"""
Views for the gold app.

Provides gold price queries, buy/sell operations, price history,
price alerts, transaction records, and price seeding.
"""

import secrets

from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

from authentication.backends import TokenAuthentication
from gold.models import GoldPrice, PriceHistory, PriceAlert, Transaction
from gold.serializers import (
    GoldPriceSerializer,
    PriceHistorySerializer,
    PriceAlertSerializer,
    TransactionSerializer,
    GoldBuySerializer,
    GoldSellSerializer,
)


# =============================================================================
# Gold Price Views
# =============================================================================

class GoldPriceView(APIView):
    """
    GET /gold/price
    Returns the latest gold price entry.
    Public access.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        price = GoldPrice.objects.first()
        if not price:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'No gold price data available.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(GoldPriceSerializer(price).data, status=status.HTTP_200_OK)


class GoldPriceListView(APIView):
    """
    GET /gold/prices
    Returns a list of recent gold prices (paginated by DRF defaults).
    Public access.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        prices = GoldPrice.objects.all()[:50]
        serializer = GoldPriceSerializer(prices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GoldRealtimeView(APIView):
    """
    GET /gold/realtime
    Returns realtime price data (latest price with computed spread info).
    Public access.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        price = GoldPrice.objects.first()
        if not price:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'No realtime price data available.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = GoldPriceSerializer(price).data
        # Add computed fields
        data['change'] = 0
        data['changePercent'] = 0

        # Compute change from previous price
        previous = GoldPrice.objects.all()[1:2].first()
        if previous:
            change = price.marketPrice - previous.marketPrice
            data['change'] = change
            data['changePercent'] = (
                (change / previous.marketPrice * 100) if previous.marketPrice else 0
            )

        data['lastUpdate'] = price.updatedAt.isoformat() if price.updatedAt else None
        return Response(data, status=status.HTTP_200_OK)


# =============================================================================
# Gold Buy / Sell Views
# =============================================================================

class GoldBuyView(APIView):
    """
    POST /gold/buy
    Buy gold — deducts fiat from wallet, adds gold to gold wallet.
    Requires authentication.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GoldBuySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount_fiat = serializer.validated_data['amountFiat']
        amount_gold = serializer.validated_data.get('amountGold', 0)

        # Get latest price
        price_obj = GoldPrice.objects.first()
        if not price_obj:
            return Response(
                {'error': {'code': 'NO_PRICE', 'message': 'No gold price available.'}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Calculate gold amount if not provided
        if not amount_gold and amount_fiat > 0:
            amount_gold = amount_fiat / price_obj.sellPrice if price_obj.sellPrice else 0

        # Check wallet balance
        try:
            from wallet.models import Wallet, GoldWallet
            wallet = Wallet.objects.get(userId=request.user)
        except Wallet.DoesNotExist:
            return Response(
                {'error': {'code': 'WALLET_NOT_FOUND', 'message': 'Wallet not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if wallet.balance < amount_fiat:
            return Response(
                {'error': {'code': 'INSUFFICIENT_BALANCE', 'message': 'Insufficient wallet balance.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deduct from wallet
        wallet.balance -= amount_fiat
        wallet.save(update_fields=['balance', 'updatedAt'])

        # Add gold to gold wallet
        gold_wallet, _ = GoldWallet.objects.get_or_create(
            userId=request.user,
            defaults={'goldGrams': 0, 'frozenGold': 0},
        )
        gold_wallet.goldGrams += amount_gold
        gold_wallet.save(update_fields=['goldGrams', 'updatedAt'])

        # Create transaction record
        fee = amount_fiat * 0.005  # 0.5% fee
        transaction = Transaction.objects.create(
            userId=request.user,
            type='buy',
            amountFiat=amount_fiat,
            amountGold=amount_gold,
            fee=fee,
            goldPrice=price_obj.sellPrice,
            status='completed',
            referenceId=f"TXN{secrets.token_hex(8).upper()}",
            description='Gold purchase',
        )

        return Response({
            'transaction': TransactionSerializer(transaction).data,
            'walletBalance': wallet.balance,
            'goldGrams': gold_wallet.goldGrams,
        }, status=status.HTTP_201_CREATED)


class GoldSellView(APIView):
    """
    POST /gold/sell
    Sell gold — deducts gold from gold wallet, adds fiat to wallet.
    Requires authentication.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GoldSellSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount_gold = serializer.validated_data['amountGold']
        amount_fiat = serializer.validated_data.get('amountFiat', 0)

        # Get latest price
        price_obj = GoldPrice.objects.first()
        if not price_obj:
            return Response(
                {'error': {'code': 'NO_PRICE', 'message': 'No gold price available.'}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Calculate fiat amount if not provided
        if not amount_fiat and amount_gold > 0:
            amount_fiat = amount_gold * price_obj.buyPrice if price_obj.buyPrice else 0

        # Check gold wallet balance
        try:
            from wallet.models import GoldWallet, Wallet
            gold_wallet = GoldWallet.objects.get(userId=request.user)
        except GoldWallet.DoesNotExist:
            return Response(
                {'error': {'code': 'GOLD_WALLET_NOT_FOUND', 'message': 'Gold wallet not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        if gold_wallet.goldGrams < amount_gold:
            return Response(
                {'error': {'code': 'INSUFFICIENT_GOLD', 'message': 'Insufficient gold balance.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deduct gold
        gold_wallet.goldGrams -= amount_gold
        gold_wallet.save(update_fields=['goldGrams', 'updatedAt'])

        # Add fiat to wallet
        wallet, _ = Wallet.objects.get_or_create(
            userId=request.user,
            defaults={'balance': 0, 'frozenBalance': 0},
        )
        wallet.balance += amount_fiat
        wallet.save(update_fields=['balance', 'updatedAt'])

        # Create transaction record
        fee = amount_fiat * 0.005  # 0.5% fee
        transaction = Transaction.objects.create(
            userId=request.user,
            type='sell',
            amountFiat=amount_fiat,
            amountGold=amount_gold,
            fee=fee,
            goldPrice=price_obj.buyPrice,
            status='completed',
            referenceId=f"TXN{secrets.token_hex(8).upper()}",
            description='Gold sale',
        )

        return Response({
            'transaction': TransactionSerializer(transaction).data,
            'walletBalance': wallet.balance,
            'goldGrams': gold_wallet.goldGrams,
        }, status=status.HTTP_201_CREATED)


# =============================================================================
# Price History ViewSet
# =============================================================================

class PriceHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only access to price history with OHLCV data.
    """
    queryset = PriceHistory.objects.all()
    serializer_class = PriceHistorySerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    filterset_fields = ['interval']
    ordering_fields = ['timestamp']


# =============================================================================
# Price Alert ViewSet
# =============================================================================

class PriceAlertViewSet(viewsets.ModelViewSet):
    """
    CRUD for price alerts, scoped to the authenticated user.
    """
    serializer_class = PriceAlertSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    filterset_fields = ['type', 'condition', 'isActive', 'isTriggered']
    ordering_fields = ['createdAt']

    def get_queryset(self):
        return PriceAlert.objects.filter(userId=self.request.user)

    def perform_create(self, serializer):
        serializer.save(userId=self.request.user)


# =============================================================================
# Transaction ViewSet
# =============================================================================

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only access to gold transactions, scoped to the authenticated user.
    """
    serializer_class = TransactionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    filterset_fields = ['type', 'status']
    search_fields = ['referenceId', 'description']
    ordering_fields = ['createdAt']

    def get_queryset(self):
        return Transaction.objects.filter(userId=self.request.user)


# =============================================================================
# Seed Prices (Admin)
# =============================================================================

class SeedPricesView(APIView):
    """
    POST /gold/seed-prices
    Seed the database with sample gold price data.
    Admin only.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request):
        import random
        from datetime import timedelta

        # Create a current price entry
        base_price = random.uniform(3500000, 4500000)  # IRR per gram
        spread = base_price * 0.02

        GoldPrice.objects.create(
            buyPrice=base_price - spread / 2,
            sellPrice=base_price + spread / 2,
            marketPrice=base_price,
            ouncePrice=base_price * 31.1035,  # Approximate ounce conversion
            spread=spread,
            currency='IRR',
            isManual=False,
        )

        # Create price history entries
        now = timezone.now()
        for i in range(24):
            ts = now - timedelta(hours=i)
            price = base_price + random.uniform(-50000, 50000)
            PriceHistory.objects.create(
                price=price,
                interval='1h',
                openPrice=price + random.uniform(-20000, 20000),
                highPrice=price + random.uniform(0, 50000),
                lowPrice=price - random.uniform(0, 50000),
                closePrice=price + random.uniform(-10000, 10000),
                volume=random.uniform(100, 1000),
                timestamp=ts,
            )

        return Response({
            'message': 'Price data seeded successfully.',
            'prices_created': 1,
            'history_created': 24,
        }, status=status.HTTP_201_CREATED)
