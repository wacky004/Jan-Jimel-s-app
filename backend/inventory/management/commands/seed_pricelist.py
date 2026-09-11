from django.core.management.base import BaseCommand

from inventory.models import Item

PRICELIST_2 = [
    # (name, category, qty, color, size, price)
    ('Monoblock w/ Cover', 'chairs', 500, '', '', 30.00),
    ('Kiddie Set', 'chairs', 200, '', '', 180.00),
    ('Tiffany Chair', 'chairs', 300, '', '', 80.00),
    ('Square Table', 'tables', 60, '', '', 70.00),
    ('Long Table', 'tables', 100, '', '', 200.00),
    ('Round Table (8 Seater)', 'tables', 80, '', '', 160.00),
    ('Round Table (10 Seater)', 'tables', 60, '', '', 200.00),
    ('Half Moon Table', 'tables', 30, '', '', 150.00),
    ('Cocktail Table', 'tables', 40, '', '', 200.00),
    ('Seat Cover', 'linens', 400, 'Black & White', '', 15.00),
    ('Colored Toppings', 'linens', 400, '', '', 30.00),
    ('Ribbon', 'linens', 600, '', '', 10.00),
    ('Table Napkins', 'linens', 400, 'Black & White', '', 10.00),
    ('Outdoor Tent', 'tents', 10, '', '', 1500.00),
    ('Plates', 'glassware', 500, '', '', 0.00),
    ('Utensils', 'glassware', 500, '', '', 0.00),
    ('Chafing Dish', 'glassware', 40, '', '', 0.00),
    ('Serving Tray', 'glassware', 50, '', '', 0.00),
    ('Soup Bowls', 'glassware', 400, '', '', 0.00),
    ('High-Ball Glass', 'glassware', 300, '', '', 0.00),
    ('Wine Glass', 'glassware', 400, '', '', 0.00),
    ('Pitcher', 'glassware', 60, '', '', 0.00),
]


EQUIPMENT_PHOTOS = {
    'Plates': '/images/equipment/plates.jpg',
    'Utensils': '/images/equipment/utensils.jpg',
    'Chafing Dish': '/images/equipment/chafing-dish.jpg',
    'Serving Tray': '/images/equipment/serving-tray.jpg',
    'Soup Bowls': '/images/equipment/soup-bowls.jpg',
    'High-Ball Glass': '/images/equipment/highball-glass.jpg',
    'Wine Glass': '/images/equipment/wine-glass.jpg',
    'Pitcher': '/images/equipment/pitcher.jpg',
}


class Command(BaseCommand):
    help = 'Sync inventory with the official Pricelist 2 items and prices.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clean-legacy',
            action='store_true',
            help='Delete old inventory items that are not in Pricelist 2 and have no orders.',
        )

    def handle(self, *args, **options):
        created, updated = 0, 0
        pricelist_names = {row[0] for row in PRICELIST_2}

        for name, category, qty, color, size, price in PRICELIST_2:
            defaults = {
                'category': category,
                'quantity_on_hand': qty,
                'color': color,
                'size': size,
                'rental_price': price,
                'condition': Item.GOOD,
            }
            photo = EQUIPMENT_PHOTOS.get(name)
            if photo:
                defaults['photo_url'] = photo
            item, was_created = Item.objects.get_or_create(name=name, defaults=defaults)
            if was_created:
                created += 1
                self.stdout.write(f'  + created {name} ({category})')
            else:
                changed = False
                for field, value in [
                    ('category', category),
                    ('color', color),
                    ('size', size),
                    ('rental_price', price),
                ]:
                    if getattr(item, field) != value:
                        setattr(item, field, value)
                        changed = True
                if photo and not item.photo_url:
                    item.photo_url = photo
                    changed = True
                if changed:
                    item.save()
                    updated += 1
                    self.stdout.write(f'  ~ updated {name}')

        if options['clean_legacy']:
            removed = 0
            for item in Item.objects.exclude(name__in=pricelist_names):
                if item.order_items.exists():
                    self.stdout.write(f'  ! kept {item.name} (has orders)')
                    continue
                item.delete()
                removed += 1
                self.stdout.write(f'  - removed legacy {item.name}')
            self.stdout.write(f'Removed {removed} legacy items.')

        self.stdout.write(
            self.style.SUCCESS(
                f'Pricelist 2 sync done: {created} created, {updated} updated, '
                f'{len(PRICELIST_2)} total official items.'
            )
        )
