CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.job_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id, created_at);

GRANT SELECT, INSERT ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller a participant of the job (worker or customer/actor)?
CREATE OR REPLACE FUNCTION public.is_job_participant(_job_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.job_requests j
    WHERE j.id = _job_id
      AND (j.worker_id = _user_id OR j.actor_id = _user_id)
  );
$$;

CREATE POLICY "direct_messages select participants"
ON public.direct_messages
FOR SELECT
USING (
  (auth.uid() = sender_id OR auth.uid() = receiver_id)
  AND public.is_job_participant(conversation_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "direct_messages insert participants"
ON public.direct_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_job_participant(conversation_id, auth.uid())
  AND public.is_job_participant(conversation_id, receiver_id)
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
