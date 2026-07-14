"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, Calendar, Phone } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Enfant {
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
  classe_id: string | null
  classe?: { libelle: string } | null
}

export default function ParentEnfantsPage() {
  const [loading, setLoading] = useState(true)
  const [enfants, setEnfants] = useState<Enfant[]>([])

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

      const { data } = await supabase
        .from("eleves")
        .select("id, nom, prenom, matricule, date_naissance, lieu_naissance, sexe, nationalite, telephone, email, classe_id, classe:classes(libelle)")
        .eq("parent_id", profil.id)
        .eq("statut", "actif")
        .order("prenom")

      setEnfants((data || []) as unknown as Enfant[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes enfants</h1>
        <p className="text-sm text-gray-500">Consultez les informations de vos enfants</p>
      </div>

      {enfants.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun enfant associé à votre compte.</p>
              <p className="text-xs text-gray-400 mt-1">Contactez l&apos;administration de l&apos;école pour plus d&apos;informations.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {enfants.map((enfant) => (
            <Card key={enfant.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold">
                    {enfant.prenom?.[0] ?? "?"}{enfant.nom?.[0] ?? ""}
                  </div>
                  <div>
                    <p className="text-base font-semibold">{enfant.prenom} {enfant.nom}</p>
                    <p className="text-xs font-normal text-gray-500">{enfant.matricule}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Classe :</span>
                  <span className="font-medium">{enfant.classe?.libelle ?? "Non affecté"}</span>
                </div>
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
                    <span className="text-gray-500">Lieu :</span>
                    <span className="font-medium">{enfant.lieu_naissance}</span>
                  </div>
                )}
                {enfant.sexe && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Sexe :</span>
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
                <div className="pt-2 border-t border-border">
                  <Link
                    href={`/parent/enfants/${enfant.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Voir le détail →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
