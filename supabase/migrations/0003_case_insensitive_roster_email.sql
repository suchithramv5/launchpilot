-- Roster emails were stored exactly as typed by the launch lead (RosterEditor
-- only trimmed, never lowercased), while login/signup always lowercases the
-- account email. is_on_roster()'s case-sensitive `=` then silently failed to
-- match a rostered person to their own account, hiding the launch from them
-- entirely. Make the match case-insensitive so existing mismatched rows work
-- immediately, without needing anyone to be re-added to the roster.

create or replace function public.is_on_roster(p_launch_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from team_members tm
    where tm.launch_id = p_launch_id and lower(tm.email) = lower(public.current_email())
  )
$$;
