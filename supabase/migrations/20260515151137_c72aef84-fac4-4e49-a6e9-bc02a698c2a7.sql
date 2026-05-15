CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services public read active" ON public.services FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "services admin insert" ON public.services FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "services admin update" ON public.services FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "services admin delete" ON public.services FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER services_set_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.services (name, slug, icon, sort_order) VALUES
  ('Plumber','plumber','wrench',10),
  ('Electrician','electrician','zap',20),
  ('Carpenter','carpenter','hammer',30),
  ('Mason','mason','brick-wall',40),
  ('Painter','painter','paintbrush',50),
  ('Mechanic','mechanic','car',60),
  ('Cleaner','cleaner','sparkles',70),
  ('AC Technician','ac-technician','snowflake',80),
  ('Welder','welder','flame',90),
  ('Tiler','tiler','grid-3x3',100),
  ('Hairdresser','hairdresser','scissors',110),
  ('Tailor','tailor','shirt',120);