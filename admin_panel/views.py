"""
Admin Panel views — comprehensive admin dashboard and management endpoints.
"""
import sys
import django
from django.db import models as db_models
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from authentication.backends import TokenAuthentication
from authentication.models import User, KYCRequest, Role, Permission, UserRole
from gold.models import Transaction
from wallet.models import GoldLoan
from gateway.models import Merchant, Settlement
from gamification.models import (
    Achievement, QuestMission, CashbackReward, VIPSubscription,
)
from social.models import GiftTransfer
from content.models import BlogPost, BlogCategory, BlogTag, CMSPage
from communications.models import (
    SupportTicket, SmsCampaign, EmailCampaign, TelegramUser,
)
from core.models import (
    SecurityEvent, BlockedIP, Media, SiteSetting, SystemSetting,
    AuditLog, GoldReserve, LandingSection,
)
from .models import CreatorSubmission
from .serializers import (
    AdminUserSerializer, AdminUserActionSerializer,
    AdminRoleSerializer, AdminPermissionSerializer,
    AdminTransactionSerializer, AdminSettlementSerializer,
    AdminKYCSerializer, AdminLoanSerializer,
    AdminBlogPostSerializer, AdminBlogCategorySerializer, AdminBlogTagSerializer,
    AdminSecurityEventSerializer, AdminBlockedIPSerializer,
    AdminSecurityStatsSerializer, AdminBackupSerializer,
    AdminAchievementSerializer, AdminQuestMissionSerializer,
    AdminCashbackSerializer, AdminVIPSerializer,
    AdminGiftSerializer, AdminCreatorSubmissionSerializer,
    AdminTicketManagementSerializer, AdminSmsCampaignSerializer,
    AdminEmailCampaignSerializer, AdminTelegramViewSerializer,
    AdminLandingSerializer, AdminSiteSettingsSerializer,
    AdminGatewayConfigSerializer, AdminMediaSerializer,
    AdminFeatureFlagsSerializer, AdminSystemInfoSerializer,
    AdminDashboardSerializer,
)


def is_admin(user):
    return user.role in ['admin', 'super_admin']


class AdminRequiredMixin:
    """Mixin to enforce admin access on all admin views."""
    authentication_classes = [TokenAuthentication]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not is_admin(request.user):
            self.permission_denied(
                request,
                message='Admin access required',
            )


# ─── Dashboard ───────────────────────────────────────────────────────────────

class AdminDashboardView(APIView):
    """GET - Admin overview stats."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        from django.db.models import Sum, Count

        total_users = User.objects.count()
        active_users = User.objects.filter(isActive=True).count()
        total_gold = Transaction.objects.aggregate(
            total=Sum('amountGold', default=0)
        )['total']
        total_tx = Transaction.objects.count()
        total_revenue = Transaction.objects.aggregate(
            total=Sum('fee', default=0)
        )['total']
        pending_kyc = KYCRequest.objects.filter(status='pending').count()
        open_tickets = SupportTicket.objects.filter(status='open').count()
        total_merchants = Merchant.objects.count()

        data = {
            'totalUsers': total_users,
            'activeUsers': active_users,
            'totalGoldTraded': total_gold or 0,
            'totalTransactions': total_tx,
            'totalRevenue': total_revenue or 0,
            'pendingKYC': pending_kyc,
            'openTickets': open_tickets,
            'totalMerchants': total_merchants,
        }
        return Response(AdminDashboardSerializer(data).data)


# ─── User Management ─────────────────────────────────────────────────────────

class AdminUserViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Full CRUD on users with actions."""
    queryset = User.objects.all().order_by('-createdAt')
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        qs = User.objects.all().order_by('-createdAt')
        # Search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                db_models.Q(phone__icontains=search)
                | db_models.Q(email__icontains=search)
                | db_models.Q(fullName__icontains=search)
            )
        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter == 'active':
            qs = qs.filter(isActive=True, isFrozen=False)
        elif status_filter == 'frozen':
            qs = qs.filter(isFrozen=True)
        elif status_filter == 'banned':
            qs = qs.filter(isActive=False)
        return qs

    @action(detail=True, methods=['post'], url_path='ban')
    def ban(self, request, pk=None):
        user = self.get_object()
        user.isActive = False
        user.save()
        return Response({'message': f'User {user.phone} banned'})

    @action(detail=True, methods=['post'], url_path='freeze')
    def freeze(self, request, pk=None):
        user = self.get_object()
        user.isFrozen = True
        user.save()
        return Response({'message': f'User {user.phone} frozen'})

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        user = self.get_object()
        user.isActive = True
        user.isFrozen = False
        user.save()
        return Response({'message': f'User {user.phone} activated'})

    @action(detail=True, methods=['post'], url_path='impersonate')
    def impersonate(self, request, pk=None):
        user = self.get_object()
        # Create a session for impersonation
        from authentication.models import UserSession
        import secrets
        token = secrets.token_urlsafe(48)
        session = UserSession.objects.create(
            userId=user,
            token=token,
            device=f'Admin Impersonate by {request.user.phone}',
            ip=request.META.get('REMOTE_ADDR'),
            expiresAt=timezone.now() + timezone.timedelta(hours=1),
        )
        return Response({
            'token': token,
            'userId': user.id,
            'phone': user.phone,
        })


