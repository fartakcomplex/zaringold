from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminDashboardView,
    AdminUserViewSet,
    AdminRoleManagementViewSet,
    AdminTransactionListView,
    AdminSettlementViewSet,
    AdminKYCListView,
    AdminLoanManagementViewSet,
    AdminBlogViewSet,
    AdminBlogCategoryViewSet,
    AdminBlogTagViewSet,
    AdminSecurityView,
    AdminSecurityEventsView,
    AdminBlockedIPViewSet,
    AdminBackupView,
    AdminGamificationView,
    AdminAchievementViewSet,
    AdminQuestMissionViewSet,
    AdminCashbackViewSet,
    AdminGiftViewSet,
    AdminCreatorSubmissionViewSet,
    AdminTicketManagementViewSet,
    AdminSmsCampaignViewSet,
    AdminEmailCampaignViewSet,
    AdminTelegramView,
    AdminLandingView,
    AdminSiteSettingsView,
    AdminGatewayConfigView,
    AdminMediaViewSet,
    AdminVIPViewSet,
    AdminFeatureFlagsView,
    AdminSystemInfoView,
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'roles', AdminRoleManagementViewSet, basename='admin-role')
router.register(r'settlements', AdminSettlementViewSet, basename='admin-settlement')
router.register(r'loans', AdminLoanManagementViewSet, basename='admin-loan')
router.register(r'blog/posts', AdminBlogViewSet, basename='admin-blog-post')
router.register(r'blog/categories', AdminBlogCategoryViewSet, basename='admin-blog-category')
router.register(r'blog/tags', AdminBlogTagViewSet, basename='admin-blog-tag')
router.register(r'security/blocked-ips', AdminBlockedIPViewSet, basename='admin-blocked-ip')
router.register(r'achievements', AdminAchievementViewSet, basename='admin-achievement')
router.register(r'quest-missions', AdminQuestMissionViewSet, basename='admin-quest-mission')
router.register(r'cashbacks', AdminCashbackViewSet, basename='admin-cashback')
router.register(r'gifts', AdminGiftViewSet, basename='admin-gift')
router.register(r'creator-submissions', AdminCreatorSubmissionViewSet, basename='admin-creator-submission')
router.register(r'tickets', AdminTicketManagementViewSet, basename='admin-ticket')
router.register(r'sms-campaigns', AdminSmsCampaignViewSet, basename='admin-sms-campaign')
router.register(r'email-campaigns', AdminEmailCampaignViewSet, basename='admin-email-campaign')
router.register(r'media', AdminMediaViewSet, basename='admin-media')
router.register(r'vip', AdminVIPViewSet, basename='admin-vip')

app_name = 'admin_panel'

urlpatterns = [
    path('', include(router.urls)),
    # Dashboard
    path('dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    # Transactions
    path('transactions/', AdminTransactionListView.as_view(), name='admin-transactions'),
    # KYC
    path('kyc/', AdminKYCListView.as_view(), name='admin-kyc'),
    # Security
    path('security/', AdminSecurityView.as_view(), name='admin-security'),
    path('security/events/', AdminSecurityEventsView.as_view(), name='admin-security-events'),
    # Backup
    path('backup/', AdminBackupView.as_view(), name='admin-backup'),
    # Gamification
    path('gamification/', AdminGamificationView.as_view(), name='admin-gamification'),
    # Telegram
    path('telegram/', AdminTelegramView.as_view(), name='admin-telegram'),
    # Landing
    path('landing/', AdminLandingView.as_view(), name='admin-landing'),
    # Site Settings
    path('site-settings/', AdminSiteSettingsView.as_view(), name='admin-site-settings'),
    # Gateway Config
    path('gateway-config/', AdminGatewayConfigView.as_view(), name='admin-gateway-config'),
    # Feature Flags
    path('feature-flags/', AdminFeatureFlagsView.as_view(), name='admin-feature-flags'),
    # System Info
    path('system-info/', AdminSystemInfoView.as_view(), name='admin-system-info'),
]
