from rest_framework import permissions


class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or hasattr(request.user, 'user_type') and request.user.user_type == 'staff')
