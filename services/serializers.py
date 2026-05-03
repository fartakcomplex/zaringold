from rest_framework import serializers
from .models import UserCar, CarServiceCategory, CarServiceOrder, UtilityPayment


class UserCarSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCar
        fields = [
            'id', 'userId', 'brand', 'model', 'year', 'color',
            'plateNumber', 'fuelType', 'isActive',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class CarServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CarServiceCategory
        fields = [
            'id', 'name', 'slug', 'icon', 'isActive',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']


class CarServiceOrderSerializer(serializers.ModelSerializer):
    carInfo = UserCarSerializer(source='carId', read_only=True)
    categoryName = serializers.CharField(source='categoryId.name', read_only=True)

    class Meta:
        model = CarServiceOrder
        fields = [
            'id', 'userId', 'carId', 'carInfo', 'categoryId', 'categoryName',
            'status', 'description', 'scheduledAt', 'completedAt',
            'cost', 'trackingCode', 'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'status', 'completedAt', 'trackingCode',
            'createdAt', 'updatedAt',
        ]


class UtilityPayBillSerializer(serializers.Serializer):
    """Serializer for utility bill payment."""
    type = serializers.ChoiceField(choices=['electricity', 'gas', 'water', 'telephone'])
    billId = serializers.CharField()
    amount = serializers.FloatField(min_value=0)


class UtilityTopUpSerializer(serializers.Serializer):
    """Serializer for mobile top-up."""
    phone = serializers.CharField()
    amount = serializers.FloatField(min_value=10000)
    operator = serializers.CharField(default='')


class UtilityInternetSerializer(serializers.Serializer):
    """Serializer for internet payment."""
    subscriptionId = serializers.CharField()
    amount = serializers.FloatField(min_value=0)
    operator = serializers.CharField(default='')


class UtilityPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UtilityPayment
        fields = [
            'id', 'userId', 'type', 'billId', 'amount',
            'status', 'paidAt', 'trackingCode',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'status', 'paidAt', 'trackingCode', 'createdAt', 'updatedAt']
