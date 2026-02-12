from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    UserViewSet,
    CheckEmailView,
    CheckUsernameView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Check availability endpoints
    path('check-email/', CheckEmailView.as_view(), name='check-email'),
    path('check-username/', CheckUsernameView.as_view(), name='check-username'),
    
    # Router endpoints
    path('', include(router.urls)),
]
