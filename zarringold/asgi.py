"""
ASGI config for ZarrinGold project.

Configures Django Channels for WebSocket support alongside
standard HTTP handling via Daphne ASGI server.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zarringold.settings')

# Initialize Django before importing channel layers or auth models
django.setup()

from channels.auth import AuthMiddlewareStack  # noqa: E402
from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from django.core.asgi import get_asgi_application  # noqa: E402

# Import WebSocket URL routes (will be created in core/routing.py)
try:
    from core.routing import websocket_urlpatterns
except ImportError:
    websocket_urlpatterns = []

application = ProtocolTypeRouter({
    # HTTP requests → standard Django ASGI
    'http': get_asgi_application(),

    # WebSocket requests → Django Channels with auth middleware
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
