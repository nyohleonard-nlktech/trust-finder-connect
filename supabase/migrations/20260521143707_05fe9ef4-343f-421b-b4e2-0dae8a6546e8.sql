
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_receiver ON public.support_messages(receiver_id, created_at DESC);
CREATE INDEX idx_support_messages_sender ON public.support_messages(sender_id, created_at DESC);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_messages select participant or admin"
ON public.support_messages FOR SELECT
USING (
  auth.uid() = sender_id
  OR auth.uid() = receiver_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "support_messages insert by sender"
ON public.support_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(receiver_id, 'admin')
  )
);

CREATE POLICY "support_messages update recipient mark read"
ON public.support_messages FOR UPDATE
USING (auth.uid() = receiver_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = receiver_id OR public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
