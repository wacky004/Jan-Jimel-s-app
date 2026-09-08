import csv

from django.http import HttpResponse
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from inventory.models import Item

from .models import DeliveryPin, DeliveryRoute, Order, ShopSettings
from .serializers import (
    DeliveryPinSerializer,
    DeliveryRouteSerializer,
    OrderSerializer,
)


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
                'source': 'order',
                'lat': float(o.lat),
                'lng': float(o.lng),
                'customer_name': o.customer_name,
                'contact_number': o.contact_number,
                'email': o.email,
                'event_type': o.event_type,
                'event_date': o.event_date,
                'total_price': float(o.total_price),
                'address': o.delivery_address,
                'status': o.status,
                'delivered_at': o.delivered_at,
                'created_at': o.created_at,
            }
            for o in qs
        ]
        manual = DeliveryPin.objects.all()
        pins += [
            {
                'id': p.id,
                'source': 'manual',
                'lat': float(p.lat),
                'lng': float(p.lng),
                'customer_name': p.label or 'Manual Pin',
                'contact_number': '',
                'email': '',
                'event_type': '',
                'event_date': p.pin_date,
                'total_price': 0,
                'address': p.address,
                'status': 'manual',
                'delivered_at': None,
                'created_at': p.created_at,
            }
            for p in manual
        ]
        return Response(pins)

    def post(self, request):
        serializer = DeliveryPinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=201)


class DeliveryPinDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DeliveryPin.objects.all()


class CustomerSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        search = request.query_params.get('search', '').strip()

        results = {}

        def bump(entry, created_at, **fields):
            if entry['lat'] is None and fields.get('lat') is not None:
                entry['lat'] = fields['lat']
                entry['lng'] = fields['lng']
            if created_at and created_at.isoformat() > entry['created_at']:
                entry['created_at'] = created_at.isoformat()
                entry['status'] = fields.get('status', entry['status'])
                entry['event_type'] = fields.get('event_type', entry['event_type'])
                entry['event_date'] = fields.get('event_date', entry['event_date'])
                entry['address'] = fields.get('address') or entry['address']
                entry['phone'] = fields.get('phone') or entry['phone']
                entry['email'] = fields.get('email') or entry['email']
            entry['pin_count'] += 1

        if search:
            order_qs = Order.objects.filter(customer_name__icontains=search).order_by('-created_at')[:50]
        else:
            order_qs = Order.objects.all().order_by('-created_at')[:200]

        for o in order_qs:
            key = (o.customer_name or '').strip().lower()
            entry = results.get(key)
            if entry is None:
                results[key] = {
                    'order_id': o.id,
                    'name': o.customer_name,
                    'phone': o.contact_number,
                    'email': o.email,
                    'address': o.delivery_address,
                    'lat': float(o.lat) if o.lat else None,
                    'lng': float(o.lng) if o.lng else None,
                    'event_type': o.event_type,
                    'event_date': o.event_date,
                    'status': o.status,
                    'created_at': o.created_at.isoformat(),
                    'source': 'order',
                    'pin_count': 1,
                }
            else:
                bump(entry, o.created_at,
                     lat=float(o.lat) if o.lat else None,
                     lng=float(o.lng) if o.lng else None,
                     status=o.status, event_type=o.event_type, event_date=o.event_date,
                     address=o.delivery_address, phone=o.contact_number, email=o.email)

        if search:
            pins_qs = DeliveryPin.objects.filter(label__icontains=search)
            pins_qs = pins_qs | DeliveryPin.objects.filter(address__icontains=search)
        else:
            pins_qs = DeliveryPin.objects.all()
        for p in pins_qs[:200]:
            name = p.label or p.address
            key = (name or '').strip().lower()
            if not key:
                continue
            entry = results.get(key)
            if entry is None:
                results[key] = {
                    'order_id': None,
                    'name': name,
                    'phone': '',
                    'email': '',
                    'address': p.address,
                    'lat': float(p.lat),
                    'lng': float(p.lng),
                    'event_type': '',
                    'event_date': p.pin_date,
                    'status': 'manual',
                    'created_at': p.created_at.isoformat(),
                    'source': 'pin',
                    'pin_count': 1,
                }
            else:
                bump(entry, p.created_at,
                     lat=float(p.lat), lng=float(p.lng),
                     status='manual', event_date=p.pin_date, address=p.address)

        return Response(sorted(results.values(), key=lambda x: x['created_at'], reverse=True))


class ShopSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        s = ShopSettings.get()
        return Response({
            'address': s.address,
            'lat': float(s.lat) if s.lat is not None else None,
            'lng': float(s.lng) if s.lng is not None else None,
        })

    def put(self, request):
        s = ShopSettings.get()
        if 'address' in request.data:
            s.address = request.data.get('address') or ''
        if request.data.get('lat') is not None:
            s.lat = request.data.get('lat')
        if request.data.get('lng') is not None:
            s.lng = request.data.get('lng')
        s.save()
        return Response({
            'address': s.address,
            'lat': float(s.lat) if s.lat is not None else None,
            'lng': float(s.lng) if s.lng is not None else None,
        })


class DeliveryRouteListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DeliveryRouteSerializer

    def get_queryset(self):
        qs = DeliveryRoute.objects.all().prefetch_related('stops')
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(route_date=date)
        return qs


class DeliveryRouteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = DeliveryRoute.objects.all().prefetch_related('stops')
    serializer_class = DeliveryRouteSerializer


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
                '; '.join(f'{i.display_name} x{i.quantity}' for i in o.items.all()),
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
