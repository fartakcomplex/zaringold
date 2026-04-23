from rest_framework import serializers
from .models import User, OTPCode


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'phone', 'email', 'full_name', 'is_verified', 'role', 'avatar', 'referral_code', 'date_joined')
        read_only_fields = ('id', 'phone', 'is_verified', 'role', 'referral_code', 'date_joined')


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'phone', 'email', 'full_name', 'avatar', 'referral_code')
        read_only_fields = ('id', 'phone', 'referral_code')


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15, required=True)

    def validate_phone(self, value):
        if not value.startswith('09') or len(value) != 11:
            raise serializers.ValidationError('شماره موبایل نامعتبر است')
        return value


class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=15, required=True)
    code = serializers.CharField(max_length=6, required=True)


class OTPCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPCode
        fields = '__all__'
        read_only_fields = ('id', 'code', 'expires_at', 'verified', 'attempts')
