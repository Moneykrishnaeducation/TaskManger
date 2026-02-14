from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'assigned_to', 'deadline')
    list_filter = ('status', 'priority')
    search_fields = ('title', 'description')
    raw_id_fields = ('assigned_to',)
