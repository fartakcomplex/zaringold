"""
Views for the authentication app.

Provides registration, login, OTP send/verify, logout,
profile management, KYC submission, and admin user/role/permission management.
"""

import secrets
import json

from datetime import timedelta

from django.utils import timezone

from rest_framework import status, viewsets, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

from authentication.models import (
    User,
    Profile,
    KYCRequest,
    OTPCode,
    UserSession,
    Role,
    Permission,
    UserRole,
    UserActivity,
)
from authentication.serializers import (
    UserSerializer,
    UserMinimalSerializer,
    RegisterSerializer,
    LoginSerializer,
    OTPSendSerializer,
    OTPVerifySerializer,
    ProfileSerializer,
    KYCRequestSerializer,
    OTPCodeSerializer,
    UserSessionSerializer,
    RoleSerializer,
    PermissionSerializer,
    UserRoleSerializer,
    UserActivitySerializer,
)
from authentication.backends import TokenAuthentication
from core.utils import generate_cuid


# =============================================================================
# Helper Functions
# =============================================================================

def _generate_token(user, request=None):
    """Generate a session token for the given user."""
    token = secrets.token_urlsafe(32)
    session = UserSession.objects.create(
        userId=user,
        token=token,
        device='',
        ip=_get_client_ip(request) if request else None,
        userAgent=_get_user_agent(request) if request else '',
        expiresAt=timezone.now() + timedelta(days=7),
    )
    return token


def _get_client_ip(request):
    """Extract client IP from request."""
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _get_user_agent(request):
    """Extract user agent from request."""
    if not request:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')


def _log_activity(user, action, request=None, details=''):
    """Log user activity for auditing."""
    UserActivity.objects.create(
        userId=user,
        action=action,
        details=details,
        ip=_get_client_ip(request),
        userAgent=_get_user_agent(request),
    )


# =============================================================================
# Registration
# =============================================================================

