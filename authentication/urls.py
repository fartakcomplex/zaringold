"""
URL configuration for the authentication app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from authentication.views import (
    RegisterView,
    LoginView,
    AdminLoginView,
    OTPSendView,
    OTPVerifyView,
    LogoutView,
    MeView,
    ProfileView,
    KYCSubmitView,
    ForgotPasswordView,
    SetPasswordView,
    UserViewSet,
    RoleViewSet,
    PermissionViewSet,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')

app_name = 'authentication'

urlpatterns = [
    # Public auth endpoints
    path('send-otp', OTPSendView.as_view(), name='send-otp'),
    path('verify-otp', OTPVerifyView.as_view(), name='verify-otp'),
    path('password-login', LoginView.as_view(), name='password-login'),
    path('admin-login', AdminLoginView.as_view(), name='admin-login'),
    path('register', RegisterView.as_view(), name='register'),
    path('forgot-password', ForgotPasswordView.as_view(), name='forgot-password'),
    path('set-password', SetPasswordView.as_view(), name='set-password'),

    # Authenticated auth endpoints
    path('logout', LogoutView.as_view(), name='logout'),
    path('me', MeView.as_view(), name='me'),
    path('profile', ProfileView.as_view(), name='profile'),
    path('kyc', KYCSubmitView.as_view(), name='kyc-submit'),

    # Admin CRUD endpoints
    path('', include(router.urls)),
]
