# Location Module

Handles high-frequency real-time driver GPS telemetry, spatial indexing via PostGIS, and nearby driver lookups.

## Layer Structure

- `routes.ts`: Maps telemetry ping endpoints.
- `controller.ts`: Validates coordinate data and handles ingestion.
- `service.ts`: Filters duplicate pings, computes dead-reckoning, and updates driver location cache.
- `repository.ts`: Writes coordinates to `driver_locations` table using PostGIS geometries.
- `schema.ts`: Zod schema validating latitude, longitude, heading, speed, and accuracy.

## Endpoints

- `POST /api/v1/drivers/me/location`: Ingest driver GPS coordinate ping (501 Stub).
