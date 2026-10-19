-- 008_money_tables.sql
-- Money domain tables: fares, payments, driver_earnings

-- 20. fares
CREATE TABLE IF NOT EXISTS public.fares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL UNIQUE REFERENCES public.trips(id) ON DELETE CASCADE,
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 0,
  distance_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  time_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  waiting_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fares_trip_id ON public.fares(trip_id);

DROP TRIGGER IF EXISTS trigger_fares_updated_at ON public.fares;
CREATE TRIGGER trigger_fares_updated_at
  BEFORE UPDATE ON public.fares
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 21. payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  gateway_transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON public.payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 22. driver_earnings
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL UNIQUE REFERENCES public.trips(id) ON DELETE RESTRICT,
  gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  settlement_status public.settlement_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id ON public.driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_trip_id ON public.driver_earnings(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_status ON public.driver_earnings(settlement_status);

DROP TRIGGER IF EXISTS trigger_driver_earnings_updated_at ON public.driver_earnings;
CREATE TRIGGER trigger_driver_earnings_updated_at
  BEFORE UPDATE ON public.driver_earnings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
