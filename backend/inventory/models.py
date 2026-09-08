from django.db import models


class Item(models.Model):
    GOOD = 'good'
    USED = 'used'
    WORN = 'worn'
    CONDITION_CHOICES = [
        (GOOD, 'Good'),
        (USED, 'Used'),
        (WORN, 'Worn'),
    ]

    name = models.CharField(max_length=150)
    category = models.CharField(
        max_length=60,
        choices=[
            ('chairs', 'Chairs'),
            ('tables', 'Tables'),
            ('linens', 'Linens & Cloths'),
            ('covers', 'Covers & Sashes'),
            ('tents', 'Tents & Canopies'),
            ('sound_light', 'Sound & Lights'),
            ('decor', 'Décor'),
            ('glassware', 'Glassware & Tableware'),
            ('other', 'Other'),
        ],
        default='other',
    )
    quantity_on_hand = models.PositiveIntegerField(default=0)
    quantity_in_use = models.PositiveIntegerField(default=0)
    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, default=GOOD)
    color = models.CharField(max_length=60, blank=True)
    size = models.CharField(max_length=60, blank=True)
    rental_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    low_stock_threshold = models.PositiveIntegerField(default=3)
    photo_url = models.CharField(max_length=255, blank=True, help_text='Path to the item photo shown on the quotation page.')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    @property
    def quantity_available(self):
        return max(self.quantity_on_hand - self.quantity_in_use, 0)

    @property
    def is_low_stock(self):
        return self.quantity_available <= self.low_stock_threshold

    def __str__(self):
        return f'{self.name} ({self.get_category_display()})'
