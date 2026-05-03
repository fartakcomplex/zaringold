from django.db import models
from core.models import BaseModel
from authentication.models import User


class UserCar(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="cars",
    )
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    color = models.CharField(max_length=50, default="")
    plateNumber = models.CharField(max_length=50, default="")
    fuelType = models.CharField(max_length=50, default="gasoline")
    isActive = models.BooleanField(default=True)

    class Meta:
        db_table = "services_usercar"

    def __str__(self):
        return f"UserCar({self.brand} {self.model} {self.year})"


class CarServiceCategory(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    icon = models.CharField(max_length=50, default="Car")
    isActive = models.BooleanField(default=True)

    class Meta:
        db_table = "services_carservicecategory"

    def __str__(self):
        return f"CarServiceCategory({self.name})"


class CarServiceOrder(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="carServiceOrders",
    )
    carId = models.ForeignKey(
        UserCar,
        on_delete=models.CASCADE,
        related_name="serviceOrders",
    )
    categoryId = models.ForeignKey(
        CarServiceCategory,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    status = models.CharField(max_length=50, default="pending")
    description = models.TextField(default="")
    scheduledAt = models.DateTimeField(null=True, blank=True)
    completedAt = models.DateTimeField(null=True, blank=True)
    cost = models.FloatField(default=0)
    trackingCode = models.CharField(max_length=100, default="")

    class Meta:
        db_table = "services_carserviceorder"

    def __str__(self):
        return f"CarServiceOrder({self.trackingCode}, {self.status})"


class UtilityPayment(BaseModel):
    userId = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="utilityPayments",
    )
    type = models.CharField(max_length=50, default="electricity")
    billId = models.CharField(max_length=100)
    amount = models.FloatField()
    status = models.CharField(max_length=50, default="pending")
    paidAt = models.DateTimeField(null=True, blank=True)
    trackingCode = models.CharField(max_length=100, default="")

    class Meta:
        db_table = "services_utilitypayment"

    def __str__(self):
        return f"UtilityPayment({self.type}, {self.billId})"
