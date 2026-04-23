"""
Celery tasks for gold price updates
"""
import random
import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

BASE_GOLD_PRICE = 34_900_000  # Base price per gram in Toman


@shared_task(name='zarringold.apps.gold.tasks.update_gold_prices')
def update_gold_prices():
    """Fetch and update gold prices from external source"""
    from .models import GoldPrice, PriceHistory

    # Simulate price fluctuation (±0.5%)
    variation = random.uniform(-0.005, 0.005)
    market_price = BASE_GOLD_PRICE * (1 + variation)
    buy_price = market_price * 1.005   # 0.5% spread
    sell_price = market_price * 0.995  # 0.5% spread
    ounce_price = market_price * 31.1035  # 1 troy ounce = 31.1035 grams

    # Check if there's a manual price override (don't overwrite)
    latest = GoldPrice.objects.first()
    if latest and latest.is_manual:
        logger.info("Skipping auto price update - manual price is set")
        return

    # Create new price record
    GoldPrice.objects.create(
        buy_price=round(buy_price),
        sell_price=round(sell_price),
        market_price=round(market_price),
        ounce_price=round(ounce_price),
        spread=round(buy_price - sell_price),
    )

    # Create hourly candle
    prev = PriceHistory.objects.filter(interval='1h').first()
    PriceHistory.objects.create(
        price=round(market_price, 2),
        interval='1h',
        open_price=prev.close_price if prev else round(market_price, 2),
        high_price=round(max(market_price, prev.high_price if prev else market_price), 2),
        low_price=round(min(market_price, prev.low_price if prev else market_price), 2),
        close_price=round(market_price, 2),
    )

    logger.info(f"Gold price updated: buy={round(buy_price):,}, sell={round(sell_price):,}")


@shared_task(name='zarringold.apps.gold.tasks.seed_historical_prices')
def seed_historical_prices(days=30):
    """Seed historical price data for demo"""
    from .models import GoldPrice, PriceHistory

    # Clear existing
    PriceHistory.objects.all().delete()
    GoldPrice.objects.all().delete()

    # Create current price
    GoldPrice.objects.create(
        buy_price=35_000_000,
        sell_price=34_800_000,
        market_price=34_900_000,
        ounce_price=1_085_922_000,
        spread=200_000,
    )

    # Create hourly candles for the past N days
    count = 0
    current_price = float(BASE_GOLD_PRICE)
    now = timezone.now()

    for day in range(days, 0, -1):
        for hour in range(24):
            timestamp = now - timedelta(days=day, hours=23 - hour)
            variation = random.uniform(-0.003, 0.003)
            price = current_price * (1 + variation)
            open_p = price * random.uniform(0.999, 1.001)
            high_p = price * random.uniform(1.001, 1.005)
            low_p = price * random.uniform(0.995, 0.999)
            close_p = price * random.uniform(0.999, 1.001)
            current_price = close_p

            PriceHistory.objects.create(
                price=round(price, 2),
                interval='1h',
                open_price=round(open_p, 2),
                high_price=round(high_p, 2),
                low_price=round(low_p, 2),
                close_price=round(close_p, 2),
                timestamp=timestamp,
            )
            count += 1

    logger.info(f"Seeded {count} historical price records")
    return count
