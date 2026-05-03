"""
Admin Panel serializers.

Uses imports from other apps to reuse existing serializers.
"""
from rest_framework import serializers
from authentication.models import User, KYCRequest, Role, Permission, UserRole, RolePermission
from gold.models import Transaction
from wallet.models import GoldLoan, Payment
from gateway.models import Merchant, Settlement, GatewayPayment
from gamification.models import (
    Achievement, QuestMission, CashbackReward, VIPSubscription, UserGamification,
)
from social.models import GiftTransfer, Referral
from content.models import BlogPost, BlogCategory, BlogTag, CMSPage
from core.models import LandingSection
from communications.models import (
    SupportTicket, SmsCampaign, EmailCampaign, TelegramUser,
)
from core.models import (
    SecurityEvent, BlockedIP, Media, SiteSetting, SystemSetting,
    AuditLog, SecurityConfig, GoldReserve, LoanSetting,
)
from .models import CreatorSubmission


# ─── User Management ─────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'phone', 'email', 'fullName', 'isVerified', 'isActive',
            'isFrozen', 'role', 'avatar', 'referralCode', 'userLevel',
            'lastLoginAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'referralCode', 'createdAt', 'updatedAt']


class AdminUserActionSerializer(serializers.Serializer):
    """Serializer for admin user actions (ban, freeze, activate, impersonate)."""
    action = serializers.ChoiceField(choices=['ban', 'freeze', 'activate', 'impersonate'])
    reason = serializers.CharField(required=False, default='')


# ─── Role & Permission ───────────────────────────────────────────────────────

class AdminRoleSerializer(serializers.ModelSerializer):
    userCount = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'name', 'label', 'description', 'permissions',
            'color', 'isSystem', 'priority', 'userCount',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']

    def get_userCount(self, obj):
        return UserRole.objects.filter(roleId=obj).count()


class AdminPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'label', 'module', 'description', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']


# ─── Transactions ────────────────────────────────────────────────────────────

class AdminTransactionSerializer(serializers.ModelSerializer):
    userPhone = serializers.CharField(source='userId.phone', read_only=True, default='')

    class Meta:
        model = Transaction
        fields = [
            'id', 'userId', 'userPhone', 'type', 'amountFiat', 'amountGold',
            'fee', 'goldPrice', 'status', 'referenceId', 'description',
            'toUserId', 'createdAt', 'updatedAt',
        ]


# ─── Settlements ─────────────────────────────────────────────────────────────

class AdminSettlementSerializer(serializers.ModelSerializer):
    merchantName = serializers.CharField(source='merchantId.businessName', read_only=True)

    class Meta:
        model = Settlement
        fields = [
            'id', 'merchantId', 'merchantName', 'amountToman', 'amountGold',
            'feeToman', 'type', 'periodStart', 'periodEnd', 'status',
            'iban', 'transactionRef', 'processedAt', 'createdAt', 'updatedAt',
        ]


# ─── KYC ─────────────────────────────────────────────────────────────────────

