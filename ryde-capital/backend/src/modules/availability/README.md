# Availability Module

Tracks driver duty status (online, offline, busy, on-trip) and vehicle category eligibility.

## Layer Structure

- `routes.ts`: Exposes availability toggle endpoints.
- `controller.ts`: Availability input handling and status serialization.
- `service.ts`: Driver status validation and matching engine updates.
- `repository.ts`: Database access for `driver_availability`.
- `schema.ts`: Zod schema for availability updates.

## Endpoints

- `PUT /api/v1/drivers/me/availability`: Toggle online/offline status (501 Stub).
