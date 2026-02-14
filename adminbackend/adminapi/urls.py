from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminTaskViewSet, AdminUserViewSet

router = DefaultRouter()
router.register(r'tasks', AdminTaskViewSet, basename='admin-task')
router.register(r'users', AdminUserViewSet, basename='admin-user')

urlpatterns = [
    path('', include(router.urls)),
]
