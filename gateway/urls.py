from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MerchantViewSet, MerchantRegisterView, ApiKeyViewSet,
    GatewayPaymentCreateView, GatewayPaymentExecuteView,
    GatewayPaymentStatusView, GatewayPaymentDetailView,
    GatewayPaymentCancelView, SettlementViewSet, InvoiceViewSet,
    QrCodeViewSet, WebhookLogViewSet, GatewayOverviewView,
    SeedGatewayView,
)

router = DefaultRouter()
router.register(r'merchants', MerchantViewSet, basename='merchant')
router.register(r'api-keys', ApiKeyViewSet, basename='apikey')
router.register(r'settlements', SettlementViewSet, basename='settlement')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'qr-codes', QrCodeViewSet, basename='qrcode')
router.register(r'webhook-logs', WebhookLogViewSet, basename='webhooklog')

app_name = 'gateway'

urlpatterns = [
    path('', include(router.urls)),
    path('register/', MerchantRegisterView.as_view(), name='merchant-register'),
    path('payments/create/', GatewayPaymentCreateView.as_view(), name='payment-create'),
    path('payments/execute/', GatewayPaymentExecuteView.as_view(), name='payment-execute'),
    path('payments/status/', GatewayPaymentStatusView.as_view(), name='payment-status'),
    path('payments/<str:pk>/', GatewayPaymentDetailView.as_view(), name='payment-detail'),
    path('payments/<str:pk>/cancel/', GatewayPaymentCancelView.as_view(), name='payment-cancel'),
    path('overview/', GatewayOverviewView.as_view(), name='gateway-overview'),
    path('seed/', SeedGatewayView.as_view(), name='gateway-seed'),
]
