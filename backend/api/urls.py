from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    UserViewSet,
    CheckEmailView,
    CheckUsernameView,
    TaskViewSet,
    ExportTasksView,
    TasksForUI,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'tasks', TaskViewSet, basename='tasks')

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Check availability endpoints
    path('check-email/', CheckEmailView.as_view(), name='check-email'),
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    
    # Export endpoint
    path('tasks/export/', ExportTasksView.as_view(), name='export-tasks'),
    # Grouped tasks for UI
    path('tasks/view/', TasksForUI.as_view(), name='tasks-for-ui'),
    
    # Router endpoints
    path('', include(router.urls)),
]
