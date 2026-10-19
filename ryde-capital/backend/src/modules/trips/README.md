# Trips Module

Coordinates the driver trip lifecycle: arrival, OTP authentication, customer vehicle handover inspection, trip progression, and completion.

## Layer Structure

- `routes.ts`: Maps trip lifecycle endpoints (`/:id`, `/arrived`, `/generate-otp`, `/verify-otp`, `/handover`, `/start`, `/end`).
- `controller.ts`: Input parsing and response formatting.
- `service.ts`: State transitions, OTP verification, and handover auditing.
- `repository.ts`: Direct operations on the `trips` database table.
- `schema.ts`: Zod schemas for trip validation.

## Endpoints

- `GET /api/v1/trips/:id`: Retrieve trip details (501 Stub).
- `POST /api/v1/trips/:id/arrived`: Mark driver reached pickup location (501 Stub).
- `POST /api/v1/trips/:id/generate-otp`: Generate trip start OTP (501 Stub).
- `POST /api/v1/trips/:id/verify-otp`: Validate trip start OTP (501 Stub).
- `POST /api/v1/trips/:id/handover`: Complete vehicle handover inspection (501 Stub).
- `POST /api/v1/trips/:id/start`: Begin driving customer's vehicle (501 Stub).
- `POST /api/v1/trips/:id/end`: Complete trip and submit final telemetry (501 Stub).
