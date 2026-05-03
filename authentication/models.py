from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from core.utils import generate_cuid
from core.models import BaseModel


class UserManager(BaseUserManager):
    """Custom user manager for phone-based authentication."""

    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('The Phone field must be set')
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('isVerified', True)
        extra_fields.setdefault('isActive', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with phone-based authentication."""
    id = models.CharField(
        primary_key=True,
        max_length=30,
        default=generate_cuid,
        editable=False,
    )
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True)
    password = models.CharField(max_length=255)
    fullName = models.CharField(max_length=200, default='', blank=True)

    isVerified = models.BooleanField(default=False)
    isActive = models.BooleanField(default=True)
    isFrozen = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    role = models.CharField(max_length=50, default='user')
    avatar = models.CharField(max_length=500, null=True, blank=True)
    referredBy = models.CharField(max_length=30, null=True, blank=True)
    referralCode = models.CharField(max_length=50, unique=True)
    userLevel = models.CharField(max_length=50, default='bronze')
    levelUpgradedAt = models.DateTimeField(null=True, blank=True)
    lastLoginAt = models.DateTimeField(null=True, blank=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'authentication_user'
        ordering = ['-createdAt']

    def __str__(self):
        return self.phone

    def save(self, *args, **kwargs):
        if not self.referralCode:
            self.referralCode = generate_cuid()
        super().save(*args, **kwargs)


class Profile(BaseModel):
    """User profile with personal and banking information."""
    userId = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        db_column='userId',
    )
    nationalId = models.CharField(max_length=20, default='', blank=True)
    birthDate = models.DateField(null=True, blank=True)
    iban = models.CharField(max_length=30, default='', blank=True)
    bankCard = models.CharField(max_length=20, default='', blank=True)
    province = models.CharField(max_length=100, default='', blank=True)
    city = models.CharField(max_length=100, default='', blank=True)
    address = models.TextField(default='', blank=True)
    postalCode = models.CharField(max_length=20, default='', blank=True)

    class Meta:
        db_table = 'authentication_profile'

    def __str__(self):
        return f"Profile({self.userId.phone})"


class KYCRequest(BaseModel):
    """Know Your Customer verification request."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    userId = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='kyc_request',
        db_column='userId',
    )
    idCardImage = models.CharField(max_length=500, default='', blank=True)
    idCardBackImage = models.CharField(max_length=500, default='', blank=True)
    selfieImage = models.CharField(max_length=500, default='', blank=True)
    bankCardImage = models.CharField(max_length=500, default='', blank=True)
    verificationVideo = models.CharField(max_length=500, default='', blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    adminNote = models.TextField(default='', blank=True)
    reviewedBy = models.CharField(max_length=30, null=True, blank=True)
    reviewedAt = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'authentication_kyc_request'

    def __str__(self):
        return f"KYCRequest({self.userId.phone}, {self.status})"


class OTPCode(BaseModel):
    """One-time password for phone verification."""
    PURPOSE_CHOICES = [
        ('login', 'Login'),
        ('register', 'Register'),
        ('reset_password', 'Reset Password'),
        ('verify_phone', 'Verify Phone'),
    ]
    userId = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='otp_codes',
        db_column='userId',
    )
    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=10)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='login')
    attempts = models.IntegerField(default=0)
    maxAttempts = models.IntegerField(default=5)
    expiresAt = models.DateTimeField()
    verified = models.BooleanField(default=False)

    class Meta:
        db_table = 'authentication_otp_code'
        ordering = ['-createdAt']

    def __str__(self):
        return f"OTPCode({self.phone}, {self.purpose})"


class UserSession(BaseModel):
    """Active user session tracking."""
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions',
        db_column='userId',
    )
    token = models.CharField(max_length=500, unique=True)
    device = models.CharField(max_length=200, default='', blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    userAgent = models.TextField(default='', blank=True)
    expiresAt = models.DateTimeField()

    class Meta:
        db_table = 'authentication_user_session'
        ordering = ['-createdAt']

    def __str__(self):
        return f"UserSession({self.userId.phone})"


class Role(BaseModel):
    """Custom roles for role-based access control."""
    name = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=200, default='', blank=True)
    description = models.TextField(default='', blank=True)
    permissions = models.TextField(default='[]')
    color = models.CharField(max_length=7, default='#6B7280')
    isSystem = models.BooleanField(default=False)
    priority = models.IntegerField(default=0)

    class Meta:
        db_table = 'authentication_role'
        ordering = ['priority', 'name']

    def __str__(self):
        return self.name


class Permission(BaseModel):
    """Granular permissions for access control."""
    name = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=200, default='', blank=True)
    module = models.CharField(max_length=100, default='', blank=True, db_index=True)
    description = models.TextField(default='', blank=True)

    class Meta:
        db_table = 'authentication_permission'
        ordering = ['module', 'name']

    def __str__(self):
        return self.name


class UserRole(BaseModel):
    """Assignment of roles to users."""
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='user_roles',
        db_column='userId',
    )
    roleId = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='user_roles',
        db_column='roleId',
    )
    assignedBy = models.CharField(max_length=30, null=True, blank=True)
    assignedAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'authentication_user_role'
        unique_together = [('userId', 'roleId')]

    def __str__(self):
        return f"UserRole({self.userId.phone}, {self.roleId.name})"


class RolePermission(BaseModel):
    """Assignment of permissions to roles."""
    roleId = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='role_permissions',
        db_column='roleId',
    )
    permissionId = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='role_permissions',
        db_column='permissionId',
    )

    class Meta:
        db_table = 'authentication_role_permission'
        unique_together = [('roleId', 'permissionId')]

    def __str__(self):
        return f"RolePermission({self.roleId.name}, {self.permissionId.name})"


class UserActivity(BaseModel):
    """User activity log for auditing and analytics."""
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activities',
        db_column='userId',
    )
    action = models.CharField(max_length=200)
    details = models.TextField(default='', blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    userAgent = models.TextField(default='', blank=True)

    class Meta:
        db_table = 'authentication_user_activity'
        ordering = ['-createdAt']

    def __str__(self):
        return f"UserActivity({self.userId.phone}, {self.action})"
