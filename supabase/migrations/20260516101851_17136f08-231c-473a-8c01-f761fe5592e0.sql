
DROP POLICY "lead_events insert anyone" ON public.lead_events;

CREATE POLICY "lead_events insert tracked"
ON public.lead_events FOR INSERT TO public
WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());
