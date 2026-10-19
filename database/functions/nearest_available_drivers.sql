-- nearest_available_drivers.sql
-- PostGIS function to locate nearest available drivers for assignment matching.

CREATE OR REPLACE FUNCTION public.nearest_available_drivers(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_m DOUBLE PRECISION,
  p_vehicle_type public.vehicle_type,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  driver_id UUID,
  distance_m DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    d.id AS driver_id,
    ST_Distance(
      dl.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_m
  FROM public.drivers d
  INNER JOIN public.driver_locations dl ON dl.driver_id = d.id
  WHERE d.verification_status = 'approved'
    AND d.availability_status = 'online'
    AND p_vehicle_type = ANY(d.allowed_vehicle_types)
    AND dl.updated_at >= (now() - INTERVAL '10 minutes')
    AND ST_DWithin(
      dl.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_m
    )
  ORDER BY distance_m ASC
  LIMIT LEAST(GREATEST(max_results, 1), 100);
$$;

REVOKE ALL ON FUNCTION public.nearest_available_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, public.vehicle_type, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearest_available_drivers(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, public.vehicle_type, INTEGER) TO service_role;
