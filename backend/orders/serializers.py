from rest_framework import serializers

from inventory.models import Item

from .models import DeliveryPin, DeliveryRoute, Order, OrderItem, RouteStop


class OrderItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), required=False, allow_null=True,
    )
    item_name = serializers.CharField(source='display_name', read_only=True)
    item_category = serializers.CharField(source='item.get_category_display', read_only=True, default='')
    quantity_missing = serializers.IntegerField(read_only=True)
    is_custom = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'item', 'item_name', 'item_category', 'custom_name', 'is_custom',
            'quantity', 'quantity_returned', 'quantity_missing', 'unit_price', 'notes',
        ]

    def get_is_custom(self, obj):
        return obj.item is None

    def validate(self, attrs):
        if not attrs.get('item') and not attrs.get('custom_name', '').strip():
            raise serializers.ValidationError('Choose an inventory item or enter a custom equipment name.')
        return attrs


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    balance = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    event_date = serializers.DateField(required=False, allow_null=True)
    event_time = serializers.TimeField(required=False, allow_null=True)
    delivery_date = serializers.DateField(required=False, allow_null=True)
    lat = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    lng = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer_name', 'contact_number', 'email', 'event_type',
            'event_date', 'event_time', 'delivery_address', 'lat', 'lng',
            'status', 'status_display', 'delivery_date', 'delivered_at',
            'total_price', 'discount', 'deposit', 'balance', 'notes',
            'items', 'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'delivered_at', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user
        order = Order.objects.create(created_by=user, **validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        old_status = instance.status
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                OrderItem.objects.create(order=instance, **item_data)

        instance = apply_inventory_on_status_change(instance, old_status)
        instance.save()
        return instance


def apply_inventory_on_status_change(order, old_status):
    """Keep inventory quantities in sync when an order's status changes."""
    if old_status == order.status:
        return order

    from django.utils import timezone

    # Revert the inventory effect of the previous status
    if old_status == Order.DELIVERED and order.inventory_applied:
        if order.status == Order.COMPLETED:
            # Finalize returns: zero in-use, permanently remove missing pieces
            for oi in order.items.all():
                if oi.item is None:
                    continue
                oi.item.quantity_in_use = max(oi.item.quantity_in_use - oi.quantity, 0)
                oi.item.quantity_on_hand = max(oi.item.quantity_on_hand - oi.quantity_missing, 0)
                oi.item.save()
        else:
            # Release the items back to available stock
            for oi in order.items.all():
                if oi.item is None:
                    continue
                oi.item.quantity_in_use = max(oi.item.quantity_in_use - oi.quantity, 0)
                oi.item.save()
        order.inventory_applied = False

    # Apply the inventory effect of the new status
    if order.status == Order.DELIVERED and not order.inventory_applied:
        for oi in order.items.all():
            if oi.item is None:
                continue
            oi.item.quantity_in_use += oi.quantity
            oi.item.save()
        order.inventory_applied = True
        order.delivered_at = timezone.now()

    return order


class DeliveryPinSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPin
        fields = ['id', 'label', 'address', 'lat', 'lng', 'pin_date', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = ['id', 'name', 'phone', 'address', 'lat', 'lng', 'seq', 'notes', 'order']
        read_only_fields = ['id']


class DeliveryRouteSerializer(serializers.ModelSerializer):
    stops = RouteStopSerializer(many=True, required=False)

    class Meta:
        model = DeliveryRoute
        fields = ['id', 'route_date', 'name', 'notes', 'stops', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        stops_data = validated_data.pop('stops', [])
        user = self.context['request'].user
        route = DeliveryRoute.objects.create(created_by=user, **validated_data)
        for idx, stop_data in enumerate(stops_data):
            RouteStop.objects.create(route=route, seq=idx, **stop_data)
        return route

    def update(self, instance, validated_data):
        stops_data = validated_data.pop('stops', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if stops_data is not None:
            instance.stops.all().delete()
            for idx, stop_data in enumerate(stops_data):
                RouteStop.objects.create(route=instance, seq=idx, **stop_data)
        instance.save()
        return instance
