from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField

from .models import User


class UserChangeForm(forms.ModelForm):
	"""A form for updating users. Includes all the fields on
	the user, but replaces the password field with admin's
	password hash display field."""
	password = ReadOnlyPasswordHashField()

	class Meta:
		model = User
		fields = ('email', 'username', 'first_name', 'last_name', 'user_type', 'is_active', 'is_staff', 'is_superuser')


class UserAdmin(BaseUserAdmin):
	form = UserChangeForm
	model = User
	list_display = ('email', 'username', 'user_type', 'is_staff', 'is_superuser', 'is_active')
	list_filter = ('is_staff', 'is_superuser', 'is_active', 'user_type')
	search_fields = ('email', 'username')
	ordering = ('-created_at',)
	fieldsets = (
		(None, {'fields': ('email', 'password')}),
		(_('Personal info'), {'fields': ('username', 'first_name', 'last_name', 'phone', 'bio', 'profile_picture')}),
		(_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'user_type', 'groups', 'user_permissions')}),
		(_('Important dates'), {'fields': ('last_login', 'created_at')}),
	)


admin.site.register(User, UserAdmin)
