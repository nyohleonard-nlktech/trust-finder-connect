
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'worker', 'customer');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT NOT NULL,
  neighborhood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_phone_idx ON public.profiles(phone);

-- user_roles (separate table to avoid RLS recursion / privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- worker_profiles
CREATE TABLE public.worker_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  service_category TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  bio TEXT,
  id_card_path TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX worker_profiles_verified_idx ON public.worker_profiles(is_verified);
CREATE INDEX worker_profiles_category_idx ON public.worker_profiles(service_category);
CREATE INDEX worker_profiles_neighborhood_idx ON public.worker_profiles(neighborhood);

-- messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_worker UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT,
  sender_phone TEXT,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_to_worker_idx ON public.messages(to_worker, created_at DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles select self or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles select for verified workers (public)" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.user_id = profiles.id AND wp.is_verified = true)
  );
CREATE POLICY "profiles insert self" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles update self" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- user_roles policies
CREATE POLICY "user_roles select self or admin" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "user_roles insert self customer/worker only" ON public.user_roles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND role IN ('customer','worker')
  );
CREATE POLICY "user_roles admin manage" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- worker_profiles policies
CREATE POLICY "worker_profiles public select verified" ON public.worker_profiles
  FOR SELECT USING (is_verified = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "worker_profiles insert self" ON public.worker_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "worker_profiles update self (no verify fields)" ON public.worker_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "worker_profiles admin all" ON public.worker_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Prevent non-admins from setting is_verified=true via trigger
CREATE OR REPLACE FUNCTION public.guard_worker_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
       AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can change verification status';
    END IF;
    IF NEW.verified_at IS DISTINCT FROM OLD.verified_at
       AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can change verified_at';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.is_verified = true AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Cannot self-verify';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER worker_profiles_guard
BEFORE INSERT OR UPDATE ON public.worker_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_worker_verification();

-- messages policies
CREATE POLICY "messages select sender or recipient" ON public.messages
  FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_worker OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "messages insert any auth user" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = from_user);
CREATE POLICY "messages update recipient (mark read)" ON public.messages
  FOR UPDATE USING (auth.uid() = to_worker);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for ID verification (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

-- Storage policies: workers upload to own folder; admin + owner read
CREATE POLICY "verification-docs owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "verification-docs owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'verification-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "verification-docs owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Realtime for messages and worker_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_profiles;
