from rest_framework import generics, permissions

from .models import Item
from .serializers import ItemSerializer


class ItemListCreateView(generics.ListCreateAPIView):
    serializer_class = ItemSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = Item.objects.all()
        category = self.request.query_params.get('category')
        low_stock = self.request.query_params.get('low_stock')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(name__icontains=search)
        if low_stock == 'true':
            qs = [i for i in qs if i.is_low_stock]
        return qs


class ItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
