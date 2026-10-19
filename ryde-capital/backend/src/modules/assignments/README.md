# Assignments Module

Manages assignment dispatch offers, driver acceptance, rejection, and offer timeouts.

## Layer Structure

- `routes.ts`: Maps assignment endpoints (`/assignments`, `/:id/accept`, `/:id/reject`).
- `controller.ts`: Request parsing and response dispatch.
- `service.ts`: Driver assignment state machine logic.
- `repository.ts`: Direct operations on the `assignments` table.
- `schema.ts`: Validation schemas for assignment parameters and payload.

## Endpoints

- `GET /api/v1/assignments`: List active/offered assignments (501 Stub).
- `POST /api/v1/assignments/:id/accept`: Accept dispatch offer (501 Stub).
- `POST /api/v1/assignments/:id/reject`: Reject dispatch offer (501 Stub).
