from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['customer_name', 'event_date', 'status', 'delivery_address', 'total_price', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['customer_name', 'delivery_address', 'contact_number']
    inlines = [OrderItemInline]
