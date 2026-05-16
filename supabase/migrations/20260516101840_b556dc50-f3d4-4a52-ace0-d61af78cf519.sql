
-- Lead/analytics events
CREATE TABLE public.lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('call','whatsapp')),
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_events_worker ON public.lead_events(worker_id);
CREATE INDEX idx_lead_events_created ON public.lead_events(created_at DESC);

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_events insert anyone"
ON public.lead_events FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "lead_events admin select"
ON public.lead_events FOR SELECT TO public
USING (public.has_role(auth.uid(), 'admin'));

-- Worker CNI number
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS cni_number text;
