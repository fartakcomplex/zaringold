"""
Custom authentication backend for ZarrinGold.

Uses token-based authentication via the UserSession model.
Validates Authorization: Bearer <token> headers against active sessions.
"""

from datetime import timezone as dt_timezone

from rest_framework import authentication, exceptions

from authentication.models import User, UserSession


class TokenAuthentication(authentication.BaseAuthentication):
    """
    Custom token authentication backend.

    Validates the Authorization header against UserSession records.
    A valid session must have a matching token and an unexpired expiresAt.
    """

    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()

        if not auth_header or auth_header[0].lower() != self.keyword.lower().encode():
            return None

        if len(auth_header) == 1:
            raise exceptions.AuthenticationFailed(
                'Invalid token header. No credentials provided.'
            )
        if len(auth_header) > 2:
            raise exceptions.AuthenticationFailed(
                'Invalid token header. Token string should not contain spaces.'
            )

        token = auth_header[1].decode('utf-8')
        return self._authenticate_token(token)

    def _authenticate_token(self, token):
        """Validate token against UserSession and return (user, token) tuple."""
        try:
            session = UserSession.objects.select_related('userId').get(token=token)
        except UserSession.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid or expired token.')

        # Check expiration
        from django.utils import timezone
        if session.expiresAt and session.expiresAt < timezone.now():
            session.delete()
            raise exceptions.AuthenticationFailed('Token has expired. Please log in again.')

        # Check user is active
        user = session.userId
        if not user.isActive:
            raise exceptions.AuthenticationFailed('User account is disabled.')

        if user.isFrozen:
            raise exceptions.AuthenticationFailed('User account is frozen.')

        return (user, token)

    def authenticate_header(self, request):
        return self.keyword
