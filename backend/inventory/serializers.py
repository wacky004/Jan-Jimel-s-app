from rest_framework import serializers

from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    quantity_available = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'category', 'category_display', 'quantity_on_hand',
            'quantity_in_use', 'quantity_available', 'condition', 'condition_display',
            'color', 'size', 'rental_price', 'low_stock_threshold', 'is_low_stock',
            'photo_url', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'quantity_in_use', 'created_at', 'updated_at']
