"""
Gold trading views - Buy/Sell gold
"""
from decimal import Decimal
from django.db import transaction as db_transaction
from django.conf import settings
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import permission_classes

from .models import GoldPrice, PriceHistory
from zarringold.utils.helpers import calculate_fee, generate_reference_id


class GoldPricesView(APIView):
    """Get current gold prices and history"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get latest price
        price = GoldPrice.objects.first()
        if not price:
            # Create default
            price = GoldPrice.objects.create(
                buy_price=35_000_000,
                sell_price=34_800_000,
                market_price=34_900_000,
                ounce_price=34_900_000_0,
            )

        # Get 24h history
        from django.utils import timezone
        since = timezone.now() - timezone.timedelta(hours=24)
        history = PriceHistory.objects.filter(interval='1h', timestamp__gte=since)[:48]

        return Response({
            'success': True,
            'prices': {
                'buy': price.buy_price,
                'sell': price.sell_price,
                'market': price.market_price,
                'ounce': price.ounce_price,
                'spread': price.spread,
                'currency': price.currency,
                'is_manual': price.is_manual,
                'updated_at': price.created_at.isoformat(),
            },
            'history': [{
                'price': h.price,
                'timestamp': h.timestamp.isoformat(),
            } for h in history],
        })


class BuyGoldView(APIView):
    """Buy gold with fiat currency"""
    permission_classes = [IsAuthenticated]

    @db_transaction.atomic
    def post(self, request):
        user = request.user
        amount_fiat = Decimal(str(request.data.get('amount_fiat', 0)))

        if amount_fiat < settings.MIN_BUY_AMOUNT:
            return Response({
                'success': False,
                'message': f'حداقل مبلغ خرید {settings.MIN_BUY_AMOUNT:,} تومان است',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get latest price
        price = GoldPrice.objects.select_for_update().first()
        if not price:
            return Response({'success': False, 'message': 'قیمت طلا در دسترس نیست'}, status=400)

        buy_price = Decimal(str(price.buy_price))
        fee = calculate_fee(amount_fiat, settings.BUY_FEE_RATE)
        net_amount = amount_fiat - fee

        if net_amount <= 0:
            return Response({'success': False, 'message': 'مبلغ پس از کسر کارمزد نامعتبر است'}, status=400)

        grams = net_amount / buy_price

        # Update wallet
        wallet = user.fiat_wallet
        if wallet.balance < amount_fiat:
            return Response({'success': False, 'message': 'موجودی کافی نیست'}, status=400)

        wallet.balance = Decimal(str(wallet.balance)) - amount_fiat
        wallet.save(update_fields=['balance'])

        gold_wallet = user.gold_wallet
        gold_wallet.gold_grams = Decimal(str(gold_wallet.gold_grams)) + grams
        gold_wallet.save(update_fields=['gold_grams'])

        # Create transaction
        from zarringold.apps.transactions.models import Transaction
        txn = Transaction.objects.create(
            user=user,
            tx_type='buy_gold',
            amount_fiat=amount_fiat,
            amount_gold=grams,
            fee=fee,
            gold_price=buy_price,
            status='success',
            reference_id=generate_reference_id('BUY'),
            description=f'خرید {grams:.6f} گرم طلا',
        )

        # Create notification
        from zarringold.apps.notifications.models import Notification
        Notification.objects.create(
            user=user,
            title='خرید طلا موفق',
            body=f'شما {grams:.6f} گرم طلا با مبلغ {amount_fiat:,} تومان خریدید.',
            type='success',
        )

        return Response({
            'success': True,
            'grams': float(grams),
            'fee': int(fee),
            'total_paid': int(amount_fiat),
            'new_gold_balance': float(gold_wallet.gold_grams),
            'new_fiat_balance': float(wallet.balance),
            'transaction': {
                'id': str(txn.id),
                'reference_id': txn.reference_id,
            },
        })


class SellGoldView(APIView):
    """Sell gold for fiat currency"""
    permission_classes = [IsAuthenticated]

    @db_transaction.atomic
    def post(self, request):
        user = request.user
        gold_grams = Decimal(str(request.data.get('gold_grams', 0)))

        if gold_grams < settings.MIN_SELL_GRAMS:
            return Response({
                'success': False,
                'message': f'حداقل مقدار فروش {settings.MIN_SELL_GRAMS} گرم است',
            }, status=400)

        price = GoldPrice.objects.select_for_update().first()
        if not price:
            return Response({'success': False, 'message': 'قیمت طلا در دسترس نیست'}, status=400)

        sell_price = Decimal(str(price.sell_price))
        gross_amount = gold_grams * sell_price
        fee = calculate_fee(gross_amount, settings.SELL_FEE_RATE)
        net_amount = gross_amount - fee

        gold_wallet = user.gold_wallet
        if gold_wallet.gold_grams < gold_grams:
            return Response({'success': False, 'message': 'موجودی طلای کافی نیست'}, status=400)

        gold_wallet.gold_grams = Decimal(str(gold_wallet.gold_grams)) - gold_grams
        gold_wallet.save(update_fields=['gold_grams'])

        wallet = user.fiat_wallet
        wallet.balance = Decimal(str(wallet.balance)) + net_amount
        wallet.save(update_fields=['balance'])

        from zarringold.apps.transactions.models import Transaction
        txn = Transaction.objects.create(
            user=user,
            tx_type='sell_gold',
            amount_fiat=net_amount,
            amount_gold=gold_grams,
            fee=fee,
            gold_price=sell_price,
            status='success',
            reference_id=generate_reference_id('SELL'),
            description=f'فروش {gold_grams:.6f} گرم طلا',
        )

        return Response({
            'success': True,
            'fiat_amount': float(net_amount),
            'fee': int(fee),
            'net_amount': float(net_amount),
            'new_fiat_balance': float(wallet.balance),
            'new_gold_balance': float(gold_wallet.gold_grams),
            'transaction': {'id': str(txn.id), 'reference_id': txn.reference_id},
        })


class AdminPriceManageView(APIView):
    """Admin: Set manual gold prices"""
    permission_classes = [IsAdminUser]

    def post(self, request):
        GoldPrice.objects.create(
            buy_price=request.data.get('buy_price', 0),
            sell_price=request.data.get('sell_price', 0),
            market_price=request.data.get('market_price', 0),
            is_manual=True,
        )
        return Response({'success': True, 'message': 'قیمت‌ها بروزرسانی شد'})
