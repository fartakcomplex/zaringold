# Notifications app
from django.db import models
from django.conf import settings
import uuid


class Notification(models.Model):
    """User notification"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200, verbose_name='عنوان')
    body = models.TextField(verbose_name='متن')
    type = models.CharField(max_length=20, default='info', choices=[
        ('info', 'اطلاع'),
        ('success', 'موفق'),
        ('warning', 'هشدار'),
        ('error', 'خطا'),
    ])
    is_read = models.BooleanField(default=False, verbose_name='خوانده شده')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'اعلان'
        verbose_name_plural = 'اعلان‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} → {self.user.phone}'
