from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from authentication.backends import TokenAuthentication
from authentication.models import User
from .models import (
    UserGamification, Achievement, UserAchievement, CheckIn,
    PricePrediction, VIPSubscription, CashbackReward,
    QuestMission, UserQuestProgress,
)
from .serializers import (
    UserGamificationSerializer, AchievementSerializer,
    UserAchievementSerializer, CheckInSerializer,
    CheckInStatusSerializer, PricePredictionSerializer,
    PredictionLeaderboardSerializer, VIPSubscriptionSerializer,
    VIPSubscribeSerializer, CashbackRewardSerializer,
    QuestMissionSerializer, UserQuestProgressSerializer,
    QuestDashboardSerializer,
)


def is_admin(user):
    return user.role in ['admin', 'super_admin']


# ─── User Gamification Profile ──────────────────────────────────────────────

class UserGamificationView(APIView):
    """GET - Retrieve the current user's gamification profile."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        gamification, _ = UserGamification.objects.get_or_create(
            userId=request.user,
            defaults={'level': 1, 'xp': 0},
        )
        serializer = UserGamificationSerializer(gamification)
        return Response(serializer.data)


# ─── Achievement ─────────────────────────────────────────────────────────────

class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of all achievements."""
    queryset = Achievement.objects.filter(isHidden=False).order_by('sortOrder')
    serializer_class = AchievementSerializer
    authentication_classes = [TokenAuthentication]


class UserAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """List achievements earned by the current user."""
    serializer_class = UserAchievementSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return UserAchievement.objects.filter(userId=self.request.user)


# ─── Check-In ────────────────────────────────────────────────────────────────

class CheckInView(APIView):
    """POST - Perform daily check-in."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        gamification, _ = UserGamification.objects.get_or_create(
            userId=request.user,
            defaults={'level': 1, 'xp': 0},
        )

        now = timezone.now()
        if gamification.lastCheckInAt:
            # Check if already checked in today (Tehran timezone)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            if gamification.lastCheckInAt >= today_start:
                return Response(
                    {'error': 'Already checked in today'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Calculate streak
        if gamification.lastCheckInAt:
            yesterday = (now - timezone.timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            if gamification.lastCheckInAt >= yesterday:
                gamification.currentStreak += 1
            else:
                gamification.currentStreak = 1
        else:
            gamification.currentStreak = 1

        gamification.longestStreak = max(gamification.longestStreak, gamification.currentStreak)

        # Calculate reward (increases with streak)
        day_number = gamification.currentStreak
        xp_earned = min(10 + (day_number - 1) * 5, 100)
        reward_value = min(50 + (day_number - 1) * 20, 500)
        reward_type = 'gold' if day_number % 7 == 0 else 'fiat'

        check_in = CheckIn.objects.create(
            userId=request.user,
            dayNumber=day_number,
            rewardType=reward_type,
            rewardValue=reward_value,
            xpEarned=xp_earned,
        )

        gamification.xp += xp_earned
        gamification.level = gamification.xp // 100 + 1
        gamification.totalBadges = UserAchievement.objects.filter(userId=request.user).count()
        gamification.lastCheckInAt = now
        gamification.checkInCount += 1
        gamification.save()

        return Response({
            'checkIn': CheckInSerializer(check_in).data,
            'gamification': UserGamificationSerializer(gamification).data,
        }, status=status.HTTP_201_CREATED)


class CheckInStatusView(APIView):
    """GET - Check-in status for today."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        gamification, _ = UserGamification.objects.get_or_create(
            userId=request.user,
            defaults={'level': 1, 'xp': 0},
        )

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        can_check_in = (
            gamification.lastCheckInAt is None
            or gamification.lastCheckInAt < today_start
        )

        next_streak = gamification.currentStreak + 1 if can_check_in else gamification.currentStreak
        today_reward = min(50 + (next_streak - 1) * 20, 500) if can_check_in else None

        data = {
            'canCheckIn': can_check_in,
            'currentStreak': gamification.currentStreak,
            'longestStreak': gamification.longestStreak,
            'lastCheckInAt': gamification.lastCheckInAt,
            'checkInCount': gamification.checkInCount,
            'todayReward': today_reward,
        }
        return Response(CheckInStatusSerializer(data).data)


