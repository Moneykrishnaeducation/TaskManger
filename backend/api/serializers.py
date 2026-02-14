from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Attendance
from .models import Task


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'user_type', 'is_verified', 'is_staff', 'is_superuser')

    def get_full_name(self, obj):
        full = f"{getattr(obj, 'first_name', '') or ''} {getattr(obj, 'last_name', '') or ''}".strip()
        return full if full else obj.username


class AttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Attendance
        fields = ('id', 'user', 'user_name', 'user_email', 'date', 'time_in', 'time_out', 'status', 'remarks', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
class TaskSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)
    assigned_to_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Task
        fields = ('id', 'title', 'description', 'status', 'priority', 'assigned_to', 'assigned_to_username', 'assigned_to_name', 'deadline', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_assigned_to_name(self, obj):
        user = obj.assigned_to
        if not user:
            return None
        full = f"{getattr(user, 'first_name', '') or ''} {getattr(user, 'last_name', '') or ''}".strip()
        return full if full else getattr(user, 'username', None)
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'user_type')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials")

        data['user'] = user
        return data
