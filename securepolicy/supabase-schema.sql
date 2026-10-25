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
--
-- RLS audit finding (documented here per the P1 isolation review): the
-- original policy below — `using (share_enabled = true)` — gated only on
-- the boolean flag, not on share_token. RLS has no way to compare a row
-- against "the value the client filtered by"; it only evaluates whether
-- each row satisfies the USING predicate. So although the Next.js page
-- additionally filters `.eq("share_token", token)`, that filter is just
-- applied in application code — anyone holding the public anon key (which
-- is, by design, embedded in every page's client bundle) could call
-- Supabase's REST endpoint directly with `?share_enabled=eq.true&select=*`
-- and skip the token filter entirely, returning every customer's shared
-- policy (full content + security_score), not just the one a given link
-- points to. This was a real cross-tenant data exposure, broader than a
-- same-user-different-row leak: it required no authentication and no
-- guessing, just the public anon key.
--
-- Fix: drop table-level anon SELECT entirely and expose the client portal
-- only through get_shared_policy(token), a SECURITY DEFINER function that
-- enforces the exact token match itself before returning a row, so there
-- is no query shape that can return more than the single matching policy.
-- ============================================================

alter table public.policies add column if not exists share_enabled boolean not null default false;
alter table public.policies add column if not exists share_token uuid;

drop policy if exists "Anyone can view shared policies" on public.policies;

drop function if exists public.get_shared_policy(uuid);
create function public.get_shared_policy(p_token uuid)
returns table (
  id uuid,
  user_id uuid,
  title text,
  content text,
  version text,
  updated_at timestamptz,
  security_score jsonb
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.user_id, p.title, p.content, p.version, p.updated_at, p.security_score
  from public.policies p
  where p.share_token = p_token
    and p.share_enabled = true
  limit 1;
$$;

revoke all on function public.get_shared_policy(uuid) from public;
grant execute on function public.get_shared_policy(uuid) to anon, authenticated;

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
  security_headers jsonb not null default '{}'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  recommended_policies jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- security_headers column added after initial launch (HSTS/CSP/X-Frame-Options/etc check)
alter table public.attack_surface_reports add column if not exists security_headers jsonb not null default '{}'::jsonb;

-- score_breakdown: per-category (SSL/DNS+Email/HIBP/Headers) subscores out of 25 each,
-- summing to risk_score. executive_summary: 2-sentence AI-generated, non-technical
-- summary of the scan shown at the top of the report.
alter table public.attack_surface_reports add column if not exists score_breakdown jsonb not null default '{}'::jsonb;
alter table public.attack_surface_reports add column if not exists executive_summary text;

-- fingerprint: passive technology observations (CMS, web server, language
-- runtime, JS framework) from the homepage response — never affects
-- risk_score, purely informational asset-discovery data.
alter table public.attack_surface_reports add column if not exists fingerprint jsonb not null default '{}'::jsonb;

alter table public.attack_surface_reports enable row level security;

drop policy if exists "Users can manage their own attack surface reports" on public.attack_surface_reports;
create policy "Users can manage their own attack surface reports"
  on public.attack_surface_reports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists attack_surface_reports_user_created_idx
  on public.attack_surface_reports (user_id, created_at desc);

-- ============================================================
-- Multi-client accounts
-- A consultant/agency account (auth.users row) can now manage several
-- clients. `company_profiles` becomes 1:1 with a `client` instead of 1:1
-- with a user. MSP branding is account-level (applies to every client's
-- exports uniformly) and moves out of company_profiles into
-- account_settings.
-- ============================================================

create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.clients enable row level security;

drop policy if exists "Users can manage their own clients" on public.clients;
create policy "Users can manage their own clients"
  on public.clients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists update_clients_updated_at on public.clients;
create trigger update_clients_updated_at
  before update on public.clients
  for each row execute function update_updated_at();

create table if not exists public.account_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  brand_name text,
  brand_color text,
  brand_logo_url text,
  updated_at timestamptz default now()
);

alter table public.account_settings enable row level security;

drop trigger if exists update_account_settings_updated_at on public.account_settings;
create trigger update_account_settings_updated_at
  before update on public.account_settings
  for each row execute function update_updated_at();

-- Migrate any existing per-user branding into account_settings before it's
-- dropped from company_profiles below.
insert into public.account_settings (user_id, brand_name, brand_color, brand_logo_url)
select user_id, brand_name, brand_color, brand_logo_url
from public.company_profiles
where user_id is not null
  and (brand_name is not null or brand_color is not null or brand_logo_url is not null)
on conflict (user_id) do nothing;

-- Link company_profiles to a client (1 profile per client instead of 1 per user)
alter table public.company_profiles add column if not exists client_id uuid references public.clients(id) on delete cascade;

with new_clients as (
  insert into public.clients (user_id, name)
  select cp.user_id, coalesce(nullif(cp.company_name, ''), 'Default Client')
  from public.company_profiles cp
  where cp.client_id is null
  returning id, user_id
)
update public.company_profiles cp
set client_id = nc.id
from new_clients nc
where cp.user_id = nc.user_id and cp.client_id is null;

alter table public.company_profiles drop constraint if exists company_profiles_user_id_key;
alter table public.company_profiles drop constraint if exists company_profiles_client_id_key;
alter table public.company_profiles add constraint company_profiles_client_id_key unique (client_id);

alter table public.company_profiles drop column if exists brand_name;
alter table public.company_profiles drop column if exists brand_color;
alter table public.company_profiles drop column if exists brand_logo_url;

-- Backfill helper: ensure every user who already has policies/scans/registers
-- but no client yet gets a "Default Client" so nothing becomes orphaned.
insert into public.clients (user_id, name)
select distinct p.user_id, 'Default Client'
from public.policies p
where not exists (select 1 from public.clients c where c.user_id = p.user_id);

insert into public.clients (user_id, name)
select distinct r.user_id, 'Default Client'
from public.attack_surface_reports r
where not exists (select 1 from public.clients c where c.user_id = r.user_id);

insert into public.clients (user_id, name)
select distinct a.user_id, 'Default Client'
from public.audit_artifacts a
where not exists (select 1 from public.clients c where c.user_id = a.user_id);

-- policies.client_id
alter table public.policies add column if not exists client_id uuid references public.clients(id) on delete cascade;
update public.policies p
set client_id = (select id from public.clients c where c.user_id = p.user_id order by c.created_at asc limit 1)
where p.client_id is null;

-- attack_surface_reports.client_id
alter table public.attack_surface_reports add column if not exists client_id uuid references public.clients(id) on delete cascade;
update public.attack_surface_reports r
set client_id = (select id from public.clients c where c.user_id = r.user_id order by c.created_at asc limit 1)
where r.client_id is null;

-- audit_artifacts.client_id (register uniqueness moves from per-user to per-client)
alter table public.audit_artifacts add column if not exists client_id uuid references public.clients(id) on delete cascade;
update public.audit_artifacts a
set client_id = (select id from public.clients c where c.user_id = a.user_id order by c.created_at asc limit 1)
where a.client_id is null;

alter table public.audit_artifacts drop constraint if exists audit_artifacts_user_id_type_key;
alter table public.audit_artifacts drop constraint if exists audit_artifacts_client_id_type_key;
alter table public.audit_artifacts add constraint audit_artifacts_client_id_type_key unique (client_id, type);

-- ============================================================
-- Plans & subscriptions
-- Selecting a plan is mandatory right after signup (enforced in the app,
-- not here) — `subscriptions` has no default row, so a user with none is
-- treated as "not onboarded yet". Paid plans go through Stripe Checkout
-- (src/app/api/subscriptions/checkout) and are only ever activated by the
-- Stripe webhook (src/app/api/webhooks/stripe) on payment confirmation; the
-- free beta plan is the only one /api/subscriptions can activate directly.
-- ============================================================

create table if not exists public.plans (
  id text primary key,
  name text not null,
  monthly_price_cents integer not null,
  annual_price_cents integer not null,
  client_limit integer,
  features jsonb not null default '[]'::jsonb,
  is_public boolean not null default true,
  beta_cutoff_at timestamptz,
  sort_order integer not null default 0
);

alter table public.plans enable row level security;

drop policy if exists "Anyone can read plans" on public.plans;
create policy "Anyone can read plans"
  on public.plans for select
  using (true);

insert into public.plans (id, name, monthly_price_cents, annual_price_cents, client_limit, features, is_public, beta_cutoff_at, sort_order)
values
  ('starter', 'Starter', 5900, 59000, 1, '[]'::jsonb, true, null, 1),
  ('pro', 'Pro', 14900, 149000, 5, '["branding","versioning","confluence_notion"]'::jsonb, true, null, 2),
  ('agency', 'Agency', 29900, 299000, null, '["branding","versioning","confluence_notion","white_label","multi_user","priority_support"]'::jsonb, true, null, 3),
  ('beta', 'Beta', 0, 0, null, '["branding","versioning","confluence_notion","white_label","multi_user","priority_support"]'::jsonb, true, now() + interval '90 days', 0)
on conflict (id) do update set
  name = excluded.name,
  monthly_price_cents = excluded.monthly_price_cents,
  annual_price_cents = excluded.annual_price_cents,
  client_limit = excluded.client_limit,
  features = excluded.features,
  sort_order = excluded.sort_order;

create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  plan_id text references public.plans(id) not null,
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly', 'annual')),
  status text not null default 'active' check (status in ('active', 'canceled', 'expired')),
  beta_expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_subscription_id text;
create unique index if not exists subscriptions_stripe_subscription_id_key on public.subscriptions (stripe_subscription_id) where stripe_subscription_id is not null;

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscription" on public.subscriptions;
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Users can create their first subscription (plan selection) and switch
-- plans/interval, but cannot forge someone else's row.
drop policy if exists "Users can create their own subscription" on public.subscriptions;
create policy "Users can create their own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own subscription" on public.subscriptions;
create policy "Users can update their own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists update_subscriptions_updated_at on public.subscriptions;
create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function update_updated_at();

-- Entitlement-gated writes: RLS enforces the Pro+ "branding" feature and
-- the Pro+ "confluence_notion" feature directly at the database level, so
-- gating can't be bypassed by calling Supabase from the client.
drop policy if exists "Users can manage their own account settings" on public.account_settings;
create policy "Users can manage their own account settings"
  on public.account_settings for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions s
      join public.plans p on p.id = s.plan_id
      where s.user_id = auth.uid() and s.status = 'active' and p.features ? 'branding'
    )
  );

