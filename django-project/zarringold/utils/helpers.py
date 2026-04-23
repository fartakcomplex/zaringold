"""
Utility helpers for Zarrin Gold
"""
import random
import string
import uuid


def generate_referral_code(length: int = 6) -> str:
    """Generate a unique referral code"""
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('O', '').replace('0', '').replace('I', '').replace('1', '')
    return ''.join(random.choices(chars, k=length))


def generate_reference_id(prefix: str = 'TXN') -> str:
    """Generate unique transaction reference ID"""
    uid = uuid.uuid4().hex[:12].upper()
    return f'{prefix}-{uid}'


def format_toman(amount) -> str:
    """Format number as Toman with Persian digits"""
    formatted = f'{int(amount):,}'
    return f'{formatted} تومان'


def format_grams(grams) -> str:
    """Format gold amount in grams"""
    g = float(grams)
    if g < 1:
        return f'{g * 1000:,.1f} میلی‌گرم'
    return f'{g:,.4f} گرم'


def calculate_fee(amount, rate: float) -> int:
    """Calculate fee amount"""
    return int(float(amount) * rate)


def get_client_ip(request) -> str:
    """Extract client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def to_persian_digits(text: str) -> str:
    """Convert Latin digits to Persian"""
    persian_digits = '۰۱۲۳۴۵۶۷۸۹'
    result = ''
    for char in text:
        if char.isdigit():
            result += persian_digits[int(char)]
        else:
            result += char
    return result
