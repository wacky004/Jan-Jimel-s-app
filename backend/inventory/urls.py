from django.urls import path

from . import views

urlpatterns = [
    path('', views.ItemListCreateView.as_view(), name='item_list'),
    path('<int:pk>/', views.ItemDetailView.as_view(), name='item_detail'),
]