drop policy if exists "Users can manage their own integrations" on public.integrations;
create policy "Users can manage their own integrations"
  on public.integrations for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subscriptions s
      join public.plans p on p.id = s.plan_id
      where s.user_id = auth.uid() and s.status = 'active' and p.features ? 'confluence_notion'
    )
  );

-- Defense-in-depth: the auth.uid() = user_id check above already prevents any
-- cross-tenant read/write regardless of client_id, but these with-check
-- clauses were missing a client_id ownership check, which allowed a user to
-- write their own row referencing a client_id they don't own (data-integrity
-- issue, not a data-isolation bypass). Tightened here so client_id must also
-- belong to the same user.
drop policy if exists "Users can manage their own company profile" on public.company_profiles;
create policy "Users can manage their own company profile"
  on public.company_profiles for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()))
  );

drop policy if exists "Users can manage their own policies" on public.policies;
create policy "Users can manage their own policies"
  on public.policies for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()))
  );

drop policy if exists "Users can manage their own audit artifacts" on public.audit_artifacts;
create policy "Users can manage their own audit artifacts"
  on public.audit_artifacts for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()))
  );

drop policy if exists "Users can manage their own attack surface reports" on public.attack_surface_reports;
create policy "Users can manage their own attack surface reports"
  on public.attack_surface_reports for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()))
  );

