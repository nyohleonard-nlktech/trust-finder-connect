-- Workers can update status of their own job requests
CREATE POLICY "job_requests worker update own status"
ON public.job_requests
FOR UPDATE
USING (auth.uid() = worker_id)
WITH CHECK (auth.uid() = worker_id);

-- Enable realtime
ALTER TABLE public.job_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_requests;