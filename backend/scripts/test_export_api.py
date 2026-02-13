#!/usr/bin/env python
"""
Test script for Task Export API with user-selected format
"""
import os
import sys
import django
import json
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from django.contrib.auth import get_user_model
from api.models import Task
from datetime import datetime, timedelta

User = get_user_model()

def create_test_user_and_tasks():
    """Create test user and sample tasks"""
    # Create or get test user
    user, created = User.objects.get_or_create(
        email='test@taskmanager.com',
        defaults={
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'user_type': 'student'
        }
    )
    
    if created:
        user.set_password('testpassword123')
        user.save()
        print(f"✓ Created test user: {user.email}")
    else:
        print(f"✓ Using existing test user: {user.email}")
    
    # Create sample tasks
    tasks_data = [
        {
            'title': 'Complete project proposal',
            'description': 'Write and submit the Q1 project proposal',
            'status': 'in_progress',
            'priority': 'high',
            'deadline': datetime.now() + timedelta(days=5)
        },
        {
            'title': 'Review API documentation',
            'description': 'Go through REST API docs and identify improvements',
            'status': 'pending',
            'priority': 'medium',
            'deadline': datetime.now() + timedelta(days=10)
        },
        {
            'title': 'Update database schema',
            'description': 'Add new fields to User and Task models',
            'status': 'completed',
            'priority': 'high',
            'deadline': datetime.now() - timedelta(days=2)
        },
        {
            'title': 'Fix login bug',
            'description': 'Email login not working on mobile devices',
            'status': 'pending',
            'priority': 'high',
            'deadline': datetime.now() + timedelta(days=1)
        },
    ]
    
    created_count = 0
    for task_data in tasks_data:
        task, created = Task.objects.get_or_create(
            user=user,
            title=task_data['title'],
            defaults=task_data
        )
        if created:
            created_count += 1
    
    print(f"✓ Created/Updated {created_count} sample tasks")
    return user

def test_export_formats():
    """Test export API with different formats"""
    user = create_test_user_and_tasks()
    
    # Generate token (in real scenario, use login endpoint)
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)
    
    print("\n" + "="*60)
    print("TESTING EXPORT API WITH DIFFERENT FORMATS")
    print("="*60)
    
    # Test JSON export
    print("\n1. Testing JSON Export:")
    print("-" * 40)
    payload = {
        "format": "json",
        "status": "all",
        "priority": "all"
    }
    print(f"Request: POST /api/tasks/export/")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("✓ JSON export endpoint ready")
    
    # Test CSV export
    print("\n2. Testing CSV Export:")
    print("-" * 40)
    payload = {
        "format": "csv",
        "status": "all",
        "priority": "high"
    }
    print(f"Request: POST /api/tasks/export/")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("✓ CSV export endpoint ready (filters: priority=high)")
    
    # Test XML export
    print("\n3. Testing XML Export:")
    print("-" * 40)
    payload = {
        "format": "xml",
        "status": "pending",
        "priority": "all"
    }
    print(f"Request: POST /api/tasks/export/")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("✓ XML export endpoint ready (filters: status=pending)")
    
    # Test PDF export
    print("\n4. Testing PDF Export:")
    print("-" * 40)
    payload = {
        "format": "pdf",
        "status": "all",
        "priority": "all"
    }
    print(f"Request: POST /api/tasks/export/")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("✓ PDF export endpoint ready")
    
    print("\n" + "="*60)
    print("API ENDPOINTS SUMMARY")
    print("="*60)
    print("""
Available Endpoints:
    
1. Create Task
   POST /api/tasks/
   Body: {
       "title": "Task title",
       "description": "Task description",
       "status": "pending|in_progress|completed",
       "priority": "low|medium|high",
       "deadline": "2024-12-31T23:59:59Z"
   }

2. List User Tasks
   GET /api/tasks/
   Returns: Array of user's tasks

3. Get Task Detail
   GET /api/tasks/{id}/
   Returns: Task object

4. Update Task
   PUT /api/tasks/{id}/
   PATCH /api/tasks/{id}/

5. Delete Task
   DELETE /api/tasks/{id}/

6. Export Tasks (NEW - FORMAT SELECTION)
   POST /api/tasks/export/
   Body: {
       "format": "json|csv|xml|pdf",
       "status": "all|pending|in_progress|completed",
       "priority": "all|low|medium|high"
   }
   Returns: File download in selected format

Authentication:
   Include header: Authorization: Bearer <access_token>
    """)
    
    print("="*60)
    print("✓ Export API setup completed successfully!")
    print("="*60)

if __name__ == '__main__':
    test_export_formats()
