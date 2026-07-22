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
drop policy if exists "Users can manage their own company profile" on public.company_profiles;
create policy "Users can manage their own company profile"
  on public.company_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies: users can only see their own
drop policy if exists "Users can manage their own policies" on public.policies;
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

drop trigger if exists update_company_profiles_updated_at on public.company_profiles;
create trigger update_company_profiles_updated_at
  before update on public.company_profiles
  for each row execute function update_updated_at();

drop trigger if exists update_policies_updated_at on public.policies;
create trigger update_policies_updated_at
  before update on public.policies
  for each row execute function update_updated_at();

-- ============================================================
-- Versioning (safe to re-run: idempotent additions)
-- ============================================================

alter table public.policies add column if not exists version_number integer not null default 1;
alter table public.policies add column if not exists answers jsonb;
alter table public.policies add column if not exists generation_reason text;

-- Append-only ledger of every generated/regenerated/restored version of a policy
create table if not exists public.policy_versions (
  id uuid default gen_random_uuid() primary key,
  policy_id uuid references public.policies(id) on delete cascade not null,
  version_number integer not null,
  title text not null,
  content text not null,
  security_score jsonb,
  answers jsonb,
  generation_reason text,
  change_type text not null default 'generated', -- 'generated' | 'regenerated' | 'restored'
  change_summary text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (policy_id, version_number)
);

alter table public.policy_versions enable row level security;

drop policy if exists "Users can view versions of their own policies" on public.policy_versions;
create policy "Users can view versions of their own policies"
  on public.policy_versions for select
  using (exists (select 1 from public.policies p where p.id = policy_id and p.user_id = auth.uid()));

drop policy if exists "Users can insert versions of their own policies" on public.policy_versions;
create policy "Users can insert versions of their own policies"
  on public.policy_versions for insert
  with check (exists (select 1 from public.policies p where p.id = policy_id and p.user_id = auth.uid()));

-- Backfill: give every pre-existing policy an initial v1 ledger entry
insert into public.policy_versions (policy_id, version_number, title, content, security_score, change_type, created_at)
select id, 1, title, content, security_score, 'generated', created_at
from public.policies p
where not exists (select 1 from public.policy_versions v where v.policy_id = p.id);

-- ============================================================
-- Audit evidence artifacts (backup register, asset inventory, training register)
-- One row per user per type; rows of the register live in `items` as jsonb.
-- ============================================================

create table if not exists public.audit_artifacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('backup_register', 'asset_inventory', 'training_register')),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, type)
);

-- Widen the allowed register types (idempotent — re-runnable if the
-- constraint was already created with the older, shorter list)
alter table public.audit_artifacts drop constraint if exists audit_artifacts_type_check;
alter table public.audit_artifacts add constraint audit_artifacts_type_check
  check (type in (
    'backup_register', 'asset_inventory', 'training_register',
    'incident_register', 'access_register', 'rights_request_register', 'third_party_register'
  ));

alter table public.audit_artifacts enable row level security;

drop policy if exists "Users can manage their own audit artifacts" on public.audit_artifacts;
create policy "Users can manage their own audit artifacts"
  on public.audit_artifacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists update_audit_artifacts_updated_at on public.audit_artifacts;
create trigger update_audit_artifacts_updated_at
  before update on public.audit_artifacts
  for each row execute function update_updated_at();

-- ============================================================
-- Third-party export integrations (Notion, Confluence)
-- Credentials are user-supplied integration/API tokens (not OAuth) stored
-- per-user, scoped by RLS. `config` shape depends on provider:
--   notion:     { token, parentPageId }
--   confluence: { baseUrl, email, apiToken, spaceKey }
-- ============================================================

create table if not exists public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null check (provider in ('notion', 'confluence')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, provider)
);

alter table public.integrations enable row level security;

drop policy if exists "Users can manage their own integrations" on public.integrations;
create policy "Users can manage their own integrations"
  on public.integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists update_integrations_updated_at on public.integrations;
create trigger update_integrations_updated_at
  before update on public.integrations
  for each row execute function update_updated_at();

