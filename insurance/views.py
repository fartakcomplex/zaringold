import secrets
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from authentication.backends import TokenAuthentication
from .models import (
    InsuranceCategory, InsuranceProvider,
    InsurancePlan, InsuranceOrder,
)
from .serializers import (
    InsuranceCategorySerializer, InsuranceProviderSerializer,
    InsurancePlanSerializer, InsuranceOrderSerializer,
)


def is_admin(user):
    return user.role in ['admin', 'super_admin']


# ─── Insurance Category ─────────────────────────────────────────────────────

class InsuranceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of insurance categories."""
    queryset = InsuranceCategory.objects.filter(isActive=True).order_by('sortOrder')
    serializer_class = InsuranceCategorySerializer
    authentication_classes = [TokenAuthentication]


# ─── Insurance Provider ─────────────────────────────────────────────────────

class InsuranceProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of insurance providers."""
    queryset = InsuranceProvider.objects.filter(isActive=True).order_by('-rating')
    serializer_class = InsuranceProviderSerializer
    authentication_classes = [TokenAuthentication]


# ─── Insurance Plan ─────────────────────────────────────────────────────────

class InsurancePlanViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of insurance plans with filters."""
    serializer_class = InsurancePlanSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        qs = InsurancePlan.objects.filter(isActive=True).select_related(
            'categoryId', 'providerId'
        ).order_by('sortOrder')

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(categoryId__slug=category)

        # Filter by provider
        provider = self.request.query_params.get('provider')
        if provider:
            qs = qs.filter(providerId__slug=provider)

        # Filter by coverage type
        coverage_type = self.request.query_params.get('coverageType')
        if coverage_type:
            qs = qs.filter(coverageType=coverage_type)

        # Filter by max premium
        max_premium = self.request.query_params.get('maxPremium')
        if max_premium:
            qs = qs.filter(premiumMonthly__lte=float(max_premium))

        return qs


# ─── Insurance Order ────────────────────────────────────────────────────────

class InsuranceOrderViewSet(viewsets.ModelViewSet):
    """Insurance orders — user scoped for create/list."""
    serializer_class = InsuranceOrderSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        if is_admin(self.request.user):
            return InsuranceOrder.objects.select_related(
                'planId', 'planId__categoryId', 'planId__providerId'
            ).all()
        return InsuranceOrder.objects.select_related(
            'planId', 'planId__categoryId', 'planId__providerId'
        ).filter(userId=self.request.user)

    def perform_create(self, serializer):
        plan = serializer.validated_data.get('planId')
        order = serializer.save(
            userId=self.request.user,
            status='pending',
            premiumAmount=plan.premiumMonthly if plan else 0,
            coverageAmount=plan.coverageAmount if plan else 0,
        )


# ─── Seed ────────────────────────────────────────────────────────────────────

class SeedInsuranceView(APIView):
    """POST - Seed sample insurance data."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Categories
        cat1, _ = InsuranceCategory.objects.get_or_create(
            slug='life',
            defaults={
                'name': 'Life Insurance',
                'icon': 'Heart',
                'sortOrder': 1,
            }
        )
        cat2, _ = InsuranceCategory.objects.get_or_create(
            slug='gold',
            defaults={
                'name': 'Gold Insurance',
                'icon': 'Shield',
                'sortOrder': 2,
            }
        )
        cat3, _ = InsuranceCategory.objects.get_or_create(
            slug='travel',
            defaults={
                'name': 'Travel Insurance',
                'icon': 'Plane',
                'sortOrder': 3,
            }
        )

        # Providers
        prov1, _ = InsuranceProvider.objects.get_or_create(
            slug='iran-insurance',
            defaults={
                'name': 'Iran Insurance',
                'description': 'Leading insurance provider in Iran',
                'rating': 4.5,
            }
        )
        prov2, _ = InsuranceProvider.objects.get_or_create(
            slug='asia-insurance',
            defaults={
                'name': 'Asia Insurance',
                'description': 'Trusted insurance partner',
                'rating': 4.2,
            }
        )

        # Plans
        InsurancePlan.objects.get_or_create(
            slug='basic-life',
            defaults={
                'categoryId': cat1,
                'providerId': prov1,
                'name': 'Basic Life Insurance',
                'description': 'Essential life coverage',
                'coverageType': 'term',
                'premiumMonthly': 200000,
                'premiumYearly': 2200000,
                'coverageAmount': 500000000,
                'deductible': 0,
                'features': '["Death benefit", "Disability coverage"]',
                'sortOrder': 1,
            }
        )
        InsurancePlan.objects.get_or_create(
            slug='gold-protect',
            defaults={
                'categoryId': cat2,
                'providerId': prov2,
                'name': 'Gold Protection',
                'description': 'Comprehensive gold asset insurance',
                'coverageType': 'comprehensive',
                'premiumMonthly': 150000,
                'premiumYearly': 1650000,
                'coverageAmount': 1000000000,
                'deductible': 5000000,
                'features': '["Theft protection", "Market volatility coverage", "Physical damage"]',
                'sortOrder': 1,
            }
        )

        return Response({'message': 'Insurance seed data created successfully'})
