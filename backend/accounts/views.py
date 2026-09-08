from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import RegisterSerializer, UserSerializer


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.SUPER_ADMIN)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        qs = User.objects.all()
        if self.request.user.role != User.SUPER_ADMIN:
            qs = qs.filter(id=self.request.user.id)
        return qs


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    serializer_class = RegisterSerializer


class UserDeleteView(generics.DestroyAPIView):
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.all()

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.id == request.user.id:
            return Response({'detail': 'You cannot delete your own account.'}, status=400)
        if user.is_superuser:
            return Response({'detail': 'Django superusers cannot be deleted here.'}, status=400)
        return super().destroy(request, *args, **kwargs)
