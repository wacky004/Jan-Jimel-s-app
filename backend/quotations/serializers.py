from rest_framework import serializers

from .models import Quotation, QuotationItem


class QuotationItemSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, allow_null=True)

    class Meta:
        model = QuotationItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'price_na', 'amount']


class QuotationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    event_date = serializers.DateField(required=False, allow_null=True)
    items = QuotationItemSerializer(many=True, required=False)

    class Meta:
        model = Quotation
        fields = [
            'id', 'name', 'phone', 'email', 'event_type', 'event_date', 'venue',
            'items_requested', 'message', 'status', 'status_display', 'source',
            'source_display', 'reply', 'items', 'created_at',
        ]
        read_only_fields = ['id', 'source', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        quotation = Quotation.objects.create(**validated_data)
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuotationItem.objects.create(quotation=instance, **item_data)
        instance.save()
        return instance
