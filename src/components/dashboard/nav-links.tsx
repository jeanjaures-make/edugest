"use client"

import {
  LayoutDashboard, Users, UserPlus, BookOpen, ClipboardList, AlertTriangle,
  Coins, CreditCard, CalendarCheck, Clock, UtensilsCrossed,
  Bus, Library, MessageSquare, Calendar, FileText, Settings,
  type LucideIcon,
} from "lucide-react"
import type { UserRole } from "@/types"

export interface NavLink {
  label: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

export const navLinks: NavLink[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, roles: ["directeur", "comptable", "enseignant", "parent", "eleve"] },
  { label: "Élèves", href: "/eleves", icon: Users, roles: ["directeur", "comptable"] },
  { label: "Inscriptions", href: "/inscriptions", icon: UserPlus, roles: ["directeur", "comptable"] },
  { label: "Personnel", href: "/personnel", icon: Users, roles: ["directeur"] },
  { label: "Notes", href: "/notes", icon: BookOpen, roles: ["directeur", "enseignant"] },
  { label: "Cahier de textes", href: "/cahier-textes", icon: BookOpen, roles: ["directeur", "enseignant"] },
  { label: "Bulletins", href: "/bulletins", icon: ClipboardList, roles: ["directeur", "enseignant", "parent", "eleve"] },
  { label: "Frais scolaires", href: "/frais", icon: Coins, roles: ["directeur", "comptable"] },
  { label: "Impayés", href: "/frais/impayes", icon: AlertTriangle, roles: ["directeur", "comptable"] },
  { label: "Paiements", href: "/paiements", icon: CreditCard, roles: ["directeur", "comptable", "parent"] },
  { label: "Présences", href: "/presences", icon: CalendarCheck, roles: ["directeur", "enseignant", "parent"] },
  { label: "Emploi du temps", href: "/emploi-du-temps", icon: Clock, roles: ["directeur", "enseignant", "eleve"] },
  { label: "Cantine", href: "/cantine", icon: UtensilsCrossed, roles: ["directeur", "comptable"] },
  { label: "Transport", href: "/transport", icon: Bus, roles: ["directeur", "comptable"] },
  { label: "Bibliothèque", href: "/bibliotheque", icon: Library, roles: ["directeur", "comptable"] },
  { label: "Communication", href: "/communication", icon: MessageSquare, roles: ["directeur", "enseignant", "parent"] },
  { label: "Calendrier", href: "/calendrier", icon: Calendar, roles: ["directeur", "enseignant", "parent", "eleve"] },
  { label: "Documents", href: "/documents", icon: FileText, roles: ["directeur", "comptable", "parent"] },
  { label: "Paramètres", href: "/parametres", icon: Settings, roles: ["directeur"] },
]
