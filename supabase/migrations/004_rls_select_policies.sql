-- RLS SELECT policies for all remaining tables
-- Each uses the standard pattern: ecole_id IN (select ecole_id from profils where user_id = auth.uid())

-- Personnel
drop policy if exists "personnel_select" on personnel;
create policy "personnel_select" on personnel for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

-- Presences (join via eleve -> ecole)
drop policy if exists "presences_select" on presences;
create policy "presences_select" on presences for select using (
  eleve_id in (select id from eleves where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);

-- Cantine abonnements
drop policy if exists "cantine_abonnements_select" on cantine_abonnements;
create policy "cantine_abonnements_select" on cantine_abonnements for select using (
  eleve_id in (select id from eleves where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);

-- Transport routes
drop policy if exists "transport_routes_select" on transport_routes;
create policy "transport_routes_select" on transport_routes for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

-- Transport inscriptions
drop policy if exists "transport_inscriptions_select" on transport_inscriptions;
create policy "transport_inscriptions_select" on transport_inscriptions for select using (
  eleve_id in (select id from eleves where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);

-- Bibliotheque ouvrages
drop policy if exists "bibliotheque_ouvrages_select" on bibliotheque_ouvrages;
create policy "bibliotheque_ouvrages_select" on bibliotheque_ouvrages for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

-- Bibliotheque prets
drop policy if exists "bibliotheque_prets_select" on bibliotheque_prets;
create policy "bibliotheque_prets_select" on bibliotheque_prets for select using (
  eleve_id in (select id from eleves where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);

-- Calendrier evenements
drop policy if exists "calendrier_evenements_select" on calendrier_evenements;
create policy "calendrier_evenements_select" on calendrier_evenements for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

-- Communications
drop policy if exists "communications_select" on communications;
create policy "communications_select" on communications for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

-- Documents eleves
drop policy if exists "documents_eleves_select" on documents_eleves;
create policy "documents_eleves_select" on documents_eleves for select using (
  eleve_id in (select id from eleves where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);

-- Frais scolarite
drop policy if exists "frais_scolarite_select" on frais_scolarite;
create policy "frais_scolarite_select" on frais_scolarite for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
