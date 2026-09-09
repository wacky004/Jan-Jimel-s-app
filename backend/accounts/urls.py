from django.urls import path

from . import views

urlpatterns = [
    path('login/', views.LoginThrottledView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', views.RefreshThrottledView.as_view(), name='token_refresh'),
    path('me/', views.MeView.as_view(), name='me'),
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/register/', views.RegisterView.as_view(), name='user_register'),
    path('users/<int:pk>/delete/', views.UserDeleteView.as_view(), name='user_delete'),
]
