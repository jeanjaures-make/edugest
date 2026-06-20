-- Ajoute 'superadmin' a la contrainte check du role dans profils
-- Execute dans Supabase Dashboard > SQL Editor

alter table profils drop constraint if exists profils_role_check;
alter table profils add constraint profils_role_check
  check (role in ('directeur', 'comptable', 'enseignant', 'parent', 'eleve', 'superadmin'));
