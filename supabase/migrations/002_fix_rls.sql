-- Fix RLS policies to allow INSERT operations
-- The original FOR ALL USING policies don't cover INSERT (need WITH CHECK)

drop policy if exists "eleves_isolation" on eleves;
create policy "eleves_isolation" on eleves
  for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

create policy "eleves_insert" on eleves
  for insert with check (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

create policy "eleves_update" on eleves
  for update using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

create policy "eleves_delete" on eleves
  for delete using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

-- Fix other tables with the same issue (FOR ALL USING without WITH CHECK for INSERT)

drop policy if exists "profils_isolation" on profils;
create policy "profils_select" on profils
  for select using (user_id = auth.uid() or ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "profils_insert" on profils
  for insert with check (true);
create policy "profils_update" on profils
  for update using (user_id = auth.uid());

drop policy if exists "ecoles_isolation" on ecoles;
create policy "ecoles_select" on ecoles
  for select using (id in (select ecole_id from profils where user_id = auth.uid()));
create policy "ecoles_insert" on ecoles
  for insert with check (true);
