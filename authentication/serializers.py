"""
Serializers for the authentication app.

Handles user registration, login, OTP, profile, KYC,
sessions, roles, permissions, and activity tracking.
"""

from rest_framework import serializers
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


# =============================================================================
# User Serializers
# =============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Full user serializer — excludes password from all outputs."""

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'email', 'fullName', 'isVerified',
            'isActive', 'isFrozen', 'is_staff', 'role', 'avatar',
            'referredBy', 'referralCode', 'userLevel', 'levelUpgradedAt',
            'lastLoginAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'isVerified', 'isActive', 'isFrozen', 'is_staff',
            'role', 'referralCode', 'userLevel', 'levelUpgradedAt',
            'lastLoginAt', 'createdAt', 'updatedAt',
        ]


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for nested relationships and list views."""

    class Meta:
        model = User
        fields = ['id', 'phone', 'fullName', 'avatar', 'role']
        read_only_fields = fields


# =============================================================================
# Auth Serializers
# =============================================================================

class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration via phone + password."""
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(min_length=8, write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(
                'A user with this phone number already exists.'
            )
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer for password-based login."""
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)


class OTPSendSerializer(serializers.Serializer):
    """Serializer for requesting an OTP code."""
    phone = serializers.CharField(max_length=20)


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for verifying an OTP code."""
    phone = serializers.CharField(max_length=20)
    code = serializers.CharField(max_length=10)


# =============================================================================
# Profile & KYC Serializers
# =============================================================================

class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with personal and banking information."""

    class Meta:
        model = Profile
        fields = [
            'id', 'userId', 'nationalId', 'birthDate', 'iban',
            'bankCard', 'province', 'city', 'address', 'postalCode',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'userId', 'createdAt', 'updatedAt']


class KYCRequestSerializer(serializers.ModelSerializer):
    """Serializer for KYC document submission and review."""

    class Meta:
        model = KYCRequest
        fields = [
            'id', 'userId', 'idCardImage', 'idCardBackImage',
            'selfieImage', 'bankCardImage', 'verificationVideo',
            'status', 'adminNote', 'reviewedBy', 'reviewedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'userId', 'status', 'adminNote',
            'reviewedBy', 'reviewedAt', 'createdAt', 'updatedAt',
        ]


# =============================================================================
# OTP & Session Serializers
# =============================================================================

class OTPCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPCode
        fields = [
            'id', 'userId', 'phone', 'code', 'purpose',
            'attempts', 'maxAttempts', 'expiresAt', 'verified',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'code', 'attempts', 'verified', 'createdAt', 'updatedAt',
        ]


class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = [
            'id', 'userId', 'token', 'device', 'ip',
            'userAgent', 'expiresAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'token', 'createdAt', 'updatedAt']
        extra_kwargs = {
            'token': {'write_only': True},
        }


# =============================================================================
# RBAC Serializers
# =============================================================================

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'label', 'module', 'description', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = [
            'id', 'name', 'label', 'description', 'permissions',
            'color', 'isSystem', 'priority', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = [
            'id', 'userId', 'roleId', 'assignedBy', 'assignedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'assignedAt', 'createdAt', 'updatedAt']


# =============================================================================
# Activity Serializer
# =============================================================================

class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = [
            'id', 'userId', 'action', 'details', 'ip',
            'userAgent', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']
