from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    
    list_display = ['email', 'username', 'user_type', 'is_verified', 'is_active', 'created_at']
    list_filter = ['user_type', 'is_verified', 'is_active', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Information', {
            'fields': ('user_type', 'phone', 'bio', 'profile_picture', 'is_verified')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-created_at']
