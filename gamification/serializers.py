from rest_framework import serializers
from .models import (
    UserGamification, Achievement, UserAchievement, CheckIn,
    PricePrediction, VIPSubscription, CashbackReward,
    QuestMission, UserQuestProgress,
)


class UserGamificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGamification
        fields = [
            'id', 'userId', 'xp', 'level', 'totalBadges',
            'currentStreak', 'longestStreak', 'lastCheckInAt',
            'checkInCount', 'predictionScore', 'referralCount',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'xp', 'level', 'totalBadges', 'currentStreak',
            'longestStreak', 'lastCheckInAt', 'checkInCount',
            'predictionScore', 'referralCount', 'createdAt', 'updatedAt',
        ]


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = [
            'id', 'slug', 'title', 'description', 'icon', 'category',
            'xpReward', 'goldRewardMg', 'sortOrder', 'isHidden',
            'createdAt', 'updatedAt',
        ]


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(source='achievementId', read_only=True)

    class Meta:
        model = UserAchievement
        fields = [
            'id', 'userId', 'achievementId', 'achievement',
            'earnedAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'earnedAt', 'createdAt', 'updatedAt']


class CheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = [
            'id', 'userId', 'dayNumber', 'rewardType',
            'rewardValue', 'xpEarned', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class CheckInStatusSerializer(serializers.Serializer):
    canCheckIn = serializers.BooleanField()
    currentStreak = serializers.IntegerField()
    longestStreak = serializers.IntegerField()
    lastCheckInAt = serializers.DateTimeField(allow_null=True)
    checkInCount = serializers.IntegerField()
    todayReward = serializers.FloatField(allow_null=True)


class PricePredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricePrediction
        fields = [
            'id', 'userId', 'predictedPrice', 'actualPrice',
            'priceDiffPercent', 'xpEarned', 'isCorrect', 'targetDate',
            'resolvedAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'actualPrice', 'priceDiffPercent', 'xpEarned',
            'isCorrect', 'resolvedAt', 'createdAt', 'updatedAt',
        ]


class PredictionLeaderboardSerializer(serializers.Serializer):
    userId = serializers.CharField()
    predictionScore = serializers.FloatField()
    totalPredictions = serializers.IntegerField()
    correctPredictions = serializers.IntegerField()


class VIPSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VIPSubscription
        fields = [
            'id', 'userId', 'plan', 'startedAt', 'expiresAt',
            'isActive', 'autoRenew', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'startedAt', 'isActive', 'createdAt', 'updatedAt',
        ]


class VIPSubscribeSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=['silver', 'gold', 'platinum'])
    autoRenew = serializers.BooleanField(default=False)


class CashbackRewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashbackReward
        fields = [
            'id', 'userId', 'title', 'rewardType', 'rewardValue',
            'status', 'expiresAt', 'claimedAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'claimedAt', 'createdAt', 'updatedAt']


class QuestMissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestMission
        fields = [
            'id', 'title', 'description', 'questType', 'category',
            'targetValue', 'rewardType', 'rewardValue', 'xpReward',
            'goldRewardMg', 'isActive', 'sortOrder', 'startsAt', 'endsAt',
            'createdAt', 'updatedAt',
        ]


class UserQuestProgressSerializer(serializers.ModelSerializer):
    quest = QuestMissionSerializer(source='questId', read_only=True)

    class Meta:
        model = UserQuestProgress
        fields = [
            'id', 'userId', 'questId', 'quest', 'currentValue',
            'isCompleted', 'isClaimed', 'claimedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'isCompleted', 'isClaimed', 'claimedAt', 'createdAt', 'updatedAt']


class QuestDashboardSerializer(serializers.Serializer):
    """Serializer for quest dashboard response."""
    dailyQuests = UserQuestProgressSerializer(many=True)
    weeklyQuests = UserQuestProgressSerializer(many=True)
    completedToday = serializers.IntegerField()
    totalClaimed = serializers.IntegerField()
