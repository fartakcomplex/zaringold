from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet, SupportTicketViewSet, TicketMessageViewSet,
    ChatView, ChatFAQViewSet, ChatAIReplyView, ChatOperatorViewSet,
    SmsCampaignViewSet, SmsTemplateViewSet, SmsStatsView, SmsQuickSendView,
    EmailCampaignViewSet, EmailTemplateViewSet, EmailStatsView,
    TelegramUserViewSet, TelegramSendMessageView,
)

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')
router.register(r'ticket-messages', TicketMessageViewSet, basename='ticket-message')
router.register(r'chat-faq', ChatFAQViewSet, basename='chat-faq')
router.register(r'chat-operators', ChatOperatorViewSet, basename='chat-operator')
router.register(r'sms/campaigns', SmsCampaignViewSet, basename='sms-campaign')
router.register(r'sms/templates', SmsTemplateViewSet, basename='sms-template')
router.register(r'email/campaigns', EmailCampaignViewSet, basename='email-campaign')
router.register(r'email/templates', EmailTemplateViewSet, basename='email-template')
router.register(r'telegram', TelegramUserViewSet, basename='telegram-user')

app_name = 'communications'

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ChatView.as_view(), name='chat'),
    path('chat/ai-reply/', ChatAIReplyView.as_view(), name='chat-ai-reply'),
    path('sms/stats/', SmsStatsView.as_view(), name='sms-stats'),
    path('sms/quick-send/', SmsQuickSendView.as_view(), name='sms-quick-send'),
    path('email/stats/', EmailStatsView.as_view(), name='email-stats'),
    path('telegram/send/', TelegramSendMessageView.as_view(), name='telegram-send'),
]
