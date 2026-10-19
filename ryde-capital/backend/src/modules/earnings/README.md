# Earnings Module

Handles driver daily, weekly, and monthly earnings breakdowns, incentives, deductions, and payout history.

## Layer Structure

- `routes.ts`: Maps `/earnings` query route.
- `controller.ts`: Query param handling and response formatting.
- `service.ts`: Earnings calculation, aggregation, and platform fee deductions.
- `repository.ts`: Direct operations on `driver_earnings` and payment records.
- `schema.ts`: Zod schema validating date filters and aggregation intervals.

## Endpoints

- `GET /api/v1/earnings`: Retrieve driver earnings ledger (501 Stub).
