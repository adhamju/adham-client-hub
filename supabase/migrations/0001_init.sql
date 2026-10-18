-- =========================================================================
-- Adham Client Hub — initial schema, security policies, and demo data
-- Run this ONCE in the Supabase SQL Editor when you first create your
-- project. After this, you never need to open the SQL editor again for
-- day-to-day use — everything else happens from the Admin UI.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES  (mirrors auth.users, adds our role + display name)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Security-definer helpers used throughout the policies below. They run
-- with the privileges of the function owner, so they can safely read
-- `profiles` / `client_users` without triggering recursive RLS checks.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- (plpgsql on purpose: this function reads the client_users table, which is
-- created further down. A plain "sql" function is checked at creation time
-- and would fail because the table doesn't exist yet.)
create function public.my_client_ids()
returns setof uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query select client_id from public.client_users where user_id = auth.uid();
end;
$$;

-- Is there an admin yet? Used by the login screen to decide whether to
-- offer "create the first admin account". Reveals nothing but a boolean.
create function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where role = 'admin');
$$;

-- Auto-create a profile row whenever someone is added to Supabase Auth.
-- The very first account ever created becomes admin automatically;
-- everyone after that defaults to 'client'.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if (select count(*) from public.profiles) = 0 then
    v_role := 'admin';
  else
    v_role := 'client';
  end if;

  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', v_role);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Only admins may edit profiles. (Users must NOT be able to edit their
-- own row — that would let a client promote themselves to admin.)
create policy "profiles_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 2. SETTINGS  (single row, business-wide branding/config)
-- ---------------------------------------------------------------------
create table public.settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  business_name text not null default 'Adham Client Hub',
  logo_url text,
  primary_color text not null default '#E4432B',
  default_currency text not null default 'USD',
  timezone text not null default 'Asia/Damascus',
  date_format text not null default 'DD/MM/YYYY',
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "settings_select" on public.settings
  for select using (auth.uid() is not null);

create policy "settings_update" on public.settings
  for update using (public.is_admin()) with check (public.is_admin());

insert into public.settings (id) values ('00000000-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------
-- 3. CLIENTS
-- ---------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  logo_url text,
  contact_person text,
  email text,
  phone text,
  currency text not null default 'USD',
  notes text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "clients_select" on public.clients
  for select using (public.is_admin() or id in (select public.my_client_ids()));

create policy "clients_admin_write" on public.clients
  for all using (public.is_admin()) with check (public.is_admin());

-- Links a Supabase Auth user to the client company they belong to.
create table public.client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

alter table public.client_users enable row level security;

create policy "client_users_select" on public.client_users
  for select using (public.is_admin() or user_id = auth.uid());

create policy "client_users_admin_write" on public.client_users
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. PROJECTS
-- ---------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  description text,
  start_date date,
  end_date date,
  status text not null default 'PLANNED'
    check (status in ('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_id_idx on public.projects (client_id);

alter table public.projects enable row level security;

create policy "projects_select" on public.projects
  for select using (public.is_admin() or client_id in (select public.my_client_ids()));

create policy "projects_admin_write" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. VIDEOS
-- ---------------------------------------------------------------------
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  description text,
  price numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'NOT_STARTED' check (
    status in (
      'NOT_STARTED', 'EDITING', 'SENT_FOR_REVIEW',
      'REVISION_REQUESTED', 'APPROVED', 'DELIVERED'
    )
  ),
  due_date date,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id),
  delivered_at timestamptz,
  review_url text,
  delivery_url text,
  revision_count int not null default 0,
  admin_notes text,
  client_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index videos_client_id_idx on public.videos (client_id);
create index videos_project_id_idx on public.videos (project_id);
create index videos_status_idx on public.videos (status);
create index videos_due_date_idx on public.videos (due_date);

alter table public.videos enable row level security;

-- IMPORTANT: clients must never see `admin_notes`. Row Level Security works
-- per row, not per column, so we revoke direct column access to
-- admin_notes for the "authenticated" role and give admins a separate
-- security-definer function to read/write it. See section 10 below.
create policy "videos_select" on public.videos
  for select using (public.is_admin() or client_id in (select public.my_client_ids()));

create policy "videos_admin_write" on public.videos
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 6. PAYMENTS
-- ---------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  video_id uuid references public.videos (id) on delete set null,
  amount numeric(12, 2) not null,
  payment_date date not null default current_date,
  method text not null default 'Cash'
    check (method in ('Cash', 'Bank Transfer', 'Wise', 'PayPal', 'Other')),
  method_other text,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index payments_client_id_idx on public.payments (client_id);
create index payments_video_id_idx on public.payments (video_id);

alter table public.payments enable row level security;

create policy "payments_select" on public.payments
  for select using (public.is_admin() or client_id in (select public.my_client_ids()));

create policy "payments_admin_write" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- A per-video read-only summary: how much has been paid, how much is
-- left, and the derived payment status. security_invoker means this
-- view respects the querying user's own RLS, not the view owner's.
create view public.video_financials
  with (security_invoker = true) as
select
  v.id as video_id,
  v.price,
  coalesce(sum(p.amount), 0) as amount_paid,
  v.price - coalesce(sum(p.amount), 0) as amount_remaining,
  case
    when coalesce(sum(p.amount), 0) <= 0 then 'UNPAID'
    when coalesce(sum(p.amount), 0) >= v.price then 'PAID'
    else 'PARTIALLY_PAID'
  end as payment_status
from public.videos v
left join public.payments p on p.video_id = v.id
group by v.id, v.price;

-- ---------------------------------------------------------------------
-- 7. FEEDBACK
-- ---------------------------------------------------------------------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid references public.profiles (id),
  message text not null,
  link text,
  created_at timestamptz not null default now()
);

create index feedback_video_id_idx on public.feedback (video_id);

alter table public.feedback enable row level security;

create policy "feedback_select" on public.feedback
  for select using (public.is_admin() or client_id in (select public.my_client_ids()));

create policy "feedback_admin_write" on public.feedback
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 8. ACTIVITY LOG
-- ---------------------------------------------------------------------
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  actor_name text,
  action_text text not null,
  client_id uuid references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  video_id uuid references public.videos (id) on delete set null,
  created_at timestamptz not null default now()
);

