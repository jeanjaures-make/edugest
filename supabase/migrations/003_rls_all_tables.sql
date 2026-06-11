-- Enable RLS on remaining tables
alter table if exists niveaux enable row level security;
alter table if exists classes enable row level security;
alter table if exists matieres enable row level security;
alter table if exists evaluations enable row level security;
alter table if exists notes enable row level security;
alter table if exists bulletins enable row level security;
alter table if exists inscriptions enable row level security;
alter table if exists echeanciers enable row level security;
alter table if exists cantine_abonnements enable row level security;
alter table if exists cantine_repas enable row level security;
alter table if exists transport_routes enable row level security;
alter table if exists transport_inscriptions enable row level security;
alter table if exists bibliotheque_ouvrages enable row level security;
alter table if exists bibliotheque_prets enable row level security;
alter table if exists calendrier_evenements enable row level security;
alter table if exists communications enable row level security;
alter table if exists communications_lues enable row level security;
alter table if exists personnel enable row level security;
alter table if exists enseignants_matieres enable row level security;
alter table if exists enseignants_classes enable row level security;
alter table if exists emplois_du_temps enable row level security;
alter table if exists parametres enable row level security;

-- Niveaux
drop policy if exists "niveaux_select" on niveaux;
drop policy if exists "niveaux_insert" on niveaux;
drop policy if exists "niveaux_update" on niveaux;
drop policy if exists "niveaux_delete" on niveaux;
create policy "niveaux_select" on niveaux for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "niveaux_insert" on niveaux for insert with check (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "niveaux_update" on niveaux for update using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "niveaux_delete" on niveaux for delete using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

-- Classes
drop policy if exists "classes_select" on classes;
drop policy if exists "classes_insert" on classes;
drop policy if exists "classes_update" on classes;
drop policy if exists "classes_delete" on classes;
create policy "classes_select" on classes for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "classes_insert" on classes for insert with check (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "classes_update" on classes for update using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "classes_delete" on classes for delete using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

-- Matieres
drop policy if exists "matieres_select" on matieres;
drop policy if exists "matieres_insert" on matieres;
drop policy if exists "matieres_update" on matieres;
drop policy if exists "matieres_delete" on matieres;
create policy "matieres_select" on matieres for select using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "matieres_insert" on matieres for insert with check (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "matieres_update" on matieres for update using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));
create policy "matieres_delete" on matieres for delete using (ecole_id in (select ecole_id from profils where user_id = auth.uid()));

-- Evaluations (join via classe -> ecole or via matiere -> ecole)
drop policy if exists "evaluations_select" on evaluations;
drop policy if exists "evaluations_insert" on evaluations;
create policy "evaluations_select" on evaluations for select using (
  classe_id in (select id from classes where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);
create policy "evaluations_insert" on evaluations for insert with check (
  classe_id in (select id from classes where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);

-- Notes (join via evaluation -> classe -> ecole)
drop policy if exists "notes_select" on notes;
drop policy if exists "notes_insert" on notes;
drop policy if exists "notes_update" on notes;
create policy "notes_select" on notes for select using (
  evaluation_id in (select id from evaluations where classe_id in (select id from classes where ecole_id in (select ecole_id from profils where user_id = auth.uid())))
);
create policy "notes_insert" on notes for insert with check (
  evaluation_id in (select id from evaluations where classe_id in (select id from classes where ecole_id in (select ecole_id from profils where user_id = auth.uid())))
);
create policy "notes_update" on notes for update using (
  evaluation_id in (select id from evaluations where classe_id in (select id from classes where ecole_id in (select ecole_id from profils where user_id = auth.uid())))
);

-- Bulletins
drop policy if exists "bulletins_select" on bulletins;
drop policy if exists "bulletins_insert" on bulletins;
drop policy if exists "bulletins_delete" on bulletins;
create policy "bulletins_select" on bulletins for select using (
  classe_id in (select id from classes where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);
create policy "bulletins_insert" on bulletins for insert with check (
  classe_id in (select id from classes where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);
create policy "bulletins_delete" on bulletins for delete using (
  classe_id in (select id from classes where ecole_id in (select ecole_id from profils where user_id = auth.uid()))
);
