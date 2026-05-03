from django.db import models
from django.utils import timezone
from core.models import BaseModel
from authentication.models import User


class GiftTransfer(BaseModel):
    senderId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sentGifts",
    )
    receiverId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="receivedGifts",
    )
    goldMg = models.FloatField()
    message = models.TextField(default="")
    occasion = models.CharField(max_length=100, default="")
    giftCardStyle = models.CharField(max_length=50, default="birthday")
    status = models.CharField(max_length=50, default="completed")
    scheduledAt = models.DateTimeField(null=True, blank=True)
    openedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "social_gifttransfer"

    def __str__(self):
        return f"GiftTransfer({self.senderId_id} -> {self.receiverId_id}, {self.goldMg}mg)"


class FamilyWallet(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(default="")

    class Meta:
        db_table = "social_familywallet"

    def __str__(self):
        return f"FamilyWallet({self.name})"


class FamilyWalletMember(BaseModel):
    walletId = models.ForeignKey(
        FamilyWallet,
        on_delete=models.CASCADE,
        related_name="members",
    )
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="familyWallets",
    )
    role = models.CharField(max_length=50, default="member")
    contribution = models.FloatField(default=0)
    canWithdraw = models.BooleanField(default=False)
    joinedAt = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "social_familywalletmember"
        unique_together = [("walletId", "userId")]

    def __str__(self):
        return f"FamilyWalletMember({self.walletId_id}, {self.userId_id})"


class SocialPost(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="socialPosts",
    )
    content = models.TextField()
    postType = models.CharField(max_length=50, default="trade")
    likes = models.IntegerField(default=0)
    isAnonymous = models.BooleanField(default=True)

    class Meta:
        db_table = "social_socialpost"

    def __str__(self):
        return f"SocialPost({self.userId_id}, {self.postType})"


class Referral(BaseModel):
    referrerId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="referrals",
    )
    referredId = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="referredByRel",
    )
    rewardType = models.CharField(max_length=50, default="cash")
    rewardAmount = models.FloatField(default=0)
    status = models.CharField(max_length=50, default="pending")
    claimedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "social_referral"

    def __str__(self):
        return f"Referral({self.referrerId_id} -> {self.referredId_id})"
