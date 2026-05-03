import secrets
import hashlib
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action
from authentication.backends import TokenAuthentication
from authentication.models import User
from .models import (
    Merchant, ApiKey, GatewayPayment, GatewayRefund,
    Settlement, WebhookLog, Invoice, QrCode, RiskEvent,
)
from .serializers import (
    MerchantSerializer, MerchantRegisterSerializer, ApiKeySerializer,
    ApiKeyCreateResponseSerializer, GatewayPaymentSerializer,
    GatewayPaymentCreateSerializer, GatewayPaymentExecuteSerializer,
    GatewayRefundSerializer, SettlementSerializer, InvoiceSerializer,
    QrCodeSerializer, WebhookLogSerializer, RiskEventSerializer,
    GatewayOverviewSerializer,
)


def is_admin(user):
    return user.role in ['admin', 'super_admin']


# ─── Merchant ────────────────────────────────────────────────────────────────

class MerchantViewSet(viewsets.ModelViewSet):
    """Merchant CRUD — users see their own merchant, admins see all."""
    serializer_class = MerchantSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        if is_admin(self.request.user):
            return Merchant.objects.all()
        return Merchant.objects.filter(userId=self.request.user)

    def perform_create(self, serializer):
        serializer.save(userId=self.request.user)


class MerchantRegisterView(APIView):
    """Register the current user as a merchant."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        if hasattr(request.user, 'merchant'):
            return Response(
                {'error': 'User is already a merchant'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = MerchantRegisterSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        merchant = serializer.save()
        return Response(
            MerchantSerializer(merchant).data,
            status=status.HTTP_201_CREATED,
        )


# ─── API Key ─────────────────────────────────────────────────────────────────

class ApiKeyViewSet(viewsets.ReadOnlyModelViewSet):
    """Read + create API keys scoped to the current user's merchant."""
    serializer_class = ApiKeySerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return ApiKey.objects.filter(merchantId__userId=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            merchant = Merchant.objects.get(userId=request.user)
        except Merchant.DoesNotExist:
            return Response(
                {'error': 'Merchant profile not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = request.data.copy()
        data['merchantId'] = merchant.id
        serializer = ApiKeySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        api_key = serializer.save()
        output = ApiKeyCreateResponseSerializer(api_key)
        return Response(output.data, status=status.HTTP_201_CREATED)


# ─── Gateway Payments ────────────────────────────────────────────────────────

class GatewayPaymentCreateView(APIView):
    """Create a new gateway payment."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        serializer = GatewayPaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            merchant = Merchant.objects.get(id=serializer.validated_data['merchantId'])
        except Merchant.DoesNotExist:
            return Response(
                {'error': 'Merchant not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not merchant.isActive or not merchant.isVerified:
            return Response(
                {'error': 'Merchant is not active or not verified'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        authority = secrets.token_urlsafe(32)
        amount_toman = serializer.validated_data.get('amountToman', 0)
        fee_toman = max(merchant.minFee, min(amount_toman * merchant.feeRate, merchant.maxFee))

        payment = GatewayPayment.objects.create(
            authority=authority,
            merchantId=merchant,
            userId=request.user,
            amountToman=amount_toman,
            amountGold=serializer.validated_data.get('amountGold', 0),
            goldGrams=serializer.validated_data.get('goldGrams', 0),
            feeToman=fee_toman,
            paymentMethod=serializer.validated_data.get('paymentMethod', 'toman'),
            description=serializer.validated_data.get('description', ''),
            callbackUrl=serializer.validated_data.get('callbackUrl', ''),
            customerPhone=serializer.validated_data.get('customerPhone', ''),
            customerEmail=serializer.validated_data.get('customerEmail', ''),
            customerName=serializer.validated_data.get('customerName', ''),
            metadata=serializer.validated_data.get('metadata', '{}'),
            status='pending',
        )

        return Response(
            GatewayPaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class GatewayPaymentExecuteView(APIView):
    """Execute/verify a gateway payment."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        serializer = GatewayPaymentExecuteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = GatewayPayment.objects.get(
                authority=serializer.validated_data['authority']
            )
        except GatewayPayment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status != 'pending':
            return Response(
                {'error': f'Payment is already {payment.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = 'completed'
        payment.refId = serializer.validated_data.get('refId', '') or secrets.token_urlsafe(16)
        payment.paidAt = timezone.now()
        payment.verifiedAt = timezone.now()
        payment.save()

        # Update merchant totals
        merchant = payment.merchantId
        merchant.totalSales += payment.amountToman
        merchant.totalSalesGold += payment.amountGold
        merchant.pendingSettle += payment.amountToman - payment.feeToman
        merchant.pendingSettleGold += payment.amountGold - payment.feeGold
        merchant.save()

        return Response(GatewayPaymentSerializer(payment).data)


class GatewayPaymentStatusView(APIView):
    """Get payment status by authority."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        authority = request.query_params.get('authority')
        if not authority:
            return Response(
                {'error': 'authority parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            payment = GatewayPayment.objects.get(authority=authority)
        except GatewayPayment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({
            'authority': payment.authority,
            'status': payment.status,
            'amountToman': payment.amountToman,
            'amountGold': payment.amountGold,
            'refId': payment.refId,
        })


class GatewayPaymentDetailView(APIView):
    """Get full payment detail."""
    authentication_classes = [TokenAuthentication]

    def get(self, request, pk):
        try:
            payment = GatewayPayment.objects.get(pk=pk)
        except GatewayPayment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(GatewayPaymentSerializer(payment).data)


class GatewayPaymentCancelView(APIView):
    """Cancel a pending payment."""
    authentication_classes = [TokenAuthentication]

    def post(self, request, pk):
        try:
            payment = GatewayPayment.objects.get(pk=pk)
        except GatewayPayment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if payment.status != 'pending':
            return Response(
                {'error': f'Cannot cancel payment in {payment.status} status'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.status = 'cancelled'
        payment.save()
        return Response(GatewayPaymentSerializer(payment).data)


# ─── Settlement ──────────────────────────────────────────────────────────────

class SettlementViewSet(viewsets.ModelViewSet):
    """Settlement CRUD scoped to the current user's merchant."""
    serializer_class = SettlementSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return Settlement.objects.filter(merchantId__userId=self.request.user)

    def perform_create(self, serializer):
        try:
            merchant = Merchant.objects.get(userId=self.request.user)
        except Merchant.DoesNotExist:
            return
        serializer.save(merchantId=merchant)


# ─── Invoice ─────────────────────────────────────────────────────────────────

class InvoiceViewSet(viewsets.ModelViewSet):
    """Invoice CRUD scoped to the current user's merchant."""
    serializer_class = InvoiceSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return Invoice.objects.filter(merchantId__userId=self.request.user)

    def perform_create(self, serializer):
        try:
            merchant = Merchant.objects.get(userId=self.request.user)
        except Merchant.DoesNotExist:
            return
        import uuid
        invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(merchantId=merchant, invoiceNumber=invoice_number)


# ─── QR Code ─────────────────────────────────────────────────────────────────

class QrCodeViewSet(viewsets.ModelViewSet):
    """QR Code CRUD scoped to the current user's merchant."""
    serializer_class = QrCodeSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return QrCode.objects.filter(merchantId__userId=self.request.user)

    def perform_create(self, serializer):
        try:
            merchant = Merchant.objects.get(userId=self.request.user)
        except Merchant.DoesNotExist:
            return
        token = secrets.token_urlsafe(24)
        serializer.save(merchantId=merchant, token=token)


# ─── Webhook Log ─────────────────────────────────────────────────────────────

class WebhookLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only webhook logs scoped to the current user's merchant."""
    serializer_class = WebhookLogSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return WebhookLog.objects.filter(merchantId__userId=self.request.user)


# ─── Gateway Overview (Admin) ────────────────────────────────────────────────

class GatewayOverviewView(APIView):
    """Admin overview of gateway statistics."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        from django.db.models import Sum, Count

        merchants = Merchant.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=models.Q(isActive=True)),
        )

        payments = GatewayPayment.objects.aggregate(
            total=Count('id'),
            volume=Sum('amountToman', default=0),
            fees=Sum('feeToman', default=0),
        )

        settlements = Settlement.objects.aggregate(
            total=Sum('amountToman', default=0),
            pending=Sum('amountToman', filter=models.Q(status='pending'), default=0),
        )

        refunds = GatewayRefund.objects.aggregate(
            total=Sum('amountToman', default=0),
        )

        data = {
            'totalMerchants': merchants['total'],
            'activeMerchants': merchants['active'],
            'totalPayments': payments['total'],
            'totalPaymentVolume': payments['volume'],
            'totalSettlements': settlements['total'],
            'pendingSettlements': settlements['pending'],
            'totalRefunds': refunds['total'],
            'totalFeesCollected': payments['fees'],
        }
        serializer = GatewayOverviewSerializer(data)
        return Response(serializer.data)


# ─── Seed ────────────────────────────────────────────────────────────────────

class SeedGatewayView(APIView):
    """Seed sample gateway data for development."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Create a merchant for the current user if not exists
        merchant, created = Merchant.objects.get_or_create(
            userId=request.user,
            defaults={
                'businessName': 'ZarinGold Test Merchant',
                'businessType': 'online',
                'website': 'https://test.zaringold.ir',
                'iban': 'IR123456789012345678901234',
                'isVerified': True,
                'kycStatus': 'approved',
            }
        )

        # Create sample API key
        raw_key = secrets.token_urlsafe(32)
        ApiKey.objects.get_or_create(
            merchantId=merchant,
            keyHash=hashlib.sha256(raw_key.encode()).hexdigest(),
            defaults={
                'keyPrefix': raw_key[:8],
                'keyType': 'live',
                'name': 'Production Key',
            }
        )

        # Create sample payment
        GatewayPayment.objects.create(
            authority=secrets.token_urlsafe(32),
            merchantId=merchant,
            userId=request.user,
            amountToman=1000000,
            amountGold=0,
            feeToman=10000,
            paymentMethod='toman',
            status='completed',
            refId=secrets.token_urlsafe(16),
            description='Test payment',
            paidAt=timezone.now(),
            verifiedAt=timezone.now(),
        )

        # Create sample settlement
        Settlement.objects.create(
            merchantId=merchant,
            amountToman=990000,
            feeToman=10000,
            type='auto',
            status='completed',
            iban='IR123456789012345678901234',
            processedAt=timezone.now(),
        )

        # Create sample QR code
        QrCode.objects.create(
            merchantId=merchant,
            title='Test QR Payment',
            amountToman=500000,
            isFixed=True,
            token=secrets.token_urlsafe(24),
        )

        return Response({
            'message': 'Gateway seed data created successfully',
            'merchant_id': merchant.id,
        })
