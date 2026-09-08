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

        call_command('seed_pricelist', clean_legacy=True)
