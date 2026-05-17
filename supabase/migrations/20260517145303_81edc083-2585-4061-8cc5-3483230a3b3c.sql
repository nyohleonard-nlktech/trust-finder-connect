
-- Job requests (leads) table
CREATE TABLE public.job_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  job_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  actor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_requests insert any"
ON public.job_requests
FOR INSERT
WITH CHECK ((actor_id IS NULL) OR (actor_id = auth.uid()));

CREATE POLICY "job_requests admin select"
ON public.job_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "job_requests worker select own"
ON public.job_requests
FOR SELECT
USING (auth.uid() = worker_id);

CREATE INDEX idx_job_requests_created_at ON public.job_requests (created_at DESC);
CREATE INDEX idx_job_requests_worker ON public.job_requests (worker_id);

-- Admin feedback table
CREATE TABLE public.admin_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_feedback insert any"
ON public.admin_feedback
FOR INSERT
WITH CHECK ((actor_id IS NULL) OR (actor_id = auth.uid()));

CREATE POLICY "admin_feedback admin select"
ON public.admin_feedback
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
