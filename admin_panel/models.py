from django.db import models
from core.models import BaseModel
from authentication.models import User


class CreatorSubmission(BaseModel):
    """Content creator submissions for admin review."""
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="creatorSubmissions",
    )
    title = models.CharField(max_length=500)
    content = models.TextField(default="")
    submissionType = models.CharField(max_length=50, default="article")
    status = models.CharField(max_length=50, default="pending")
    adminNote = models.TextField(default="")
    reviewedBy = models.CharField(max_length=30, default="")
    reviewedAt = models.DateTimeField(null=True, blank=True)
    attachments = models.TextField(default="[]")

    class Meta:
        db_table = "admin_panel_creatorsubmission"

    def __str__(self):
        return f"CreatorSubmission({self.title}, {self.status})"
