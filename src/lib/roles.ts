import type { UserRole } from "@/types"

export const roleLabels: Record<UserRole, string> = {
  superadmin: "Super Admin",
  directeur: "Directeur",
  comptable: "Comptable",
  enseignant: "Enseignant",
  parent: "Parent",
  eleve: "Élève",
}

export const roleColors: Record<UserRole, string> = {
  superadmin: "bg-red-100 text-red-800",
  directeur: "bg-purple-100 text-purple-800",
  comptable: "bg-blue-100 text-blue-800",
  enseignant: "bg-green-100 text-green-800",
  parent: "bg-orange-100 text-orange-800",
  eleve: "bg-teal-100 text-teal-800",
}

export const modulePermissions: Record<UserRole, string[]> = {
  superadmin: [
    "superadmin", "dashboard", "eleves", "inscriptions", "personnel", "notes", "bulletins",
    "frais", "paiements", "presences", "emploi-du-temps", "cantine", "transport",
    "bibliotheque", "communication", "calendrier", "documents", "parametres",
  ],
  directeur: [
    "dashboard", "eleves", "inscriptions", "personnel", "notes", "bulletins",
    "frais", "paiements", "presences", "emploi-du-temps", "cantine", "transport",
    "bibliotheque", "communication", "calendrier", "documents", "parametres",
  ],
  comptable: [
    "dashboard", "eleves", "inscriptions", "frais", "paiements",
    "cantine", "transport", "bibliotheque", "documents",
  ],
  enseignant: [
    "dashboard", "notes", "bulletins", "presences", "emploi-du-temps",
    "communication", "calendrier",
  ],
  parent: [
    "dashboard", "notes", "bulletins", "presences", "paiements",
    "communication", "calendrier", "documents",
  ],
  eleve: [
    "dashboard", "notes", "bulletins", "emploi-du-temps", "calendrier",
  ],
}
