"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Bulletin {
  id: string
  eleve_id: string
  trimestre: number
  moyenne_generale: number
  rang: number
  appreciation: string
  classe_id: string
  eleve?: { nom: string; prenom: string } | null
  classe?: { libelle: string } | null
}

export default function ParentBulletinsPage() {
  const [loading, setLoading] = useState(true)
  const [bulletins, setBulletins] = useState<Bulletin[]>([])

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
        .from("bulletins")
        .select("id, eleve_id, trimestre, moyenne_generale, rang, appreciation, classe_id, eleve:eleves(nom, prenom), classe:classes(libelle)")
        .in("eleve_id", enfantIds)
        .order("trimestre", { ascending: false })

      setBulletins((data || []) as unknown as Bulletin[])
      setLoading(false)
    }
    load()
  }, [])

  function getMention(moy: number) {
    if (moy >= 16) return { label: "Excellent", variant: "success" as const }
    if (moy >= 14) return { label: "Très bien", variant: "success" as const }
    if (moy >= 12) return { label: "Bien", variant: "info" as const }
    if (moy >= 10) return { label: "Assez bien", variant: "default" as const }
    if (moy >= 8) return { label: "Passable", variant: "warning" as const }
    return { label: "Insuffisant", variant: "danger" as const }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulletins</h1>
        <p className="text-sm text-gray-500">Consultez les bulletins de vos enfants</p>
      </div>

      {bulletins.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun bulletin disponible pour le moment.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bulletins.map((b) => {
            const mention = getMention(b.moyenne_generale)
            return (
              <Card key={b.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{b.eleve?.prenom} {b.eleve?.nom}</span>
                    <Badge variant="info">T{b.trimestre}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Moyenne générale</span>
                    <span className="text-xl font-bold text-primary">{b.moyenne_generale?.toFixed(2)}/20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Rang</span>
                    <span className="text-sm font-medium">{b.rang}e</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Mention</span>
                    <Badge variant={mention.variant}>{mention.label}</Badge>
                  </div>
                  {b.classe?.libelle && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Classe</span>
                      <span className="text-sm font-medium">{b.classe.libelle}</span>
                    </div>
                  )}
                  {b.appreciation && (
                    <p className="text-sm text-gray-600 italic border-t border-border pt-2">{b.appreciation}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
