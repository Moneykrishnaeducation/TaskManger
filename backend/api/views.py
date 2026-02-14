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
import requests
import logging
from .models import User, Attendance, Task
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, AttendanceSerializer, TaskSerializer
from rest_framework import permissions
from .models import Lead
from .serializers import LeadSerializer
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
import csv
from io import TextIOWrapper


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


class FetchMetaLeadsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        logger = logging.getLogger(__name__)

        # Prefer explicit FACEBOOK_* settings (used by lead.py); fall back to FB_* names
        fb_app_id = getattr(settings, 'FACEBOOK_APP_ID', None) or os.getenv('FACEBOOK_APP_ID')
        fb_app_secret = getattr(settings, 'FACEBOOK_APP_SECRET', None) or os.getenv('FACEBOOK_APP_SECRET')
        access_token = (
            getattr(settings, 'FACEBOOK_ACCESS_TOKEN', None)
            or getattr(settings, 'FB_ACCESS_TOKEN', None)
            or os.getenv('FACEBOOK_ACCESS_TOKEN')
            or os.getenv('FB_ACCESS_TOKEN')
        )

        # Support either a single FACEBOOK_PAGE_ID or comma-separated FB_PAGE_IDS
        page_ids_setting = (
            getattr(settings, 'FACEBOOK_PAGE_ID', None)
            or getattr(settings, 'FB_PAGE_IDS', None)
            or os.getenv('FACEBOOK_PAGE_ID')
            or os.getenv('FB_PAGE_IDS')
        )

        api_version = (
            getattr(settings, 'FB_API_VERSION', None)
            or getattr(settings, 'FACEBOOK_API_VERSION', None)
            or os.getenv('FB_API_VERSION')
            or os.getenv('FACEBOOK_API_VERSION')
            or '14.0'
        )

        if not access_token or not page_ids_setting:
            return Response({'error': 'Facebook credentials (access token and page id(s)) must be configured in settings'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize to list of page ids
        page_ids_str = str(page_ids_setting)
        if ',' in page_ids_str:
            page_list = [p.strip() for p in page_ids_str.split(',') if p.strip()]
        else:
            page_list = [page_ids_str.strip()]

        created = 0
        skipped = 0
        errors = []

        for page_id in page_list:
            try:
                forms_url = f"https://graph.facebook.com/v{api_version}/{page_id}/leadgen_forms?access_token={access_token}"
                resp = requests.get(forms_url, timeout=20)
                resp.raise_for_status()
                forms_data = resp.json().get('data', [])

                for form in forms_data:
                    form_id = form.get('id')
                    if not form_id:
                        continue

                    # fetch leads for this form
                    leads_url = f"https://graph.facebook.com/v{api_version}/{form_id}/leads?access_token={access_token}"
                    lresp = requests.get(leads_url, timeout=20)
                    lresp.raise_for_status()
                    leads_data = lresp.json().get('data', [])

                    for lead in leads_data:
                        external_id = lead.get('id')
                        created_time = lead.get('created_time')
                        field_data = lead.get('field_data') or []

                        # parse fields flexibly
                        lead_info = {
                            'name': None,
                            'email': None,
                            'phone': None,
                            'city': None,
                            'source': 'facebook',
                        }

                        # field_data can be list of dicts with 'name' and 'values' or 'values' list
                        for item in field_data:
                            # support both {'name': 'email', 'values': ['a@b.com']} and {'name': 'email', 'values': [{'value':'a@b.com'}]}
                            key = item.get('name') or item.get('field') or None
                            values = item.get('values') or item.get('value') or []
                            if isinstance(values, list) and values:
                                # try to extract string
                                val = None
                                first = values[0]
                                if isinstance(first, dict):
                                    val = first.get('value') or first.get('name')
                                else:
                                    val = first
                            elif isinstance(values, dict):
                                val = values.get('value') or values.get('name')
                            else:
                                val = values

                            if not key or val is None:
                                continue

                            k = key.lower()
                            v = str(val).strip()
                            if 'email' in k:
                                lead_info['email'] = v
                            elif 'phone' in k or 'mobile' in k:
                                lead_info['phone'] = v
                            elif 'name' in k:
                                lead_info['name'] = v
                            elif 'city' in k or 'town' in k:
                                lead_info['city'] = v
                            else:
                                # unknown fields go into raw_data below
                                pass

                        # dedupe by external_id first, then email/phone
                        if external_id and Lead.objects.filter(external_id=external_id).exists():
                            skipped += 1
                            continue

                        email = lead_info.get('email')
                        phone = lead_info.get('phone')
                        if (email and Lead.objects.filter(email__iexact=email).exists()) or (phone and Lead.objects.filter(phone=phone).exists()):
                            skipped += 1
                            continue

                        # create lead record
                        try:
                            lead_obj = Lead.objects.create(
                                name=lead_info.get('name'),
                                email=lead_info.get('email'),
                                phone=lead_info.get('phone'),
                                city=lead_info.get('city'),
                                source='facebook',
                                external_id=external_id,
                                form_id=form_id,
                                raw_data=lead,
                                created_at=created_time if created_time else timezone.now()
                            )
                            created += 1
                        except Exception as e:
                            logger.exception('Error creating lead')
                            errors.append(str(e))
            except Exception as e:
                errors.append(f"page {page_id}: {str(e)}")

        return Response({
            'success': True,
            'created': created,
            'skipped': skipped,
            'errors': errors
        }, status=status.HTTP_200_OK)


class UploadLeadsCSVView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        logger = logging.getLogger(__name__)
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        f = request.FILES['file']
        # Support text/csv uploads
        try:
            stream = TextIOWrapper(f.file, encoding='utf-8')
        except Exception:
            return Response({'error': 'Unable to read uploaded file'}, status=status.HTTP_400_BAD_REQUEST)

        reader = csv.DictReader(stream)
        required = set(['name', 'email', 'phone', 'city'])
        created = 0
        skipped = 0
        errors = []

        # gather active staff for round-robin assignment
        staff_qs = User.objects.filter(user_type='staff', is_active=True)
        staff_list = list(staff_qs)
        staff_count = len(staff_list)
        rr_index = 0

        for i, row in enumerate(reader):
            try:
                # normalize keys to lower-case
                row_lc = {k.strip().lower(): (v.strip() if v is not None else '') for k, v in row.items()}

                # ensure at least one identifier
                email = row_lc.get('email') or row_lc.get('mail-id') or row_lc.get('mail')
                phone = row_lc.get('phone') or row_lc.get('number') or row_lc.get('mobile')
                name = row_lc.get('name') or ''
                city = row_lc.get('city') or ''

                # dedupe by external_id not available for CSV; use email/phone
                if email and Lead.objects.filter(email__iexact=email).exists():
                    skipped += 1
                    continue
                if phone and Lead.objects.filter(phone=phone).exists():
                    skipped += 1
                    continue

                assigned = None
                if staff_count > 0:
                    assigned = staff_list[rr_index % staff_count]
                    rr_index += 1

                lead = Lead.objects.create(
                    name=name or None,
                    email=email or None,
                    phone=phone or None,
                    city=city or None,
                    source='csv',
                    assigned_to=assigned
                )
                created += 1
            except Exception as e:
                logger.exception('Error creating lead from CSV')
                errors.append({'row': i+1, 'error': str(e)})

        return Response({'success': True, 'created': created, 'skipped': skipped, 'errors': errors}, status=status.HTTP_200_OK)
