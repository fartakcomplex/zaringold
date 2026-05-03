"""
Views for the core app.

Provides ViewSets for site settings, system settings, audit logs,
security events, blocked IPs, security config, media uploads,
landing sections, gold reserves, and loan settings.
Also includes a HealthCheckView for monitoring.
"""

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

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
from core.serializers import (
    SiteSettingSerializer,
    SystemSettingSerializer,
    AuditLogSerializer,
    SecurityEventSerializer,
    BlockedIPSerializer,
    SecurityConfigSerializer,
    MediaSerializer,
    LandingSectionSerializer,
    GoldReserveSerializer,
    LoanSettingSerializer,
)


class SiteSettingViewSet(viewsets.ModelViewSet):
    """
    CRUD for site settings (grouped key-value with type and label).
    Admin only for write operations; read-only for authenticated users.
    """
    queryset = SiteSetting.objects.all()
    serializer_class = SiteSettingSerializer
    filterset_fields = ['group', 'key', 'type']
    search_fields = ['key', 'label', 'group']
    ordering_fields = ['sortOrder', 'group', 'createdAt']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdminUser()]


class SystemSettingViewSet(viewsets.ModelViewSet):
    """
    CRUD for system-level settings (unique key-value pairs).
    Admin only for write; read-only for authenticated users.
    """
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    filterset_fields = ['group', 'key']
    search_fields = ['key', 'label', 'group']
    ordering_fields = ['group', 'key', 'createdAt']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdminUser()]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only access to audit logs. Admin only.
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['userId', 'action', 'ip']
    search_fields = ['action', 'details']
    ordering_fields = ['createdAt']


class SecurityEventViewSet(viewsets.ModelViewSet):
    """
    CRUD for security events. Admin only.
    """
    queryset = SecurityEvent.objects.all()
    serializer_class = SecurityEventSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['type', 'severity', 'userId', 'resolved']
    search_fields = ['type', 'details', 'phone']
    ordering_fields = ['createdAt', 'riskScore']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAdminUser()]
        return [IsAdminUser()]


class BlockedIPViewSet(viewsets.ModelViewSet):
    """
    CRUD for blocked IP addresses. Admin only.
    """
    queryset = BlockedIP.objects.all()
    serializer_class = BlockedIPSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['ip', 'isActive']
    search_fields = ['ip', 'reason']
    ordering_fields = ['createdAt']


class SecurityConfigViewSet(viewsets.ModelViewSet):
    """
    CRUD for security configuration key-value pairs. Admin only.
    """
    queryset = SecurityConfig.objects.all()
    serializer_class = SecurityConfigSerializer
    permission_classes = [IsAdminUser]
    search_fields = ['key', 'description']
    ordering_fields = ['key']


class MediaViewSet(viewsets.ModelViewSet):
    """
    CRUD for media files with file upload support.
    Authenticated users can upload; admin can manage all.
    """
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    filterset_fields = ['folder', 'uploadedBy', 'mimeType']
    search_fields = ['filename', 'originalName', 'alt']
    ordering_fields = ['createdAt', 'size']

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'create'):
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        """Set uploadedBy to the current user on creation."""
        serializer.save(uploadedBy=str(self.request.user.id))


class LandingSectionViewSet(viewsets.ModelViewSet):
    """
    CRUD for landing page sections. Admin for write; public read.
    """
    queryset = LandingSection.objects.all()
    serializer_class = LandingSectionSerializer
    filterset_fields = ['sectionId', 'isVisible']
    search_fields = ['sectionId', 'title']
    ordering_fields = ['sortOrder', 'createdAt']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminUser()]


class GoldReserveViewSet(viewsets.ModelViewSet):
    """
    CRUD for gold reserve data. Admin only.
    """
    queryset = GoldReserve.objects.all()
    serializer_class = GoldReserveSerializer
    permission_classes = [IsAdminUser]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdminUser()]


class LoanSettingViewSet(viewsets.ModelViewSet):
    """
    CRUD for loan configuration key-value pairs. Admin only.
    """
    queryset = LoanSetting.objects.all()
    serializer_class = LoanSettingSerializer
    permission_classes = [IsAdminUser]
    search_fields = ['key', 'description']
    ordering_fields = ['key']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdminUser()]


class HealthCheckView(APIView):
    """
    Health check endpoint for monitoring and load balancers.
    Public access — no authentication required.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({
            'status': 'ok',
            'service': 'zarringold',
            'version': '5.0.0',
        }, status=status.HTTP_200_OK)