class AdminKYCSerializer(serializers.ModelSerializer):
    userPhone = serializers.CharField(source='userId.phone', read_only=True)
    userName = serializers.CharField(source='userId.fullName', read_only=True, default='')

    class Meta:
        model = KYCRequest
        fields = [
            'id', 'userId', 'userPhone', 'userName',
            'idCardImage', 'idCardBackImage', 'selfieImage',
            'bankCardImage', 'verificationVideo',
            'status', 'adminNote', 'reviewedBy', 'reviewedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


# ─── Loans ───────────────────────────────────────────────────────────────────

class AdminLoanSerializer(serializers.ModelSerializer):
    userPhone = serializers.CharField(source='userId.phone', read_only=True)

    class Meta:
        model = GoldLoan
        fields = [
            'id', 'userId', 'userPhone', 'amountRequested', 'goldCollateral',
            'goldPriceAtLoan', 'ltvRatio', 'interestRate', 'durationDays',
            'amountApproved', 'status', 'adminNote', 'reviewedBy',
            'reviewedAt', 'approvedAt', 'dueDate', 'repaidAmount',
            'penaltyAmount', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


# ─── Blog ────────────────────────────────────────────────────────────────────

class AdminBlogPostSerializer(serializers.ModelSerializer):
    authorName = serializers.CharField(source='authorId.fullName', read_only=True, default='')

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt', 'featuredImage',
            'status', 'authorId', 'authorName', 'categoryId',
            'isFeatured', 'viewCount', 'publishedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'viewCount', 'createdAt', 'updatedAt']


class AdminBlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'color', 'icon', 'sortOrder', 'isActive', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminBlogTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = ['id', 'name', 'slug', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']


# ─── Security ────────────────────────────────────────────────────────────────

class AdminSecurityEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityEvent
        fields = [
            'id', 'type', 'severity', 'userId', 'phone', 'ip',
            'userAgent', 'url', 'method', 'details', 'riskScore',
            'resolved', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminBlockedIPSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedIP
        fields = ['id', 'ip', 'reason', 'blockedBy', 'expiresAt', 'isActive', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminSecurityStatsSerializer(serializers.Serializer):
    totalEvents = serializers.IntegerField()
    criticalEvents = serializers.IntegerField()
    unresolvedEvents = serializers.IntegerField()
    blockedIPs = serializers.IntegerField()
    topEventTypes = serializers.ListField()


# ─── Backup ──────────────────────────────────────────────────────────────────

class AdminBackupSerializer(serializers.Serializer):
    lastBackup = serializers.DateTimeField(allow_null=True)
    backupSize = serializers.CharField()
    status = serializers.CharField()
    backups = serializers.ListField()


# ─── Gamification ────────────────────────────────────────────────────────────

class AdminAchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = [
            'id', 'slug', 'title', 'description', 'icon', 'category',
            'xpReward', 'goldRewardMg', 'sortOrder', 'isHidden',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminQuestMissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestMission
        fields = [
            'id', 'title', 'description', 'questType', 'category',
            'targetValue', 'rewardType', 'rewardValue', 'xpReward',
            'goldRewardMg', 'isActive', 'sortOrder', 'startsAt', 'endsAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminCashbackSerializer(serializers.ModelSerializer):
    userPhone = serializers.CharField(source='userId.phone', read_only=True)

    class Meta:
        model = CashbackReward
        fields = [
            'id', 'userId', 'userPhone', 'title', 'rewardType',
            'rewardValue', 'status', 'expiresAt', 'claimedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'claimedAt', 'createdAt', 'updatedAt']


class AdminVIPSerializer(serializers.ModelSerializer):
    userPhone = serializers.CharField(source='userId.phone', read_only=True)

    class Meta:
        model = VIPSubscription
        fields = [
            'id', 'userId', 'userPhone', 'plan', 'startedAt',
            'expiresAt', 'isActive', 'autoRenew', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


# ─── Social ──────────────────────────────────────────────────────────────────

class AdminGiftSerializer(serializers.ModelSerializer):
    senderPhone = serializers.CharField(source='senderId.phone', read_only=True)
    receiverPhone = serializers.CharField(source='receiverId.phone', read_only=True)

    class Meta:
        model = GiftTransfer
        fields = [
            'id', 'senderId', 'receiverId', 'senderPhone', 'receiverPhone',
            'goldMg', 'message', 'occasion', 'giftCardStyle', 'status',
            'scheduledAt', 'openedAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminCreatorSubmissionSerializer(serializers.ModelSerializer):
    userPhone = serializers.CharField(source='userId.phone', read_only=True)

    class Meta:
        model = CreatorSubmission
        fields = [
            'id', 'userId', 'userPhone', 'title', 'content',
            'submissionType', 'status', 'adminNote', 'reviewedBy',
            'reviewedAt', 'attachments', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


# ─── Communications ──────────────────────────────────────────────────────────

class AdminTicketManagementSerializer(serializers.ModelSerializer):
    userPhone = serializers.CharField(source='userId.phone', read_only=True)
    messageCount = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'userId', 'userPhone', 'subject', 'category', 'status',
            'priority', 'department', 'assignedTo', 'rating', 'feedback',
            'slaDeadline', 'closedAt', 'firstReplyAt', 'messageCount',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']

    def get_messageCount(self, obj):
        return obj.messages.count()


class AdminSmsCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmsCampaign
        fields = '__all__'
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminEmailCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailCampaign
        fields = '__all__'
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminTelegramViewSerializer(serializers.Serializer):
    totalUsers = serializers.IntegerField()
    activeUsers = serializers.IntegerField()
    recentMessages = serializers.IntegerField()


# ─── Landing & Settings ─────────────────────────────────────────────────────

class AdminLandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingSection
        fields = [
            'id', 'sectionId', 'title', 'icon', 'isVisible',
            'sortOrder', 'settings', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminSiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = [
            'id', 'group', 'key', 'value', 'type', 'label',
            'description', 'sortOrder', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class AdminGatewayConfigSerializer(serializers.Serializer):
    defaultFeeRate = serializers.FloatField()
    minFee = serializers.FloatField()
    maxFee = serializers.FloatField()
    settlementFreq = serializers.CharField()
    webhookTimeout = serializers.IntegerField()


# ─── Media ───────────────────────────────────────────────────────────────────

class AdminMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = [
            'id', 'filename', 'originalName', 'mimeType', 'size',
            'url', 'alt', 'folder', 'width', 'height', 'uploadedBy',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


# ─── Feature Flags & System Info ─────────────────────────────────────────────

class AdminFeatureFlagsSerializer(serializers.Serializer):
    flags = serializers.DictField()


class AdminSystemInfoSerializer(serializers.Serializer):
    version = serializers.CharField()
    pythonVersion = serializers.CharField()
    djangoVersion = serializers.CharField()
    database = serializers.CharField()
    totalUsers = serializers.IntegerField()
    totalTransactions = serializers.IntegerField()
    uptime = serializers.CharField()


# ─── Dashboard ───────────────────────────────────────────────────────────────

class AdminDashboardSerializer(serializers.Serializer):
    totalUsers = serializers.IntegerField()
    activeUsers = serializers.IntegerField()
    totalGoldTraded = serializers.FloatField()
    totalTransactions = serializers.IntegerField()
    totalRevenue = serializers.FloatField()
    pendingKYC = serializers.IntegerField()
    openTickets = serializers.IntegerField()
    totalMerchants = serializers.IntegerField()
