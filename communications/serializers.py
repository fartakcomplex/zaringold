from rest_framework import serializers
from .models import (
    Notification, SupportTicket, TicketMessage,
    SmsCampaign, SmsLog, SmsTemplate,
    EmailCampaign, EmailLog, EmailTemplate,
    TelegramUser,
)


# ─── Notification ────────────────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'userId', 'title', 'body', 'type', 'isRead',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


# ─── Support Ticket ──────────────────────────────────────────────────────────

class TicketMessageSerializer(serializers.ModelSerializer):
    senderPhone = serializers.CharField(source='senderId.phone', read_only=True)

    class Meta:
        model = TicketMessage
        fields = [
            'id', 'ticketId', 'senderId', 'senderPhone', 'content',
            'isAdmin', 'isInternal', 'attachments',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'senderId', 'createdAt', 'updatedAt']


class SupportTicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    messageCount = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'userId', 'subject', 'category', 'status', 'priority',
            'department', 'assignedTo', 'rating', 'feedback',
            'slaDeadline', 'closedAt', 'firstReplyAt',
            'messages', 'messageCount', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'status', 'assignedTo', 'closedAt', 'firstReplyAt',
            'createdAt', 'updatedAt',
        ]

    def get_messageCount(self, obj):
        return obj.messages.count()


class SupportTicketListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for ticket lists."""
    messageCount = serializers.IntegerField(default=0)

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'subject', 'category', 'status', 'priority',
            'department', 'createdAt', 'updatedAt',
        ]


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatMessageSerializer(serializers.Serializer):
    id = serializers.CharField()
    content = serializers.CharField()
    senderType = serializers.CharField()  # 'user' or 'admin' or 'bot'
    senderId = serializers.CharField(allow_null=True)
    createdAt = serializers.DateTimeField()


class ChatFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmsTemplate
        fields = [
            'id', 'name', 'slug', 'content', 'type',
            'variables', 'isActive', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']


class ChatAIReplySerializer(serializers.Serializer):
    message = serializers.CharField()


# ─── SMS Campaign ────────────────────────────────────────────────────────────

class SmsCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmsCampaign
        fields = [
            'id', 'name', 'type', 'message', 'senderNumber',
            'recipientCount', 'deliveredCount', 'failedCount', 'pendingCount',
            'status', 'scheduledAt', 'sentAt', 'completedAt',
            'createdById', 'segment', 'filterJson', 'costPerSms',
            'totalCost', 'template', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'deliveredCount', 'failedCount', 'pendingCount',
            'sentAt', 'completedAt', 'totalCost', 'createdAt', 'updatedAt',
        ]


class SmsLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmsLog
        fields = [
            'id', 'campaignId', 'phone', 'message', 'type', 'status',
            'provider', 'messageId', 'cost', 'errorMessage', 'retryCount',
            'sentAt', 'deliveredAt', 'userId', 'createdAt', 'updatedAt',
        ]
        read_only_fields = fields


class SmsTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmsTemplate
        fields = [
            'id', 'name', 'slug', 'content', 'type',
            'variables', 'isActive', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']


# ─── Email Campaign ──────────────────────────────────────────────────────────

class EmailCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailCampaign
        fields = [
            'id', 'name', 'type', 'subject', 'content',
            'senderEmail', 'senderName', 'recipientCount',
            'deliveredCount', 'failedCount', 'status',
            'scheduledAt', 'sentAt', 'completedAt',
            'createdById', 'segment', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'deliveredCount', 'failedCount',
            'sentAt', 'completedAt', 'createdAt', 'updatedAt',
        ]


class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = [
            'id', 'campaignId', 'email', 'subject', 'content',
            'status', 'errorMessage', 'sentAt', 'deliveredAt',
            'userId', 'createdAt', 'updatedAt',
        ]
        read_only_fields = fields


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'slug', 'subject', 'content', 'type',
            'variables', 'isActive', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']


# ─── Telegram ────────────────────────────────────────────────────────────────

class TelegramUserSerializer(serializers.ModelSerializer):
    userPhone = serializers.CharField(source='userId.phone', read_only=True)

    class Meta:
        model = TelegramUser
        fields = [
            'id', 'userId', 'userPhone', 'chatId', 'telegramUsername',
            'telegramId', 'isLinked', 'linkedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'linkedAt', 'createdAt', 'updatedAt']


class TelegramSendMessageSerializer(serializers.Serializer):
    chatId = serializers.CharField()
    message = serializers.CharField()


# ─── Stats Serializers ───────────────────────────────────────────────────────

class SmsStatsSerializer(serializers.Serializer):
    totalCampaigns = serializers.IntegerField()
    totalSent = serializers.IntegerField()
    totalDelivered = serializers.IntegerField()
    totalFailed = serializers.IntegerField()
    totalCost = serializers.FloatField()
    deliveryRate = serializers.FloatField()


class EmailStatsSerializer(serializers.Serializer):
    totalCampaigns = serializers.IntegerField()
    totalSent = serializers.IntegerField()
    totalDelivered = serializers.IntegerField()
    totalFailed = serializers.IntegerField()
    deliveryRate = serializers.FloatField()


class SmsQuickSendSerializer(serializers.Serializer):
    phone = serializers.CharField()
    message = serializers.CharField()
    type = serializers.CharField(default='notification')