-- Dedupe tracking for automated re-engagement emails (sent by the
-- /api/cron/reengagement route via the service-role client only — no
-- client-facing RLS policy needed).
create table if not exists public.email_campaigns_sent (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  campaign text not null,
  sent_at timestamptz default now(),
  unique (user_id, campaign)
);
alter table public.email_campaigns_sent enable row level security;

-- ============================================================
-- Phase 1 — Knowledge Base + finding-to-action pipeline
-- (Sprint 1). RLS cross-tenant isolation and all policies below
-- verified against two real authenticated users going through actual
-- RLS-enforced requests (not the service-role client) — confirmed
-- User B cannot select/update/delete User A's rows by id or via an
-- unfiltered list, on remediation_tasks and compliance_assessments.
-- ============================================================

create table if not exists public.kb_controls (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  finding_key text not null,
  category text not null check (category in ('email_security','tls','headers','exposure','subdomain','governance')),
  severity text not null check (severity in ('critical','high','medium','low')),
  phase int not null default 1 check (phase in (1,2,3)),
  title_fr text not null, title_en text not null,
  why_it_matters_fr text, why_it_matters_en text,
  business_impact_fr text, business_impact_en text,
  remediation_steps_fr jsonb not null default '[]'::jsonb,
  remediation_steps_en jsonb not null default '[]'::jsonb,
  evidence_required_fr text[] not null default '{}',
  evidence_required_en text[] not null default '{}',
  nist_csf text[] not null default '{}',
  cis_controls text[] not null default '{}',
  iso_27001 text[] not null default '{}',
  loi_25 text[] not null default '{}',
  pipeda text[] not null default '{}',
  soc2 text[] not null default '{}',
  created_at timestamptz default now()
);

