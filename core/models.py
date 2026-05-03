from django.db import models
from core.utils import generate_cuid


class BaseModel(models.Model):
    id = models.CharField(
        primary_key=True,
        max_length=30,
        default=generate_cuid,
        editable=False,
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SiteSetting(BaseModel):
    group = models.CharField(max_length=100, db_index=True)
    key = models.CharField(max_length=100)
    value = models.TextField(default="", blank=True)
    type = models.CharField(max_length=50, default="text")
    label = models.CharField(max_length=200, default="", blank=True)
    description = models.TextField(default="", blank=True)
    sortOrder = models.IntegerField(default=0)

    class Meta:
        db_table = "core_site_setting"
        ordering = ["group", "sortOrder"]
        unique_together = [("group", "key")]

    def __str__(self):
        return f"{self.group}.{self.key}"


class SystemSetting(BaseModel):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(default="", blank=True)
    group = models.CharField(max_length=100, default="general", db_index=True)
    label = models.CharField(max_length=200, default="", blank=True)

    class Meta:
        db_table = "core_system_setting"
        ordering = ["group", "key"]

    def __str__(self):
        return self.key


class AuditLog(BaseModel):
    userId = models.CharField(max_length=30, null=True, blank=True, db_index=True)
    action = models.CharField(max_length=200)
    details = models.TextField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    userAgent = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "core_audit_log"
        ordering = ["-createdAt"]

    def __str__(self):
        return f"AuditLog({self.action})"


class SecurityEvent(BaseModel):
    type = models.CharField(max_length=100, db_index=True)
    severity = models.CharField(max_length=20, default="info")
    userId = models.CharField(max_length=30, null=True, blank=True, db_index=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    userAgent = models.TextField(null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    method = models.CharField(max_length=10, null=True, blank=True)
    details = models.TextField(null=True, blank=True)
    riskScore = models.IntegerField(default=0)
    resolved = models.BooleanField(default=False)

    class Meta:
        db_table = "core_security_event"
        ordering = ["-createdAt"]

    def __str__(self):
        return f"SecurityEvent({self.type}, {self.severity})"


class BlockedIP(BaseModel):
    ip = models.GenericIPAddressField(unique=True)
    reason = models.TextField(null=True, blank=True)
    blockedBy = models.CharField(max_length=30, null=True, blank=True)
    expiresAt = models.DateTimeField(null=True, blank=True)
    isActive = models.BooleanField(default=True)

    class Meta:
        db_table = "core_blocked_ip"
        ordering = ["-createdAt"]

    def __str__(self):
        return f"BlockedIP({self.ip})"


class SecurityConfig(BaseModel):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(default="", blank=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "core_security_config"

    def __str__(self):
        return self.key


class Media(BaseModel):
    filename = models.CharField(max_length=255)
    originalName = models.CharField(max_length=255, default="", blank=True)
    mimeType = models.CharField(max_length=100, default="", blank=True)
    size = models.BigIntegerField(default=0)
    url = models.URLField(max_length=500)
    alt = models.CharField(max_length=255, null=True, blank=True)
    folder = models.CharField(max_length=100, default="general")
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    uploadedBy = models.CharField(max_length=30, null=True, blank=True)

    class Meta:
        db_table = "core_media"
        ordering = ["-createdAt"]

    def __str__(self):
        return self.filename


class LandingSection(BaseModel):
    sectionId = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=200, default="", blank=True)
    icon = models.CharField(max_length=50, default="Layout")
    isVisible = models.BooleanField(default=True)
    sortOrder = models.IntegerField(default=0)
    settings = models.TextField(default="{}")

    class Meta:
        db_table = "core_landing_section"
        ordering = ["sortOrder"]

    def __str__(self):
        return self.sectionId


class GoldReserve(BaseModel):
    totalGrams = models.FloatField(default=0)
    todayAddedGrams = models.FloatField(default=0)
    reserveRatio = models.FloatField(default=1.0)
    lastAuditDate = models.DateField(null=True, blank=True)
    auditFirm = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = "core_gold_reserve"

    def __str__(self):
        return f"GoldReserve({self.totalGrams}g)"


class LoanSetting(BaseModel):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(default="", blank=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "core_loan_setting"

    def __str__(self):
        return self.key
