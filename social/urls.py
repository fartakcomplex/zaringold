from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GiftTransferViewSet, FamilyWalletViewSet,
    FamilyWalletMemberAddView, FamilyWalletContributeView,
    SocialFeedView, SocialPostLikeView, ReferralView,
)

router = DefaultRouter()
router.register(r'gifts', GiftTransferViewSet, basename='gift')
router.register(r'family-wallets', FamilyWalletViewSet, basename='family-wallet')

app_name = 'social'

urlpatterns = [
    path('', include(router.urls)),
    path('family-wallets/<str:wallet_id>/add-member/', FamilyWalletMemberAddView.as_view(), name='family-wallet-add-member'),
    path('family-wallets/<str:wallet_id>/contribute/', FamilyWalletContributeView.as_view(), name='family-wallet-contribute'),
    path('feed/', SocialFeedView.as_view(), name='social-feed'),
    path('posts/<str:pk>/like/', SocialPostLikeView.as_view(), name='social-post-like'),
    path('referral/', ReferralView.as_view(), name='referral'),
]