class RegisterView(APIView):
    """
    POST /auth/register
    Register a new user with phone + password.
    Auto-generates referralCode, creates profile, and returns user + token.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone']
        password = serializer.validated_data['password']
        email = serializer.validated_data.get('email', '')

        user = User.objects.create_user(
            phone=phone,
            password=password,
            email=email or None,
            referralCode=generate_cuid(),
        )

        # Create default profile
        Profile.objects.create(userId=user)

        # Generate session token
        token = _generate_token(user, request)
        _log_activity(user, 'register', request)

        return Response({
            'user': UserSerializer(user).data,
            'token': token,
        }, status=status.HTTP_201_CREATED)


# =============================================================================
# Login
# =============================================================================

class LoginView(APIView):
    """
    POST /auth/password-login
    Authenticate with phone + password. Returns user + token.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response(
                {'error': {'code': 'AUTHENTICATION_FAILED', 'message': 'Invalid phone or password.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {'error': {'code': 'AUTHENTICATION_FAILED', 'message': 'Invalid phone or password.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.isActive:
            return Response(
                {'error': {'code': 'ACCOUNT_DISABLED', 'message': 'User account is disabled.'}},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.isFrozen:
            return Response(
                {'error': {'code': 'ACCOUNT_FROZEN', 'message': 'User account is frozen.'}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Update last login
        user.lastLoginAt = timezone.now()
        user.save(update_fields=['lastLoginAt', 'updatedAt'])

        token = _generate_token(user, request)
        _log_activity(user, 'login', request, 'password_login')

        return Response({
            'user': UserSerializer(user).data,
            'token': token,
        }, status=status.HTTP_200_OK)


class AdminLoginView(APIView):
    """
    POST /auth/admin-login
    Admin login with phone + password. Only allows staff/admin users.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response(
                {'error': {'code': 'AUTHENTICATION_FAILED', 'message': 'Invalid credentials.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {'error': {'code': 'AUTHENTICATION_FAILED', 'message': 'Invalid credentials.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_staff and user.role != 'admin':
            return Response(
                {'error': {'code': 'PERMISSION_DENIED', 'message': 'Admin access required.'}},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.lastLoginAt = timezone.now()
        user.save(update_fields=['lastLoginAt', 'updatedAt'])

        token = _generate_token(user, request)
        _log_activity(user, 'admin_login', request)

        return Response({
            'user': UserSerializer(user).data,
            'token': token,
        }, status=status.HTTP_200_OK)


# =============================================================================
# OTP
# =============================================================================

class OTPSendView(APIView):
    """
    POST /auth/send-otp
    Generate and send an OTP code to the given phone number.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone']

        # Check if there's an existing unexpired OTP
        now = timezone.now()
        existing = OTPCode.objects.filter(
            phone=phone,
            verified=False,
            expiresAt__gt=now,
        ).first()

        if existing:
            # Resend the same code (in production, check rate limits)
            code = existing.code
        else:
            # Generate new OTP code (in production, use a secure random generator)
            code = str(secrets.randbelow(90000) + 10000)  # 5-digit code

            # Try to find user by phone
            user = User.objects.filter(phone=phone).first()

            OTPCode.objects.create(
                userId=user,
                phone=phone,
                code=code,
                purpose='login',
                expiresAt=now + timedelta(minutes=2),
            )

        # In production, send SMS here
        # For development, return the code in the response
        return Response({
            'message': 'OTP sent successfully.',
            'code': code if request.query_params.get('debug') else None,
        }, status=status.HTTP_200_OK)


class OTPVerifyView(APIView):
    """
    POST /auth/verify-otp
    Verify an OTP code and return user + token if valid.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']

        now = timezone.now()
        try:
            otp = OTPCode.objects.get(
                phone=phone,
                code=code,
                verified=False,
                expiresAt__gt=now,
            )
        except OTPCode.DoesNotExist:
            return Response(
                {'error': {'code': 'INVALID_OTP', 'message': 'Invalid or expired OTP code.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check attempts
        if otp.attempts >= otp.maxAttempts:
            return Response(
                {'error': {'code': 'MAX_ATTEMPTS', 'message': 'Maximum attempts exceeded.'}},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Mark as verified
        otp.verified = True
        otp.save(update_fields=['verified', 'updatedAt'])

        # Get or create user
        user = User.objects.filter(phone=phone).first()
        if not user:
            # Auto-register user if phone is verified via OTP
            user = User.objects.create_user(
                phone=phone,
                password=secrets.token_urlsafe(16),
                referralCode=generate_cuid(),
            )
            Profile.objects.create(userId=user)

        # Verify user
        if not user.isVerified:
            user.isVerified = True
            user.save(update_fields=['isVerified', 'updatedAt'])

        user.lastLoginAt = timezone.now()
        user.save(update_fields=['lastLoginAt', 'updatedAt'])

        token = _generate_token(user, request)
        _log_activity(user, 'otp_login', request, 'otp_verified')

        return Response({
            'user': UserSerializer(user).data,
            'token': token,
        }, status=status.HTTP_200_OK)


# =============================================================================
# Logout
# =============================================================================

class LogoutView(APIView):
    """
    POST /auth/logout
    Invalidate the current session token.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            UserSession.objects.filter(token=token).delete()

        _log_activity(request.user, 'logout', request)

        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


# =============================================================================
# Me / Profile
# =============================================================================

class MeView(APIView):
    """
    GET  /auth/me — Return current user profile.
    POST /auth/me — Update current user profile fields.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data

        # Include profile if it exists
        try:
            profile = user.profile
            data['profile'] = ProfileSerializer(profile).data
        except Profile.DoesNotExist:
            data['profile'] = None

        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        updatable_fields = ['fullName', 'email', 'avatar']

        for field in updatable_fields:
            if field in request.data:
                setattr(user, field, request.data[field])

        user.save(update_fields=updatable_fields + ['updatedAt'])
        _log_activity(user, 'profile_update', request)

        # Update profile fields if provided
        profile_data = request.data.get('profile', {})
        if profile_data:
            try:
                profile = user.profile
                profile_fields = [
                    'nationalId', 'birthDate', 'iban', 'bankCard',
                    'province', 'city', 'address', 'postalCode',
                ]
                for field in profile_fields:
                    if field in profile_data:
                        setattr(profile, field, profile_data[field])
                profile.save()
            except Profile.DoesNotExist:
                pass

        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class ProfileView(APIView):
    """
    GET  /auth/profile — Get user profile.
    PUT  /auth/profile — Update user profile.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
            return Response(ProfileSerializer(profile).data, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'Profile not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

    def put(self, request):
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            # Create profile if it doesn't exist
            profile = Profile.objects.create(userId=request.user)

        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        _log_activity(request.user, 'profile_update', request)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =============================================================================
# KYC
# =============================================================================

class KYCSubmitView(APIView):
    """
    POST /auth/kyc
    Submit KYC documents for verification.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Check if KYC already submitted
        existing = KYCRequest.objects.filter(userId=user).first()
        if existing and existing.status == 'pending':
            return Response(
                {'error': {'code': 'KYC_PENDING', 'message': 'KYC request already pending.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if existing and existing.status == 'approved':
            return Response(
                {'error': {'code': 'KYC_APPROVED', 'message': 'KYC already approved.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If rejected, allow resubmission
        if existing:
            existing.delete()

        serializer = KYCRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        kyc = serializer.save(userId=user)

        _log_activity(user, 'kyc_submit', request, 'KYC documents submitted')
        return Response(KYCRequestSerializer(kyc).data, status=status.HTTP_201_CREATED)


# =============================================================================
# Password Reset
# =============================================================================

class ForgotPasswordView(APIView):
    """
    POST /auth/forgot-password
    Send OTP for password reset.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Phone number is required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(phone=phone).first()
        if not user:
            # Don't reveal whether user exists
            return Response(
                {'message': 'If the phone number exists, an OTP will be sent.'},
                status=status.HTTP_200_OK,
            )

        # Generate OTP for password reset
        code = str(secrets.randbelow(90000) + 10000)
        OTPCode.objects.create(
            userId=user,
            phone=phone,
            code=code,
            purpose='reset_password',
            expiresAt=timezone.now() + timedelta(minutes=2),
        )

        # In production, send SMS here
        return Response(
            {'message': 'If the phone number exists, an OTP will be sent.'},
            status=status.HTTP_200_OK,
        )


class SetPasswordView(APIView):
    """
    POST /auth/set-password
    Set a new password after verifying OTP.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        phone = request.data.get('phone')
        code = request.data.get('code')
        new_password = request.data.get('password')

        if not all([phone, code, new_password]):
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Phone, code, and password are required.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Password must be at least 8 characters.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify OTP
        now = timezone.now()
        try:
            otp = OTPCode.objects.get(
                phone=phone,
                code=code,
                purpose='reset_password',
                verified=False,
                expiresAt__gt=now,
            )
        except OTPCode.DoesNotExist:
            return Response(
                {'error': {'code': 'INVALID_OTP', 'message': 'Invalid or expired OTP code.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp.verified = True
        otp.save(update_fields=['verified', 'updatedAt'])

        # Update password
        user = User.objects.filter(phone=phone).first()
        if user:
            user.set_password(new_password)
            user.save(update_fields=['password', 'updatedAt'])
            # Invalidate all sessions
            UserSession.objects.filter(userId=user).delete()
            _log_activity(user, 'password_reset', None, 'Password reset via OTP')

        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


# =============================================================================
# Admin ViewSets
# =============================================================================

class UserViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD for users.
    """
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]
    authentication_classes = [TokenAuthentication]
    filterset_fields = ['phone', 'role', 'isVerified', 'isActive', 'isFrozen']
    search_fields = ['phone', 'email', 'fullName']
    ordering_fields = ['createdAt', 'phone']

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return UserSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        Profile.objects.create(userId=user)

    def perform_destroy(self, instance):
        # Soft delete — deactivate instead of hard delete
        instance.isActive = False
        instance.save(update_fields=['isActive', 'updatedAt'])


class RoleViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD for roles.
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminUser]
    authentication_classes = [TokenAuthentication]
    search_fields = ['name', 'label']
    ordering_fields = ['priority', 'name']


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only read-only access to permissions.
    """
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAdminUser]
    authentication_classes = [TokenAuthentication]
    filterset_fields = ['module']
    search_fields = ['name', 'label']
    ordering_fields = ['module', 'name']
