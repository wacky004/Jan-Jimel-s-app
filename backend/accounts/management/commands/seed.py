from django.core.management import call_command
from django.core.management.base import BaseCommand

from accounts.models import User


class Command(BaseCommand):
    help = 'Seed default users and sync inventory with the official Pricelist 2.'

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

        from orders.models import ShopSettings

        shop = ShopSettings.get()
        if not shop.address:
            shop.address = '#1 Pelota St., Saint Francis Village, Cainta, Rizal'
            shop.lat = '14.5758'
            shop.lng = '121.1182'
            shop.save()
            self.stdout.write('Seeded default shop location.')

        call_command('seed_pricelist', clean_legacy=True)
