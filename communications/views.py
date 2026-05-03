from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from authentication.backends import TokenAuthentication
from authentication.models import User
from .models import (
    Notification, SupportTicket, TicketMessage,
    SmsCampaign, SmsLog, SmsTemplate,
    EmailCampaign, EmailLog, EmailTemplate,
    TelegramUser,
)
from .serializers import (
    NotificationSerializer, SupportTicketSerializer,
    SupportTicketListSerializer, TicketMessageSerializer,
    ChatMessageSerializer, ChatAIReplySerializer,
    SmsCampaignSerializer, SmsLogSerializer, SmsTemplateSerializer,
    EmailCampaignSerializer, EmailLogSerializer, EmailTemplateSerializer,
    TelegramUserSerializer, TelegramSendMessageSerializer,
    SmsStatsSerializer, EmailStatsSerializer, SmsQuickSendSerializer,
)


def is_admin(user):
    return user.role in ['admin', 'super_admin']


# ─── Notification ────────────────────────────────────────────────────────────

class NotificationViewSet(viewsets.ModelViewSet):
    """Notifications scoped to the current user, with mark-as-read action."""
    serializer_class = NotificationSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return Notification.objects.filter(userId=self.request.user)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.isRead = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(
            userId=request.user, isRead=False
        ).update(isRead=True)
        return Response({'message': 'All notifications marked as read'})


# ─── Support Ticket ──────────────────────────────────────────────────────────

class SupportTicketViewSet(viewsets.ModelViewSet):
    """Support tickets scoped to current user for create/list."""
    authentication_classes = [TokenAuthentication]

    def get_serializer_class(self):
        if self.action == 'list':
            return SupportTicketListSerializer
        return SupportTicketSerializer

    def get_queryset(self):
        return SupportTicket.objects.filter(userId=self.request.user).prefetch_related('messages')

    def perform_create(self, serializer):
        serializer.save(userId=self.request.user)


