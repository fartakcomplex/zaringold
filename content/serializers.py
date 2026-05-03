from rest_framework import serializers
from .models import (
    BlogCategory, BlogTag, BlogPost, BlogPostTag,
    CMSPage, CMSComponent, SmsConfig,
)


class BlogCategorySerializer(serializers.ModelSerializer):
    postCount = serializers.SerializerMethodField()

    class Meta:
        model = BlogCategory
        fields = [
            'id', 'name', 'slug', 'description', 'color', 'icon',
            'sortOrder', 'isActive', 'postCount', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']

    def get_postCount(self, obj):
        return obj.posts.filter(status='published').count()


class BlogTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogTag
        fields = ['id', 'name', 'slug', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']


class BlogPostSerializer(serializers.ModelSerializer):
    authorName = serializers.CharField(source='authorId.fullName', read_only=True, default='')
    category = BlogCategorySerializer(source='categoryId', read_only=True)
    tags = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt', 'featuredImage',
            'status', 'seoTitle', 'seoDesc', 'readTime', 'isFeatured',
            'viewCount', 'publishedAt', 'authorId', 'authorName',
            'categoryId', 'category', 'tags', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'slug', 'viewCount', 'publishedAt', 'createdAt', 'updatedAt',
        ]

    def get_tags(self, obj):
        tag_ids = BlogPostTag.objects.filter(postId=obj).values_list('tagId', flat=True)
        tags = BlogTag.objects.filter(id__in=tag_ids)
        return BlogTagSerializer(tags, many=True).data


class BlogPostListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    authorName = serializers.CharField(source='authorId.fullName', read_only=True, default='')
    categoryName = serializers.CharField(source='categoryId.name', read_only=True, default='')

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featuredImage', 'status',
            'readTime', 'isFeatured', 'viewCount', 'publishedAt',
            'authorName', 'categoryId', 'categoryName', 'createdAt', 'updatedAt',
        ]


class CMSComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CMSComponent
        fields = [
            'id', 'pageId', 'type', 'order', 'props',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class CMSPageSerializer(serializers.ModelSerializer):
    components = CMSComponentSerializer(many=True, read_only=True)

    class Meta:
        model = CMSPage
        fields = [
            'id', 'slug', 'title', 'content', 'seoTitle', 'seoDesc',
            'isPublished', 'components', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']


class SmsConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmsConfig
        fields = [
            'id', 'provider', 'apiKey', 'senderNumber', 'otpTemplate',
            'lastTestAt', 'lastTestOk', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'lastTestAt', 'lastTestOk', 'createdAt', 'updatedAt']
        extra_kwargs = {
            'apiKey': {'write_only': True},
        }