create index activity_logs_client_id_idx on public.activity_logs (client_id);
create index activity_logs_video_id_idx on public.activity_logs (video_id);

alter table public.activity_logs enable row level security;

-- Clients do NOT read the activity log directly (it can contain internal
-- admin events). Admin only.
create policy "activity_logs_admin_all" on public.activity_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 9. CLIENT-FACING ACTIONS AS SECURITY-DEFINER RPCs
--    (a client account is never granted direct UPDATE on videos — every
--    client-triggered change goes through one of these narrow, audited
--    functions instead)
-- ---------------------------------------------------------------------
create function public.approve_video(p_video_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_title text;
  v_status text;
  v_actor_name text;
begin
  select client_id, title, status into v_client_id, v_title, v_status
  from public.videos where id = p_video_id;

  if v_client_id is null or v_client_id not in (select public.my_client_ids()) then
    raise exception 'not authorized for this video';
  end if;

  if v_status <> 'SENT_FOR_REVIEW' then
    raise exception 'video is not currently waiting for approval';
  end if;

  update public.videos
    set status = 'APPROVED', approved_at = now(), approved_by = auth.uid(), updated_at = now()
    where id = p_video_id;

  select full_name into v_actor_name from public.profiles where id = auth.uid();

  insert into public.activity_logs (actor_id, actor_name, action_text, client_id, video_id)
  values (auth.uid(), v_actor_name, coalesce(v_actor_name, 'Client') || ' approved "' || v_title || '"',
          v_client_id, p_video_id);
end;
$$;

create function public.request_revision(p_video_id uuid, p_message text, p_link text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_title text;
  v_status text;
  v_actor_name text;
begin
  select client_id, title, status into v_client_id, v_title, v_status
  from public.videos where id = p_video_id;

  if v_client_id is null or v_client_id not in (select public.my_client_ids()) then
    raise exception 'not authorized for this video';
  end if;

  if v_status <> 'SENT_FOR_REVIEW' then
    raise exception 'video is not currently waiting for review';
  end if;

  update public.videos
    set status = 'REVISION_REQUESTED',
        revision_count = revision_count + 1,
        updated_at = now()
    where id = p_video_id;

  insert into public.feedback (video_id, client_id, user_id, message, link)
  values (p_video_id, v_client_id, auth.uid(), p_message, p_link);

  select full_name into v_actor_name from public.profiles where id = auth.uid();

  insert into public.activity_logs (actor_id, actor_name, action_text, client_id, video_id)
  values (auth.uid(), v_actor_name, coalesce(v_actor_name, 'Client') || ' requested a revision on "' || v_title || '"',
          v_client_id, p_video_id);
end;
$$;

create function public.submit_feedback(p_video_id uuid, p_message text, p_link text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_title text;
  v_actor_name text;
begin
  select client_id, title into v_client_id, v_title
  from public.videos where id = p_video_id;

  if v_client_id is null or v_client_id not in (select public.my_client_ids()) then
    raise exception 'not authorized for this video';
  end if;

  insert into public.feedback (video_id, client_id, user_id, message, link)
  values (p_video_id, v_client_id, auth.uid(), p_message, p_link);

  select full_name into v_actor_name from public.profiles where id = auth.uid();

  insert into public.activity_logs (actor_id, actor_name, action_text, client_id, video_id)
  values (auth.uid(), v_actor_name, coalesce(v_actor_name, 'Client') || ' left feedback on "' || v_title || '"',
          v_client_id, p_video_id);
end;
$$;

-- ---------------------------------------------------------------------
-- 10. HIDE INTERNAL ADMIN NOTES FROM CLIENTS
--     Column-level privilege: the "authenticated" role (every logged-in
--     user, admin and client alike) cannot SELECT the admin_notes column
--     directly. Admins read and write it through the two functions below
--     (which check is_admin() first). Clients can never see it, even if
--     they craft their own API request with select=admin_notes.
-- ---------------------------------------------------------------------
revoke select on public.videos from authenticated, anon;
grant select (
  id, title, client_id, project_id, description, price, currency, status,
  due_date, submitted_at, approved_at, approved_by, delivered_at,
  review_url, delivery_url, revision_count, client_notes,
  created_at, updated_at
) on public.videos to authenticated;

create function public.get_video_admin_notes(p_video_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_notes text;
begin
  if not public.is_admin() then
    raise exception 'admins only';
  end if;
  select admin_notes into v_notes from public.videos where id = p_video_id;
  return v_notes;
end;
$$;

create function public.set_video_admin_notes(p_video_id uuid, p_notes text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admins only';
  end if;
  update public.videos set admin_notes = p_notes where id = p_video_id;
end;
$$;

-- =========================================================================
-- DEMO DATA — safe to delete later from the Admin UI (delete the "Hidden"
-- client and everything under it goes with it).
-- =========================================================================
do $$
declare
  v_client_id uuid := gen_random_uuid();
  v_project_id uuid := gen_random_uuid();
  v_v1 uuid := gen_random_uuid();
  v_v2 uuid := gen_random_uuid();
  v_v3 uuid := gen_random_uuid();
  v_v4 uuid := gen_random_uuid();
  v_v5 uuid := gen_random_uuid();
  v_v6 uuid := gen_random_uuid();
  v_v7 uuid := gen_random_uuid();
  v_v8 uuid := gen_random_uuid();
begin
  insert into public.clients (id, company_name, contact_person, email, phone, currency, status)
  values (v_client_id, 'Hidden', 'Layla Haddad', 'layla@hidden.example', '+963 900 000 000', 'USD', 'active');

  insert into public.projects (id, client_id, name, description, start_date, status)
  values (v_project_id, v_client_id, 'Summer 2026 Campaign', 'Seasonal brand + social content', current_date - 30, 'ACTIVE');

  insert into public.videos (id, title, client_id, project_id, price, status, due_date, submitted_at, review_url, client_notes, admin_notes)
  values
    (v_v1, 'Summer Campaign 01', v_client_id, v_project_id, 250, 'DELIVERED', current_date - 20, now() - interval '18 days', 'https://example.com/review/1', 'Final cut delivered.', 'Client was easy on this one.'),
    (v_v2, 'Summer Campaign 02', v_client_id, v_project_id, 250, 'APPROVED', current_date - 14, now() - interval '10 days', 'https://example.com/review/2', null, null),
    (v_v3, 'Brand Reel 01', v_client_id, v_project_id, 400, 'SENT_FOR_REVIEW', current_date - 5, now() - interval '2 days', 'https://example.com/review/3', 'Please review and approve or send notes.', null),
    (v_v4, 'Product Launch', v_client_id, v_project_id, 600, 'EDITING', current_date + 4, null, null, null, 'Waiting on final logo files.'),
    (v_v5, 'Social Reel 04', v_client_id, v_project_id, 150, 'REVISION_REQUESTED', current_date - 2, now() - interval '4 days', 'https://example.com/review/5', null, null),
    (v_v6, 'Event Recap', v_client_id, v_project_id, 350, 'NOT_STARTED', current_date + 12, null, null, null, null),
    (v_v7, 'Hero Film', v_client_id, v_project_id, 900, 'EDITING', current_date + 20, null, null, null, 'Biggest piece of the campaign.'),
    (v_v8, 'Instagram Ad 03', v_client_id, v_project_id, 180, 'DELIVERED', current_date - 40, now() - interval '39 days', 'https://example.com/review/8', null, null);

  insert into public.payments (client_id, video_id, amount, payment_date, method)
  values
    (v_client_id, v_v1, 250, current_date - 15, 'Bank Transfer'),
    (v_client_id, v_v2, 150, current_date - 8, 'Wise'),
    (v_client_id, v_v8, 180, current_date - 35, 'Cash');

  insert into public.feedback (video_id, client_id, message)
  values (v_v5, v_client_id, 'Please tighten the intro by a couple seconds and swap the closing music cue.');

  insert into public.activity_logs (actor_name, action_text, client_id, video_id)
  values
    ('Adham', 'Created video "Summer Campaign 01"', v_client_id, v_v1),
    ('Adham', 'Changed status to DELIVERED on "Summer Campaign 01"', v_client_id, v_v1),
    ('Adham', 'Payment of $250 recorded', v_client_id, v_v1);
end $$;
