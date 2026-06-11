-- Fix: infinite recursion in profils RLS policy
-- The recursive subquery triggers itself because profils has RLS.
-- Solution: use a security definer function to get the user's ecole_id.

-- Drop recursive policies that reference profils
drop policy if exists "ecoles_isolation" on ecoles;
drop policy if exists "profils_isolation" on profils;
drop policy if exists "eleves_isolation" on eleves;

-- Create security definer helper function (bypasses RLS)
create or replace function get_user_ecole_id()
returns uuid
language sql
security definer
stable
as $$
  select ecole_id from public.profils where user_id = auth.uid() limit 1;
$$;

-- Recreate ecoles policy using the helper
create policy "ecoles_select" on ecoles for select using (
  id = get_user_ecole_id()
);

-- Recreate profils policy (non-recursive)
create policy "profils_select" on profils for select using (
  user_id = auth.uid()
  or
  ecole_id = get_user_ecole_id()
);

-- Recreate eleves policy
drop policy if exists "eleves_select" on eleves;
create policy "eleves_select" on eleves for select using (
  ecole_id = get_user_ecole_id()
);

-- Update all remaining table policies to use the helper
-- Niveaux
drop policy if exists "niveaux_select" on niveaux;
create policy "niveaux_select" on niveaux for select using (
  ecole_id = get_user_ecole_id()
);

-- Classes
drop policy if exists "classes_select" on classes;
create policy "classes_select" on classes for select using (
  ecole_id = get_user_ecole_id()
);

-- Matieres
drop policy if exists "matieres_select" on matieres;
create policy "matieres_select" on matieres for select using (
  ecole_id = get_user_ecole_id()
);

-- Personnel
drop policy if exists "personnel_select" on personnel;
create policy "personnel_select" on personnel for select using (
  ecole_id = get_user_ecole_id()
);

-- Frais scolarite
drop policy if exists "frais_scolarite_select" on frais_scolarite;
create policy "frais_scolarite_select" on frais_scolarite for select using (
  ecole_id = get_user_ecole_id()
);

-- Transport routes
drop policy if exists "transport_routes_select" on transport_routes;
create policy "transport_routes_select" on transport_routes for select using (
  ecole_id = get_user_ecole_id()
);

-- Bibliotheque ouvrages
drop policy if exists "bibliotheque_ouvrages_select" on bibliotheque_ouvrages;
create policy "bibliotheque_ouvrages_select" on bibliotheque_ouvrages for select using (
  ecole_id = get_user_ecole_id()
);

-- Calendrier evenements
drop policy if exists "calendrier_evenements_select" on calendrier_evenements;
create policy "calendrier_evenements_select" on calendrier_evenements for select using (
  ecole_id = get_user_ecole_id()
);

-- Communications
drop policy if exists "communications_select" on communications;
create policy "communications_select" on communications for select using (
  ecole_id = get_user_ecole_id()
);

-- Presences (join via eleve -> ecole)
drop policy if exists "presences_select" on presences;
create policy "presences_select" on presences for select using (
  eleve_id in (select id from eleves where ecole_id = get_user_ecole_id())
);

-- Cantine abonnements
drop policy if exists "cantine_abonnements_select" on cantine_abonnements;
create policy "cantine_abonnements_select" on cantine_abonnements for select using (
  eleve_id in (select id from eleves where ecole_id = get_user_ecole_id())
);

-- Transport inscriptions
drop policy if exists "transport_inscriptions_select" on transport_inscriptions;
create policy "transport_inscriptions_select" on transport_inscriptions for select using (
  eleve_id in (select id from eleves where ecole_id = get_user_ecole_id())
);

-- Bibliotheque prets
drop policy if exists "bibliotheque_prets_select" on bibliotheque_prets;
create policy "bibliotheque_prets_select" on bibliotheque_prets for select using (
  eleve_id in (select id from eleves where ecole_id = get_user_ecole_id())
);

-- Documents eleves
drop policy if exists "documents_eleves_select" on documents_eleves;
create policy "documents_eleves_select" on documents_eleves for select using (
  eleve_id in (select id from eleves where ecole_id = get_user_ecole_id())
);

-- Evaluations (join via classe -> ecole)
drop policy if exists "evaluations_select" on evaluations;
create policy "evaluations_select" on evaluations for select using (
  classe_id in (select id from classes where ecole_id = get_user_ecole_id())
);

-- Notes (join via evaluation -> classe -> ecole)
drop policy if exists "notes_select" on notes;
create policy "notes_select" on notes for select using (
  evaluation_id in (select id from evaluations where classe_id in (select id from classes where ecole_id = get_user_ecole_id()))
);

-- Bulletins
drop policy if exists "bulletins_select" on bulletins;
create policy "bulletins_select" on bulletins for select using (
  classe_id in (select id from classes where ecole_id = get_user_ecole_id())
);
