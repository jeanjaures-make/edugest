-- Fix profils_select to allow school members to see each other.
-- The previous policy (user_id = auth.uid()) only showed own profile.
-- Using get_user_ecole_id() which is SECURITY DEFINER (bypasses RLS) to avoid recursion.

drop policy if exists "profils_select" on profils;
create policy "profils_select" on profils for select using (
  ecole_id = get_user_ecole_id() OR user_id = auth.uid()
);
