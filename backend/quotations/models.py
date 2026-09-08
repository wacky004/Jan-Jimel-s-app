from django.db import models


class Quotation(models.Model):
    NEW = 'new'
    REPLIED = 'replied'
    CLOSED = 'closed'
    STATUS_CHOICES = [
        (NEW, 'New'),
        (REPLIED, 'Replied'),
        (CLOSED, 'Closed'),
    ]

    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    event_type = models.CharField(max_length=80, blank=True)
    event_date = models.DateField(null=True, blank=True)
    venue = models.CharField(max_length=200, blank=True)
    items_requested = models.TextField(blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=NEW)
    reply = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def has_contact(self):
        return bool(self.phone or self.email)

    def __str__(self):
        return f'{self.name} - {self.get_status_display()}'


class QuotationItem(models.Model):
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['id']

    @property
    def amount(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f'{self.description} x{self.quantity}'
