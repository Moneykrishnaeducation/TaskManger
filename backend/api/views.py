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
    UpdateProfileSerializer,
    TaskSerializer,
    ExportFormatSerializer
)
from .models import Task
import json
import csv
import io
from django.http import HttpResponse
from xml.etree.ElementTree import Element, SubElement, tostring
from datetime import datetime

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


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task management
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return tasks visible to the current user.
        Admin/staff users see all tasks; regular users see only their own tasks.
        """
        user = self.request.user
        if user.is_authenticated and (getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'user_type', '') == 'admin'):
            return Task.objects.all()
        return Task.objects.filter(user=user)

    def perform_create(self, serializer):
        """Create task. If the request includes a `user` field and the actor is admin/staff,
        assign the task to that user. Otherwise assign to the request.user.
        """
        actor = self.request.user
        is_actor_admin = actor.is_authenticated and (
            getattr(actor, 'is_superuser', False)
            or getattr(actor, 'is_staff', False)
            or getattr(actor, 'user_type', '') == 'admin'
        )

        # Default to assigning to the actor
        assigned_user = actor

        # If actor has permission, prefer the serializer-validated `user` (a User instance).
        if is_actor_admin:
            assigned_from_serializer = serializer.validated_data.get('user') if hasattr(serializer, 'validated_data') else None
            if assigned_from_serializer:
                assigned_user = assigned_from_serializer
            else:
                # Fallback: try request payload id (for backward compatibility)
                requested_user_id = self.request.data.get('user') or self.request.data.get('user_id')
                if requested_user_id:
                    try:
                        assigned_user = User.objects.get(id=requested_user_id)
                    except Exception:
                        assigned_user = actor

        serializer.save(user=assigned_user)


class ExportTasksView(APIView):
    """
    Export tasks in user-selected format
    POST /api/tasks/export/
    Body: {
        "format": "json|csv|xml|pdf",
        "status": "all|pending|in_progress|completed",
        "priority": "all|low|medium|high"
    }
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Validate format selection
        serializer = ExportFormatSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user's tasks
        queryset = Task.objects.filter(user=request.user)
        
        # Apply filters
        status_filter = serializer.validated_data.get('status', 'all')
        priority_filter = serializer.validated_data.get('priority', 'all')
        
        if status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        if priority_filter != 'all':
            queryset = queryset.filter(priority=priority_filter)
        
        export_format = serializer.validated_data.get('format')
        tasks = queryset.values('id', 'title', 'description', 'status', 'priority', 'deadline', 'created_at')
        
        if export_format == 'json':
            return self._export_json(tasks)
        elif export_format == 'csv':
            return self._export_csv(tasks)
        elif export_format == 'xml':
            return self._export_xml(tasks)
        elif export_format == 'pdf':
            return self._export_pdf(tasks)
        
        return Response({
            'success': False,
            'error': 'Invalid format specified.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def _export_json(self, tasks):
        """Export tasks as JSON"""
        tasks_list = list(tasks)
        # Convert datetime objects to strings
        for task in tasks_list:
            if task['deadline']:
                task['deadline'] = task['deadline'].isoformat()
            if task['created_at']:
                task['created_at'] = task['created_at'].isoformat()
        
        response = HttpResponse(
            json.dumps({'tasks': tasks_list}, indent=2),
            content_type='application/json'
        )
        response['Content-Disposition'] = 'attachment; filename="tasks_export.json"'
        return response


class TasksForUI(APIView):
    """Provide grouped tasks for the frontend staff UI.

    GET /api/tasks/view/
    Returns JSON: { assigned: [...], pending: [...], completed: [...] }
    The view respects TaskViewSet.get_queryset visibility rules.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Reuse TaskViewSet.get_queryset to respect permissions
        try:
            viewset = TaskViewSet()
            viewset.request = request
            queryset = viewset.get_queryset()
        except Exception:
            queryset = Task.objects.none()

        # Serialize full tasks (use TaskSerializer)
        serializer = TaskSerializer(queryset, many=True, context={'request': request})
        tasks = serializer.data

        # Group tasks
        assigned = [t for t in tasks]
        pending = [t for t in tasks if (t.get('status') or 'pending') != 'completed']
        completed = [t for t in tasks if (t.get('status') or '') == 'completed']

        return Response({
            'assigned': assigned,
            'pending': pending,
            'completed': completed,
        }, status=status.HTTP_200_OK)
    
    def _export_csv(self, tasks):
        """Export tasks as CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="tasks_export.csv"'
        
        writer = csv.DictWriter(
            response,
            fieldnames=['id', 'title', 'description', 'status', 'priority', 'deadline', 'created_at']
        )
        writer.writeheader()
        
        for task in tasks:
            task_copy = dict(task)
            if task_copy['deadline']:
                task_copy['deadline'] = task_copy['deadline'].isoformat()
            if task_copy['created_at']:
                task_copy['created_at'] = task_copy['created_at'].isoformat()
            writer.writerow(task_copy)
        
        return response
    
    def _export_xml(self, tasks):
        """Export tasks as XML"""
        root = Element('tasks')
        root.set('exported', datetime.now().isoformat())
        
        for task in tasks:
            task_elem = SubElement(root, 'task')
            SubElement(task_elem, 'id').text = str(task['id'])
            SubElement(task_elem, 'title').text = str(task['title'] or '')
            SubElement(task_elem, 'description').text = str(task['description'] or '')
            SubElement(task_elem, 'status').text = str(task['status'] or '')
            SubElement(task_elem, 'priority').text = str(task['priority'] or '')
            SubElement(task_elem, 'deadline').text = task['deadline'].isoformat() if task['deadline'] else 'N/A'
            SubElement(task_elem, 'created_at').text = task['created_at'].isoformat() if task['created_at'] else 'N/A'
        
        xml_str = tostring(root, encoding='unicode')
        response = HttpResponse(xml_str, content_type='application/xml')
        response['Content-Disposition'] = 'attachment; filename="tasks_export.xml"'
        return response
    
    def _export_pdf(self, tasks):
        """Export tasks as PDF"""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib import colors
            from datetime import datetime
            
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="tasks_export.pdf"'
            
            # Create PDF
            doc = SimpleDocTemplate(response, pagesize=letter)
            elements = []
            styles = getSampleStyleSheet()
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1f2937'),
                spaceAfter=30
            )
            elements.append(Paragraph('Task Export', title_style))
            elements.append(Spacer(1, 0.2 * inch))
            
            # Tasks table
            data = [['ID', 'Title', 'Status', 'Priority', 'Deadline']]
            for task in tasks:
                data.append([
                    str(task['id']),
                    task['title'][:30] or 'N/A',
                    task['status'] or 'N/A',
                    task['priority'] or 'N/A',
                    task['deadline'].strftime('%Y-%m-%d') if task['deadline'] else 'N/A'
                ])
            
            table = Table(data, colWidths=[0.8*inch, 2.2*inch, 1*inch, 1*inch, 1.2*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey)
            ]))
            
            elements.append(table)
            doc.build(elements)
            
            return response
        except ImportError:
            return Response({
                'success': False,
                'error': 'PDF export requires reportlab. Please install it: pip install reportlab'
            }, status=status.HTTP_400_BAD_REQUEST)
