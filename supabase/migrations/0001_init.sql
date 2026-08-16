-- LaunchPilot initial schema: enums, tables, signup trigger, and row level security.
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('launch_lead', 'compliance', 'upstream_ops', 'marketing', 'admin');
create type access_tier as enum ('owner', 'member', 'external');
create type user_status as enum ('active', 'revoked');
create type task_status as enum ('not_started', 'on track', 'at risk', 'blocked', 'completed');
create type subtask_status as enum ('open', 'in_progress', 'closed', 'flagged');
create type review_status as enum ('none', 'pending', 'acknowledged', 'flagged');
create type team_group_type as enum ('leadership', 'stakeholder', 'team', 'external');
create type compliance_flag_status as enum ('open', 'resolved');

-- ============================================================
-- TABLES
-- ============================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  initial text not null,
  email text not null unique,
  role user_role not null default 'marketing',
  access_tier access_tier not null default 'member',
  employee_id text not null,
  status user_status not null default 'active',
  created_at timestamptz not null default now()
);

create table pending_invites (
  email text primary key,
  role user_role not null,
  access_tier access_tier not null,
  invited_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table launches (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null default 'Beauty & personal care',
  description text not null default '',
  closed boolean not null default false,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references profiles (id),
  retro_tags jsonb not null default '{}'::jsonb,
  retro_saved boolean not null default false,
  packet_submitted boolean not null default false,
  booking_adjusted boolean not null default false,
  booking_vendor_name text not null default '',
  booking_reason_label text not null default '',
  booking_extension_days int
);

create table team_members (
  id bigint generated always as identity primary key,
  launch_id bigint not null references launches (id) on delete cascade,
  name text not null,
  email text not null,
  role user_role not null,
  team_group team_group_type not null,
  title text not null default '',
  perm_summary boolean not null default true,
  perm_retro boolean not null default false
);

create table tasks (
  id bigint generated always as identity primary key,
  launch_id bigint not null references launches (id) on delete cascade,
  step int not null,
  name text not null,
  owner_id uuid references profiles (id),
  status task_status not null default 'not_started',
  custom boolean not null default false,
  blocks boolean not null default false,
  locked boolean not null default false,
  risk_reason text not null default '',
  risk_comment text not null default '',
  duration_days int not null default 3,
  depends_on_task_id bigint references tasks (id),
  review_status review_status not null default 'none',
  review_assignee_id uuid references profiles (id),
  review_note text not null default '',
  started_at timestamptz,
  completed_at timestamptz
);

create table subtasks (
  id bigint generated always as identity primary key,
  task_id bigint not null references tasks (id) on delete cascade,
  name text not null,
  assignee_id uuid references profiles (id),
  assigned_by_id uuid references profiles (id),
  status subtask_status not null default 'open',
  flag_reason text,
  flag_detail text,
  response_note text,
  needs_info boolean not null default false,
  locked boolean not null default false,
  kind text
);

create table compliance_flags (
  id bigint generated always as identity primary key,
  launch_id bigint not null references launches (id) on delete cascade,
  name text not null,
  task text not null,
  status compliance_flag_status not null default 'open'
);

create table trail_entries (
  id bigint generated always as identity primary key,
  launch_id bigint not null references launches (id) on delete cascade,
  actor_id uuid references profiles (id),
  actor_initial text not null,
  actor_name text not null,
  action text not null,
  old_value text not null,
  new_value text not null,
  task text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SIGNUP TRIGGER: create a profile the moment someone signs up,
-- consuming any matching pending invite for their role/tier.
-- ============================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inv pending_invites%rowtype;
  next_emp_num int;
  derived_name text;
begin
  select * into inv from pending_invites where email = new.email;

  select coalesce(max(nullif(regexp_replace(employee_id, '\D', '', 'g'), '')::int), 1000) + 1
    into next_emp_num
    from profiles;

  derived_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    initcap(split_part(new.email, '@', 1))
  );

  insert into profiles (id, name, initial, email, role, access_tier, employee_id)
  values (
    new.id,
    derived_name,
    upper(left(derived_name, 1)),
    new.email,
    coalesce(inv.role, 'marketing'),
    coalesce(inv.access_tier, 'member'),
    'EMP-' || next_emp_num
  );

  if inv.email is not null then
    delete from pending_invites where email = inv.email;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- HELPER FUNCTIONS (for RLS policies)
-- ============================================================

create function public.current_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create function public.is_owner_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('launch_lead', 'admin'), false)
$$;

