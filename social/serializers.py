from rest_framework import serializers
from .models import (
    GiftTransfer, FamilyWallet, FamilyWalletMember,
    SocialPost, Referral,
)


class GiftTransferSerializer(serializers.ModelSerializer):
    senderPhone = serializers.CharField(source='senderId.phone', read_only=True)
    receiverPhone = serializers.CharField(source='receiverId.phone', read_only=True)

    class Meta:
        model = GiftTransfer
        fields = [
            'id', 'senderId', 'receiverId', 'senderPhone', 'receiverPhone',
            'goldMg', 'message', 'occasion', 'giftCardStyle', 'status',
            'scheduledAt', 'openedAt', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'senderId', 'status', 'openedAt', 'createdAt', 'updatedAt']


class FamilyWalletMemberSerializer(serializers.ModelSerializer):
    userPhone = serializers.CharField(source='userId.phone', read_only=True)

    class Meta:
        model = FamilyWalletMember
        fields = [
            'id', 'walletId', 'userId', 'userPhone', 'role',
            'contribution', 'canWithdraw', 'joinedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'joinedAt', 'createdAt', 'updatedAt']


class FamilyWalletSerializer(serializers.ModelSerializer):
    members = FamilyWalletMemberSerializer(many=True, read_only=True)
    memberCount = serializers.SerializerMethodField()
    totalContribution = serializers.SerializerMethodField()

    class Meta:
        model = FamilyWallet
        fields = [
            'id', 'name', 'description', 'members', 'memberCount',
            'totalContribution', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']

    def get_memberCount(self, obj):
        return obj.members.count()

    def get_totalContribution(self, obj):
        members = obj.members.all()
        return sum(m.contribution for m in members)


class FamilyWalletMemberAddSerializer(serializers.Serializer):
    """Serializer for adding a member to a family wallet."""
    userId = serializers.CharField()
    role = serializers.CharField(default="member")
    canWithdraw = serializers.BooleanField(default=False)


class FamilyWalletContributeSerializer(serializers.Serializer):
    """Serializer for contributing to a family wallet."""
    amount = serializers.FloatField(min_value=0)


class SocialPostSerializer(serializers.ModelSerializer):
    userPhone = serializers.SerializerMethodField()

    class Meta:
        model = SocialPost
        fields = [
            'id', 'userId', 'userPhone', 'content', 'postType',
            'likes', 'isAnonymous', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'userId', 'likes', 'createdAt', 'updatedAt']

    def get_userPhone(self, obj):
        if obj.isAnonymous:
            return None
        return obj.userId.phone


class SocialFeedSerializer(serializers.Serializer):
    posts = SocialPostSerializer(many=True)
    totalPosts = serializers.IntegerField()


class ReferralSerializer(serializers.ModelSerializer):
    referrerPhone = serializers.CharField(source='referrerId.phone', read_only=True)
    referredPhone = serializers.CharField(source='referredId.phone', read_only=True)

    class Meta:
        model = Referral
        fields = [
            'id', 'referrerId', 'referredId', 'referrerPhone', 'referredPhone',
            'rewardType', 'rewardAmount', 'status', 'claimedAt',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'referrerId', 'referredId', 'status', 'claimedAt', 'createdAt', 'updatedAt']


class ReferralInfoSerializer(serializers.Serializer):
    """Serializer for referral info response."""
    referralCode = serializers.CharField()
    totalReferrals = serializers.IntegerField()
    pendingRewards = serializers.IntegerField()
    totalEarned = serializers.FloatField()
