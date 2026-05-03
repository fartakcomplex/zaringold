from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from authentication.backends import TokenAuthentication
from .models import (
    BlogCategory, BlogTag, BlogPost, BlogPostTag,
    CMSPage, CMSComponent, SmsConfig,
)
from .serializers import (
    BlogCategorySerializer, BlogTagSerializer,
    BlogPostSerializer, BlogPostListSerializer,
    CMSPageSerializer, CMSComponentSerializer, SmsConfigSerializer,
)


def is_admin(user):
    return user.role in ['admin', 'super_admin']


# ─── Blog Post ───────────────────────────────────────────────────────────────

class BlogPostViewSet(viewsets.ModelViewSet):
    """Blog posts — public read, admin write."""
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        qs = BlogPost.objects.select_related('authorId', 'categoryId')
        if not is_admin(self.request.user):
            qs = qs.filter(status='published')
        return qs.order_by('-publishedAt', '-createdAt')

    def get_serializer_class(self):
        if self.action == 'list':
            return BlogPostListSerializer
        return BlogPostSerializer

    def perform_create(self, serializer):
        serializer.save(authorId=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.viewCount += 1
        instance.save(update_fields=['viewCount'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class BlogPostBySlugView(APIView):
    """GET - Retrieve a blog post by its slug."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            post = BlogPost.objects.select_related('authorId', 'categoryId').get(slug=slug)
        except BlogPost.DoesNotExist:
            return Response(
                {'error': 'Blog post not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if post.status != 'published':
            return Response(
                {'error': 'Blog post not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        post.viewCount += 1
        post.save(update_fields=['viewCount'])
        return Response(BlogPostSerializer(post).data)


# ─── Blog Category ───────────────────────────────────────────────────────────

class BlogCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of blog categories."""
    queryset = BlogCategory.objects.filter(isActive=True).order_by('sortOrder')
    serializer_class = BlogCategorySerializer
    authentication_classes = [TokenAuthentication]


# ─── Blog Tag ────────────────────────────────────────────────────────────────

class BlogTagViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only list of blog tags."""
    queryset = BlogTag.objects.all().order_by('name')
    serializer_class = BlogTagSerializer
    authentication_classes = [TokenAuthentication]


# ─── CMS Page ────────────────────────────────────────────────────────────────

class CMSPageViewSet(viewsets.ModelViewSet):
    """CMS page CRUD."""
    serializer_class = CMSPageSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        qs = CMSPage.objects.prefetch_related('components')
        if not is_admin(self.request.user):
            qs = qs.filter(isPublished=True)
        return qs


class CMSPageBySlugView(APIView):
    """GET - Retrieve a CMS page by its slug."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            page = CMSPage.objects.prefetch_related('components').get(slug=slug)
        except CMSPage.DoesNotExist:
            return Response(
                {'error': 'Page not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not page.isPublished:
            return Response(
                {'error': 'Page not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(CMSPageSerializer(page).data)


# ─── CMS Component ───────────────────────────────────────────────────────────

class CMSComponentViewSet(viewsets.ModelViewSet):
    """CMS component CRUD."""
    serializer_class = CMSComponentSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return CMSComponent.objects.filter(pageId__isPublished=True)


# ─── SMS Config ──────────────────────────────────────────────────────────────

class SmsConfigViewSet(viewsets.ModelViewSet):
    """SMS Config — admin only."""
    serializer_class = SmsConfigSerializer
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return SmsConfig.objects.all()

    def list(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)


# ─── Seed Views ──────────────────────────────────────────────────────────────

class SeedBlogView(APIView):
    """POST - Seed sample blog data."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Create categories
        cat1, _ = BlogCategory.objects.get_or_create(
            slug='gold-market',
            defaults={
                'name': 'Gold Market',
                'description': 'Latest gold market news and analysis',
                'color': '#D4AF37',
                'icon': 'TrendingUp',
            }
        )
        cat2, _ = BlogCategory.objects.get_or_create(
            slug='tutorials',
            defaults={
                'name': 'Tutorials',
                'description': 'Guides and tutorials for gold trading',
                'color': '#10B981',
                'icon': 'BookOpen',
            }
        )

        # Create tags
        tag1, _ = BlogTag.objects.get_or_create(
            name='gold',
            defaults={'slug': 'gold'}
        )
        tag2, _ = BlogTag.objects.get_or_create(
            name='investing',
            defaults={'slug': 'investing'}
        )
        tag3, _ = BlogTag.objects.get_or_create(
            name='tutorial',
            defaults={'slug': 'tutorial'}
        )

        # Create sample posts
        post1, _ = BlogPost.objects.get_or_create(
            slug='gold-market-outlook-2025',
            defaults={
                'title': 'Gold Market Outlook 2025',
                'content': 'The gold market continues to show strong momentum in 2025...',
                'excerpt': 'An overview of the gold market trends for 2025.',
                'status': 'published',
                'authorId': request.user,
                'categoryId': cat1,
                'readTime': 5,
                'isFeatured': True,
            }
        )
        post2, _ = BlogPost.objects.get_or_create(
            slug='how-to-start-gold-investing',
            defaults={
                'title': 'How to Start Gold Investing',
                'content': 'Getting started with gold investing is easier than you think...',
                'excerpt': 'A beginner guide to gold investing.',
                'status': 'published',
                'authorId': request.user,
                'categoryId': cat2,
                'readTime': 8,
            }
        )

        # Link tags
        BlogPostTag.objects.get_or_create(postId=post1, tagId=tag1, defaults={})
        BlogPostTag.objects.get_or_create(postId=post1, tagId=tag2, defaults={})
        BlogPostTag.objects.get_or_create(postId=post2, tagId=tag1, defaults={})
        BlogPostTag.objects.get_or_create(postId=post2, tagId=tag3, defaults={})

        return Response({'message': 'Blog seed data created successfully'})


class SeedCMSView(APIView):
    """POST - Seed sample CMS data."""
    authentication_classes = [TokenAuthentication]

    def post(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        page1, _ = CMSPage.objects.get_or_create(
            slug='about',
            defaults={
                'title': 'About ZarrinGold',
                'content': 'ZarrinGold is a comprehensive gold trading platform...',
                'seoTitle': 'About ZarrinGold - Gold Trading Platform',
                'seoDesc': 'Learn about ZarrinGold, the leading digital gold trading platform.',
                'isPublished': True,
            }
        )
        page2, _ = CMSPage.objects.get_or_create(
            slug='terms',
            defaults={
                'title': 'Terms of Service',
                'content': 'By using ZarrinGold, you agree to the following terms...',
                'seoTitle': 'Terms of Service - ZarrinGold',
                'seoDesc': 'Read the ZarrinGold terms of service.',
                'isPublished': True,
            }
        )

        # Add components
        CMSComponent.objects.get_or_create(
            pageId=page1,
            type='hero',
            order=1,
            defaults={'props': '{"title": "About ZarrinGold", "subtitle": "Your trusted gold partner"}'}
        )
        CMSComponent.objects.get_or_create(
            pageId=page1,
            type='stats',
            order=2,
            defaults={'props': '{"items": [{"label": "Users", "value": "100K+"}, {"label": "Gold Traded", "value": "5000kg"}]}'}
        )

        return Response({'message': 'CMS seed data created successfully'})