-- ============================================================
-- Framework version tracking (drives "policy needs review" alerts)
-- `frameworks.current_version` is curated by the SecurePilot team (there is
-- no reliable machine-readable feed for standards revisions). Every policy
-- snapshots the framework versions it was generated against in
-- `policies.framework_versions`; a mismatch against the live `frameworks`
-- row means that policy should be reviewed/regenerated.
-- ============================================================

create table if not exists public.frameworks (
  id text primary key,
  name text not null,
  current_version text not null,
  changelog text,
  updated_at timestamptz default now()
);

alter table public.policies add column if not exists framework_versions jsonb;
alter table public.policy_versions add column if not exists framework_versions jsonb;

alter table public.frameworks enable row level security;

drop policy if exists "Anyone can read frameworks" on public.frameworks;
create policy "Anyone can read frameworks"
  on public.frameworks for select
  using (true);

insert into public.frameworks (id, name, current_version, changelog)
values
  ('ISO27001', 'ISO 27001', '2022', 'Baseline version tracked by SecurePilot.'),
  ('NIST', 'NIST CSF', '2.0', 'Baseline version tracked by SecurePilot.'),
  ('CIS', 'CIS Controls', 'v8', 'Baseline version tracked by SecurePilot.'),
  ('SOC2', 'SOC 2', '2017 Trust Services Criteria (2022 points of focus)', 'Baseline version tracked by SecurePilot.'),
  ('Loi25', 'Law 25', '2023 (fully in force)', 'Baseline version tracked by SecurePilot.'),
  ('RGPD', 'GDPR', '2018', 'Baseline version tracked by SecurePilot.')
on conflict (id) do nothing;

-- ============================================================
-- Client portal (public, read-only share links)
-- A policy can be shared via an unguessable token; RLS only exposes rows
-- that are explicitly opted in, and the app additionally filters by the
-- exact token, so an anonymous visitor can never browse/enumerate policies.
-- ============================================================

alter table public.policies add column if not exists share_enabled boolean not null default false;
alter table public.policies add column if not exists share_token uuid;

drop policy if exists "Anyone can view shared policies" on public.policies;
create policy "Anyone can view shared policies"
  on public.policies for select
  using (share_enabled = true);

-- ============================================================
-- MSP branding (white-label exports for the Agency plan)
-- ============================================================

alter table public.company_profiles add column if not exists brand_name text;
alter table public.company_profiles add column if not exists brand_color text;
alter table public.company_profiles add column if not exists brand_logo_url text;

-- ============================================================
-- Compliance notifications
-- Generated reactively (on dashboard load, not by a cron job — there is no
-- scheduler in this app) from framework-outdated and high-risk-gap
-- conditions. `dedupe_key` prevents re-notifying for the same condition and
-- preserves the read/unread state across visits.
-- ============================================================

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  link text,
  dedupe_key text not null,
  read boolean not null default false,
  created_at timestamptz default now(),
  unique (user_id, dedupe_key)
);

alter table public.notifications enable row level security;

drop policy if exists "Users can manage their own notifications" on public.notifications;
create policy "Users can manage their own notifications"
  on public.notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Attack surface diagnostic (passive domain scan)
-- Read-only, third-party-API-backed scan of a company's domain. Feeds
-- directly into policy generation: a scan's findings can prefill the
-- generate questionnaire and are injected into the Claude prompt.
-- ============================================================

create table if not exists public.attack_surface_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  domain text not null,
  risk_score integer not null,
  ssl jsonb not null default '{}'::jsonb,
  emails_compromis jsonb not null default '{}'::jsonb,
  subdomains jsonb not null default '{}'::jsonb,
  dns jsonb not null default '{}'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  recommended_policies jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table public.attack_surface_reports enable row level security;

drop policy if exists "Users can manage their own attack surface reports" on public.attack_surface_reports;
create policy "Users can manage their own attack surface reports"
  on public.attack_surface_reports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists attack_surface_reports_user_created_idx
  on public.attack_surface_reports (user_id, created_at desc);
