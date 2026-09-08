from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Quotation
from .serializers import QuotationSerializer

class PublicQuotationCreateView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = QuotationSerializer

    def perform_create(self, serializer):
        serializer.save(source=Quotation.WEB, status=Quotation.NEW)


class QuotationListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuotationSerializer

    def get_queryset(self):
        qs = Quotation.objects.all().prefetch_related('items')
        status = self.request.query_params.get('status')
        source = self.request.query_params.get('source')
        if status:
            qs = qs.filter(status=status)
        if source:
            qs = qs.filter(source=source)
        return qs

    def perform_create(self, serializer):
        serializer.save(source=Quotation.MANUAL)


class QuotationUpdateView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer


class PublicItemsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from inventory.models import Item

        return Response([
            {
                'id': i.id,
                'name': i.name,
                'category': i.get_category_display(),
                'rental_price': i.rental_price,
                'color': i.color,
                'size': i.size,
                'photo_url': i.photo_url,
            }
            for i in Item.objects.all()
        ])
