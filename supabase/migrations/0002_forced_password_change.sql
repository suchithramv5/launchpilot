-- Admin-invited users are created with no password (via auth.admin.inviteUserByEmail
-- from the invite-user edge function) and must set one via the emailed link before
-- using the app. This flag drives that forced redirect.

alter table profiles add column must_change_password boolean not null default false;

-- Lets a signed-in user clear their own flag once they've set a real password,
-- without opening up general self-service UPDATE on profiles (role/tier/status
-- stay admin-managed via the existing "admins manage profiles" policy).
create function public.clear_must_change_password()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set must_change_password = false where id = auth.uid();
end;
$$;
