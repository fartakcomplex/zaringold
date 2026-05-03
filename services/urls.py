from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserCarViewSet, CarServiceCategoryViewSet, CarServiceOrderViewSet,
    UtilityPayBillView, UtilityTopUpView, UtilityInternetView,
    UtilityHistoryView, SeedCarDataView,
)

router = DefaultRouter()
router.register(r'cars', UserCarViewSet, basename='user-car')
router.register(r'car-categories', CarServiceCategoryViewSet, basename='car-service-category')
router.register(r'car-orders', CarServiceOrderViewSet, basename='car-service-order')

app_name = 'services'

urlpatterns = [
    path('', include(router.urls)),
    path('utility/pay-bill/', UtilityPayBillView.as_view(), name='utility-pay-bill'),
    path('utility/top-up/', UtilityTopUpView.as_view(), name='utility-top-up'),
    path('utility/internet/', UtilityInternetView.as_view(), name='utility-internet'),
    path('utility/history/', UtilityHistoryView.as_view(), name='utility-history'),
    path('seed/', SeedCarDataView.as_view(), name='seed-car-data'),
]
