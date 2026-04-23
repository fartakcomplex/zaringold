"""
Zarrin Gold URL Configuration
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from drf_yasg import openapi
from drf_yasg.views import get_schema_view

schema_view = get_schema_view(
    openapi.Info(
        title="Zarrin Gold API",
        default_version="v1.0",
        description="API documentation for Zarrin Gold - Persian Fintech Gold Trading Platform",
        contact=openapi.Contact(email="api@zarringold.ir"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # API Endpoints
    path('api/auth/', include('zarringold.apps.accounts.urls')),
    path('api/users/', include('zarringold.apps.users.urls')),
    path('api/kyc/', include('zarringold.apps.kyc.urls')),
    path('api/wallet/', include('zarringold.apps.wallets.urls')),
    path('api/gold/', include('zarringold.apps.gold.urls')),
    path('api/transactions/', include('zarringold.apps.transactions.urls')),
    path('api/referrals/', include('zarringold.apps.referrals.urls')),
    path('api/notifications/', include('zarringold.apps.notifications.urls')),
    path('api/support/', include('zarringold.apps.support.urls')),
    path('api/cms/', include('zarringold.apps.cms.urls')),
    path('api/reports/', include('zarringold.apps.reports.urls')),
    path('api/analytics/', include('zarringold.apps.analytics.urls')),

    # Swagger / Redoc
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
