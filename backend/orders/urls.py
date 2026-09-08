from django.urls import path

from . import views

urlpatterns = [
    path('', views.OrderListCreateView.as_view(), name='order_list'),
    path('pins/', views.DeliveryPinsView.as_view(), name='delivery_pins'),
    path('pins/<int:pk>/', views.DeliveryPinDeleteView.as_view(), name='delivery_pin_delete'),
    path('customers/', views.CustomerSearchView.as_view(), name='customer_search'),
    path('routes/', views.DeliveryRouteListCreateView.as_view(), name='route_list'),
    path('routes/<int:pk>/', views.DeliveryRouteDetailView.as_view(), name='route_detail'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('export/orders.csv', views.OrdersCsvView.as_view(), name='orders_csv'),
    path('export/inventory.csv', views.InventoryCsvView.as_view(), name='inventory_csv'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order_detail'),
]
