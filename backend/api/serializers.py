from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Attendance
from .models import Task
from .models import Lead
from .models import AccountOpening
from .models import PaymentProof
from .models import FollowUp


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
        fields = ('id', 'title', 'description', 'status', 'priority', 'assigned_to', 'assigned_to_username', 'assigned_to_name', 'deadline', 'completion_notes', 'created_at', 'updated_at')
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


class LeadSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = Lead
        fields = ('id', 'name', 'email', 'phone', 'city', 'source', 'status', 'assigned_to', 'assigned_to_username', 'external_id', 'form_id', 'raw_data', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class AccountOpeningSerializer(serializers.ModelSerializer):
    lead_info = serializers.SerializerMethodField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = AccountOpening
        fields = ('id', 'lead', 'lead_info', 'created_by', 'created_by_username', 'deposit_amount', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_lead_info(self, obj):
        lead = obj.lead
        return {
            'id': lead.id,
            'name': lead.name,
            'email': lead.email,
            'phone': lead.phone,
            'city': lead.city,
            'status': lead.status,
        }


class PaymentProofSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = PaymentProof
        fields = ('id', 'lead', 'uploaded_by', 'uploaded_by_username', 'file', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class FollowUpSerializer(serializers.ModelSerializer):
    lead_info = serializers.SerializerMethodField(read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = FollowUp
        fields = ('id', 'lead', 'lead_info', 'scheduled_date', 'notes', 'created_by', 'created_by_username', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_lead_info(self, obj):
        lead = obj.lead
        return {
            'id': lead.id,
            'name': lead.name,
            'email': lead.email,
            'phone': lead.phone,
            'city': lead.city,
            'status': lead.status,
        }
