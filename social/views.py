from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from authentication.backends import TokenAuthentication
from authentication.models import User
from .models import (
    GiftTransfer, FamilyWallet, FamilyWalletMember,
    SocialPost, Referral,
)
from .serializers import (
    GiftTransferSerializer, FamilyWalletSerializer,
    FamilyWalletMemberSerializer, FamilyWalletMemberAddSerializer,
    FamilyWalletContributeSerializer, SocialPostSerializer,
    SocialFeedSerializer, ReferralSerializer, ReferralInfoSerializer,
)


def is_admin(user):
    return user.role in ['admin', 'super_admin']


# ─── Gift Transfer ───────────────────────────────────────────────────────────

class GiftTransferViewSet(viewsets.ModelViewSet):
    """Gift transfer CRUD, scoped to current user. Sender is auto-set."""
    serializer_class = GiftTransferSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return GiftTransfer.objects.filter(senderId=self.request.user)

    def perform_create(self, serializer):
        serializer.save(senderId=self.request.user)


# ─── Family Wallet ───────────────────────────────────────────────────────────

class FamilyWalletViewSet(viewsets.ModelViewSet):
    """Family wallet CRUD with member management."""
    serializer_class = FamilyWalletSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        # Show wallets where the user is a member
        return FamilyWallet.objects.filter(
            members__userId=self.request.user
        ).distinct()


class FamilyWalletMemberAddView(APIView):
    """POST - Add a member to a family wallet."""
    authentication_classes = [TokenAuthentication]

    def post(self, request, wallet_id):
        try:
            wallet = FamilyWallet.objects.get(id=wallet_id)
        except FamilyWallet.DoesNotExist:
            return Response(
                {'error': 'Wallet not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify user is a member
        if not FamilyWalletMember.objects.filter(
            walletId=wallet, userId=request.user
        ).exists():
            return Response(
                {'error': 'You are not a member of this wallet'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = FamilyWalletMemberAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['userId']
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        member, created = FamilyWalletMember.objects.get_or_create(
            walletId=wallet,
            userId=user,
            defaults={
                'role': serializer.validated_data.get('role', 'member'),
                'canWithdraw': serializer.validated_data.get('canWithdraw', False),
            }
        )

        if not created:
            return Response(
                {'error': 'User is already a member'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            FamilyWalletMemberSerializer(member).data,
            status=status.HTTP_201_CREATED,
        )


class FamilyWalletContributeView(APIView):
    """POST - Contribute gold to a family wallet."""
    authentication_classes = [TokenAuthentication]

    def post(self, request, wallet_id):
        try:
            wallet = FamilyWallet.objects.get(id=wallet_id)
        except FamilyWallet.DoesNotExist:
            return Response(
                {'error': 'Wallet not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            member = FamilyWalletMember.objects.get(
                walletId=wallet, userId=request.user
            )
        except FamilyWalletMember.DoesNotExist:
            return Response(
                {'error': 'You are not a member of this wallet'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = FamilyWalletContributeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data['amount']
        member.contribution += amount
        member.save()

        return Response(FamilyWalletMemberSerializer(member).data)


# ─── Social Feed ─────────────────────────────────────────────────────────────

class SocialFeedView(APIView):
    """GET - social feed, POST - create post."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        posts = SocialPost.objects.order_by('-createdAt')[:50]
        total = SocialPost.objects.count()
        data = {
            'posts': SocialPostSerializer(posts, many=True).data,
            'totalPosts': total,
        }
        return Response(SocialFeedSerializer(data).data)

    def post(self, request):
        serializer = SocialPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(userId=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SocialPostLikeView(APIView):
    """POST - Like a social post."""
    authentication_classes = [TokenAuthentication]

    def post(self, request, pk):
        try:
            post = SocialPost.objects.get(pk=pk)
        except SocialPost.DoesNotExist:
            return Response(
                {'error': 'Post not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        post.likes += 1
        post.save()
        return Response(SocialPostSerializer(post).data)


# ─── Referral ────────────────────────────────────────────────────────────────

class ReferralView(APIView):
    """GET - referral info, POST - create referral."""
    authentication_classes = [TokenAuthentication]

    def get(self, request):
        user = request.user
        referrals = Referral.objects.filter(referrerId=user)
        total_earned = sum(r.rewardAmount for r in referrals if r.status == 'claimed')
        pending = referrals.filter(status='pending').count()

        data = {
            'referralCode': user.referralCode,
            'totalReferrals': referrals.count(),
            'pendingRewards': pending,
            'totalEarned': total_earned,
        }
        return Response(ReferralInfoSerializer(data).data)

    def post(self, request):
        referred_code = request.data.get('referralCode')
        if not referred_code:
            return Response(
                {'error': 'referralCode is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            referrer = User.objects.get(referralCode=referred_code)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid referral code'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if referrer.id == request.user.id:
            return Response(
                {'error': 'Cannot refer yourself'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if already referred
        if Referral.objects.filter(referredId=request.user).exists():
            return Response(
                {'error': 'You have already been referred'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        referral = Referral.objects.create(
            referrerId=referrer,
            referredId=request.user,
            rewardType='cash',
            rewardAmount=50000,  # Default reward
            status='pending',
        )

        return Response(
            ReferralSerializer(referral).data,
            status=status.HTTP_201_CREATED,
        )
