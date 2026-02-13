#!/usr/bin/env python
"""
List Task rows with related User details (id, email, username)
"""
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)
import django
django.setup()

from api.models import Task

qs = Task.objects.select_related('user').all()
print('TOTAL TASKS:', qs.count())
for t in qs:
    user = t.user
    print(f'Task id={t.id} title="{t.title}" user_id={user.id if user else None} user_email={getattr(user, "email", None)} user_username={getattr(user, "username", None)} status={t.status} priority={t.priority} deadline={t.deadline}')
