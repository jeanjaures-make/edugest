-- Fix infinite RLS recursion on profils table.
-- The old profils_select policy called get_user_ecole_id() which queries profils,
-- causing infinite recursion. New policy only lets users see their own profile.
-- Other table policies (eleves, notes, etc.) still use get_user_ecole_id() fine.

drop policy if exists "profils_select" on profils;
create policy "profils_select" on profils for select using (
  user_id = auth.uid()
);

drop policy if exists "profils_insert" on profils;
create policy "profils_insert" on profils for insert with check (true);
