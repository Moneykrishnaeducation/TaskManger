#!/usr/bin/env python
"""
Print a JWT access token for test@taskmanager.com
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
User = get_user_model()

try:
    user = User.objects.get(email='test@taskmanager.com')
except User.DoesNotExist:
    print('Test user not found')
    sys.exit(1)

refresh = RefreshToken.for_user(user)
print('ACCESS_TOKEN:', str(refresh.access_token))
print('REFRESH_TOKEN:', str(refresh))
