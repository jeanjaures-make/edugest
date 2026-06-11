export type UserRole = "superadmin" | "directeur" | "comptable" | "enseignant" | "parent" | "eleve"

export interface Profil {
  id: string
  email: string
  nom: string
  prenom: string
  telephone: string
  role: UserRole
  ecole_id: string
  created_at: string
  updated_at: string
}

export interface Ecole {
  id: string
  nom: string
  adresse: string
  telephone: string
  email: string
  site_web: string
  logo_url: string
  code_etablissement: string
  created_at: string
}

export interface AnneeScolaire {
  id: string
  ecole_id: string
  libelle: string
  date_debut: string
  date_fin: string
  active: boolean
}

export interface Niveau {
  id: string
  ecole_id: string
  libelle: string
  code: string
  ordre: number
}

export interface Classe {
  id: string
  ecole_id: string
  niveau_id: string
  annee_scolaire_id: string
  libelle: string
  professeur_principal_id: string
  frais_scolarite: number
  frais_inscription: number
  created_at: string
}

export interface Eleve {
  id: string
  ecole_id: string
  matricule: string
  nom: string
  prenom: string
  date_naissance: string
  lieu_naissance: string
  sexe: "M" | "F"
  nationalite: string
  adresse: string
  telephone: string
  email: string
  photo_url: string
  parent_id: string
  classe_id: string
  annee_scolaire_id: string
  statut: "actif" | "inactif" | "ancien"
  created_at: string
}

export interface Inscription {
  id: string
  eleve_id: string
  classe_id: string
  annee_scolaire_id: string
  date_inscription: string
  frais_inscription: number
  frais_scolarite: number
  statut: "en_attente" | "confirmee" | "annulee"
  documents: DocumentEleve[]
  created_at: string
}

export interface DocumentEleve {
  id: string
  eleve_id: string
  type: "cni" | "acte_naissance" | "photo" | "bulletin" | "certificat" | "autre"
  nom: string
  url: string
  created_at: string
}

export interface Personnel {
  id: string
  ecole_id: string
  matricule: string
  nom: string
  prenom: string
  date_naissance: string
  sexe: "M" | "F"
  type: "enseignant" | "administratif"
  matieres: string[]
  telephone: string
  email: string
  adresse: string
  photo_url: string
  date_embauche: string
  statut: "actif" | "inactif"
  created_at: string
}

export interface EnseignantClasse {
  id: string
  enseignant_id: string
  classe_id: string
  matiere_id: string
  annee_scolaire_id: string
}

export interface Matiere {
  id: string
  ecole_id: string
  libelle: string
  code: string
  coefficient: number
}

export interface Note {
  id: string
  eleve_id: string
  evaluation_id: string
  valeur: number
  appreciation: string
  created_at: string
}

export interface Evaluation {
  id: string
  classe_id: string
  matiere_id: string
  enseignant_id: string
  type: "devoir" | "composition" | "examen"
  libelle: string
  coefficient: number
  date: string
  trimestre: number
  annee_scolaire_id: string
  notes: Note[]
  created_at: string
}

export interface Bulletin {
  id: string
  eleve_id: string
  classe_id: string
  trimestre: number
  annee_scolaire_id: string
  moyenne_generale: number
  rang: number
  appreciation: string
  pdf_url: string
  created_at: string
}

export interface Presence {
  id: string
  eleve_id: string
  classe_id: string
  date: string
  statut: "present" | "absent" | "retard" | "exclu"
  motif: string
  enseignant_id: string
}

export interface FraisScolarite {
  id: string
  ecole_id: string
  libelle: string
  montant: number
  type: "inscription" | "scolarite" | "cantine" | "transport" | "bibliotheque" | "autre"
  periodicite: "annuel" | "trimestriel" | "mensuel" | "unique"
}

export interface Echeancier {
  id: string
  eleve_id: string
  classe_id: string
  annee_scolaire_id: string
  frais_id: string
  montant_total: number
  montant_restant: number
  statut: "en_attente" | "partiel" | "payer"
}

export interface Paiement {
  id: string
  echeancier_id: string
  eleve_id: string
  montant: number
  methode: "orange_money" | "mtn_momo" | "especes" | "virement" | "cheque"
  reference: string
  statut: "en_attente" | "confirme" | "echoue"
  recu_url: string
  date_paiement: string
  created_at: string
}

export interface Communication {
  id: string
  ecole_id: string
  expediteur_id: string
  destinataire_type: "classe" | "niveau" | "tous" | "individuel"
  destinataire_id: string
  sujet: string
  message: string
  type: "info" | "urgence" | "rappel"
  lu: boolean
  created_at: string
}

export interface CalendrierEvenement {
  id: string
  ecole_id: string
  titre: string
  description: string
  type: "cours" | "examen" | "reunion" | "vacance" | "evenement"
  date_debut: string
  date_fin: string
  classe_id: string
  created_at: string
}

export interface CantineAbonnement {
  id: string
  eleve_id: string
  classe_id: string
  type: "mensuel" | "trimestriel" | "annuel"
  montant: number
  statut: "actif" | "inactif"
  date_debut: string
  date_fin: string
}

export interface CantineRepas {
  id: string
  eleve_id: string
  date: string
  type: "dejeuner" | "gouter"
  present: boolean
}

export interface TransportRoute {
  id: string
  ecole_id: string
  libelle: string
  zones: string[]
  montant: number
}

export interface TransportInscription {
  id: string
  eleve_id: string
  route_id: string
  type: "aller" | "retour" | "aller_retour"
  montant: number
  statut: "actif" | "inactif"
}

export interface BibliothequeOuvrage {
  id: string
  ecole_id: string
  titre: string
  auteur: string
  isbn: string
  editeur: string
  annee: number
  quantite: number
  disponibles: number
}

export interface BibliothequePret {
  id: string
  ouvrage_id: string
  eleve_id: string
  date_pret: string
  date_retour_prevue: string
  date_retour_reelle: string
  statut: "en_cours" | "rendu" | "retard"
}

export interface EmploiTemps {
  id: string
  classe_id: string
  matiere_id: string
  enseignant_id: string
  jour_semaine: 1 | 2 | 3 | 4 | 5 | 6
  heure_debut: string
  heure_fin: string
  salle: string
}
