-- Cahier de textes - suivi pédagogique
-- Permet aux enseignants de saisir le contenu de chaque cours

create table if not exists cahier_textes (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  classe_id uuid references classes(id) on delete cascade not null,
  matiere_id uuid references matieres(id) on delete cascade not null,
  personnel_id uuid references personnel(id) on delete set null,
  date_cours date not null,
  chapitre text not null,
  contenu text,
  activites text,
  devoirs text,
  duree int default 2,
  statut text default 'planifie' check (statut in ('planifie', 'fait', 'annule')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index
create index if not exists idx_cahier_ecole on cahier_textes(ecole_id);
create index if not exists idx_cahier_classe on cahier_textes(classe_id);
create index if not exists idx_cahier_matiere on cahier_textes(matiere_id);
create index if not exists idx_cahier_date on cahier_textes(date_cours);
create index if not exists idx_cahier_personnel on cahier_textes(personnel_id);

-- RLS
alter table cahier_textes enable row level security;

DO $$ BEGIN
  DROP POLICY IF EXISTS "cahier_textes_select" ON cahier_textes;
  DROP POLICY IF EXISTS "cahier_textes_insert" ON cahier_textes;
  DROP POLICY IF EXISTS "cahier_textes_update" ON cahier_textes;
  DROP POLICY IF EXISTS "cahier_textes_delete" ON cahier_textes;

  CREATE POLICY "cahier_textes_select" ON cahier_textes FOR SELECT USING (
    ecole_id = get_user_ecole_id()
  );
  CREATE POLICY "cahier_textes_insert" ON cahier_textes FOR INSERT WITH CHECK (
    ecole_id = get_user_ecole_id()
  );
  CREATE POLICY "cahier_textes_update" ON cahier_textes FOR UPDATE USING (
    ecole_id = get_user_ecole_id()
  );
  CREATE POLICY "cahier_textes_delete" ON cahier_textes FOR DELETE USING (
    ecole_id = get_user_ecole_id()
  );
END $$;
