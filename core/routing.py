"""
WebSocket URL routing for ZarrinGold Django Channels.

Defines all WebSocket endpoint patterns for real-time features:
- Gold price streaming
- Live trading updates
- Notifications
- Chat/support
"""

from django.urls import re_path

# Import consumers as they are created
# from core.consumers import GoldPriceConsumer, NotificationConsumer

# WebSocket URL patterns — consumers will be added as they're implemented
websocket_urlpatterns = [
    # Gold price real-time stream
    # re_path(r'ws/gold/prices/$', GoldPriceConsumer.as_asgi()),

    # User notification channel
    # re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),

    # Trading updates
    # re_path(r'ws/trading/$', TradingConsumer.as_asgi()),
]
