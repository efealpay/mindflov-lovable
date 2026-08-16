-- Roles
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admins read all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  subscription_tier text not null default 'free',
  tokens_used bigint not null default 0,
  last_token_reset bigint,
  subscription_start bigint,
  license_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "users insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "admins read all profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins update all profiles" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Mindmaps
create table public.mindmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  map_key text not null,
  title text not null default 'Draft Concept',
  nodes jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  global_role text not null default 'default',
  global_primer text not null default '',
  has_shown_primer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, map_key)
);
grant select, insert, update, delete on public.mindmaps to authenticated;
grant all on public.mindmaps to service_role;
alter table public.mindmaps enable row level security;
create policy "users manage own mindmaps" on public.mindmaps for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index mindmaps_user_updated_idx on public.mindmaps (user_id, updated_at desc);

-- Weekly usage
create table public.usage_weekly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, week_key)
);
grant select, insert, update on public.usage_weekly to authenticated;
grant all on public.usage_weekly to service_role;
alter table public.usage_weekly enable row level security;
create policy "users manage own usage" on public.usage_weekly for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admins read all usage" on public.usage_weekly for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- App config
create table public.app_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.app_config to anon, authenticated;
grant all on public.app_config to service_role;
alter table public.app_config enable row level security;
create policy "anyone reads config" on public.app_config for select using (true);
create policy "admins write config" on public.app_config for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.app_config (key, value) values ('global', '{"WEEKLY_LIMIT":10,"PLUS_TOKEN_LIMIT":100000,"PRO_TOKEN_LIMIT":250000}'::jsonb);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null default 'free',
  status text not null default 'inactive',
  interval text,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "users read own subscription" on public.subscriptions for select to authenticated using (user_id = auth.uid());
create policy "admins read all subscriptions" on public.subscriptions for select to authenticated using (public.has_role(auth.uid(),'admin'));

create trigger subscriptions_updated_at before update on public.subscriptions
for each row execute function public.update_updated_at_column();