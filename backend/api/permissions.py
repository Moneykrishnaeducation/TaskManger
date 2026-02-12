from rest_framework import permissions


class IsAdminOrSuperuser(permissions.BasePermission):
    """Allow access only to superusers or users with user_type == 'admin'."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if getattr(user, 'is_superuser', False):
            return True

        user_type = (getattr(user, 'user_type', '') or '').lower()
        return user_type == 'admin'
