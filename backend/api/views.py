from rest_framework import status, viewsets, permissions
from .permissions import IsAdminOrSuperuser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    UpdateProfileSerializer
)

User = get_user_model()


class RegisterView(APIView):
    """
    User registration endpoint
    POST /api/register/
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Optionally generate tokens here
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'User registered successfully. Please verify your email.',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    User login endpoint
    POST /api/login/
    Uses the LoginSerializer to validate credentials (email or username)
    and returns tokens + user in a consistent JSON shape similar to registration.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            data = serializer.validated_data

            # TokenObtainPairSerializer returns 'refresh' and 'access' keys
            refresh = data.get('refresh')
            access = data.get('access')
            user_data = data.get('user')

            # Ensure superusers and staff are treated with correct `user_type`
            try:
                user_obj = User.objects.get(id=user_data.get('id'))
                if getattr(user_obj, 'is_superuser', False):
                    user_data['user_type'] = 'admin'
                elif getattr(user_obj, 'is_staff', False):
                    # non-superuser staff accounts should be considered 'staff'
                    user_data['user_type'] = 'staff'
            except Exception:
                pass

            return Response({
                'success': True,
                'message': 'Login successful.',
                'user': user_data,
                'tokens': {
                    'refresh': refresh,
                    'access': access,
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User management
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RegisterSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Get current user profile
        GET /api/users/me/
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """
        Change user password
        POST /api/users/change_password/
        """
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Password changed successfully.'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['put'], permission_classes=[permissions.IsAuthenticated])
    def update_profile(self, request):
        """
        Update user profile
        PUT /api/users/update_profile/
        """
        serializer = UpdateProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Profile updated successfully.',
                'user': UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def verify_email(self, request):
        """
        Verify user email (placeholder)
        GET /api/users/verify_email/
        """
        user = request.user
        user.is_verified = True
        user.save()
        
        return Response({
            'success': True,
            'message': 'Email verified successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def by_email(self, request):
        """
        Get user by email
        GET /api/users/by_email/?email=...
        """
        email = request.query_params.get('email')
        
        if not email:
            return Response({
                'success': False,
                'error': 'Email parameter is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def by_user_type(self, request):
        """
        Get users by user type
        GET /api/users/by_user_type/?user_type=staff
        """
        user_type = request.query_params.get('user_type')
        
        if not user_type:
            return Response({
                'success': False,
                'error': 'user_type parameter is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(user_type=user_type)
        serializer = self.get_serializer(users, many=True)
        
        return Response({
            'success': True,
            'count': users.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrSuperuser])
    def change_role(self, request, pk=None):
        """
        Change a user's role between 'admin' and 'staff'.
        POST /api/users/{id}/change_role/ with JSON { "target": "admin"|"staff" }
        Only request.user who is superuser or has user_type=='admin' may perform this.
        Superusers cannot be modified via this endpoint.
        """
        # Authorization check: only superusers or admin users may promote/demote
        # permission class already enforces actor is superuser or admin-type
        actor = request.user

        try:
            target_user = self.get_object()
        except Exception:
            return Response({'success': False, 'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Do not allow modifying actual superusers
        if getattr(target_user, 'is_superuser', False):
            return Response({'success': False, 'error': 'Cannot modify superuser role.'}, status=status.HTTP_400_BAD_REQUEST)

        target = (request.data.get('target') or '').lower()
        if target not in ('admin', 'staff', 'student'):
            return Response({'success': False, 'error': 'Invalid target role.'}, status=status.HTTP_400_BAD_REQUEST)

        # Apply changes
        if target == 'admin':
            target_user.user_type = 'admin'
            target_user.is_staff = True
        elif target == 'staff':
            target_user.user_type = 'staff'
            target_user.is_staff = True
        else:
            # student or other -> remove staff status
            target_user.user_type = 'student'
            target_user.is_staff = False

        target_user.save()

        return Response({'success': True, 'message': 'Role updated.', 'user': UserSerializer(target_user).data}, status=status.HTTP_200_OK)


class CheckEmailView(APIView):
    """
    Check if email is available
    POST /api/check-email/
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'success': False,
                'error': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        exists = User.objects.filter(email=email).exists()
        
        return Response({
            'success': True,
            'available': not exists,
            'email': email
        }, status=status.HTTP_200_OK)


class CheckUsernameView(APIView):
    """
    Check if username is available
    POST /api/check-username/
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        
        if not username:
            return Response({
                'success': False,
                'error': 'Username is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        exists = User.objects.filter(username=username).exists()
        
        return Response({
            'success': True,
            'available': not exists,
            'username': username
        }, status=status.HTTP_200_OK)
