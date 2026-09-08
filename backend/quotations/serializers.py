from rest_framework import serializers

from .models import Quotation


class QuotationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    event_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'name', 'phone', 'email', 'event_type', 'event_date', 'venue',
            'items_requested', 'message', 'status', 'status_display', 'reply',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']
