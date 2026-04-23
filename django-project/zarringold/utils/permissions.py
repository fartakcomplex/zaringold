"""
Custom permissions for Zarrin Gold
"""
from rest_framework.permissions import BasePermission


class IsVerifiedUser(BasePermission):
    """Only verified users can access"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_verified)


class IsKYCApproved(BasePermission):
    """Only KYC approved users can access"""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.is_verified
            and getattr(request.user, 'is_kyc_approved', False)
        )


class IsAdminUser(BasePermission):
    """Only admin users can access"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsOwnerOrAdmin(BasePermission):
    """Only owner or admin can access"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return hasattr(obj, 'user') and obj.user == request.user
