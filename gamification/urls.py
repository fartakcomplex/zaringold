from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserGamificationView, AchievementViewSet, UserAchievementViewSet,
    CheckInView, CheckInStatusView, PricePredictionViewSet,
    ResolvePredictionView, PredictionLeaderboardView, VIPStatusView,
    VIPSubscribeView, CashbackViewSet, CashbackClaimView,
    QuestMissionViewSet, QuestDashboardView, QuestClaimView,
)

router = DefaultRouter()
router.register(r'achievements', AchievementViewSet, basename='achievement')
router.register(r'my-achievements', UserAchievementViewSet, basename='user-achievement')
router.register(r'predictions', PricePredictionViewSet, basename='prediction')
router.register(r'cashbacks', CashbackViewSet, basename='cashback')
router.register(r'quests', QuestMissionViewSet, basename='quest')

app_name = 'gamification'

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', UserGamificationView.as_view(), name='gamification-profile'),
    path('check-in/', CheckInView.as_view(), name='check-in'),
    path('check-in/status/', CheckInStatusView.as_view(), name='check-in-status'),
    path('predictions/resolve/', ResolvePredictionView.as_view(), name='resolve-prediction'),
    path('predictions/leaderboard/', PredictionLeaderboardView.as_view(), name='prediction-leaderboard'),
    path('vip/', VIPStatusView.as_view(), name='vip-status'),
    path('vip/subscribe/', VIPSubscribeView.as_view(), name='vip-subscribe'),
    path('cashbacks/claim/', CashbackClaimView.as_view(), name='cashback-claim'),
    path('quest-dashboard/', QuestDashboardView.as_view(), name='quest-dashboard'),
    path('quest-claim/', QuestClaimView.as_view(), name='quest-claim'),
]
