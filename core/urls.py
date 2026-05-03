"""
URL configuration for the core app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import (
    SiteSettingViewSet,
    SystemSettingViewSet,
    AuditLogViewSet,
    SecurityEventViewSet,
    BlockedIPViewSet,
    SecurityConfigViewSet,
    MediaViewSet,
    LandingSectionViewSet,
    GoldReserveViewSet,
    LoanSettingViewSet,
    HealthCheckView,
)

router = DefaultRouter()
router.register(r'site-settings', SiteSettingViewSet, basename='site-setting')
router.register(r'system-settings', SystemSettingViewSet, basename='system-setting')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'security-events', SecurityEventViewSet, basename='security-event')
router.register(r'blocked-ips', BlockedIPViewSet, basename='blocked-ip')
router.register(r'security-config', SecurityConfigViewSet, basename='security-config')
router.register(r'media', MediaViewSet, basename='media')
router.register(r'landing-sections', LandingSectionViewSet, basename='landing-section')
router.register(r'gold-reserves', GoldReserveViewSet, basename='gold-reserve')
router.register(r'loan-settings', LoanSettingViewSet, basename='loan-setting')

app_name = 'core'

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('', include(router.urls)),
]
