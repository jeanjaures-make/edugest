"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react"
import { MobilePaymentButton } from "@/components/paiements/mobile-payment-button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Paiement {
  id: string
  montant: number
  date_paiement: string | null
  date_echeance: string | null
  statut: string
  mode_paiement: string | null
  eleve?: { nom: string; prenom: string } | null
}

export default function ParentPaiementsPage() {
  const [loading, setLoading] = useState(true)
  const [paiements, setPaiements] = useState<Paiement[]>([])

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
        .from("paiements")
        .select("id, montant, date_paiement, date_echeance, statut, mode_paiement, eleve:eleves(nom, prenom)")
        .in("eleve_id", enfantIds)
        .order("date_paiement", { ascending: false })

      setPaiements((data || []) as unknown as Paiement[])
      setLoading(false)
    }
    load()
  }, [])

  const payes = paiements.filter(p => p.statut === "paye")
  const enAttente = paiements.filter(p => p.statut === "en_attente")
  const totalPaye = payes.reduce((sum, p) => sum + (p.montant || 0), 0)
  const totalDu = enAttente.reduce((sum, p) => sum + (p.montant || 0), 0)

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
        <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
        <p className="text-sm text-gray-500">Suivi des paiements de scolarité</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalPaye.toLocaleString("fr-FR")}</p>
              <p className="text-xs text-gray-500">FCFA payés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalDu.toLocaleString("fr-FR")}</p>
              <p className="text-xs text-gray-500">FCFA restants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{paiements.length}</p>
              <p className="text-xs text-gray-500">Total transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile payment for pending echeances */}
      {enAttente.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payer en ligne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {enAttente.map((p) => (
                <div key={p.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium">{p.eleve?.prenom} {p.eleve?.nom}</p>
                    <p className="text-lg font-bold text-red-600">{p.montant?.toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  <MobilePaymentButton
                    montant={p.montant}
                    description={`Paiement scolarité - ${p.eleve?.prenom} ${p.eleve?.nom}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des paiements</CardTitle>
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
                      {p.date_paiement
                        ? `Payé le ${format(new Date(p.date_paiement), "dd MMM yyyy", { locale: fr })}`
                        : p.date_echeance
                        ? `Échéance : ${format(new Date(p.date_echeance), "dd MMM yyyy", { locale: fr })}`
                        : "Date non précisée"}
                    </p>
                    {p.mode_paiement && (
                      <p className="text-xs text-gray-400">Mode : {p.mode_paiement}</p>
                    )}
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
