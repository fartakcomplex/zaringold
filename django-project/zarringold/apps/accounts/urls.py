from django.urls import path
from . import views

urlpatterns = [
    path('send-otp/', views.SendOTPView.as_view(), name='send-otp'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('token/refresh/', views.VerifyOTPView.as_view(), name='token-refresh'),
]
