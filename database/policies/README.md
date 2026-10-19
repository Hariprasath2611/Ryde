# Row Level Security (RLS) Policies

This directory contains standalone or reference SQL definitions for Row Level Security policies.

## Guidelines

- Every table must have RLS enabled: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`.
- Use specific policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- Backend services operating under the `service_role` key bypass RLS by default, but direct mobile client queries (via anon/authenticated roles) are strictly evaluated against these policies.
