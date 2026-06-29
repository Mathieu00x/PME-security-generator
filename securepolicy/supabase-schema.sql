-- Run this in your Supabase SQL Editor

-- Company Profiles
create table if not exists public.company_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  company_name text,
  industry text,
  employee_count text,
  country text default 'Canada',
  province text,
  phone text,
  email text,
  website text,
  remote_work boolean default false,
  cloud_services text default 'none',
  uses_microsoft_365 boolean default false,
  uses_google_workspace boolean default false,
  mfa_enabled boolean default false,
  has_backups boolean default false,
  has_it_department boolean default false,
  uses_personal_devices boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Policies
create table if not exists public.policies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  type text not null,
  content text not null,
  status text default 'completed',
  version text default '1.0',
  security_score jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table public.company_profiles enable row level security;
alter table public.policies enable row level security;

-- Company profiles: users can only see their own
create policy "Users can manage their own company profile"
  on public.company_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies: users can only see their own
create policy "Users can manage their own policies"
  on public.policies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_company_profiles_updated_at
  before update on public.company_profiles
  for each row execute function update_updated_at();

create trigger update_policies_updated_at
  before update on public.policies
  for each row execute function update_updated_at();
