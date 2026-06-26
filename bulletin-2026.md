# Modèle de Bulletin de Notes — 2026

## Structure du bulletin PDF généré

### En-tête (1ère ligne)
| Colonne 1 | Colonne 2 | Colonne 3 |
|-----------|-----------|-----------|
| **Logo de l'école** (55x55px, depuis `ecoles.logo_url`) | **République de Côte d'Ivoire**<br>Ministère de l'Éducation Nationale<br>et de l'Enseignement Technique<br>**Nom de l'établissement**<br>Code établissement | **Coordonnées de l'école :**<br>Adresse, Téléphone, Email |

### Titre
- **BULLETIN DE NOTES**
- Trimestre X - Année scolaire YYYY-YYYY

### Identité de l'élève
| Nom & Prénom (Majuscules) | Matricule |
| Classe | Effectif | Sexe | Nationalité | Date de naissance | Lieu |

### Tableau des notes
| MATIERE | MOY | COEFF | Moy x Coeff | RANG | PROFESSEUR | APPRECIATION |
|---------|-----|-------|-------------|------|------------|--------------|
| (groupe par matière) | moyenne/20 | coeff matière | moyenne × coeff | - | Prénom Nom | appréciation |
| **TOTAUX** | | Σ coeffs | Σ moy×coeff | | | |

### Moyenne & Rang
- **MOYENNE TRIMESTRIELLE :** X.XX / 20
- **RANG :** Xe / Effectif

### Absences
- Absences justifiées : N
- Absences non justifiées : N

### Distinctions & Sanctions
- Tableau d'honneur (Moy ≥ 14)
- Encouragement (Moy ≥ 12)
- Félicitations (Moy ≥ 16)
- Avertissement / Blâme / Exclusion

### Appréciation du Conseil de classe
- Texte automatique généré selon la moyenne
- Signature du Professeur Principal

### Visa du Chef d'Établissement
- ABIDJAN, le [date]
- Cachet + Signature

### Pied de page
- Nom de l'école | EduGest CI | Imprimé le [date]

---

## Calculs

- **Moyenne par matière :** Σ(valeur × coeff_évaluation) / Σ(coeff_évaluation)
- **Moy x Coeff :** moyenne_matière × coeff_matière
- **Moyenne générale :** Σ(moy_x_coeff) / Σ(coeff)
- **Appréciation :** ≥16 Excellent / ≥14 Très bon / ≥12 Bon / ≥10 Satisfaisant / ≥8 Peut mieux faire / <8 Insuffisant

## Données chargées
- `eleves` : nom, prénom, matricule, date_naissance, lieu_naissance, sexe, nationalité
- `notes` : valeur, appréciation → `evaluations` (libelle, coefficient) → `matieres` (libelle, coefficient)
- `personnel` : nom, prénom (enseignant via `evaluations.enseignant_id`)
- `ecoles` : nom, adresse, téléphone, email, logo_url, code_etablissement
- `bulletins` : moyenne_generale, rang, appreciation (depuis la table bulletins générée par l'API)
