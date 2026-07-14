"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, MapPin, Phone, GraduationCap, TrendingUp, ClipboardList, CalendarCheck } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface EnfantDetail {
  id: string
  nom: string
  prenom: string
  matricule: string
  date_naissance: string | null
  lieu_naissance: string | null
  sexe: string | null
  nationalite: string | null
  telephone: string | null
  email: string | null
  adresse: string | null
  classe?: { libelle: string } | null
}

interface Bulletin {
  id: string
  trimestre: number
  moyenne_generale: number
  rang: number
  appreciation: string
}

interface NoteItem {
  id: string
  valeur: number
  appreciation: string | null
  evaluation?: { libelle: string; coefficient: number; matiere?: { libelle: string; coefficient: number } | null } | null
}

interface PresenceItem {
  id: string
  date: string
  statut: string
  motif: string | null
}

export default function ParentEnfantDetailPage() {
  const params = useParams()
  const eleveId = params.id as string
  const [loading, setLoading] = useState(true)
  const [enfant, setEnfant] = useState<EnfantDetail | null>(null)
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [presences, setPresences] = useState<PresenceItem[]>([])

  useEffect(() => {
    async function load() {
      // Vérifier que cet enfant appartient au parent connecté
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profil } = await supabase
        .from("profils")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!profil) return

      const { data: enfData } = await supabase
        .from("eleves")
        .select("id, nom, prenom, matricule, date_naissance, lieu_naissance, sexe, nationalite, telephone, email, adresse, classe:classes(libelle)")
        .eq("id", eleveId)
        .eq("parent_id", profil.id)
        .eq("statut", "actif")
        .single()

      if (!enfData) { setLoading(false); return }
      setEnfant(enfData as unknown as EnfantDetail)

      // Bulletins
      const { data: bulData } = await supabase
        .from("bulletins")
        .select("id, trimestre, moyenne_generale, rang, appreciation")
        .eq("eleve_id", eleveId)
        .order("trimestre", { ascending: false })
      setBulletins((bulData || []) as unknown as Bulletin[])

      // Notes récentes
      const { data: notesData } = await supabase
        .from("notes")
        .select("id, valeur, appreciation, evaluation:evaluations(libelle, coefficient, matiere:matieres(libelle, coefficient))")
        .eq("eleve_id", eleveId)
        .order("id", { ascending: false })
        .limit(20)
      setNotes((notesData || []) as unknown as NoteItem[])

      // Présences récentes
      const { data: presData } = await supabase
        .from("presences")
        .select("id, date, statut, motif")
        .eq("eleve_id", eleveId)
        .order("date", { ascending: false })
        .limit(15)
      setPresences((presData || []) as unknown as PresenceItem[])

      setLoading(false)
    }
    load()
  }, [eleveId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!enfant) {
    return (
      <div className="space-y-4">
        <Link href="/parent/enfants" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">Cet enfant n&apos;est pas associé à votre compte.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/parent/enfants" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Retour à mes enfants
      </Link>

      {/* En-tête enfant */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">
              {enfant.prenom?.[0] ?? "?"}{enfant.nom?.[0] ?? ""}
            </div>
            <div>
              <h1 className="text-xl font-bold">{enfant.prenom} {enfant.nom}</h1>
              <p className="text-sm text-gray-500">{enfant.matricule} · {enfant.classe?.libelle ?? "Non affecté"}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4 pt-4 border-t border-border">
            {enfant.date_naissance && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Né(e) le :</span>
                <span className="font-medium">{format(new Date(enfant.date_naissance), "dd MMM yyyy", { locale: fr })}</span>
              </div>
            )}
            {enfant.lieu_naissance && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{enfant.lieu_naissance}</span>
              </div>
            )}
            {enfant.sexe && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-400" />
                <Badge variant="info">{enfant.sexe === "M" ? "Masculin" : "Féminin"}</Badge>
              </div>
            )}
            {enfant.nationalite && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Nationalité :</span>
                <span className="font-medium">{enfant.nationalite}</span>
              </div>
            )}
            {enfant.telephone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{enfant.telephone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulletins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            Bulletins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bulletins.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun bulletin disponible.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bulletins.map((b) => (
                <div key={b.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="info">Trimestre {b.trimestre}</Badge>
                    <span className="text-lg font-bold text-primary">{b.moyenne_generale?.toFixed(2)}/20</span>
                  </div>
                  <p className="text-xs text-gray-500">Rang : {b.rang}e</p>
                  {b.appreciation && <p className="text-xs text-gray-600 italic mt-1">{b.appreciation}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Notes récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Notes récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune note disponible.</p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between rounded-lg border border-border p-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {n.evaluation?.matiere?.libelle ?? "Matière"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{n.evaluation?.libelle ?? "Évaluation"}</p>
                    </div>
                    <span className={`text-sm font-bold ${n.valeur >= 10 ? "text-green-600" : "text-red-600"}`}>
                      {n.valeur}/20
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Présences récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-orange-600" />
              Présences récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {presences.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun enregistrement.</p>
            ) : (
              <div className="space-y-2">
                {presences.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-2">
                    <span className="text-sm text-gray-600">
                      {format(new Date(p.date), "dd MMM", { locale: fr })}
                    </span>
                    <Badge variant={p.statut === "present" ? "success" : p.statut === "absent" ? "danger" : "warning"}>
                      {p.statut === "present" ? "Présent" : p.statut === "absent" ? "Absent" : "Retard"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
