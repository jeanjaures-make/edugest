-- ============================================================
-- EduGest CI - Schema de la base de donnees
-- ============================================================

-- 1. TABLES DE BASE
-- ============================================================

create table if not exists ecoles (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  adresse text,
  telephone text,
  email text,
  site_web text,
  logo_url text,
  code_etablissement text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists profils (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  ecole_id uuid references ecoles(id) on delete cascade,
  nom text not null,
  prenom text not null,
  telephone text,
  role text not null check (role in ('directeur', 'comptable', 'enseignant', 'parent', 'eleve')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists annees_scolaires (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  libelle text not null,
  date_debut date not null,
  date_fin date not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists niveaux (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  libelle text not null,
  code text not null,
  ordre int not null default 0,
  created_at timestamptz default now()
);

create table if not exists matieres (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  libelle text not null,
  code text not null,
  coefficient int not null default 1,
  created_at timestamptz default now()
);

-- 2. CLASSES
-- ============================================================

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  niveau_id uuid references niveaux(id) on delete cascade not null,
  annee_scolaire_id uuid references annees_scolaires(id) on delete cascade not null,
  libelle text not null,
  professeur_principal_id uuid references profils(id) on delete set null,
  frais_scolarite int default 0,
  frais_inscription int default 0,
  created_at timestamptz default now()
);

-- 3. ELEVES
-- ============================================================

create table if not exists eleves (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  matricule text unique not null,
  nom text not null,
  prenom text not null,
  date_naissance date,
  lieu_naissance text,
  sexe text check (sexe in ('M', 'F')),
  nationalite text default 'Ivoirienne',
  adresse text,
  telephone text,
  email text,
  photo_url text,
  parent_id uuid references profils(id) on delete set null,
  classe_id uuid references classes(id) on delete set null,
  annee_scolaire_id uuid references annees_scolaires(id) on delete set null,
  statut text default 'actif' check (statut in ('actif', 'inactif', 'ancien')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists inscriptions (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references eleves(id) on delete cascade not null,
  classe_id uuid references classes(id) on delete cascade not null,
  annee_scolaire_id uuid references annees_scolaires(id) on delete cascade not null,
  date_inscription date default current_date,
  frais_inscription int default 0,
  frais_scolarite int default 0,
  statut text default 'en_attente' check (statut in ('en_attente', 'confirmee', 'annulee')),
  created_at timestamptz default now()
);

-- 4. DOCUMENTS
-- ============================================================

create table if not exists documents_eleves (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references eleves(id) on delete cascade not null,
  type text not null check (type in ('cni', 'acte_naissance', 'photo', 'bulletin', 'certificat', 'autre')),
  nom text not null,
  url text not null,
  created_at timestamptz default now()
);

-- 5. PERSONNEL ET AFFECTATIONS
-- ============================================================

create table if not exists personnel (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  profil_id uuid references profils(id) on delete cascade,
  matricule text unique not null,
  nom text not null,
  prenom text not null,
  date_naissance date,
  sexe text check (sexe in ('M', 'F')),
  type text not null check (type in ('enseignant', 'administratif')),
  telephone text,
  email text,
  adresse text,
  photo_url text,
  date_embauche date,
  statut text default 'actif' check (statut in ('actif', 'inactif')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists enseignants_matieres (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid references personnel(id) on delete cascade not null,
  matiere_id uuid references matieres(id) on delete cascade not null,
  unique(enseignant_id, matiere_id)
);

create table if not exists enseignants_classes (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid references personnel(id) on delete cascade not null,
  classe_id uuid references classes(id) on delete cascade not null,
  matiere_id uuid references matieres(id) on delete cascade not null,
  annee_scolaire_id uuid references annees_scolaires(id) on delete cascade not null,
  unique(enseignant_id, classe_id, matiere_id, annee_scolaire_id)
);

-- 6. NOTES ET EVALUATIONS
-- ============================================================

create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid references classes(id) on delete cascade not null,
  matiere_id uuid references matieres(id) on delete cascade not null,
  enseignant_id uuid references personnel(id) on delete set null,
  type text not null check (type in ('devoir', 'composition', 'examen')),
  libelle text not null,
  coefficient int default 1,
  date date,
  trimestre int not null,
  annee_scolaire_id uuid references annees_scolaires(id) on delete cascade not null,
  created_at timestamptz default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references eleves(id) on delete cascade not null,
  evaluation_id uuid references evaluations(id) on delete cascade not null,
  valeur numeric(4,1) not null check (valeur >= 0 and valeur <= 20),
  appreciation text,
  created_at timestamptz default now(),
  unique(eleve_id, evaluation_id)
);

create table if not exists bulletins (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references eleves(id) on delete cascade not null,
  classe_id uuid references classes(id) on delete cascade not null,
  trimestre int not null,
  annee_scolaire_id uuid references annees_scolaires(id) on delete cascade not null,
  moyenne_generale numeric(4,1),
  rang int,
  appreciation text,
  pdf_url text,
  created_at timestamptz default now()
);

-- 7. PRESENCES
-- ============================================================

create table if not exists presences (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references eleves(id) on delete cascade not null,
  classe_id uuid references classes(id) on delete cascade not null,
  date date not null default current_date,
  statut text not null check (statut in ('present', 'absent', 'retard', 'exclu')),
  motif text,
  enseignant_id uuid references personnel(id) on delete set null,
  created_at timestamptz default now(),
  unique(eleve_id, date)
);

-- 8. FRAIS ET PAIEMENTS
-- ============================================================

create table if not exists frais_scolarite (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  libelle text not null,
  montant int not null,
  type text not null check (type in ('inscription', 'scolarite', 'cantine', 'transport', 'bibliotheque', 'autre')),
  periodicite text not null check (periodicite in ('annuel', 'trimestriel', 'mensuel', 'unique')),
  created_at timestamptz default now()
);

create table if not exists echeanciers (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references eleves(id) on delete cascade not null,
  classe_id uuid references classes(id) on delete cascade not null,
  annee_scolaire_id uuid references annees_scolaires(id) on delete cascade not null,
  frais_id uuid references frais_scolarite(id) on delete cascade not null,
  montant_total int not null,
  montant_restant int not null,
  statut text default 'en_attente' check (statut in ('en_attente', 'partiel', 'payer')),
  created_at timestamptz default now()
);

create table if not exists paiements (
  id uuid primary key default gen_random_uuid(),
  echeancier_id uuid references echeanciers(id) on delete cascade not null,
  eleve_id uuid references eleves(id) on delete cascade not null,
  montant int not null,
  methode text not null check (methode in ('orange_money', 'mtn_momo', 'especes', 'virement', 'cheque')),
  reference text unique not null,
  statut text default 'en_attente' check (statut in ('en_attente', 'confirme', 'echoue')),
  recu_url text,
  telephone text,
  date_paiement timestamptz default now(),
  created_at timestamptz default now()
);

-- 9. EMPLOI DU TEMPS
-- ============================================================

create table if not exists emplois_du_temps (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid references classes(id) on delete cascade not null,
  matiere_id uuid references matieres(id) on delete cascade not null,
  enseignant_id uuid references personnel(id) on delete set null,
  jour_semaine int not null check (jour_semaine between 1 and 6),
  heure_debut time not null,
  heure_fin time not null,
  salle text,
  created_at timestamptz default now()
);

-- 10. COMMUNICATION
-- ============================================================

create table if not exists communications (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  expediteur_id uuid references profils(id) on delete set null,
  destinataire_type text not null check (destinataire_type in ('classe', 'niveau', 'tous', 'individuel')),
  destinataire_id text,
  sujet text not null,
  message text not null,
  type text not null check (type in ('info', 'urgence', 'rappel')),
  created_at timestamptz default now()
);

create table if not exists communications_lues (
  id uuid primary key default gen_random_uuid(),
  communication_id uuid references communications(id) on delete cascade not null,
  profil_id uuid references profils(id) on delete cascade not null,
  lu boolean default false,
  lu_at timestamptz,
  unique(communication_id, profil_id)
);

-- 11. CALENDRIER
-- ============================================================

create table if not exists calendrier_evenements (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  titre text not null,
  description text,
  type text not null check (type in ('cours', 'examen', 'reunion', 'vacance', 'evenement')),
  date_debut timestamptz not null,
  date_fin timestamptz not null,
  classe_id uuid references classes(id) on delete set null,
  created_at timestamptz default now()
);

-- 12. CANTINE
-- ============================================================

create table if not exists cantine_abonnements (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references eleves(id) on delete cascade not null,
  classe_id uuid references classes(id) on delete cascade not null,
  type text not null check (type in ('mensuel', 'trimestriel', 'annuel')),
  montant int not null,
  statut text default 'actif' check (statut in ('actif', 'inactif')),
  date_debut date,
  date_fin date,
  created_at timestamptz default now()
);

create table if not exists cantine_repas (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references eleves(id) on delete cascade not null,
  date date not null default current_date,
  type text not null check (type in ('dejeuner', 'gouter')),
  present boolean default false,
  unique(eleve_id, date, type)
);

-- 13. TRANSPORT
-- ============================================================

create table if not exists transport_routes (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  libelle text not null,
  zones text[],
  montant int not null,
  created_at timestamptz default now()
);

create table if not exists transport_inscriptions (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid references eleves(id) on delete cascade not null,
  route_id uuid references transport_routes(id) on delete cascade not null,
  type text not null check (type in ('aller', 'retour', 'aller_retour')),
  montant int not null,
  statut text default 'actif' check (statut in ('actif', 'inactif')),
  created_at timestamptz default now()
);

-- 14. BIBLIOTHEQUE
-- ============================================================

create table if not exists bibliotheque_ouvrages (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null,
  titre text not null,
  auteur text not null,
  isbn text,
  editeur text,
  annee int,
  quantite int default 1,
  disponibles int default 1,
  created_at timestamptz default now()
);

create table if not exists bibliotheque_prets (
  id uuid primary key default gen_random_uuid(),
  ouvrage_id uuid references bibliotheque_ouvrages(id) on delete cascade not null,
  eleve_id uuid references eleves(id) on delete cascade not null,
  date_pret date not null default current_date,
  date_retour_prevue date not null,
  date_retour_reelle date,
  statut text default 'en_cours' check (statut in ('en_cours', 'rendu', 'retard')),
  created_at timestamptz default now()
);

-- 15. PARAMETRES
-- ============================================================

create table if not exists parametres (
  id uuid primary key default gen_random_uuid(),
  ecole_id uuid references ecoles(id) on delete cascade not null unique,
  cle text not null,
  valeur jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_eleves_classe on eleves(classe_id);
create index if not exists idx_eleves_ecole on eleves(ecole_id);
create index if not exists idx_notes_evaluation on notes(evaluation_id);
create index if not exists idx_notes_eleve on notes(eleve_id);
create index if not exists idx_paiements_eleve on paiements(eleve_id);
create index if not exists idx_presences_eleve on presences(eleve_id);
create index if not exists idx_presences_date on presences(date);
create index if not exists idx_communications_ecole on communications(ecole_id);
create index if not exists idx_evenements_date on calendrier_evenements(date_debut);
create index if not exists idx_prets_eleve on bibliotheque_prets(eleve_id);
create index if not exists idx_transport_eleve on transport_inscriptions(eleve_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table ecoles enable row level security;
alter table profils enable row level security;
alter table eleves enable row level security;
alter table classes enable row level security;
alter table notes enable row level security;
alter table paiements enable row level security;
alter table presences enable row level security;
alter table communications enable row level security;
alter table documents_eleves enable row level security;

-- Politique: un utilisateur voit les donnees de son ecole
create policy "ecoles_isolation" on ecoles
  for all using (id in (
    select ecole_id from profils where user_id = auth.uid()
  ));

create policy "profils_isolation" on profils
  for all using (user_id = auth.uid() or ecole_id in (
    select ecole_id from profils where user_id = auth.uid()
  ));

create policy "eleves_isolation" on eleves
  for all using (ecole_id in (
    select ecole_id from profils where user_id = auth.uid()
  ));

-- ============================================================
-- FONCTIONS UTILES
-- ============================================================

create or replace function generate_matricule(ecole_code text)
returns text
language sql
as $$
  select upper(ecole_code || '-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('seq_matricule')::text, 4, '0'));
$$;

create sequence if not exists seq_matricule start 1;