# ─── Price Prediction ────────────────────────────────────────────────────────

class PricePredictionViewSet(viewsets.ModelViewSet):
    """Price prediction CRUD, scoped to current user."""
    serializer_class = PricePredictionSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return PricePrediction.objects.filter(userId=self.request.user)

    def perform_create(self, serializer):
        serializer.save(userId=self.request.user)


class ResolvePredictionView(APIView):
    """POST - Resolve predictions whose target date has passed."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        now = timezone.now()
        pending = PricePrediction.objects.filter(
            userId=request.user,
            isCorrect=None,
            targetDate__lte=now,
        )

        # Get current gold price for resolution
        from gold.models import GoldPrice
        latest_price = GoldPrice.objects.order_by('-createdAt').first()

        resolved_count = 0
        for prediction in pending:
            if latest_price:
                prediction.actualPrice = latest_price.sellPrice
                diff = abs(prediction.predictedPrice - latest_price.sellPrice)
                prediction.priceDiffPercent = (diff / latest_price.sellPrice) * 100 if latest_price.sellPrice else 0
                prediction.isCorrect = prediction.priceDiffPercent <= 5.0  # 5% tolerance
                prediction.xpEarned = 50 if prediction.isCorrect else 10
            else:
                prediction.isCorrect = False
                prediction.xpEarned = 0

            prediction.resolvedAt = now
            prediction.save()
            resolved_count += 1

            # Update gamification
            if prediction.xpEarned > 0:
                gamification, _ = UserGamification.objects.get_or_create(
                    userId=request.user,
                    defaults={'level': 1, 'xp': 0},
                )
                gamification.xp += prediction.xpEarned
                gamification.level = gamification.xp // 100 + 1
                gamification.predictionScore += 1 if prediction.isCorrect else 0
                gamification.save()

        return Response({
            'resolved': resolved_count,
            'message': f'{resolved_count} predictions resolved',
        })


class PredictionLeaderboardView(APIView):
    """GET - Leaderboard for price predictions."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        leaderboard = UserGamification.objects.order_by('-predictionScore')[:20]
        data = []
        for entry in leaderboard:
            total = PricePrediction.objects.filter(
                userId=entry.userId, isCorrect__isnull=False
            ).count()
            correct = PricePrediction.objects.filter(
                userId=entry.userId, isCorrect=True
            ).count()
            data.append({
                'userId': entry.userId_id,
                'predictionScore': entry.predictionScore,
                'totalPredictions': total,
                'correctPredictions': correct,
            })
        serializer = PredictionLeaderboardSerializer(data, many=True)
        return Response(serializer.data)


# ─── VIP ─────────────────────────────────────────────────────────────────────

class VIPStatusView(APIView):
    """GET - Current user's VIP status."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        try:
            vip = VIPSubscription.objects.get(userId=request.user)
        except VIPSubscription.DoesNotExist:
            return Response({
                'isActive': False,
                'plan': None,
                'expiresAt': None,
            })
        return Response(VIPSubscriptionSerializer(vip).data)


class VIPSubscribeView(APIView):
    """POST - Subscribe to a VIP plan."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        serializer = VIPSubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = serializer.validated_data['plan']
        auto_renew = serializer.validated_data.get('autoRenew', False)

        # Plan durations
        durations = {
            'silver': 30,
            'gold': 30,
            'platinum': 30,
        }

        now = timezone.now()
        vip, created = VIPSubscription.objects.get_or_create(
            userId=request.user,
            defaults={
                'plan': plan,
                'startedAt': now,
                'expiresAt': now + timezone.timedelta(days=durations.get(plan, 30)),
                'isActive': True,
                'autoRenew': auto_renew,
            }
        )

        if not created:
            vip.plan = plan
            vip.startedAt = now
            vip.expiresAt = now + timezone.timedelta(days=durations.get(plan, 30))
            vip.isActive = True
            vip.autoRenew = auto_renew
            vip.save()

        return Response(VIPSubscriptionSerializer(vip).data)


