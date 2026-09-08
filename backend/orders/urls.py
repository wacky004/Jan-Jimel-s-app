from django.urls import path

from . import views

urlpatterns = [
    path('', views.OrderListCreateView.as_view(), name='order_list'),
    path('pins/', views.DeliveryPinsView.as_view(), name='delivery_pins'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('export/orders.csv', views.OrdersCsvView.as_view(), name='orders_csv'),
    path('export/inventory.csv', views.InventoryCsvView.as_view(), name='inventory_csv'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order_detail'),
]
