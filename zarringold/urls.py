"""
URL configuration for ZarrinGold project.

Routes:
- /admin/               — Django admin panel
- /api/auth/            — Authentication endpoints (login, register, JWT)
- /api/gold/            — Gold trading, prices, market data
- /api/wallet/          — Digital wallet operations
- /api/gateway/         — Payment gateway integration
- /api/gamification/    — Quests, badges, leaderboards
- /api/social/          — Social features, referrals
- /api/content/         — CMS, blog, pages
- /api/insurance/       — Gold insurance products
- /api/services/        — Additional platform services
- /api/admin-panel/     — Admin dashboard API
- /api/communications/  — Notifications, SMS, email
- /api/core/            — Core utilities and shared endpoints
- /health/              — Health check endpoint
"""

import os
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.http import JsonResponse, FileResponse
from django.views.static import serve


def health_check(request):
    """Simple health check endpoint for load balancers and monitoring."""
    return JsonResponse({
        'status': 'ok',
        'service': 'zarringold',
        'version': '5.0.0',
    })


# Frontend static files path
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')


def serve_frontend(request, path=''):
    """Serve the React frontend SPA."""
    file_path = os.path.join(FRONTEND_DIST, path)
    if os.path.isfile(file_path):
        return FileResponse(open(file_path, 'rb'))
    # For SPA routing, serve index.html for any non-API route
    index_path = os.path.join(FRONTEND_DIST, 'index.html')
    if os.path.isfile(index_path):
        return FileResponse(open(index_path, 'rb'))
    return JsonResponse({'error': 'Frontend not built. Run: cd frontend && npm run build'}, status=404)


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Health check
    path('health/', health_check, name='health-check'),

    # API routes
    path('api/auth/', include('authentication.urls'), name='api-auth'),
    path('api/gold/', include('gold.urls'), name='api-gold'),
    path('api/wallet/', include('wallet.urls'), name='api-wallet'),
    path('api/gateway/', include('gateway.urls'), name='api-gateway'),
    path('api/gamification/', include('gamification.urls'), name='api-gamification'),
    path('api/social/', include('social.urls'), name='api-social'),
    path('api/content/', include('content.urls'), name='api-content'),
    path('api/insurance/', include('insurance.urls'), name='api-insurance'),
    path('api/services/', include('services.urls'), name='api-services'),
    path('api/admin-panel/', include('admin_panel.urls'), name='api-admin-panel'),
    path('api/communications/', include('communications.urls'), name='api-communications'),
    path('api/core/', include('core.urls'), name='api-core'),
]

# Serve static and media files in development mode
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve React frontend (catch-all must be last)
# This serves frontend assets and handles SPA routing
if os.path.isdir(FRONTEND_DIST):
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', serve, kwargs={'document_root': os.path.join(FRONTEND_DIST, 'assets')}),
        re_path(r'^(?!api/|admin/|static/|media/|health/).*$', serve_frontend, name='frontend'),
    ]