create function public.current_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from profiles where id = auth.uid()
$$;

-- Is the current user rostered on this launch (by email)?
create function public.is_on_roster(p_launch_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from team_members tm
    where tm.launch_id = p_launch_id and tm.email = public.current_email()
  )
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table pending_invites enable row level security;
alter table launches enable row level security;
alter table team_members enable row level security;
alter table tasks enable row level security;
alter table subtasks enable row level security;
alter table compliance_flags enable row level security;
alter table trail_entries enable row level security;

-- profiles: anyone signed in can read (needed for name/role lookups everywhere);
-- only launch_lead/admin can change someone else's role/tier/status.
create policy "profiles readable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');

create policy "admins manage profiles" on profiles
  for update using (public.is_owner_or_admin()) with check (public.is_owner_or_admin());

-- pending_invites: launch_lead/admin only, end to end.
create policy "admins manage pending invites" on pending_invites
  for all using (public.is_owner_or_admin()) with check (public.is_owner_or_admin());

-- launches: visible to owners/admins, or anyone rostered on it.
create policy "launches visible to owners or roster" on launches
  for select using (public.is_owner_or_admin() or public.is_on_roster(id));

create policy "launch_lead/admin create launches" on launches
  for insert with check (public.is_owner_or_admin());

create policy "launch_lead/admin update launches" on launches
  for update using (public.is_owner_or_admin()) with check (public.is_owner_or_admin());

-- team_members (roster): visible with the launch; editable by launch_lead/admin only.
create policy "roster visible with launch" on team_members
  for select using (public.is_owner_or_admin() or public.is_on_roster(launch_id));

create policy "launch_lead/admin manage roster" on team_members
  for all using (public.is_owner_or_admin()) with check (public.is_owner_or_admin());

-- tasks: visible with the launch; editable by the assigned owner or admin.
create policy "tasks visible with launch" on tasks
  for select using (public.is_owner_or_admin() or public.is_on_roster(launch_id));

create policy "launch_lead/admin create tasks" on tasks
  for insert with check (public.is_owner_or_admin());

create policy "launch_lead/admin delete tasks" on tasks
  for delete using (public.is_owner_or_admin());

create policy "owner or admin update tasks" on tasks
  for update using (owner_id = auth.uid() or public.current_role() = 'admin')
  with check (owner_id = auth.uid() or public.current_role() = 'admin');

-- subtasks: visible with the parent task's launch; editable by the assignee, the
-- parent task's owner (adding/locking/recalling), or admin.
create policy "subtasks visible with launch" on subtasks
  for select using (
    public.is_owner_or_admin()
    or exists (select 1 from tasks t where t.id = subtasks.task_id and public.is_on_roster(t.launch_id))
  );

create policy "task owner or admin create subtasks" on subtasks
  for insert with check (
    public.current_role() = 'admin'
    or exists (select 1 from tasks t where t.id = subtasks.task_id and t.owner_id = auth.uid())
  );

create policy "assignee or task owner or admin update subtasks" on subtasks
  for update using (
    public.current_role() = 'admin'
    or assignee_id = auth.uid()
    or exists (select 1 from tasks t where t.id = subtasks.task_id and t.owner_id = auth.uid())
  )
  with check (
    public.current_role() = 'admin'
    or assignee_id = auth.uid()
    or exists (select 1 from tasks t where t.id = subtasks.task_id and t.owner_id = auth.uid())
  );

-- compliance_flags: visible with the launch; managed by compliance/launch_lead/admin.
create policy "compliance flags visible with launch" on compliance_flags
  for select using (public.is_owner_or_admin() or public.is_on_roster(launch_id));

create policy "compliance manages flags" on compliance_flags
  for all using (public.current_role() in ('compliance', 'launch_lead', 'admin'))
  with check (public.current_role() in ('compliance', 'launch_lead', 'admin'));

-- trail_entries: append-only and immutable (no update/delete policy at all).
-- Visible to owners/admins in full; everyone else only sees entries on tasks
-- they own, or entries they personally authored — mirrors scopedTrailEntries().
create policy "trail visible per scoping rules" on trail_entries
  for select using (
    public.is_owner_or_admin()
    or actor_id = auth.uid()
    or exists (
      select 1 from tasks t
      where t.launch_id = trail_entries.launch_id
        and t.name = trail_entries.task
        and t.owner_id = auth.uid()
    )
  );

create policy "rostered members can log trail entries" on trail_entries
  for insert with check (public.is_owner_or_admin() or public.is_on_roster(launch_id));