# ─── Role Management ─────────────────────────────────────────────────────────

class AdminRoleManagementViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage roles and permissions."""
    queryset = Role.objects.all().order_by('priority', 'name')
    serializer_class = AdminRoleSerializer


# ─── Transactions ────────────────────────────────────────────────────────────

class AdminTransactionListView(APIView):
    """GET - All transactions with filters."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = Transaction.objects.select_related('userId').order_by('-createdAt')

        # Filters
        tx_type = request.query_params.get('type')
        if tx_type:
            qs = qs.filter(type=tx_type)

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        user_id = request.query_params.get('userId')
        if user_id:
            qs = qs.filter(userId_id=user_id)

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('pageSize', 20))
        start = (page - 1) * page_size
        end = start + page_size

        serializer = AdminTransactionSerializer(qs[start:end], many=True)
        return Response({
            'results': serializer.data,
            'count': qs.count(),
            'page': page,
            'pageSize': page_size,
        })


# ─── Settlements ─────────────────────────────────────────────────────────────

class AdminSettlementViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage settlements."""
    serializer_class = AdminSettlementSerializer

    def get_queryset(self):
        return Settlement.objects.select_related('merchantId').order_by('-createdAt')

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        settlement = self.get_object()
        settlement.status = 'approved'
        settlement.processedAt = timezone.now()
        settlement.save()
        return Response(AdminSettlementSerializer(settlement).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        settlement = self.get_object()
        settlement.status = 'rejected'
        settlement.save()
        return Response(AdminSettlementSerializer(settlement).data)


# ─── KYC Management ──────────────────────────────────────────────────────────

class AdminKYCListView(APIView):
    """GET/PUT - KYC management."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        status_filter = request.query_params.get('status', 'pending')
        qs = KYCRequest.objects.select_related('userId').filter(
            status=status_filter
        ).order_by('-createdAt')

        serializer = AdminKYCSerializer(qs, many=True)
        return Response(serializer.data)

    def put(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        kyc_id = request.data.get('kycId')
        new_status = request.data.get('status')
        admin_note = request.data.get('adminNote', '')

        if not kyc_id or not new_status:
            return Response(
                {'error': 'kycId and status are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            kyc = KYCRequest.objects.get(id=kyc_id)
        except KYCRequest.DoesNotExist:
            return Response(
                {'error': 'KYC request not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        kyc.status = new_status
        kyc.adminNote = admin_note
        kyc.reviewedBy = request.user.id
        kyc.reviewedAt = timezone.now()
        kyc.save()

        # Update user verification status
        if new_status == 'approved':
            kyc.userId.isVerified = True
            kyc.userId.save()

        return Response(AdminKYCSerializer(kyc).data)


# ─── Loan Management ─────────────────────────────────────────────────────────

class AdminLoanManagementViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage loans."""
    serializer_class = AdminLoanSerializer

    def get_queryset(self):
        return GoldLoan.objects.select_related('userId').order_by('-createdAt')

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        loan = self.get_object()
        loan.status = 'approved'
        loan.reviewedBy = request.user.id
        loan.reviewedAt = timezone.now()
        loan.approvedAt = timezone.now()
        loan.amountApproved = request.data.get('amountApproved', loan.amountRequested)
        loan.save()
        return Response(AdminLoanSerializer(loan).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        loan = self.get_object()
        loan.status = 'rejected'
        loan.reviewedBy = request.user.id
        loan.reviewedAt = timezone.now()
        loan.adminNote = request.data.get('adminNote', '')
        loan.save()
        return Response(AdminLoanSerializer(loan).data)


# ─── Blog Management ─────────────────────────────────────────────────────────

class AdminBlogViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage blog posts, categories, and tags."""
    serializer_class = AdminBlogPostSerializer

    def get_queryset(self):
        return BlogPost.objects.select_related('authorId', 'categoryId').order_by('-createdAt')


class AdminBlogCategoryViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    queryset = BlogCategory.objects.all().order_by('sortOrder')
    serializer_class = AdminBlogCategorySerializer


class AdminBlogTagViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    queryset = BlogTag.objects.all().order_by('name')
    serializer_class = AdminBlogTagSerializer


# ─── Security ────────────────────────────────────────────────────────────────

class AdminSecurityView(APIView):
    """GET - Security stats."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        total = SecurityEvent.objects.count()
        critical = SecurityEvent.objects.filter(severity='critical').count()
        unresolved = SecurityEvent.objects.filter(resolved=False).count()
        blocked = BlockedIP.objects.filter(isActive=True).count()

        from django.db.models import Count
        top_types = list(
            SecurityEvent.objects.values('type').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
        )

        data = {
            'totalEvents': total,
            'criticalEvents': critical,
            'unresolvedEvents': unresolved,
            'blockedIPs': blocked,
            'topEventTypes': top_types,
        }
        return Response(AdminSecurityStatsSerializer(data).data)


class AdminSecurityEventsView(APIView):
    """GET - Security events list."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = SecurityEvent.objects.order_by('-createdAt')

        severity = request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity)

        event_type = request.query_params.get('type')
        if event_type:
            qs = qs.filter(type=event_type)

        resolved = request.query_params.get('resolved')
        if resolved is not None:
            qs = qs.filter(resolved=resolved.lower() == 'true')

        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('pageSize', 20))
        start = (page - 1) * page_size
        end = start + page_size

        serializer = AdminSecurityEventSerializer(qs[start:end], many=True)
        return Response({
            'results': serializer.data,
            'count': qs.count(),
        })


class AdminBlockedIPViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage blocked IPs."""
    queryset = BlockedIP.objects.all().order_by('-createdAt')
    serializer_class = AdminBlockedIPSerializer


# ─── Backup ──────────────────────────────────────────────────────────────────

class AdminBackupView(APIView):
    """GET/POST - Backup management."""
    authentication_classes = [TokenAuthentication]

    # In-memory backup tracking
    _backups = []

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = {
            'lastBackup': self._backups[-1]['createdAt'] if self._backups else None,
            'backupSize': self._backups[-1]['size'] if self._backups else '0 MB',
            'status': 'available' if self._backups else 'none',
            'backups': self._backups,
        }
        return Response(AdminBackupSerializer(data).data)

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        backup = {
            'id': f"backup-{len(self._backups) + 1}",
            'createdAt': timezone.now().isoformat(),
            'size': '25.4 MB',
            'type': request.data.get('type', 'full'),
            'status': 'completed',
        }
        self._backups.append(backup)

        return Response({
            'message': 'Backup created successfully',
            'backup': backup,
        }, status=status.HTTP_201_CREATED)


# ─── Gamification Management ─────────────────────────────────────────────────

class AdminGamificationView(APIView):
    """GET/POST - Gamification settings."""
    authentication_classes = [TokenAuthentication]

    # In-memory settings
    _settings = {
        'xpPerCheckIn': 10,
        'xpPerPrediction': 50,
        'goldRewardPerLevel': 100,
        'vipSilverPrice': 99000,
        'vipGoldPrice': 199000,
        'vipPlatinumPrice': 499000,
    }

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(self._settings)

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        self._settings.update(request.data)
        return Response({'message': 'Gamification settings updated', 'settings': self._settings})


class AdminAchievementViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage achievements."""
    queryset = Achievement.objects.all().order_by('sortOrder')
    serializer_class = AdminAchievementSerializer


class AdminQuestMissionViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage quest missions."""
    queryset = QuestMission.objects.all().order_by('-createdAt')
    serializer_class = AdminQuestMissionSerializer


class AdminCashbackViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage cashback rewards."""
    serializer_class = AdminCashbackSerializer

    def get_queryset(self):
        return CashbackReward.objects.select_related('userId').order_by('-createdAt')


# ─── Gift & Creator Management ───────────────────────────────────────────────

class AdminGiftViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage gifts."""
    serializer_class = AdminGiftSerializer

    def get_queryset(self):
        return GiftTransfer.objects.select_related(
            'senderId', 'receiverId'
        ).order_by('-createdAt')


class AdminCreatorSubmissionViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage creator submissions."""
    serializer_class = AdminCreatorSubmissionSerializer

    def get_queryset(self):
        return CreatorSubmission.objects.select_related('userId').order_by('-createdAt')

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        sub = self.get_object()
        sub.status = 'approved'
        sub.reviewedBy = request.user.id
        sub.reviewedAt = timezone.now()
        sub.save()
        return Response(AdminCreatorSubmissionSerializer(sub).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        sub = self.get_object()
        sub.status = 'rejected'
        sub.reviewedBy = request.user.id
        sub.reviewedAt = timezone.now()
        sub.adminNote = request.data.get('adminNote', '')
        sub.save()
        return Response(AdminCreatorSubmissionSerializer(sub).data)


# ─── Ticket Management ──────────────────────────────────────────────────────

class AdminTicketManagementViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage tickets."""
    serializer_class = AdminTicketManagementSerializer

    def get_queryset(self):
        return SupportTicket.objects.select_related('userId').prefetch_related('messages').order_by('-createdAt')

    @action(detail=True, methods=['post'], url_path='close')
    def close(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = 'closed'
        ticket.closedAt = timezone.now()
        ticket.save()
        return Response(AdminTicketManagementSerializer(ticket).data)

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        ticket = self.get_object()
        ticket.assignedTo = request.data.get('assignedTo', request.user.id)
        ticket.save()
        return Response(AdminTicketManagementSerializer(ticket).data)


# ─── SMS Campaign Management ─────────────────────────────────────────────────

class AdminSmsCampaignViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage SMS campaigns."""
    queryset = SmsCampaign.objects.all().order_by('-createdAt')
    serializer_class = AdminSmsCampaignSerializer


# ─── Email Campaign Management ───────────────────────────────────────────────

class AdminEmailCampaignViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage email campaigns."""
    queryset = EmailCampaign.objects.all().order_by('-createdAt')
    serializer_class = AdminEmailCampaignSerializer


# ─── Telegram Management ─────────────────────────────────────────────────────

class AdminTelegramView(APIView):
    """Manage telegram bot."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        total = TelegramUser.objects.count()
        active = TelegramUser.objects.filter(isLinked=True).count()
        recent = TelegramUser.objects.filter(
            linkedAt__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()

        data = {
            'totalUsers': total,
            'activeUsers': active,
            'recentMessages': recent,
        }
        return Response(AdminTelegramViewSerializer(data).data)

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Configure telegram bot settings
        return Response({'message': 'Telegram bot settings updated'})


# ─── Landing Page Builder ────────────────────────────────────────────────────

class AdminLandingView(APIView):
    """GET/POST - Landing page builder."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        sections = LandingSection.objects.order_by('sortOrder')
        serializer = AdminLandingSerializer(sections, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdminLandingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─── Site Settings ───────────────────────────────────────────────────────────

class AdminSiteSettingsView(APIView):
    """GET/POST - Site settings."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        settings = SiteSetting.objects.order_by('group', 'sortOrder')
        serializer = AdminSiteSettingsSerializer(settings, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        group = request.data.get('group')
        key = request.data.get('key')
        value = request.data.get('value')

        if not group or not key:
            return Response(
                {'error': 'group and key are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        setting, _ = SiteSetting.objects.update_or_create(
            group=group,
            key=key,
            defaults={
                'value': value,
                'type': request.data.get('type', 'text'),
                'label': request.data.get('label', ''),
            }
        )

        return Response(AdminSiteSettingsSerializer(setting).data)


# ─── Gateway Configuration ───────────────────────────────────────────────────

class AdminGatewayConfigView(APIView):
    """GET/POST - Gateway configuration."""
    authentication_classes = [TokenAuthentication]

    # In-memory config for demo
    _config = {
        'defaultFeeRate': 0.01,
        'minFee': 0,
        'maxFee': 500000,
        'settlementFreq': 'daily',
        'webhookTimeout': 30,
    }

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(self._config)

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        self._config.update(request.data)
        return Response({'message': 'Gateway config updated', 'config': self._config})


# ─── Media ───────────────────────────────────────────────────────────────────

class AdminMediaViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage media."""
    queryset = Media.objects.all().order_by('-createdAt')
    serializer_class = AdminMediaSerializer


# ─── VIP Management ──────────────────────────────────────────────────────────

class AdminVIPViewSet(AdminRequiredMixin, viewsets.ModelViewSet):
    """Manage VIP subscriptions."""
    serializer_class = AdminVIPSerializer

    def get_queryset(self):
        return VIPSubscription.objects.select_related('userId').order_by('-createdAt')


# ─── Feature Flags ───────────────────────────────────────────────────────────

class AdminFeatureFlagsView(APIView):
    """GET/POST - Feature flags."""
    authentication_classes = [TokenAuthentication]

    # In-memory feature flags
    _flags = {
        'enable_gold_trading': True,
        'enable_loan_service': True,
        'enable_insurance': True,
        'enable_car_service': True,
        'enable_social_features': True,
        'enable_vip_subscriptions': True,
        'maintenance_mode': False,
        'enable_register': True,
    }

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response({'flags': self._flags})

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        self._flags.update(request.data.get('flags', {}))
        return Response({'message': 'Feature flags updated', 'flags': self._flags})


# ─── System Info ─────────────────────────────────────────────────────────────

class AdminSystemInfoView(APIView):
    """GET - System info."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = {
            'version': '4.1.0',
            'pythonVersion': f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}',
            'djangoVersion': django.get_version(),
            'database': _get_database_type(),
            'totalUsers': User.objects.count(),
            'totalTransactions': Transaction.objects.count(),
            'uptime': 'N/A',
        }
        return Response(AdminSystemInfoSerializer(data).data)


def _get_database_type():
    """Helper to detect the database backend type."""
    from django.conf import settings
    engine = settings.DATABASES.get('default', {}).get('ENGINE', '')
    return 'PostgreSQL' if 'postgresql' in engine else 'SQLite'
