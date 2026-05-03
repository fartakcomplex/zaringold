from rest_framework import serializers
from .models import (
    InsuranceCategory, InsuranceProvider,
    InsurancePlan, InsuranceOrder,
)


class InsuranceCategorySerializer(serializers.ModelSerializer):
    planCount = serializers.SerializerMethodField()

    class Meta:
        model = InsuranceCategory
        fields = [
            'id', 'name', 'slug', 'icon', 'isActive',
            'sortOrder', 'planCount', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']

    def get_planCount(self, obj):
        return obj.plans.filter(isActive=True).count()


class InsuranceProviderSerializer(serializers.ModelSerializer):
    planCount = serializers.SerializerMethodField()

    class Meta:
        model = InsuranceProvider
        fields = [
            'id', 'name', 'slug', 'logo', 'description',
            'isActive', 'rating', 'planCount', 'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']

    def get_planCount(self, obj):
        return obj.plans.filter(isActive=True).count()


class InsurancePlanSerializer(serializers.ModelSerializer):
    categoryName = serializers.CharField(source='categoryId.name', read_only=True)
    providerName = serializers.CharField(source='providerId.name', read_only=True)
    providerLogo = serializers.CharField(source='providerId.logo', read_only=True)

    class Meta:
        model = InsurancePlan
        fields = [
            'id', 'categoryId', 'providerId', 'name', 'slug', 'description',
            'coverageType', 'premiumMonthly', 'premiumYearly', 'coverageAmount',
            'deductible', 'isActive', 'sortOrder', 'features',
            'categoryName', 'providerName', 'providerLogo',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = ['id', 'slug', 'createdAt', 'updatedAt']


class InsuranceOrderSerializer(serializers.ModelSerializer):
    planName = serializers.CharField(source='planId.name', read_only=True)
    categoryName = serializers.CharField(source='planId.categoryId.name', read_only=True)

    class Meta:
        model = InsuranceOrder
        fields = [
            'id', 'userId', 'planId', 'planName', 'categoryName',
            'status', 'premiumAmount', 'coverageAmount',
            'startDate', 'endDate', 'policyNumber',
            'createdAt', 'updatedAt',
        ]
        read_only_fields = [
            'id', 'status', 'policyNumber', 'startDate', 'endDate',
            'createdAt', 'updatedAt',
        ]
