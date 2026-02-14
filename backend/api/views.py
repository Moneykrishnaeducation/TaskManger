from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.generic import View
from django.http import FileResponse
from django.conf import settings
from django.urls import path
from django.utils import timezone
from datetime import datetime
import os
from .models import User, Attendance, Task
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, AttendanceSerializer, TaskSerializer
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_staff or request.user.is_superuser or getattr(request.user, 'user_type', None) == 'admin'))


class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_staff or getattr(request.user, 'user_type', None) == 'staff'))


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Mark attendance on login
        local_now = timezone.localtime(timezone.now())
        today = local_now.date()
        current_time = local_now.time()
        
        attendance, created = Attendance.objects.get_or_create(
            user=user,
            date=today,
            defaults={
                'time_in': current_time,
                'status': 'present'
            }
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'message': 'Login successful.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type,
                'is_verified': user.is_verified,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            },
            'attendance': {
                'id': attendance.id,
                'date': attendance.date,
                'time_in': str(attendance.time_in),
                'status': attendance.status,
                'created': created
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'success': True,
            'message': 'User registered successfully.',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        target_role = request.data.get('target')

        if not request.user.is_superuser and request.user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        user.user_type = target_role
        user.save()

        return Response({
            'success': True,
            'message': f'User role changed to {target_role}',
            'user': UserSerializer(user).data
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing attendance records"""
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter attendance based on user type"""
        user = self.request.user
        
        # Admin and staff can see all attendance
        if user.is_superuser or user.user_type == 'admin' or user.is_staff:
            return Attendance.objects.all()
        
        # Regular users can only see their own attendance
        return Attendance.objects.filter(user=user)

    def create(self, request, *args, **kwargs):
        """Create or update attendance record"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def mark_attendance(self, request):
        """Mark attendance for current user"""
        user = request.user
        local_now = timezone.localtime(timezone.now())
        today = local_now.date()
        current_time = local_now.time()

        attendance, created = Attendance.objects.get_or_create(
            user=user,
            date=today,
            defaults={
                'time_in': current_time,
                'status': 'present'
            }
        )

        serializer = self.get_serializer(attendance)
        return Response({
            'success': True,
            'message': 'Attendance marked successfully',
            'attendance': serializer.data,
            'created': created
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_checkout(self, request):
        """Mark check-out time for current user"""
        user = request.user
        local_now = timezone.localtime(timezone.now())
        today = local_now.date()
        current_time = local_now.time()

        try:
            attendance = Attendance.objects.get(user=user, date=today)
            attendance.time_out = current_time
            attendance.save()

            serializer = self.get_serializer(attendance)
            return Response({
                'success': True,
                'message': 'Check-out recorded successfully',
                'attendance': serializer.data
            }, status=status.HTTP_200_OK)
        except Attendance.DoesNotExist:
            return Response({
                'success': False,
                'message': 'No attendance record found for today'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's attendance for current user"""
        user = request.user
        today = timezone.now().date()

        try:
            attendance = Attendance.objects.get(user=user, date=today)
            serializer = self.get_serializer(attendance)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Attendance.DoesNotExist:
            return Response({
                'message': 'No attendance record for today'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def my_records(self, request):
        """Get all attendance records for current user"""
        user = request.user
        records = Attendance.objects.filter(user=user).order_by('-date')
        
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def user_attendance(self, request):
        """Get attendance records for a specific user (admin only)"""
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response({
                'error': 'user_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not (request.user.is_superuser or request.user.user_type == 'admin' or request.user.is_staff):
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            records = Attendance.objects.filter(user_id=user_id).order_by('-date')
            serializer = self.get_serializer(records, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AdminTaskViewSet(viewsets.ModelViewSet):
    """Admin Task endpoints exposed on main API for frontend compatibility"""
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        status_value = request.data.get('status')

        if status_value not in dict(Task.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        task.status = status_value
        task.save()
        return Response(TaskSerializer(task).data)


class StaffTaskViewSet(viewsets.ModelViewSet):
    """Staff-facing task endpoints using the main Task model."""
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffUser]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        # staff see tasks assigned to them
        return Task.objects.filter(assigned_to=user)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        status_value = request.data.get('status')

        if status_value not in dict(Task.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        task.status = status_value
        task.save()
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['patch'])
    def update_details(self, request, pk=None):
        task = self.get_object()
        serializer = TaskSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SPAView(View):
    """View to serve React SPA frontend"""
    
    def get(self, request, *args, **kwargs):
        index_path = os.path.join(settings.BASE_DIR, 'static', 'index.html')
        if os.path.exists(index_path):
            return FileResponse(open(index_path, 'rb'), content_type='text/html')
        else:
            return Response({'error': 'Frontend not found'}, status=404)
