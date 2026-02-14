#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

# Create test admin user
admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@example.com',
        'user_type': 'admin',
        'is_staff': True,
        'is_superuser': True,
    }
)

if created:
    admin_user.set_password('admin123')
    admin_user.save()
    print("✅ Admin user created: admin / admin123")
else:
    print("✅ Admin user already exists: admin")

# Create test staff user
staff_user, created = User.objects.get_or_create(
    username='staff',
    defaults={
        'email': 'staff@example.com',
        'user_type': 'staff',
        'is_staff': True,
    }
)

if created:
    staff_user.set_password('staff123')
    staff_user.save()
    print("✅ Staff user created: staff / staff123")
else:
    print("✅ Staff user already exists: staff")
