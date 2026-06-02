-- New broadcasts table
CREATE TABLE public.admin_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_content text NOT NULL,
  target_audience text NOT NULL CHECK (target_audience IN ('all','workers','customers')),
  sender_id uuid NOT NULL,
  recipients_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_broadcasts TO authenticated;
GRANT ALL ON public.admin_broadcasts TO service_role;

ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_broadcasts admin select"
  ON public.admin_broadcasts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_broadcasts admin insert"
  ON public.admin_broadcasts FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = sender_id);

-- Flag broadcast / official admin messages on support_messages
ALTER TABLE public.support_messages
  ADD COLUMN is_admin_message boolean NOT NULL DEFAULT false,
  ADD COLUMN broadcast_id uuid REFERENCES public.admin_broadcasts(id) ON DELETE SET NULL;

CREATE INDEX idx_support_messages_broadcast ON public.support_messages(broadcast_id);
