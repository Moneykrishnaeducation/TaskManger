#!/usr/bin/env python
"""
Simple script to check Task rows in the database
"""
import os
import sys

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

import django
django.setup()

from api.models import Task

def main():
    qs = Task.objects.all()
    count = qs.count()
    print(f"TASK ROW COUNT: {count}")
    # Print up to 10 sample rows
    samples = list(qs.values('id', 'user_id', 'title', 'status', 'priority', 'deadline', 'created_at')[:10])
    if samples:
        import json
        print(json.dumps(samples, default=str, indent=2))
    else:
        print('No task rows found.')

if __name__ == '__main__':
    main()
