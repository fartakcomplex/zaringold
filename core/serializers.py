"""
Serializers for the core app.

Handles site settings, system settings, audit logs, security events,
blocked IPs, security config, media uploads, landing sections,
gold reserves, and loan settings.
"""

from rest_framework import serializers
from core.models import (
    SiteSetting,
    SystemSetting,
    AuditLog,
    SecurityEvent,
    BlockedIP,
    SecurityConfig,
    Media,
    LandingSection,
    GoldReserve,
    LoanSetting,
)


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = [
            'id', 'group', 'key', 'value', 'type', 'label',
            'description', 'sortOrder', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = ['id', 'key', 'value', 'group', 'label', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            'id', 'userId', 'action', 'details', 'ip',
            'userAgent', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class SecurityEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityEvent
        fields = [
            'id', 'type', 'severity', 'userId', 'phone', 'ip',
            'userAgent', 'url', 'method', 'details', 'riskScore',
            'resolved', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class BlockedIPSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedIP
        fields = [
            'id', 'ip', 'reason', 'blockedBy', 'expiresAt',
            'isActive', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class SecurityConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityConfig
        fields = ['id', 'key', 'value', 'description', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class MediaSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = Media
        fields = [
            'id', 'filename', 'originalName', 'mimeType', 'size',
            'url', 'alt', 'folder', 'width', 'height', 'uploadedBy',
            'file', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']

    def create(self, validated_data):
        uploaded_file = validated_data.pop('file', None)
        if uploaded_file:
            validated_data['originalName'] = uploaded_file.name
            validated_data['mimeType'] = uploaded_file.content_type or ''
            validated_data['size'] = uploaded_file.size
            validated_data['filename'] = uploaded_file.name
            # In production, upload to S3/CDN. For now, use local media path.
            validated_data['url'] = f'/media/uploads/{uploaded_file.name}'
        return super().create(validated_data)


class LandingSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingSection
        fields = [
            'id', 'sectionId', 'title', 'icon', 'isVisible',
            'sortOrder', 'settings', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class GoldReserveSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoldReserve
        fields = [
            'id', 'totalGrams', 'todayAddedGrams', 'reserveRatio',
            'lastAuditDate', 'auditFirm', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class LoanSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanSetting
        fields = ['id', 'key', 'value', 'description', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']
