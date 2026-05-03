import secrets
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from authentication.backends import TokenAuthentication
from .models import UserCar, CarServiceCategory, CarServiceOrder, UtilityPayment
from .serializers import (
    UserCarSerializer, CarServiceCategorySerializer,
    CarServiceOrderSerializer, UtilityPayBillSerializer,
    UtilityTopUpSerializer, UtilityInternetSerializer,
    UtilityPaymentSerializer,
)


def is_admin(user):
    return user.role in ['admin', 'super_admin']


# ─── User Car ────────────────────────────────────────────────────────────────

class UserCarViewSet(viewsets.ModelViewSet):
    """User car CRUD, scoped to current user."""
    serializer_class = UserCarSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return UserCar.objects.filter(userId=self.request.user)

    def perform_create(self, serializer):
        serializer.save(userId=self.request.user)


# ─── Car Service Category ────────────────────────────────────────────────────

class CarServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of car service categories."""
    queryset = CarServiceCategory.objects.filter(isActive=True).order_by('name')
    serializer_class = CarServiceCategorySerializer
    authentication_classes = [TokenAuthentication]


# ─── Car Service Order ───────────────────────────────────────────────────────

class CarServiceOrderViewSet(viewsets.ModelViewSet):
    """Car service orders, user scoped for create/list."""
    serializer_class = CarServiceOrderSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return CarServiceOrder.objects.filter(userId=self.request.user).select_related(
            'carId', 'categoryId'
        )

    def perform_create(self, serializer):
        tracking = f"SVC-{secrets.token_urlsafe(8).upper()}"
        serializer.save(
            userId=self.request.user,
            trackingCode=tracking,
        )


# ─── Utility Payments ───────────────────────────────────────────────────────

class UtilityPayBillView(APIView):
    """POST - Pay a utility bill."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        serializer = UtilityPayBillSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = UtilityPayment.objects.create(
            userId=request.user,
            type=serializer.validated_data['type'],
            billId=serializer.validated_data['billId'],
            amount=serializer.validated_data['amount'],
            status='completed',
            paidAt=timezone.now(),
            trackingCode=f"BILL-{secrets.token_urlsafe(8).upper()}",
        )

        return Response(
            UtilityPaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class UtilityTopUpView(APIView):
    """POST - Mobile top-up."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        serializer = UtilityTopUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = UtilityPayment.objects.create(
            userId=request.user,
            type='mobile_topup',
            billId=serializer.validated_data['phone'],
            amount=serializer.validated_data['amount'],
            status='completed',
            paidAt=timezone.now(),
            trackingCode=f"TOP-{secrets.token_urlsafe(8).upper()}",
        )

        return Response(
            UtilityPaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class UtilityInternetView(APIView):
    """POST - Internet payment."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        serializer = UtilityInternetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = UtilityPayment.objects.create(
            userId=request.user,
            type='internet',
            billId=serializer.validated_data.get('subscriptionId', ''),
            amount=serializer.validated_data['amount'],
            status='completed',
            paidAt=timezone.now(),
            trackingCode=f"NET-{secrets.token_urlsafe(8).upper()}",
        )

        return Response(
            UtilityPaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class UtilityHistoryView(APIView):
    """GET - Payment history for utility payments."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        payments = UtilityPayment.objects.filter(
            userId=request.user
        ).order_by('-createdAt')

        # Optional type filter
        pay_type = request.query_params.get('type')
        if pay_type:
            payments = payments.filter(type=pay_type)

        serializer = UtilityPaymentSerializer(payments, many=True)
        return Response(serializer.data)


# ─── Seed ────────────────────────────────────────────────────────────────────

class SeedCarDataView(APIView):
    """POST - Seed sample car service data."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Car service categories
        categories = [
            ('oil-change', 'Oil Change', 'Droplet'),
            ('car-wash', 'Car Wash', 'Sparkles'),
            ('tire-service', 'Tire Service', 'Circle'),
            ('inspection', 'Inspection', 'ClipboardCheck'),
            ('repair', 'General Repair', 'Wrench'),
        ]

        for slug, name, icon in categories:
            CarServiceCategory.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'icon': icon}
            )

        return Response({'message': 'Car service seed data created successfully'})
