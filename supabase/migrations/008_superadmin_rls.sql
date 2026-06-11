-- Superadmin RLS support
-- Superadmins have ecole_id = NULL in profils.
-- get_user_ecole_id() returns NULL for superadmins.
-- The RLS policies below allow superadmins to read all rows.
-- Run these if you want superadmin to see data via anon key (not just service role key).

-- Update helper to handle superadmin
create or replace function get_user_ecole_id()
returns uuid
language sql
security definer
stable
as $$
  select ecole_id from public.profils where user_id = auth.uid() limit 1;
$$;

-- Update all select policies to allow when get_user_ecole_id() is NULL (superadmin)
-- Example for ecoles:
drop policy if exists "ecoles_select" on ecoles;
create policy "ecoles_select" on ecoles for select using (
  get_user_ecole_id() is null or id = get_user_ecole_id()
);

-- Repeat for all other tables...
-- In practice, superadmin uses service role key for all queries,
-- so these changes are optional. The service role key bypasses RLS entirely.
