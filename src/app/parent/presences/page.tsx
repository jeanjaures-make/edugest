"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Presence {
  id: string
  date: string
  statut: string
  motif: string | null
  eleve?: { nom: string; prenom: string } | null
}

export default function ParentPresencesPage() {
  const [loading, setLoading] = useState(true)
  const [presences, setPresences] = useState<Presence[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profil } = await supabase
        .from("profils")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!profil) return

      const { data: enfants } = await supabase
        .from("eleves")
        .select("id")
        .eq("parent_id", profil.id)
        .eq("statut", "actif")

      const enfantIds = (enfants || []).map(e => e.id)
      if (enfantIds.length === 0) { setLoading(false); return }

      const { data } = await supabase
        .from("presences")
        .select("id, date, statut, motif, eleve:eleves(nom, prenom)")
        .in("eleve_id", enfantIds)
        .order("date", { ascending: false })
        .limit(50)

      setPresences((data || []) as unknown as Presence[])
      setLoading(false)
    }
    load()
  }, [])

  const absences = presences.filter(p => p.statut === "absent")
  const retards = presences.filter(p => p.statut === "retard")
  const presents = presences.filter(p => p.statut === "present")

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Présences</h1>
        <p className="text-sm text-gray-500">Suivi des présences de vos enfants</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{presents.length}</p>
              <p className="text-xs text-gray-500">Présences</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <CalendarCheck className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{absences.length}</p>
              <p className="text-xs text-gray-500">Absences</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <CalendarCheck className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{retards.length}</p>
              <p className="text-xs text-gray-500">Retards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique récent</CardTitle>
        </CardHeader>
        <CardContent>
          {presences.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun enregistrement de présence.</p>
          ) : (
            <div className="space-y-2">
              {presences.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {p.eleve?.prenom} {p.eleve?.nom}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(p.date), "EEEE dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.motif && <span className="text-xs text-gray-400">{p.motif}</span>}
                    <Badge variant={p.statut === "present" ? "success" : p.statut === "absent" ? "danger" : "warning"}>
                      {p.statut === "present" ? "Présent" : p.statut === "absent" ? "Absent" : "Retard"}
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
