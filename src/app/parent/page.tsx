"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, ClipboardList, CalendarCheck, CreditCard, TrendingUp, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"

interface Enfant {
  id: string
  nom: string
  prenom: string
  matricule: string
  classe_id: string
  classe?: { libelle: string }
  photo_url: string | null
}

interface Bulletin {
  id: string
  eleve_id: string
  trimestre: number
  moyenne_generale: number
  rang: number
  appreciation: string
  eleve?: { nom: string; prenom: string }
}

interface Presence {
  id: string
  date: string
  statut: string
  motif: string | null
  eleve?: { nom: string; prenom: string }
}

interface Paiement {
  id: string
  montant: number
  date_paiement: string
  statut: string
  eleve?: { nom: string; prenom: string }
}

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true)
  const [profilId, setProfilId] = useState<string | null>(null)
  const [enfants, setEnfants] = useState<Enfant[]>([])
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [presences, setPresences] = useState<Presence[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [impayes, setImpayes] = useState(0)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profil } = await supabase
        .from("profils")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!profil) return
      setProfilId(profil.id)

      // Récupérer les enfants du parent
      const { data: enfantsData } = await supabase
        .from("eleves")
        .select("id, nom, prenom, matricule, classe_id, photo_url, classe:classes(libelle)")
        .eq("parent_id", profil.id)
        .eq("statut", "actif")
        .order("prenom")

      const enfantsList = (enfantsData || []) as unknown as Enfant[]
      setEnfants(enfantsList)

      if (enfantsList.length > 0) {
        const enfantIds = enfantsList.map(e => e.id)

        // Derniers bulletins
        const { data: bulData } = await supabase
          .from("bulletins")
          .select("id, eleve_id, trimestre, moyenne_generale, rang, appreciation, eleve:eleves(nom, prenom)")
          .in("eleve_id", enfantIds)
          .order("trimestre", { ascending: false })
          .limit(6)
        setBulletins((bulData || []) as unknown as Bulletin[])

        // Présences récentes (absences et retards)
        const { data: presData } = await supabase
          .from("presences")
          .select("id, date, statut, motif, eleve:eleves(nom, prenom)")
          .in("eleve_id", enfantIds)
          .in("statut", ["absent", "retard"])
          .order("date", { ascending: false })
          .limit(10)
        setPresences((presData || []) as unknown as Presence[])

        // Derniers paiements
        const { data: paiData } = await supabase
          .from("paiements")
          .select("id, montant, date_paiement, statut, eleve:eleves(nom, prenom)")
          .in("eleve_id", enfantIds)
          .order("date_paiement", { ascending: false })
          .limit(5)
        setPaiements((paiData || []) as unknown as Paiement[])

        // Impayés
        const { count } = await supabase
          .from("paiements")
          .select("id", { count: "exact", head: true })
          .in("eleve_id", enfantIds)
          .eq("statut", "en_attente")
        setImpayes(count || 0)
      }

      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenue</h1>
        <p className="text-sm text-gray-500">Suivez la scolarité de vos enfants</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{enfants.length}</p>
              <p className="text-xs text-gray-500">Enfant(s)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <ClipboardList className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bulletins.length}</p>
              <p className="text-xs text-gray-500">Bulletin(s)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <CalendarCheck className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{presences.length}</p>
              <p className="text-xs text-gray-500">Absence(s)/Retard(s)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{impayes}</p>
              <p className="text-xs text-gray-500">Paiement(s) en attente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mes enfants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Mes enfants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enfants.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun enfant associé à votre compte.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {enfants.map((enfant) => (
                <Link
                  key={enfant.id}
                  href={`/parent/enfants/${enfant.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold">
                    {enfant.prenom?.[0] ?? "?"}{enfant.nom?.[0] ?? ""}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{enfant.prenom} {enfant.nom}</p>
                    <p className="text-xs text-gray-500">
                      {enfant.classe?.libelle ?? "Non affecté"} · {enfant.matricule}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Derniers bulletins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Derniers bulletins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bulletins.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun bulletin disponible.</p>
            ) : (
              <div className="space-y-2">
                {bulletins.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {b.eleve?.prenom} {b.eleve?.nom}
                      </p>
                      <p className="text-xs text-gray-500">Trimestre {b.trimestre}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{b.moyenne_generale?.toFixed(2)}/20</span>
                      <Badge variant="outline">Rang {b.rang}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Absences récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-orange-600" />
              Absences & retards récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {presences.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune absence ou retard récent. Très bien !</p>
            ) : (
              <div className="space-y-2">
                {presences.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {p.eleve?.prenom} {p.eleve?.nom}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(p.date), "dd MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <Badge variant={p.statut === "absent" ? "danger" : "default"}>
                      {p.statut === "absent" ? "Absent" : "Retard"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Derniers paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Derniers paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paiements.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun paiement enregistré.</p>
          ) : (
            <div className="space-y-2">
              {paiements.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {p.eleve?.prenom} {p.eleve?.nom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.date_paiement ? format(new Date(p.date_paiement), "dd MMM yyyy", { locale: fr }) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{p.montant?.toLocaleString("fr-FR")} FCFA</span>
                    <Badge variant={p.statut === "paye" ? "success" : p.statut === "en_attente" ? "danger" : "default"}>
                      {p.statut === "paye" ? "Payé" : p.statut === "en_attente" ? "En attente" : p.statut}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
