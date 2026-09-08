from django.conf import settings
from django.db import models


class Order(models.Model):
    PENDING = 'pending'
    CONFIRMED = 'confirmed'
    OUT_FOR_DELIVERY = 'out_for_delivery'
    DELIVERED = 'delivered'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (CONFIRMED, 'Confirmed'),
        (OUT_FOR_DELIVERY, 'Out for Delivery'),
        (DELIVERED, 'Delivered'),
        (COMPLETED, 'Completed'),
        (CANCELLED, 'Cancelled'),
    ]

    customer_name = models.CharField(max_length=150)
    contact_number = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    event_type = models.CharField(max_length=80, blank=True)
    event_date = models.DateField(null=True, blank=True)
    event_time = models.TimeField(null=True, blank=True)
    delivery_address = models.TextField()
    lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=PENDING)
    delivery_date = models.DateField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    inventory_applied = models.BooleanField(default=False)
    total_price = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    deposit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='orders_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def balance(self):
        return self.total_price - self.deposit

    def __str__(self):
        return f'{self.customer_name} - {self.get_status_display()}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(
        'inventory.Item', on_delete=models.PROTECT, related_name='order_items',
    )
    quantity = models.PositiveIntegerField(default=1)
    quantity_returned = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.CharField(max_length=200, blank=True)

    @property
    def quantity_missing(self):
        return max(self.quantity - self.quantity_returned, 0)

    def __str__(self):
        return f'{self.item.name} x{self.quantity}'
