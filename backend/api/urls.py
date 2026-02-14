from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, UserViewSet, AttendanceViewSet, AdminTaskViewSet, StaffTaskViewSet, FetchMetaLeadsView, UploadLeadsCSVView
from .views import LeadsListView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'tasks', AdminTaskViewSet, basename='tasks')
router.register(r'staff/tasks', StaffTaskViewSet, basename='staff-tasks')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('fetch_meta_leads/', FetchMetaLeadsView.as_view(), name='fetch_meta_leads'),
    path('upload_leads_csv/', UploadLeadsCSVView.as_view(), name='upload_leads_csv'),
    path('leads/', LeadsListView.as_view(), name='leads_list'),
    path('', include(router.urls)),
]
