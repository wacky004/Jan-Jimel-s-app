from django.urls import path

from . import views

urlpatterns = [
    path('public/submit/', views.PublicQuotationCreateView.as_view(), name='quotation_submit'),
    path('public/items/', views.PublicItemsView.as_view(), name='public_items'),
    path('', views.QuotationListView.as_view(), name='quotation_list'),
    path('<int:pk>/', views.QuotationUpdateView.as_view(), name='quotation_detail'),
]
