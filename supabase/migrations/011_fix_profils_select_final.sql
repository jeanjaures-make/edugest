-- ============================================================
-- Fix final de profils_select : afficher tous les membres de l'ecole
-- ============================================================
-- Le probleme : la policy actuelle utilise `user_id = auth.uid()`
-- ce qui limite chaque utilisateur a son propre profil.
-- 
-- La solution : utiliser `get_user_ecole_id()` qui est SECURITY DEFINER
-- (executee en tant que proprietaire de la base, pas l'utilisateur courant)
-- donc elle contourne RLS et ne cause PAS de recursion.
--
-- Attention : Ne JAMAIS utiliser de sous-requete directe sur `profils`
-- dans une policy `profils`. Exemple a EVITER :
--   ecole_id IN (SELECT ecole_id FROM profils WHERE user_id = auth.uid())
-- Ceci cause une recursion infinie car RLS se re-applique.
-- ============================================================

-- 1. Supprimer l'ancienne policy trop restrictive
drop policy if exists "profils_select" on profils;

-- 2. Creer la nouvelle policy
--    - Chaque utilisateur voit son propre profil
--    - Chaque utilisateur voit les profils de son ecole
--    (securise via get_user_ecole_id() qui est SECURITY DEFINER)
create policy "profils_select" on profils for select using (
  user_id = auth.uid() or ecole_id = get_user_ecole_id()
);

-- 3. Policy INSERT (inchangee)
drop policy if exists "profils_insert" on profils;
create policy "profils_insert" on profils for insert with check (true);

-- 4. Policy UPDATE : uniquement son propre profil
drop policy if exists "profils_update" on profils;
create policy "profils_update" on profils for update using (
  user_id = auth.uid()
);

-- 5. Policy DELETE : uniquement son propre profil
drop policy if exists "profils_delete" on profils;
create policy "profils_delete" on profils for delete using (
  user_id = auth.uid()
);