class TicketMessageViewSet(viewsets.ModelViewSet):
    """Ticket messages scoped to a specific ticket."""
    serializer_class = TicketMessageSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return TicketMessage.objects.filter(
            ticketId__userId=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(senderId=self.request.user)
        # Update ticket's first reply timestamp
        ticket = serializer.validated_data.get('ticketId')
        if ticket and not ticket.firstReplyAt:
            ticket.firstReplyAt = timezone.now()
            ticket.save(update_fields=['firstReplyAt'])


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatView(APIView):
    """GET/POST - Chat messages (simple in-memory store for demo)."""
    authentication_classes = [TokenAuthentication]

    # In-memory chat store for demo purposes
    _chat_messages = {}

    def get(self, request):
        user_id = request.user.id
        messages = self._chat_messages.get(user_id, [])
        return Response({
            'messages': messages,
            'total': len(messages),
        })

    def post(self, request):
        user_id = request.user.id
        content = request.data.get('content', '')
        if not content:
            return Response(
                {'error': 'Content is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user_id not in self._chat_messages:
            self._chat_messages[user_id] = []

        message = {
            'id': f"msg-{len(self._chat_messages[user_id]) + 1}",
            'content': content,
            'senderType': 'user',
            'senderId': user_id,
            'createdAt': timezone.now().isoformat(),
        }
        self._chat_messages[user_id].append(message)

        return Response(message, status=status.HTTP_201_CREATED)


class ChatFAQViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only chat FAQ (using SmsTemplate as FAQ store)."""
    serializer_class = SmsTemplateSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return SmsTemplate.objects.filter(type='faq', isActive=True)


class ChatAIReplyView(APIView):
    """POST - Generate AI reply for chat."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        serializer = ChatAIReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = serializer.validated_data['message']

        # Simple rule-based AI reply (placeholder for real AI integration)
        reply = self._generate_reply(user_message)

        return Response({
            'reply': reply,
            'senderType': 'bot',
            'createdAt': timezone.now().isoformat(),
        })

    def _generate_reply(self, message):
        msg_lower = message.lower()
        if 'price' in msg_lower or 'قیمت' in msg_lower:
            return 'برای مشاهده قیمت لحظه‌ای طلا، به بخش بازار مراجعه کنید.'
        elif 'buy' in msg_lower or 'خرید' in msg_lower:
            return 'برای خرید طلا، به بخش معامله بروید و مبلغ مورد نظر را وارد کنید.'
        elif 'sell' in msg_lower or 'فروش' in msg_lower:
            return 'برای فروش طلا، به بخش معامله بروید و مقدار طلای خود را وارد کنید.'
        elif 'help' in msg_lower or 'کمک' in msg_lower:
            return 'چطور می‌توانم کمکتان کنم؟ می‌توانید درباره قیمت، خرید، فروش یا سایر سوالات خود بپرسید.'
        else:
            return 'متشکرم از پیام شما. تیم پشتیبانی در اسرع وقت پاسخ خواهد داد.'


class ChatOperatorViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin only - list chat operators."""
    serializer_class = TelegramUserSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        if not is_admin(self.request.user):
            return TelegramUser.objects.none()
        return TelegramUser.objects.filter(isLinked=True)


# ─── SMS Campaign ────────────────────────────────────────────────────────────

class SmsCampaignViewSet(viewsets.ModelViewSet):
    """SMS campaigns — admin only."""
    serializer_class = SmsCampaignSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        if not is_admin(self.request.user):
            return SmsCampaign.objects.none()
        return SmsCampaign.objects.all().order_by('-createdAt')

    def perform_create(self, serializer):
        serializer.save(createdById=self.request.user.id)


class SmsTemplateViewSet(viewsets.ModelViewSet):
    """SMS templates — admin only."""
    serializer_class = SmsTemplateSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        if not is_admin(self.request.user):
            return SmsTemplate.objects.none()
        return SmsTemplate.objects.all().order_by('name')


class SmsStatsView(APIView):
    """GET - SMS statistics."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        from django.db.models import Sum, Count
        campaigns = SmsCampaign.objects.aggregate(
            total=Count('id'),
            total_sent=Sum('recipientCount', default=0),
            total_delivered=Sum('deliveredCount', default=0),
            total_failed=Sum('failedCount', default=0),
            total_cost=Sum('totalCost', default=0),
        )

        total_sent = campaigns['total_sent'] or 0
        total_delivered = campaigns['total_delivered'] or 0
        delivery_rate = (total_delivered / total_sent * 100) if total_sent > 0 else 0

        data = {
            'totalCampaigns': campaigns['total'],
            'totalSent': total_sent,
            'totalDelivered': total_delivered,
            'totalFailed': campaigns['total_failed'] or 0,
            'totalCost': campaigns['total_cost'] or 0,
            'deliveryRate': round(delivery_rate, 2),
        }
        return Response(SmsStatsSerializer(data).data)


class SmsQuickSendView(APIView):
    """POST - Quick send a single SMS."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = SmsQuickSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        log = SmsLog.objects.create(
            phone=serializer.validated_data['phone'],
            message=serializer.validated_data['message'],
            type=serializer.validated_data.get('type', 'notification'),
            status='sent',
            sentAt=timezone.now(),
        )

        return Response(SmsLogSerializer(log).data, status=status.HTTP_201_CREATED)


# ─── Email Campaign ──────────────────────────────────────────────────────────

class EmailCampaignViewSet(viewsets.ModelViewSet):
    """Email campaigns — admin only."""
    serializer_class = EmailCampaignSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        if not is_admin(self.request.user):
            return EmailCampaign.objects.none()
        return EmailCampaign.objects.all().order_by('-createdAt')

    def perform_create(self, serializer):
        serializer.save(createdById=self.request.user.id)


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """Email templates — admin only."""
    serializer_class = EmailTemplateSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        if not is_admin(self.request.user):
            return EmailTemplate.objects.none()
        return EmailTemplate.objects.all().order_by('name')


class EmailStatsView(APIView):
    """GET - Email statistics."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        from django.db.models import Sum, Count
        campaigns = EmailCampaign.objects.aggregate(
            total=Count('id'),
            total_sent=Sum('recipientCount', default=0),
            total_delivered=Sum('deliveredCount', default=0),
            total_failed=Sum('failedCount', default=0),
        )

        total_sent = campaigns['total_sent'] or 0
        total_delivered = campaigns['total_delivered'] or 0
        delivery_rate = (total_delivered / total_sent * 100) if total_sent > 0 else 0

        data = {
            'totalCampaigns': campaigns['total'],
            'totalSent': total_sent,
            'totalDelivered': total_delivered,
            'totalFailed': campaigns['total_failed'] or 0,
            'deliveryRate': round(delivery_rate, 2),
        }
        return Response(EmailStatsSerializer(data).data)


# ─── Telegram ────────────────────────────────────────────────────────────────

class TelegramUserViewSet(viewsets.ModelViewSet):
    """Telegram user management — user scoped."""
    serializer_class = TelegramUserSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        if is_admin(self.request.user):
            return TelegramUser.objects.all()
        return TelegramUser.objects.filter(userId=self.request.user)

    def perform_create(self, serializer):
        serializer.save(userId=self.request.user)


class TelegramSendMessageView(APIView):
    """POST - Send a message via Telegram bot."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = TelegramSendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Placeholder - in production, integrate with Telegram Bot API
        return Response({
            'message': 'Telegram message queued',
            'chatId': serializer.validated_data['chatId'],
        })
