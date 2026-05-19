
ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS profession_group text,
  ADD COLUMN IF NOT EXISTS custom_profession text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS portfolio_images text[] NOT NULL DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolios', 'portfolios', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Portfolio images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolios');

CREATE POLICY "Artisans can upload own portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Artisans can update own portfolio images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Artisans can delete own portfolio images"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolios' AND auth.uid()::text = (storage.foldername(name))[1]);
