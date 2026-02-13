#!/usr/bin/env python
"""
Call the /api/tasks/view/ endpoint as jo@gmail.com using DRF test client.
"""
import os, sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)
import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIClient

User = get_user_model()

try:
    user = User.objects.get(email='jo@gmail.com')
except User.DoesNotExist:
    print('User jo@gmail.com not found')
    sys.exit(1)

client = APIClient()
token = str(RefreshToken.for_user(user).access_token)
client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

# Provide a valid Host header to avoid DisallowedHost in test environments
resp = client.get('/api/tasks/view/', SERVER_NAME='localhost', HTTP_HOST='localhost')
print('STATUS:', resp.status_code)
try:
    import json
    print('DATA:', json.dumps(resp.data, indent=2, default=str))
except Exception:
    print('DATA:', resp.content)
