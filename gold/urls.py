"""
URL configuration for the gold app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from gold.views import (
    GoldPriceView,
    GoldPriceListView,
    GoldRealtimeView,
    GoldBuyView,
    GoldSellView,
    PriceHistoryViewSet,
    PriceAlertViewSet,
    TransactionViewSet,
    SeedPricesView,
)

router = DefaultRouter()
router.register(r'price-history', PriceHistoryViewSet, basename='price-history')
router.register(r'alerts', PriceAlertViewSet, basename='price-alert')
router.register(r'transactions', TransactionViewSet, basename='gold-transaction')

app_name = 'gold'

urlpatterns = [
    # Price endpoints (public)
    path('price', GoldPriceView.as_view(), name='gold-price'),
    path('prices', GoldPriceListView.as_view(), name='gold-price-list'),
    path('realtime', GoldRealtimeView.as_view(), name='gold-realtime'),

    # Trading endpoints (authenticated)
    path('buy', GoldBuyView.as_view(), name='gold-buy'),
    path('sell', GoldSellView.as_view(), name='gold-sell'),

    # Admin
    path('seed-prices', SeedPricesView.as_view(), name='seed-prices'),

    # ViewSet routes
    path('', include(router.urls)),
]
