from django.db import models
from core.models import BaseModel
from authentication.models import User


class InsuranceCategory(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    icon = models.CharField(max_length=50, default="Shield")
    isActive = models.BooleanField(default=True)
    sortOrder = models.IntegerField(default=0)

    class Meta:
        db_table = "insurance_insurancecategory"

    def __str__(self):
        return f"InsuranceCategory({self.name})"


class InsuranceProvider(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    logo = models.CharField(max_length=500, default="")
    description = models.TextField(default="")
    isActive = models.BooleanField(default=True)
    rating = models.FloatField(default=0)

    class Meta:
        db_table = "insurance_insuranceprovider"

    def __str__(self):
        return f"InsuranceProvider({self.name})"


class InsurancePlan(BaseModel):
    categoryId = models.ForeignKey(
        InsuranceCategory,
        on_delete=models.CASCADE,
        related_name="plans",
    )
    providerId = models.ForeignKey(
        InsuranceProvider,
        on_delete=models.CASCADE,
        related_name="plans",
    )
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    description = models.TextField(default="")
    coverageType = models.CharField(max_length=100, default="")
    premiumMonthly = models.FloatField(default=0)
    premiumYearly = models.FloatField(default=0)
    coverageAmount = models.FloatField(default=0)
    deductible = models.FloatField(default=0)
    isActive = models.BooleanField(default=True)
    sortOrder = models.IntegerField(default=0)
    features = models.TextField(default="[]")

    class Meta:
        db_table = "insurance_insuranceplan"

    def __str__(self):
        return f"InsurancePlan({self.name})"


class InsuranceOrder(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="insuranceOrders",
    )
    planId = models.ForeignKey(
        InsurancePlan,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    status = models.CharField(max_length=50, default="pending")
    premiumAmount = models.FloatField()
    coverageAmount = models.FloatField()
    startDate = models.DateTimeField(null=True, blank=True)
    endDate = models.DateTimeField(null=True, blank=True)
    policyNumber = models.CharField(max_length=100, default="")

    class Meta:
        db_table = "insurance_insuranceorder"

    def __str__(self):
        return f"InsuranceOrder({self.userId_id}, {self.status})"
