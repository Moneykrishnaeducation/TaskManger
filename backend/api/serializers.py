from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'user_type', 'phone', 'bio', 'profile_picture', 'is_verified', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_verified']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password_confirm', 'user_type', 'phone']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate(self, attrs):
        """Validate passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Password fields must match.'
            })
        
        # Check if email already exists
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({
                'email': 'This email is already registered.'
            })
        
        # Check if username already exists
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({
                'username': 'This username is already taken.'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            **validated_data,
            password=password
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login with JWT - accepts `email` or `username`.

    This serializer validates credentials (email or username + password)
    and returns JWT tokens plus a serialized user object.
    """
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    user_type = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, attrs):
        username_or_email = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')

        if not username_or_email or not password:
            raise serializers.ValidationError('Both email/username and password are required.')

        # Try to find user by email first, then username
        user = None
        try:
            user = User.objects.get(email=username_or_email)
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=username_or_email)
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid email or username.')

        # Verify password
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid password.')

        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')

        # If a user_type was provided in the request, ensure it matches the user's type
        requested_type = attrs.get('user_type')
        if requested_type:
            # Normalize case for comparison
            if requested_type.lower() != (user.user_type or '').lower():
                raise serializers.ValidationError('Selected role does not match this account.')

        # Create tokens
        refresh = RefreshToken.for_user(user)

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.user_type,
                'is_verified': user.is_verified,
            }
        }


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password"""
    old_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password': 'Password fields must match.'
            })
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
    
    def save(self):
        """Update user password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'bio', 'profile_picture', 'user_type']
    
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