create index if not exists kb_controls_finding_key_idx on public.kb_controls (finding_key);

alter table public.kb_controls enable row level security;

-- Shared reference data, not user-owned — read-only for every
-- authenticated user, written only via the fail-closed admin seed route.
drop policy if exists "Anyone can read kb controls" on public.kb_controls;
create policy "Anyone can read kb controls"
  on public.kb_controls for select
  using (true);

create table if not exists public.remediation_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  scan_id uuid references public.attack_surface_reports(id) on delete set null,
  control_code text references public.kb_controls(code),
  -- "scan" rows (control_code set) come from generateRemediationTasks();
  -- "assessment" rows (source_question_id set, control_code null) come from
  -- a Loi 25 / PIPEDA compliance gap — one unified table so the tasks list
  -- and roadmap show both kinds of action items together.
  source text not null default 'scan' check (source in ('scan','assessment')),
  source_question_id text,
  finding_key text,
  category text not null,
  severity text not null check (severity in ('critical','high','medium','low')),
  phase int not null default 1 check (phase in (1,2,3)),
  status text not null default 'open' check (status in ('open','in_progress','completed','verified')),
  title_fr text not null default '',
  title_en text not null default '',
  why_it_matters_fr text,
  why_it_matters_en text,
  business_impact_fr text,
  business_impact_en text,
  remediation_steps_fr jsonb not null default '[]'::jsonb,
  remediation_steps_en jsonb not null default '[]'::jsonb,
  evidence_required_fr text[] not null default '{}',
  evidence_required_en text[] not null default '{}',
  framework_mappings jsonb not null default '{}'::jsonb,
  owner_name text,
  owner_email text,
  due_date date,
  evidence_notes text,
  evidence_url text,
  ai_context text,
  completed_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Dedup for scan-sourced tasks: one row per (client, control), regardless
-- of status, so a re-scan never resurrects a completed task nor duplicates
-- an open one. A plain unique constraint, not a partial index — PostgREST's
-- upsert generates a bare `ON CONFLICT (columns)` with no way to repeat a
-- partial index's WHERE predicate, so a partial index here fails with
-- "no unique or exclusion constraint matching" (42P10). The standard SQL
-- NULL-distinctness of a plain unique constraint (two NULLs never conflict)
-- naturally excludes assessment-sourced rows (control_code = null) from
-- this constraint, so it only ever dedupes scan-sourced rows.
alter table public.remediation_tasks drop constraint if exists remediation_tasks_client_control_key;
alter table public.remediation_tasks add constraint remediation_tasks_client_control_key
  unique (client_id, control_code);

