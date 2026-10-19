# Database Functions and Triggers

This directory contains definitions for PostgreSQL stored procedures, PL/pgSQL functions, and triggers.

## Guidelines
- Write functions using `SECURITY DEFINER` only when elevated privileges are strictly necessary; set explicit `search_path`.
- PostGIS spatial functions (e.g., calculating driver distance, proximity queries) should be placed here.
- Maintain idempotent migration scripts that install or update these functions.
