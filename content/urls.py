from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BlogPostViewSet, BlogPostBySlugView, BlogCategoryViewSet,
    BlogTagViewSet, CMSPageViewSet, CMSPageBySlugView,
    CMSComponentViewSet, SmsConfigViewSet, SeedBlogView, SeedCMSView,
)

router = DefaultRouter()
router.register(r'posts', BlogPostViewSet, basename='blog-post')
router.register(r'categories', BlogCategoryViewSet, basename='blog-category')
router.register(r'tags', BlogTagViewSet, basename='blog-tag')
router.register(r'pages', CMSPageViewSet, basename='cms-page')
router.register(r'components', CMSComponentViewSet, basename='cms-component')
router.register(r'sms-config', SmsConfigViewSet, basename='sms-config')

app_name = 'content'

urlpatterns = [
    path('', include(router.urls)),
    path('posts/by-slug/<str:slug>/', BlogPostBySlugView.as_view(), name='blog-post-by-slug'),
    path('pages/by-slug/<str:slug>/', CMSPageBySlugView.as_view(), name='cms-page-by-slug'),
    path('seed/blog/', SeedBlogView.as_view(), name='seed-blog'),
    path('seed/cms/', SeedCMSView.as_view(), name='seed-cms'),
]
