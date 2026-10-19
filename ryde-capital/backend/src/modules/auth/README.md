# Auth Module

Handles authentication, session validation, and user profile retrieval for Ryde Capital drivers.

## Layer Structure
- `routes.ts`: Maps HTTP paths to controller actions.
- `controller.ts`: Unpacks HTTP requests and formats JSON responses.
- `service.ts`: Business logic for identity verification and tokens.
- `repository.ts`: Supabase Auth API communication.
- `schema.ts`: Zod validation schemas for auth payloads.

## Endpoints
- `GET /api/v1/auth/me`: Retrieves current authenticated user ID and role (Implemented).
- Phone OTP endpoints (Planned Phase 2).
