#!/usr/bin/env python
"""
Create a test Task in the database for user test@taskmanager.com
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

import django
django.setup()

from django.contrib.auth import get_user_model
from api.models import Task
from datetime import datetime, timedelta

User = get_user_model()

def main():
    try:
        user = User.objects.get(email='test@taskmanager.com')
    except User.DoesNotExist:
        print('Test user not found. Please create test@taskmanager.com first.')
        return

    task = Task.objects.create(
        user=user,
        title='Scripted test task',
        description='Task created by create_test_task.py',
        status='pending',
        priority='medium',
        deadline=datetime.now() + timedelta(days=7)
    )
    print('Created task id:', task.id)

if __name__ == '__main__':
    main()
