# Database Migrations

This folder contains all sequential SQL migration files for the Ryde Platform Supabase database.

## Naming Convention

All migration files must adhere to the pattern:

```text
NNN_short_description.sql
```

Examples:

- `001_extensions_and_enums.sql`
- `002_driver_tables.sql`
- `003_customer_booking_tables.sql`
- `004_rls_policies.sql`

## Rules

1. Files are sorted and applied sequentially based on the 3-digit prefix.
2. Every table created must include `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`.
3. Do not modify an already committed and executed migration; create a new numbered migration for updates.
4. Test migrations locally using the Supabase CLI before pushing.
