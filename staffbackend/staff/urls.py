from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffTaskViewSet

router = DefaultRouter()
router.register(r'staff/tasks', StaffTaskViewSet, basename='staff-task')

urlpatterns = [
    path('', include(router.urls)),
]
