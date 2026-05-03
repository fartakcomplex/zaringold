from django.db import models
from django.utils import timezone
from core.models import BaseModel
from authentication.models import User


class Notification(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=500)
    body = models.TextField(default="")
    type = models.CharField(max_length=50, default="info")
    isRead = models.BooleanField(default=False)

    class Meta:
        db_table = "communications_notification"

    def __str__(self):
        return f"Notification({self.userId_id}, {self.title})"


class SupportTicket(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="supportTickets",
    )
    subject = models.CharField(max_length=500)
    category = models.CharField(max_length=50, default="general")
    status = models.CharField(max_length=50, default="open")
    priority = models.CharField(max_length=50, default="normal")
    department = models.CharField(max_length=50, default="support")
    assignedTo = models.CharField(max_length=30, default="")
    rating = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(default="")
    slaDeadline = models.DateTimeField(null=True, blank=True)
    closedAt = models.DateTimeField(null=True, blank=True)
    firstReplyAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "communications_supportticket"

    def __str__(self):
        return f"SupportTicket({self.subject}, {self.status})"


class TicketMessage(BaseModel):
    ticketId = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    senderId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ticketMessages",
    )
    content = models.TextField()
    isAdmin = models.BooleanField(default=False)
    isInternal = models.BooleanField(default=False)
    attachments = models.TextField(default="[]")

    class Meta:
        db_table = "communications_ticketmessage"

    def __str__(self):
        return f"TicketMessage({self.ticketId_id}, by {self.senderId_id})"


class SmsCampaign(BaseModel):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, default="marketing")
    message = models.TextField(default="")
    senderNumber = models.CharField(max_length=50, default="")
    recipientCount = models.IntegerField(default=0)
    deliveredCount = models.IntegerField(default=0)
    failedCount = models.IntegerField(default=0)
    pendingCount = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default="draft")
    scheduledAt = models.DateTimeField(null=True, blank=True)
    sentAt = models.DateTimeField(null=True, blank=True)
    completedAt = models.DateTimeField(null=True, blank=True)
    createdById = models.CharField(max_length=30, default="")
    segment = models.CharField(max_length=100, default="all")
    filterJson = models.TextField(default="{}")
    costPerSms = models.FloatField(default=35)
    totalCost = models.FloatField(default=0)
    template = models.CharField(max_length=100, default="")

    class Meta:
        db_table = "communications_smscampaign"

    def __str__(self):
        return f"SmsCampaign({self.name}, {self.status})"


class SmsLog(BaseModel):
    campaignId = models.ForeignKey(
        SmsCampaign,
        on_delete=models.CASCADE,
        related_name="logs",
        null=True,
        blank=True,
    )
    phone = models.CharField(max_length=50)
    message = models.TextField(default="")
    type = models.CharField(max_length=50, default="marketing")
    status = models.CharField(max_length=50, default="pending")
    provider = models.CharField(max_length=50, default="kavenegar")
    messageId = models.CharField(max_length=100, default="")
    cost = models.FloatField(default=35)
    errorMessage = models.TextField(default="")
    retryCount = models.IntegerField(default=0)
    sentAt = models.DateTimeField(null=True, blank=True)
    deliveredAt = models.DateTimeField(null=True, blank=True)
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="smsLogs",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "communications_smslog"

    def __str__(self):
        return f"SmsLog({self.phone}, {self.status})"


class SmsTemplate(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=100, unique=True)
    content = models.TextField(default="")
    type = models.CharField(max_length=50, default="marketing")
    variables = models.TextField(default="[]")
    isActive = models.BooleanField(default=True)

    class Meta:
        db_table = "communication_smstemplate"

    def __str__(self):
        return f"SmsTemplate({self.name})"


class EmailCampaign(BaseModel):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, default="marketing")
    subject = models.CharField(max_length=500)
    content = models.TextField(default="")
    senderEmail = models.CharField(max_length=255, default="")
    senderName = models.CharField(max_length=255, default="")
    recipientCount = models.IntegerField(default=0)
    deliveredCount = models.IntegerField(default=0)
    failedCount = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default="draft")
    scheduledAt = models.DateTimeField(null=True, blank=True)
    sentAt = models.DateTimeField(null=True, blank=True)
    completedAt = models.DateTimeField(null=True, blank=True)
    createdById = models.CharField(max_length=30, default="")
    segment = models.CharField(max_length=100, default="all")

    class Meta:
        db_table = "communications_emailcampaign"

    def __str__(self):
        return f"EmailCampaign({self.name}, {self.status})"


class EmailLog(BaseModel):
    campaignId = models.ForeignKey(
        EmailCampaign,
        on_delete=models.CASCADE,
        related_name="logs",
        null=True,
        blank=True,
    )
    email = models.CharField(max_length=255)
    subject = models.CharField(max_length=500, default="")
    content = models.TextField(default="")
    status = models.CharField(max_length=50, default="pending")
    errorMessage = models.TextField(default="")
    sentAt = models.DateTimeField(null=True, blank=True)
    deliveredAt = models.DateTimeField(null=True, blank=True)
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="emailLogs",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "communications_emaillog"

    def __str__(self):
        return f"EmailLog({self.email}, {self.status})"


class EmailTemplate(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=500, default="")
    content = models.TextField(default="")
    type = models.CharField(max_length=50, default="marketing")
    variables = models.TextField(default="[]")
    isActive = models.BooleanField(default=True)

    class Meta:
        db_table = "communications_emailtemplate"

    def __str__(self):
        return f"EmailTemplate({self.name})"


class TelegramUser(BaseModel):
    userId = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="telegramUser",
    )
    chatId = models.CharField(max_length=100, default="")
    telegramUsername = models.CharField(max_length=100, default="")
    telegramId = models.CharField(max_length=100, default="")
    isLinked = models.BooleanField(default=True)
    linkedAt = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "communications_telegramuser"

    def __str__(self):
        return f"TelegramUser({self.telegramUsername})"
