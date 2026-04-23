import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTPCode, UserSession
from .serializers import SendOTPSerializer, VerifyOTPSerializer, UserProfileSerializer
from zarringold.utils.helpers import generate_referral_code


class SendOTPView(APIView):
    """Send OTP code to phone number"""
    permission_classes = [AllowAny]
    throttle_scope = 'otp'

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']

        # Invalidate previous unverified OTPs
        OTPCode.objects.filter(phone=phone, verified=False).update(verified=True)

        # Generate 6-digit code
        code = str(random.randint(100000, 999999))

        # Create OTP record
        otp = OTPCode.objects.create(
            phone=phone,
            code=code,
            expires_at=timezone.now() + timedelta(seconds=120),
        )

        # TODO: Send SMS via SMS provider (e.g., Kavenegar, Twilio)
        # In development, code is returned in response

        return Response({
            'success': True,
            'message': 'کد تایید ارسال شد',
            'dev_code': code,  # Remove in production
        }, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """Verify OTP and login/register"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']

        # Get latest unverified OTP
        try:
            otp = OTPCode.objects.filter(phone=phone, verified=False).latest('created_at')
        except OTPCode.DoesNotExist:
            return Response({
                'success': False,
                'message': 'کد تایید منقضی شده. لطفاً دوباره درخواست کنید.',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check expiry
        if otp.is_expired():
            otp.verified = True
            otp.save()
            return Response({
                'success': False,
                'message': 'کد تایید منقضی شده',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check attempts
        if otp.is_max_attempts_reached():
            return Response({
                'success': False,
                'message': 'حداکثر تعداد تلاش استفاده شده. لطفاً کد جدید درخواست کنید.',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Increment attempts
        otp.attempts += 1
        otp.save()

        # Verify code
        if otp.code != code:
            return Response({
                'success': False,
                'message': 'کد تایید نادرست است',
                'remaining_attempts': otp.max_attempts - otp.attempts,
            }, status=status.HTTP_400_BAD_REQUEST)

        # Mark as verified
        otp.verified = True
        otp.save()

        # Get or create user
        user, is_new = User.objects.get_or_create(
            phone=phone,
            defaults={
                'username': phone,
                'is_verified': True,
                'referral_code': generate_referral_code(),
            }
        )
        user.is_verified = True
        user.last_login_at = timezone.now()
        user.save(update_fields=['is_verified', 'last_login_at'])

        # Create wallets for new users
        if is_new:
            from zarringold.apps.wallets.models import Wallet, GoldWallet
            Wallet.objects.create(user=user)
            GoldWallet.objects.create(user=user)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Create session
        session = UserSession.objects.create(
            user=user,
            token=str(refresh.access_token),
            device=request.META.get('HTTP_USER_AGENT', '')[:200],
            ip=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            expires_at=timezone.now() + timedelta(days=7),
        )

        return Response({
            'success': True,
            'user': {
                'id': str(user.id),
                'phone': user.phone,
                'full_name': user.full_name,
                'email': user.email,
                'role': user.role,
                'avatar': user.avatar.url if user.avatar else None,
                'referral_code': user.referral_code,
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'is_new_user': is_new,
        }, status=status.HTTP_200_OK)

    @staticmethod
    def _get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class LogoutView(APIView):
    """Logout user"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Blacklist refresh token
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass

        # Delete sessions
        UserSession.objects.filter(user=request.user).delete()

        return Response({'success': True, 'message': 'با موفقیت خارج شدید'})


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update user profile"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user
