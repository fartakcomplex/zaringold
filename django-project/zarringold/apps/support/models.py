# Support app
from django.db import models
from django.conf import settings
import uuid


class SupportTicket(models.Model):
    """Support ticket"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets')
    subject = models.CharField(max_length=200, verbose_name='موضوع')
    category = models.CharField(max_length=20, default='general', choices=[
        ('payment', 'پرداخت'),
        ('kyc', 'احراز هویت'),
        ('bug', 'مشکلات فنی'),
        ('account', 'حساب کاربری'),
        ('trading', 'معاملات'),
        ('general', 'سایر'),
    ])
    status = models.CharField(max_length=20, default='open', choices=[
        ('open', 'باز'),
        ('closed', 'بسته شده'),
        ('pending', 'در انتظار'),
    ])
    priority = models.CharField(max_length=10, default='normal', choices=[
        ('low', 'کم'),
        ('normal', 'عادی'),
        ('high', 'زیاد'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'تیکت پشتیبانی'
        verbose_name_plural = 'تیکت‌های پشتیبانی'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.subject} - {self.user.phone}'


class TicketMessage(models.Model):
    """Ticket message"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ticket_messages')
    content = models.TextField(verbose_name='محتوا')
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'پیام تیکت'
        verbose_name_plural = 'پیام‌های تیکت'
        ordering = ['created_at']
