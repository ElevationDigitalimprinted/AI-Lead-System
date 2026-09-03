-- Elevation Pipeline multi-tenant schema
-- Run this in the Supabase SQL editor (or via supabase db push) as a privileged role.
-- Requires Authentication to be enabled on the project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_role') then
    create type public.organization_role as enum ('owner', 'member');
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum (
      'new',
      'contacted',
      'qualified',
      'booked',
      'lost'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_source') then
    create type public.lead_source as enum (
      'manual',
      'missed_call',
      'inbound_sms',
      'web_form'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text unique,
  business_type text not null default 'trade services',
  service_area text,
  business_hours text,
  owner_name text,
  business_phone text,
  twilio_number text,
  owner_phone text,
  api_key text not null unique default encode(gen_random_bytes(24), 'hex'),
  lemon_squeezy_customer_id text,
  lemon_squeezy_subscription_id text unique,
  lemon_squeezy_order_id text,
  lemon_squeezy_variant_id text,
  lemon_squeezy_product_id text,
  subscription_status text not null default 'inactive'
    check (subscription_status in (
      'inactive',
      'on_trial',
      'active',
      'paused',
      'past_due',
      'unpaid',
      'cancelled',
      'expired'
    )),
  subscription_renews_at timestamptz,
  subscription_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null default '',
  role public.organization_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_phone text not null check (char_length(trim(lead_phone)) between 7 and 32),
  status public.lead_status not null default 'new',
  source public.lead_source not null default 'manual',
  handoff_sent boolean not null default false,
  message_history text not null default '',
  project_need text,
  timeline text,
  location text,
  callback_number text,
  notes text,
  call_sid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, lead_phone)
);

create index if not exists profiles_organization_id_idx
  on public.profiles (organization_id);

create index if not exists leads_organization_id_idx
  on public.leads (organization_id);

create index if not exists leads_organization_status_idx
  on public.leads (organization_id, status);

create index if not exists leads_organization_created_at_idx
  on public.leads (organization_id, created_at desc);

create index if not exists organizations_subscription_status_idx
  on public.organizations (subscription_status);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create or replace function public.protect_organization_billing_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  new.api_key := old.api_key;
  new.lemon_squeezy_customer_id := old.lemon_squeezy_customer_id;
  new.lemon_squeezy_subscription_id := old.lemon_squeezy_subscription_id;
  new.lemon_squeezy_order_id := old.lemon_squeezy_order_id;
  new.lemon_squeezy_variant_id := old.lemon_squeezy_variant_id;
  new.lemon_squeezy_product_id := old.lemon_squeezy_product_id;
  new.subscription_status := old.subscription_status;
  new.subscription_renews_at := old.subscription_renews_at;
  new.subscription_ends_at := old.subscription_ends_at;
  return new;
end;
$$;

drop trigger if exists organizations_protect_billing on public.organizations;
create trigger organizations_protect_billing
before update on public.organizations
for each row execute function public.protect_organization_billing_columns();

-- ---------------------------------------------------------------------------
-- Tenant helpers (SECURITY DEFINER, locked search_path)
-- ---------------------------------------------------------------------------

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.is_organization_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organization_id = target_org
  );
$$;

create or replace function public.is_organization_owner(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organization_id = target_org
      and p.role = 'owner'
  );
$$;

revoke all on function public.current_organization_id() from public;
revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_owner(uuid) from public;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Provision org + profile on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name text;
  display_name text;
begin
  org_name := nullif(trim(coalesce(new.raw_user_meta_data->>'organization_name', '')), '');
  if org_name is null then
    org_name := 'My Shop';
  end if;

  display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  if display_name is null then
    display_name := split_part(coalesce(new.email, 'owner'), '@', 1);
  end if;

  insert into public.organizations (
    name,
    slug,
    owner_name,
    business_phone,
    service_area,
    business_hours
  )
  values (
    org_name,
    lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(replace(new.id::text, '-', ''), 1, 8),
    display_name,
    nullif(trim(coalesce(new.raw_user_meta_data->>'business_phone', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'service_area', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'business_hours', '')), '')
  )
  returning id into new_org_id;

  insert into public.profiles (id, organization_id, full_name, role)
  values (new.id, new_org_id, display_name, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;

alter table public.organizations force row level security;
alter table public.profiles force row level security;
alter table public.leads force row level security;

-- Organizations -------------------------------------------------------------

drop policy if exists "Members can read their organization" on public.organizations;
create policy "Members can read their organization"
on public.organizations
for select
to authenticated
using (public.is_organization_member(id));

drop policy if exists "Owners can update their organization" on public.organizations;
create policy "Owners can update their organization"
on public.organizations
for update
to authenticated
using (public.is_organization_owner(id))
with check (public.is_organization_owner(id));

-- Direct inserts/deletes are performed by triggers or the service role only.
drop policy if exists "No direct organization inserts" on public.organizations;
create policy "No direct organization inserts"
on public.organizations
for insert
to authenticated
with check (false);

drop policy if exists "No direct organization deletes" on public.organizations;
create policy "No direct organization deletes"
on public.organizations
for delete
to authenticated
using (false);

-- Profiles ------------------------------------------------------------------

drop policy if exists "Members can read profiles in their organization" on public.profiles;
create policy "Members can read profiles in their organization"
on public.profiles
for select
to authenticated
using (public.is_organization_member(organization_id));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and organization_id = public.current_organization_id()
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

drop policy if exists "No direct profile inserts" on public.profiles;
create policy "No direct profile inserts"
on public.profiles
for insert
to authenticated
with check (false);

drop policy if exists "No direct profile deletes" on public.profiles;
create policy "No direct profile deletes"
on public.profiles
for delete
to authenticated
using (false);

-- Leads ---------------------------------------------------------------------

drop policy if exists "Members can read organization leads" on public.leads;
create policy "Members can read organization leads"
on public.leads
for select
to authenticated
using (public.is_organization_member(organization_id));

drop policy if exists "Members can insert organization leads" on public.leads;
create policy "Members can insert organization leads"
on public.leads
for insert
to authenticated
with check (
  organization_id = public.current_organization_id()
  and public.is_organization_member(organization_id)
);

drop policy if exists "Members can update organization leads" on public.leads;
create policy "Members can update organization leads"
on public.leads
for update
to authenticated
using (public.is_organization_member(organization_id))
with check (
  organization_id = public.current_organization_id()
  and public.is_organization_member(organization_id)
);

drop policy if exists "Members can delete organization leads" on public.leads;
create policy "Members can delete organization leads"
on public.leads
for delete
to authenticated
using (public.is_organization_member(organization_id));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated, anon;

grant select, update on public.organizations to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.leads to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'leads'
  ) then
    execute 'alter publication supabase_realtime add table public.leads';
  end if;
end
$$;
