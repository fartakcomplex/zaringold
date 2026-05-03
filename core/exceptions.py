"""
Custom exception handlers for ZarrinGold REST API.

Provides consistent error response format across all API endpoints.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent JSON error responses.

    Response format:
    {
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "details": { ... }  # Optional field-level errors
        }
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'error': {
                'code': _get_error_code(response.status_code, exc),
                'message': _get_error_message(response.data),
            }
        }

        # Include field-level validation errors in details
        if isinstance(response.data, dict):
            details = {}
            non_field_errors = []

            for key, value in response.data.items():
                if key == 'detail':
                    continue
                if key == 'non_field_errors':
                    non_field_errors = _flatten_errors(value)
                else:
                    details[key] = _flatten_errors(value)

            if details:
                error_data['error']['details'] = details
            if non_field_errors:
                error_data['error']['details'] = {'non_field_errors': non_field_errors}

        response.data = error_data
        return response

    # Handle unhandled exceptions
    return Response(
        {
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'An unexpected error occurred.',
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _get_error_code(status_code, exc):
    """Map HTTP status codes to application error codes."""
    error_codes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        409: 'CONFLICT',
        422: 'UNPROCESSABLE_ENTITY',
        429: 'TOO_MANY_REQUESTS',
        500: 'INTERNAL_SERVER_ERROR',
    }

    # Check for specific exception types
    from rest_framework.exceptions import (
        ValidationError,
        AuthenticationFailed,
        PermissionDenied,
        NotFound,
        Throttled,
    )

    if isinstance(exc, ValidationError):
        return 'VALIDATION_ERROR'
    if isinstance(exc, AuthenticationFailed):
        return 'AUTHENTICATION_FAILED'
    if isinstance(exc, PermissionDenied):
        return 'PERMISSION_DENIED'
    if isinstance(exc, NotFound):
        return 'NOT_FOUND'
    if isinstance(exc, Throttled):
        return 'RATE_LIMIT_EXCEEDED'

    return error_codes.get(status_code, 'UNKNOWN_ERROR')


def _get_error_message(data):
    """Extract a human-readable error message from response data."""
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        # Return the first error found
        for key, value in data.items():
            errors = _flatten_errors(value)
            if errors:
                return errors[0]
    elif isinstance(data, list):
        errors = _flatten_errors(data)
        if errors:
            return errors[0]

    return 'An error occurred.'


def _flatten_errors(value):
    """Flatten nested error lists into a simple list of strings."""
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        result = []
        for item in value:
            if isinstance(item, str):
                result.append(item)
            elif isinstance(item, dict):
                for k, v in item.items():
                    result.extend(_flatten_errors(v))
            elif isinstance(item, list):
                result.extend(_flatten_errors(item))
        return result
    if isinstance(value, dict):
        result = []
        for k, v in value.items():
            result.extend(_flatten_errors(v))
        return result
    return [str(value)]
