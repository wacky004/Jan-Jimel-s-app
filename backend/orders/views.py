import csv

from django.http import HttpResponse
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import Item

from .models import Order
from .serializers import OrderSerializer


class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        qs = Order.objects.all().prefetch_related('items__item')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        month = self.request.query_params.get('month')
        if status:
            qs = qs.filter(status=status)
        if search:
            qs = qs.filter(
                customer_name__icontains=search,
            ) | qs.filter(delivery_address__icontains=search) | qs.filter(contact_number__icontains=search)
        if month:
            try:
                year, mon = month.split('-')
                qs = qs.filter(created_at__year=year, created_at__month=mon)
            except ValueError:
                pass
        return qs


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Order.objects.all().prefetch_related('items__item')
    serializer_class = OrderSerializer


class DeliveryPinsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Order.objects.exclude(lat__isnull=True).exclude(lng__isnull=True)
        status = request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        pins = [
            {
                'id': o.id,
                'lat': float(o.lat),
                'lng': float(o.lng),
                'customer_name': o.customer_name,
                'address': o.delivery_address,
                'status': o.status,
                'delivered_at': o.delivered_at,
                'created_at': o.created_at,
            }
            for o in qs
        ]
        return Response(pins)


class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum
        from django.utils import timezone

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        orders = Order.objects.all()
        items = Item.objects.all()
        low_stock_items = [i for i in items if i.is_low_stock]

        revenue = orders.filter(status__in=[Order.DELIVERED, Order.COMPLETED]).aggregate(
            total=Sum('total_price')
        )['total'] or 0

        return Response({
            'orders_total': orders.count(),
            'orders_pending': orders.filter(status=Order.PENDING).count(),
            'orders_out_for_delivery': orders.filter(status=Order.OUT_FOR_DELIVERY).count(),
            'orders_delivered': orders.filter(status__in=[Order.DELIVERED, Order.COMPLETED]).count(),
            'deliveries_this_month': orders.filter(delivered_at__gte=month_start).count(),
            'low_stock_count': len(low_stock_items),
            'items_total': items.count(),
            'revenue': revenue,
        })


class OrdersCsvView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="orders.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Customer', 'Contact', 'Email', 'Event Type', 'Event Date',
            'Address', 'Lat', 'Lng', 'Status', 'Delivered At', 'Total',
            'Discount', 'Deposit', 'Balance', 'Items', 'Created',
        ])
        for o in Order.objects.all().prefetch_related('items__item'):
            writer.writerow([
                o.id, o.customer_name, o.contact_number, o.email, o.event_type,
                o.event_date, o.delivery_address, o.lat, o.lng, o.status,
                o.delivered_at, o.total_price, o.discount, o.deposit, o.balance,
                '; '.join(f'{i.item.name} x{i.quantity}' for i in o.items.all()),
                o.created_at.strftime('%Y-%m-%d %H:%M'),
            ])
        return response


class InventoryCsvView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Name', 'Category', 'On Hand', 'In Use', 'Available',
            'Condition', 'Color', 'Size', 'Rental Price', 'Low Stock',
        ])
        for i in Item.objects.all():
            writer.writerow([
                i.id, i.name, i.get_category_display(), i.quantity_on_hand,
                i.quantity_in_use, i.quantity_available, i.get_condition_display(),
                i.color, i.size, i.rental_price, 'YES' if i.is_low_stock else 'no',
            ])
        return response