-- Symmetric dedup for assessment-sourced tasks (one row per client +
-- question), using the same NULL-distinctness to stay independent of the
-- constraint above.
alter table public.remediation_tasks drop constraint if exists remediation_tasks_client_source_question_key;
alter table public.remediation_tasks add constraint remediation_tasks_client_source_question_key
  unique (client_id, source_question_id);

create index if not exists remediation_tasks_client_id_idx on public.remediation_tasks (client_id);
create index if not exists remediation_tasks_scan_id_idx on public.remediation_tasks (scan_id);
create index if not exists remediation_tasks_status_idx on public.remediation_tasks (status);

alter table public.remediation_tasks enable row level security;

drop policy if exists "Users can manage their own remediation tasks" on public.remediation_tasks;
create policy "Users can manage their own remediation tasks"
  on public.remediation_tasks for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
  );

drop trigger if exists update_remediation_tasks_updated_at on public.remediation_tasks;
create trigger update_remediation_tasks_updated_at
  before update on public.remediation_tasks
  for each row execute function update_updated_at();

-- ============================================================
-- Phase 1 — Compliance assessments: Loi 25 / PIPEDA readiness
-- (Sprint 2-3). One living row per (client, framework), updated in
-- place as the questionnaire is answered.
-- ============================================================

create table if not exists public.compliance_assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  framework text not null check (framework in ('loi25','pipeda')),
  answers jsonb not null default '{}'::jsonb,
  scores jsonb,
  overall_score int,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  version int not null default 1,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists compliance_assessments_client_framework_idx
  on public.compliance_assessments (client_id, framework);

alter table public.compliance_assessments enable row level security;

drop policy if exists "Users can manage their own compliance assessments" on public.compliance_assessments;
create policy "Users can manage their own compliance assessments"
  on public.compliance_assessments for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
  );

drop trigger if exists update_compliance_assessments_updated_at on public.compliance_assessments;
create trigger update_compliance_assessments_updated_at
  before update on public.compliance_assessments
  for each row execute function update_updated_at();

-- Rate-limit tracking for POST /api/remediation-tasks/[id]/ai-context — the
-- only new Sprint 1-4 route that calls Claude directly. checkRateLimit()
-- (src/lib/rateLimit.ts) counts rows a user has *created* in a table within
-- a window, which fits insert-heavy actions (scans, policy generations) but
-- not this one: ai-context is an UPDATE on an existing remediation_tasks
-- row, and remediation_tasks.created_at reflects when the task itself was
-- created (by a scan), not when AI context was requested for it — counting
-- against that column would both over-count (unrelated task creation) and
-- under-count (repeated AI-context clicks on the same task never add a new
-- row). This tiny log table gives checkRateLimit() a real per-call signal to
-- count, mirroring the purpose-built email_campaigns_sent table above
-- rather than forcing an ill-fitting table to serve double duty.
create table if not exists public.ai_context_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

create index if not exists ai_context_requests_user_created_idx
  on public.ai_context_requests (user_id, created_at);

alter table public.ai_context_requests enable row level security;

drop policy if exists "Users can manage their own ai context requests" on public.ai_context_requests;
create policy "Users can manage their own ai context requests"
  on public.ai_context_requests for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Legal traceability for Loi 25 / PIPEDA questions: "why am I being asked
-- this?" + an official source, shown next to each assessment question.
-- review_status defaults to "pending_review" because kb_references/help
-- text was authored by this codebase, not reviewed by a qualified privacy
-- professional — nothing here should be presented as legally authoritative
-- until reviewed_by/last_reviewed_at are set. Reference data shared across
-- tenants, same read-everyone treatment as kb_controls.
create table if not exists public.compliance_requirement (
  id uuid default gen_random_uuid() primary key,
  framework text not null check (framework in ('loi25','pipeda')),
  framework_version text,
  requirement_key text unique not null,
  title_fr text not null,
  title_en text not null,
  description_fr text,
  description_en text,
  source_reference text,
  source_url text,
  effective_date date,
  review_status text not null default 'pending_review' check (review_status in ('pending_review','reviewed')),
  last_reviewed_at timestamptz,
  reviewed_by text,
  weight int,
  created_at timestamptz default now()
);

