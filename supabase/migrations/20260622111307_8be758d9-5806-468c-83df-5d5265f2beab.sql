
-- 1) Tighten SECURITY DEFINER helper EXECUTE grants (remove anon/public)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_job_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_job_participant(uuid, uuid) TO authenticated;

-- 2) messages: restrict recipient UPDATE to read_at only via column-level grants + WITH CHECK
DROP POLICY IF EXISTS "messages update recipient (mark read)" ON public.messages;
REVOKE UPDATE ON public.messages FROM anon, authenticated;
GRANT UPDATE (read_at) ON public.messages TO authenticated;
CREATE POLICY "messages update recipient (mark read)" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_worker)
  WITH CHECK (auth.uid() = to_worker);

-- 3) profiles: do not expose phone to anonymous users
REVOKE SELECT (phone) ON public.profiles FROM anon;

-- 4) worker_profiles: hide CNI and id_card_path from anon; block self-verification via column grants
REVOKE SELECT (cni_number, id_card_path) ON public.worker_profiles FROM anon;
REVOKE UPDATE (is_verified, verified_at, verified_by) ON public.worker_profiles FROM anon, authenticated;
-- (admins go through SECURITY DEFINER / service role for verification flips; trigger still enforces.)

-- 5) Storage: add DELETE policy for verification-docs bucket (owner + admin)
CREATE POLICY "verification-docs owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

-- 6) Realtime: restrict channel subscriptions to authenticated postgres_changes only.
--    Source-table RLS still filters which rows each user can see.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='realtime' AND tablename='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_postgres_changes_only" ON realtime.messages';
    EXECUTE $p$CREATE POLICY "authenticated_postgres_changes_only" ON realtime.messages
      FOR SELECT TO authenticated
      USING (extension = 'postgres_changes')$p$;
  END IF;
END $$;
