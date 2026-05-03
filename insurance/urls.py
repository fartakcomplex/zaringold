from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InsuranceCategoryViewSet, InsuranceProviderViewSet,
    InsurancePlanViewSet, InsuranceOrderViewSet, SeedInsuranceView,
)

router = DefaultRouter()
router.register(r'categories', InsuranceCategoryViewSet, basename='insurance-category')
router.register(r'providers', InsuranceProviderViewSet, basename='insurance-provider')
router.register(r'plans', InsurancePlanViewSet, basename='insurance-plan')
router.register(r'orders', InsuranceOrderViewSet, basename='insurance-order')

app_name = 'insurance'

urlpatterns = [
    path('', include(router.urls)),
    path('seed/', SeedInsuranceView.as_view(), name='seed-insurance'),
]
