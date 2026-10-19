-- 009_communication_and_audit_tables.sql
-- Communication and audit domain tables: ratings, complaints, notifications, audit_logs

-- 23. ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_ratings_trip_from_user UNIQUE (trip_id, from_user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_trip_id ON public.ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_ratings_from_user_id ON public.ratings(from_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user_id ON public.ratings(to_user_id);

DROP TRIGGER IF EXISTS trigger_ratings_updated_at ON public.ratings;
CREATE TRIGGER trigger_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 24. complaints
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  complaint_type TEXT NOT NULL,
  description TEXT NOT NULL,
  complaint_status public.complaint_status NOT NULL DEFAULT 'filed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaints_trip_id ON public.complaints(trip_id);
CREATE INDEX IF NOT EXISTS idx_complaints_reported_by ON public.complaints(reported_by);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(complaint_status);

DROP TRIGGER IF EXISTS trigger_complaints_updated_at ON public.complaints;
CREATE TRIGGER trigger_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 25. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 26. audit_logs (append-only: no update, no delete)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
