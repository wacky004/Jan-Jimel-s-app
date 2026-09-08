from django.core.management.base import BaseCommand

from accounts.models import User
from inventory.models import Item


class Command(BaseCommand):
    help = 'Seed the database with default users and inventory items.'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(username='superadmin').exists():
            User.objects.create_user(
                username='superadmin',
                password='janjimels2026',
                first_name='Super',
                last_name='Admin',
                role=User.SUPER_ADMIN,
            )
            self.stdout.write('Created superadmin / janjimels2026')
        if not User.objects.filter(username='admin').exists():
            User.objects.create_user(
                username='admin',
                password='janjimels2026',
                first_name='Staff',
                last_name='Admin',
                role=User.ADMIN,
            )
            self.stdout.write('Created admin / janjimels2026')

        items = [
            ('Monobloc Chair', 'chairs', 500, 'white', '', 15.00),
            ('Tiffany Chair', 'chairs', 300, 'silver', '', 45.00),
            ('Banquet Chair', 'chairs', 250, 'gold', '', 55.00),
            ('Chiavari Chair', 'chairs', 200, 'gold', '', 60.00),
            ('Round Table (60in)', 'tables', 80, 'white', '60 inches', 250.00),
            ('Rectangular Table (8ft)', 'tables', 100, 'white', '8 feet', 280.00),
            ('Cocktail Table', 'tables', 40, 'white', '42 inches', 200.00),
            ('Table Cloth (Round)', 'linens', 250, 'white', '120 inches', 45.00),
            ('Table Cloth (Rectangular)', 'linens', 200, 'white', '90x156 inches', 55.00),
            ('Table Cloth (Rectangular)', 'linens', 150, 'navy blue', '90x156 inches', 55.00),
            ('Table Cloth (Rectangular)', 'linens', 120, 'gold', '90x156 inches', 55.00),
            ('Table Skirting', 'linens', 100, 'white', '8 feet', 120.00),
            ('Chair Cover', 'covers', 400, 'white', 'standard', 20.00),
            ('Chair Sash / Ribbon', 'covers', 600, 'assorted', 'standard', 10.00),
            ('Table Runner', 'linens', 300, 'assorted', '12 feet', 25.00),
            ('Canopy Tent (10x10ft)', 'tents', 10, 'white', '10x10 feet', 800.00),
            ('Canopy Tent (20x20ft)', 'tents', 8, 'white', '20x20 feet', 1500.00),
            ('Centrepiece Vase (Glass)', 'decor', 120, 'clear', 'standard', 35.00),
            ('Candle Holder', 'decor', 150, 'gold', 'standard', 15.00),
            ('Backdrop Stand (8ft)', 'decor', 20, 'silver', '8 feet', 350.00),
            ('Flower Wall Panel', 'decor', 60, 'assorted', 'panel', 80.00),
            ('Chandelier', 'decor', 15, 'gold', 'large', 500.00),
            ('Sound System (PA)', 'sound_light', 4, 'black', 'set', 1500.00),
            ('Projector & Screen', 'sound_light', 3, 'white', 'set', 1000.00),
            ('Party Lights', 'sound_light', 10, 'multicolor', 'set', 400.00),
            ('Wine Glass', 'glassware', 400, 'clear', 'standard', 8.00),
            ('Dinner Plate', 'glassware', 500, 'white', 'standard', 8.00),
            ('Serving Spoon & Fork', 'glassware', 400, 'silver', 'set', 6.00),
            ('Juice Dispenser', 'glassware', 30, 'clear', 'standard', 60.00),
            ('Chafing Dish', 'glassware', 40, 'silver', 'standard', 90.00),
        ]
        created = 0
        for name, category, qty, color, size, price in items:
            _, was_created = Item.objects.get_or_create(
                name=name, color=color, size=size,
                defaults={
                    'category': category,
                    'quantity_on_hand': qty,
                    'rental_price': price,
                    'condition': Item.GOOD,
                },
            )
            if was_created:
                created += 1
        self.stdout.write(f'Seeded {created} inventory items.')
