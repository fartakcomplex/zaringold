from django.urls import path
from . import views

urlpatterns = [
    path('prices/', views.GoldPricesView.as_view(), name='gold-prices'),
    path('buy/', views.BuyGoldView.as_view(), name='buy-gold'),
    path('sell/', views.SellGoldView.as_view(), name='sell-gold'),
    path('admin/prices/', views.AdminPriceManageView.as_view(), name='admin-prices'),
]
