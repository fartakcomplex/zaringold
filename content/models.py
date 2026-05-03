from django.db import models
from core.models import BaseModel
from authentication.models import User


class BlogCategory(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    description = models.TextField(default="")
    color = models.CharField(max_length=20, default="#D4AF37")
    icon = models.CharField(max_length=50, default="BookOpen")
    sortOrder = models.IntegerField(default=0)
    isActive = models.BooleanField(default=True)

    class Meta:
        db_table = "content_blogcategory"

    def __str__(self):
        return f"BlogCategory({self.name})"


class BlogTag(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    slug = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "content_blogtag"

    def __str__(self):
        return f"BlogTag({self.name})"


class BlogPost(BaseModel):
    title = models.CharField(max_length=500)
    slug = models.CharField(max_length=500, unique=True)
    content = models.TextField(default="")
    excerpt = models.TextField(default="")
    featuredImage = models.CharField(max_length=500, default="")
    status = models.CharField(max_length=50, default="draft")
    seoTitle = models.CharField(max_length=500, default="")
    seoDesc = models.CharField(max_length=500, default="")
    readTime = models.IntegerField(default=1)
    isFeatured = models.BooleanField(default=False)
    viewCount = models.IntegerField(default=0)
    publishedAt = models.DateTimeField(null=True, blank=True)
    authorId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="blogPosts",
    )
    categoryId = models.ForeignKey(
        BlogCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
    )

    class Meta:
        db_table = "content_blogpost"

    def __str__(self):
        return f"BlogPost({self.title})"


class BlogPostTag(BaseModel):
    postId = models.ForeignKey(
        BlogPost,
        on_delete=models.CASCADE,
        related_name="blogPostTags",
    )
    tagId = models.ForeignKey(
        BlogTag,
        on_delete=models.CASCADE,
        related_name="blogPostTags",
    )

    class Meta:
        db_table = "content_blogposttag"
        unique_together = [("postId", "tagId")]

    def __str__(self):
        return f"BlogPostTag({self.postId_id}, {self.tagId_id})"


class CMSPage(BaseModel):
    slug = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=500)
    content = models.TextField(default="")
    seoTitle = models.CharField(max_length=500, default="")
    seoDesc = models.CharField(max_length=500, default="")
    isPublished = models.BooleanField(default=False)

    class Meta:
        db_table = "content_cmspage"

    def __str__(self):
        return f"CMSPage({self.slug})"


class CMSComponent(BaseModel):
    pageId = models.ForeignKey(
        CMSPage,
        on_delete=models.CASCADE,
        related_name="components",
    )
    type = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    props = models.TextField(default="")

    class Meta:
        db_table = "content_cmscomponent"

    def __str__(self):
        return f"CMSComponent({self.pageId_id}, {self.type})"


class SmsConfig(BaseModel):
    provider = models.CharField(max_length=50, default="kavenegar")
    apiKey = models.CharField(max_length=500, default="")
    senderNumber = models.CharField(max_length=50, default="")
    otpTemplate = models.CharField(max_length=100, default="")
    lastTestAt = models.DateTimeField(null=True, blank=True)
    lastTestOk = models.BooleanField(null=True, blank=True)

    class Meta:
        db_table = "content_smsconfig"

    def __str__(self):
        return f"SmsConfig({self.provider})"