create index if not exists compliance_requirement_framework_idx on public.compliance_requirement (framework);

alter table public.compliance_requirement enable row level security;

drop policy if exists "Anyone can read compliance requirements" on public.compliance_requirement;
create policy "Anyone can read compliance requirements"
  on public.compliance_requirement for select
  using (true);

-- Atomic merge for assessment autosave. The PATCH route used to read
-- compliance_assessments.answers in JS, spread the new answers on top, then
-- write the merge back — a classic lost-update race when two autosaves
-- overlap (both read the same snapshot, whichever writes last silently
-- discards the other's answer). Doing the merge as a single UPDATE
-- statement serializes on Postgres' row lock instead, so no answer is ever
-- lost. security invoker (the default) means the UPDATE still goes through
-- this table's own RLS policy as the calling user — isolation is unchanged.
create or replace function public.merge_assessment_answers(
  p_id uuid, p_user_id uuid, p_new_answers jsonb
) returns public.compliance_assessments
language sql
as $$
  update public.compliance_assessments
  set answers = answers || p_new_answers, updated_at = now()
  where id = p_id and user_id = p_user_id
  returning *;
$$;
-- Minimal asset inventory — deliberately not a full CMDB. type starts at
-- just domain/subdomain; add ip/service/application/cloud_resource only
-- once SecurePilot actually produces that kind of observation. Lets the
-- scanner accumulate history (first/last seen) instead of every scan being
-- a disconnected snapshot, and keeps "observation" (a fact: Next.js
-- detected) architecturally separate from "finding" (a potential problem) —
-- load-bearing for when CVE correlation is built later, so "technology
-- detected" never collapses directly into "vulnerability found".
-- ============================================================
-- Bloc 1 — table assets
-- ============================================================
create table if not exists public.assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  type text not null check (type in ('domain','subdomain')),
  hostname text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','stale')),
  created_at timestamptz default now()
);

-- Plain unique constraint (not a partial index) so upsert's ON CONFLICT
-- works — same lesson as remediation_tasks/kb_controls earlier.
alter table public.assets drop constraint if exists assets_client_hostname_key;
alter table public.assets add constraint assets_client_hostname_key unique (client_id, hostname);

create index if not exists assets_client_id_idx on public.assets (client_id);

-- ============================================================
-- Bloc 2 — RLS assets (même pattern que remediation_tasks :
-- vérifie aussi que client_id appartient bien à l'utilisateur)
-- ============================================================
alter table public.assets enable row level security;

drop policy if exists "Users can manage their own assets" on public.assets;
create policy "Users can manage their own assets"
  on public.assets for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())
  );

-- ============================================================
-- Bloc 3 — table asset_observations
-- ============================================================
create table if not exists public.asset_observations (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references public.assets(id) on delete cascade not null,
  report_id uuid references public.attack_surface_reports(id) on delete set null,
  observation_type text not null,
  value text not null,
  confidence text not null check (confidence in ('high','medium')),
  evidence text,
  observed_at timestamptz not null default now()
);

create index if not exists asset_observations_asset_id_idx on public.asset_observations (asset_id);
create index if not exists asset_observations_report_id_idx on public.asset_observations (report_id);

-- ============================================================
-- Bloc 4 — RLS asset_observations (pas de user_id propre,
-- vérifié via une jointure sur assets — reste volontairement
-- minimal plutôt que de dénormaliser user_id partout)
-- ============================================================
alter table public.asset_observations enable row level security;

drop policy if exists "Users can manage their own asset observations" on public.asset_observations;
create policy "Users can manage their own asset observations"
  on public.asset_observations for all
  using (exists (select 1 from public.assets a where a.id = asset_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.assets a where a.id = asset_id and a.user_id = auth.uid()));
