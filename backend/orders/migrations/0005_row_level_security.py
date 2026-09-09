from django.db import migrations

# Business tables protected by Row-Level Security on PostgreSQL.
# Django's system tables (migrations, sessions, content types) are intentionally
# excluded — only tenant data rows are guarded.
RLS_TABLES = [
    'accounts_user',
    'inventory_item',
    'orders_order',
    'orders_orderitem',
    'orders_shopsettings',
    'orders_deliverypin',
    'orders_deliveryroute',
    'orders_routestop',
    'quotations_quotation',
    'quotations_quotationitem',
]

APPLY_SQL = """
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[{tables}] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND policyname = 'app_full_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY app_full_access ON %I FOR ALL TO %I USING (true) WITH CHECK (true)',
        t, current_user
      );
    END IF;
  END LOOP;
END $$;
""".format(tables=', '.join("'" + t + "'" for t in RLS_TABLES))

REVERSE_SQL = """
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[{tables}] LOOP
    EXECUTE format('DROP POLICY IF EXISTS app_full_access ON %I', t);
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
""".format(tables=', '.join("'" + t + "'" for t in RLS_TABLES))


def apply_rls(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        # SQLite (local dev) has no RLS concept — no-op. RLS applies on Railway/PostgreSQL.
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(APPLY_SQL)


def reverse_rls(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(REVERSE_SQL)


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0004_shopsettings'),
        ('accounts', '0001_initial'),
        ('inventory', '0002_item_photo_url'),
        ('quotations', '0003_quotation_source_quotationitem_price_na'),
    ]

    operations = [
        migrations.RunPython(apply_rls, reverse_rls),
    ]
