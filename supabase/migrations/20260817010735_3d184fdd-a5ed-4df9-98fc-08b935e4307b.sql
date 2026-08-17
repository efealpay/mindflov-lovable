-- 1. ai_events
CREATE TABLE public.ai_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL DEFAULT 'expand',
  context_role text,
  mode_key text,
  mode_label text,
  model text,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  latency_ms integer,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  map_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_events TO authenticated;
GRANT ALL ON public.ai_events TO service_role;

ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read ai events" ON public.ai_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users read own ai events" ON public.ai_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX ai_events_created_at_idx ON public.ai_events (created_at DESC);
CREATE INDEX ai_events_user_created_idx ON public.ai_events (user_id, created_at DESC);
CREATE INDEX ai_events_context_idx ON public.ai_events (context_role);
CREATE INDEX ai_events_mode_idx ON public.ai_events (mode_key);
CREATE INDEX ai_events_action_idx ON public.ai_events (action_type);

-- 2. onboarding state on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_skipped boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS milestone_first_map boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_first_expansion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_first_synthesis boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_first_export boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone;

-- 3. grant admin role to owner account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'efe.alpay@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. admin management policies
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage usage" ON public.usage_weekly
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete mindmaps" ON public.mindmaps
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

GRANT DELETE ON public.profiles TO authenticated;
GRANT DELETE, INSERT, UPDATE ON public.user_roles TO authenticated;