# Ryde Customer Backend (@ryde/customer-backend)

This is a placeholder package for the **Ryde Customer App Backend**.

## Scope & Timeline
- Phase 0: Placeholder README and `package.json`.
- Phase 3+: Full implementation including customer booking intents, vehicle registration, fare calculation, Razorpay integration, and customer profile management.

## Architecture
- Shares the central Supabase PostgreSQL database with Ryde Capital.
- Owns tables: `customers`, `vehicles`, `bookings`, `payments`, `ratings`.
- Communicates with Ryde Capital exclusively via database state and Supabase Realtime CDC events.
