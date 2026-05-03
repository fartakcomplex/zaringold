from django.db import models
from django.utils import timezone
from core.models import BaseModel
from authentication.models import User


class UserGamification(BaseModel):
    userId = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="gamification",
    )
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    totalBadges = models.IntegerField(default=0)
    currentStreak = models.IntegerField(default=0)
    longestStreak = models.IntegerField(default=0)
    lastCheckInAt = models.DateTimeField(null=True, blank=True)
    checkInCount = models.IntegerField(default=0)
    predictionScore = models.FloatField(default=0)
    referralCount = models.IntegerField(default=0)

    class Meta:
        db_table = "gamification_usergamification"

    def __str__(self):
        return f"UserGamification({self.userId}, Lvl {self.level})"


class Achievement(BaseModel):
    slug = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(default="")
    icon = models.CharField(max_length=50, default="trophy")
    category = models.CharField(max_length=50, default="general")
    xpReward = models.IntegerField(default=0)
    goldRewardMg = models.FloatField(default=0)
    sortOrder = models.IntegerField(default=0)
    isHidden = models.BooleanField(default=False)

    class Meta:
        db_table = "gamification_achievement"

    def __str__(self):
        return f"Achievement({self.slug})"


class UserAchievement(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="userAchievements",
    )
    achievementId = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name="userAchievements",
    )
    earnedAt = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "gamification_userachievement"
        unique_together = [("userId", "achievementId")]

    def __str__(self):
        return f"UserAchievement({self.userId_id}, {self.achievementId_id})"


class CheckIn(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="checkIns",
    )
    dayNumber = models.IntegerField()
    rewardType = models.CharField(max_length=50, default="fiat")
    rewardValue = models.FloatField(default=0)
    xpEarned = models.IntegerField(default=0)

    class Meta:
        db_table = "gamification_checkin"

    def __str__(self):
        return f"CheckIn({self.userId_id}, Day {self.dayNumber})"


class PricePrediction(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="pricePredictions",
    )
    predictedPrice = models.FloatField()
    actualPrice = models.FloatField(null=True, blank=True)
    priceDiffPercent = models.FloatField(null=True, blank=True)
    xpEarned = models.IntegerField(default=0)
    isCorrect = models.BooleanField(null=True, blank=True)
    targetDate = models.DateTimeField()
    resolvedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "gamification_priceprediction"

    def __str__(self):
        return f"PricePrediction({self.userId_id}, {self.targetDate})"


class VIPSubscription(BaseModel):
    userId = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="vipSubscription",
    )
    plan = models.CharField(max_length=50, default="silver")
    startedAt = models.DateTimeField(default=timezone.now)
    expiresAt = models.DateTimeField(null=True, blank=True)
    isActive = models.BooleanField(default=True)
    autoRenew = models.BooleanField(default=False)

    class Meta:
        db_table = "gamification_vipsubscription"

    def __str__(self):
        return f"VIPSubscription({self.userId}, {self.plan})"


class CashbackReward(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="cashbackRewards",
    )
    title = models.CharField(max_length=255)
    rewardType = models.CharField(max_length=50, default="fiat")
    rewardValue = models.FloatField()
    status = models.CharField(max_length=50, default="pending")
    expiresAt = models.DateTimeField(null=True, blank=True)
    claimedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "gamification_cashbackreward"

    def __str__(self):
        return f"CashbackReward({self.title}, {self.status})"


class QuestMission(BaseModel):
    """Daily/weekly quests and missions for users."""
    title = models.CharField(max_length=255)
    description = models.TextField(default="")
    questType = models.CharField(max_length=50, default="daily")
    category = models.CharField(max_length=50, default="general")
    targetValue = models.FloatField(default=1)
    rewardType = models.CharField(max_length=50, default="xp")
    rewardValue = models.FloatField(default=0)
    xpReward = models.IntegerField(default=0)
    goldRewardMg = models.FloatField(default=0)
    isActive = models.BooleanField(default=True)
    sortOrder = models.IntegerField(default=0)
    startsAt = models.DateTimeField(null=True, blank=True)
    endsAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "gamification_questmission"

    def __str__(self):
        return f"QuestMission({self.title}, {self.questType})"


class UserQuestProgress(BaseModel):
    """Track user progress on quests."""
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="questProgress",
    )
    questId = models.ForeignKey(
        QuestMission,
        on_delete=models.CASCADE,
        related_name="userProgress",
    )
    currentValue = models.FloatField(default=0)
    isCompleted = models.BooleanField(default=False)
    isClaimed = models.BooleanField(default=False)
    claimedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "gamification_userquestprogress"
        unique_together = [("userId", "questId")]

    def __str__(self):
        return f"UserQuestProgress({self.userId_id}, {self.questId_id})"
