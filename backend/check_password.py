import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

user = User.objects.get(email='admin@example.com')
print(f'User: {user.email}')
print(f'Password check (admin123): {user.check_password("admin123")}')
print(f'Encoded password: {user.password[:50]}...')