# ─── Cashback ────────────────────────────────────────────────────────────────

class CashbackViewSet(viewsets.ReadOnlyModelViewSet):
    """List cashback rewards for the current user."""
    serializer_class = CashbackRewardSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return CashbackReward.objects.filter(userId=self.request.user)


class CashbackClaimView(APIView):
    """POST - Claim a pending cashback reward."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        cashback_id = request.data.get('cashbackId')
        if not cashback_id:
            return Response(
                {'error': 'cashbackId is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cashback = CashbackReward.objects.get(
                id=cashback_id, userId=request.user, status='pending'
            )
        except CashbackReward.DoesNotExist:
            return Response(
                {'error': 'Cashback not found or not claimable'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check expiry
        if cashback.expiresAt and cashback.expiresAt < timezone.now():
            cashback.status = 'expired'
            cashback.save()
            return Response(
                {'error': 'Cashback has expired'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cashback.status = 'claimed'
        cashback.claimedAt = timezone.now()
        cashback.save()

        return Response(CashbackRewardSerializer(cashback).data)


# ─── Quest & Mission ─────────────────────────────────────────────────────────

class QuestMissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of active quests/missions."""
    serializer_class = QuestMissionSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        now = timezone.now()
        return QuestMission.objects.filter(
            isActive=True
        ).order_by('sortOrder')


class QuestDashboardView(APIView):
    """GET - User's quest dashboard with progress."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        now = timezone.now()
        active_quests = QuestMission.objects.filter(isActive=True)

        # Create progress entries for quests the user hasn't started
        for quest in active_quests:
            UserQuestProgress.objects.get_or_create(
                userId=request.user,
                questId=quest,
                defaults={'currentValue': 0},
            )

        daily = UserQuestProgress.objects.filter(
            userId=request.user,
            questId__questType='daily',
        ).select_related('questId')

        weekly = UserQuestProgress.objects.filter(
            userId=request.user,
            questId__questType='weekly',
        ).select_related('questId')

        completed_today = daily.filter(isCompleted=True).count()
        total_claimed = UserQuestProgress.objects.filter(
            userId=request.user, isClaimed=True
        ).count()

        data = {
            'dailyQuests': UserQuestProgressSerializer(daily, many=True).data,
            'weeklyQuests': UserQuestProgressSerializer(weekly, many=True).data,
            'completedToday': completed_today,
            'totalClaimed': total_claimed,
        }
        return Response(data)


class QuestClaimView(APIView):
    """POST - Claim a completed quest reward."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        quest_id = request.data.get('questId')
        if not quest_id:
            return Response(
                {'error': 'questId is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            progress = UserQuestProgress.objects.get(
                userId=request.user,
                questId_id=quest_id,
                isCompleted=True,
                isClaimed=False,
            )
        except UserQuestProgress.DoesNotExist:
            return Response(
                {'error': 'Quest not found, not completed, or already claimed'},
                status=status.HTTP_404_NOT_FOUND,
            )

        progress.isClaimed = True
        progress.claimedAt = timezone.now()
        progress.save()

        # Award XP
        quest = progress.questId
        gamification, _ = UserGamification.objects.get_or_create(
            userId=request.user,
            defaults={'level': 1, 'xp': 0},
        )
        gamification.xp += quest.xpReward
        gamification.level = gamification.xp // 100 + 1
        gamification.save()

        return Response({
            'message': 'Quest reward claimed',
            'xpEarned': quest.xpReward,
            'goldEarned': quest.goldRewardMg,
        })
