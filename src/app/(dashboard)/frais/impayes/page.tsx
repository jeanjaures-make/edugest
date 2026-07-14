"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Send, Loader2, Search, TrendingDown, Clock, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Impaye {
  id: string
  eleve_id: string
  montant_total: number
  montant_restant: number
  statut: string
  created_at: string
  eleve?: { nom: string; prenom: string; matricule: string; parent: { telephone: string | null; nom: string; prenom: string | null } | null } | null
  classe?: { libelle: string } | null
}

export default function ImpayesPage() {
  const { profile } = useUser()
  const [loading, setLoading] = useState(true)
  const [impayes, setImpayes] = useState<Impaye[]>([])
  const [search, setSearch] = useState("")
  const [sendingRelance, setSendingRelance] = useState<string | null>(null)
  const [relanceResult, setRelanceResult] = useState<Record<string, { success: boolean; msg: string }>>({})

  const loadImpayes = useCallback(async () => {
    if (!profile?.ecole_id) return
    setLoading(true)

    const { data } = await supabase
      .from("echeanciers")
      .select(`
        id, eleve_id, montant_total, montant_restant, statut, created_at,
        eleve:eleves(nom, prenom, matricule, parent:profils!parent_id(telephone, nom, prenom)),
        classe:classes(libelle)
      `)
      .eq("classe.ecole_id", profile.ecole_id)
      .in("statut", ["en_attente", "partiel"])
      .order("created_at", { ascending: false })

    setImpayes((data || []) as unknown as Impaye[])
    setLoading(false)
  }, [profile])

  useEffect(() => { loadImpayes() }, [loadImpayes])

  async function sendRelance(impaye: Impaye) {
    setSendingRelance(impaye.id)
    const eleveName = `${impaye.eleve?.prenom ?? ""} ${impaye.eleve?.nom ?? ""}`.trim()
    const montant = impaye.montant_restant

    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "notify_eleve",
          eleveId: impaye.eleve_id,
          template: "relancePaiement",
          data: { eleve: eleveName, montant },
        }),
      })
      const data = await res.json()

      setRelanceResult(prev => ({
        ...prev,
        [impaye.id]: data.success
          ? { success: true, msg: "SMS de relance envoyé" }
          : { success: false, msg: data.error || "Échec d'envoi" },
      }))
    } catch {
      setRelanceResult(prev => ({
        ...prev,
        [impaye.id]: { success: false, msg: "Erreur réseau" },
      }))
    }
    setSendingRelance(null)
  }

  async function sendRelanceAll() {
    setSendingRelance("all")
    const promises = filteredImpayes
      .filter(i => i.eleve?.parent?.telephone)
      .map(i => sendRelance(i))
    await Promise.all(promises)
    setSendingRelance(null)
  }

  const filteredImpayes = impayes.filter(i => {
    if (!search) return true
    const name = `${i.eleve?.prenom ?? ""} ${i.eleve?.nom ?? ""}`.toLowerCase()
    return name.includes(search.toLowerCase()) || (i.eleve?.matricule ?? "").toLowerCase().includes(search.toLowerCase())
  })

  const totalImpayes = filteredImpayes.reduce((s, i) => s + (i.montant_restant || 0), 0)
  const totalPartiel = filteredImpayes.filter(i => i.statut === "partiel").length
  const totalEnAttente = filteredImpayes.filter(i => i.statut === "en_attente").length
  const avecTelephone = filteredImpayes.filter(i => i.eleve?.parent?.telephone).length

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suivi des impayés</h1>
          <p className="text-sm text-gray-500">Relances et gestion des retards de paiement</p>
        </div>
        {filteredImpayes.length > 0 && avecTelephone > 0 && (
          <Button onClick={sendRelanceAll} disabled={sendingRelance === "all"}>
            {sendingRelance === "all" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4 mr-2" /> Relancer tous ({avecTelephone})</>}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalImpayes.toLocaleString("fr-FR")}</p>
              <p className="text-xs text-gray-500">FCFA impayés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEnAttente}</p>
              <p className="text-xs text-gray-500">En attente (non commencés)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPartiel}</p>
              <p className="text-xs text-gray-500">Paiements partiels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom ou matricule..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Liste des impayés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Échéances impayées ({filteredImpayes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredImpayes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun impayé. Tous les paiements sont à jour !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredImpayes.map((imp) => {
                const pct = imp.montant_total > 0 ? ((imp.montant_total - imp.montant_restant) / imp.montant_total) * 100 : 0
                const hasPhone = !!imp.eleve?.parent?.telephone
                return (
                  <div key={imp.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 font-bold text-sm">
                          {(imp.eleve?.prenom?.[0] ?? "?")}{(imp.eleve?.nom?.[0] ?? "")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {imp.eleve?.prenom} {imp.eleve?.nom}
                          </p>
                          <p className="text-xs text-gray-500">
                            {imp.eleve?.matricule} · {imp.classe?.libelle ?? "N/A"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Échéance du {format(new Date(imp.created_at), "dd MMM yyyy", { locale: fr })}
                          </p>
                          {imp.eleve?.parent && (
                            <p className="text-xs text-gray-400">
                              Parent : {imp.eleve.parent.prenom} {imp.eleve.parent.nom}
                              {imp.eleve.parent.telephone ? ` · ${imp.eleve.parent.telephone}` : " · Pas de téléphone"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">
                            {imp.montant_restant.toLocaleString("fr-FR")} FCFA
                          </p>
                          <p className="text-xs text-gray-400">
                            sur {imp.montant_total.toLocaleString("fr-FR")}
                          </p>
                        </div>
                        <Badge variant={imp.statut === "partiel" ? "warning" : "danger"}>
                          {imp.statut === "partiel" ? "Partiel" : "En attente"}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="bg-green-500" style={{ width: `${pct}%` }} />
                        <div className="bg-red-500" style={{ width: `${100 - pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>{pct.toFixed(0)}% payé</span>
                        <span>{(100 - pct).toFixed(0)}% restant</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasPhone || sendingRelance === imp.id}
                        onClick={() => sendRelance(imp)}
                      >
                        {sendingRelance === imp.id ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Envoi...</>
                        ) : (
                          <><Send className="h-3.5 w-3.5 mr-1" /> Relancer par SMS</>
                        )}
                      </Button>
                      {!hasPhone && (
                        <span className="text-xs text-gray-400">Pas de numéro de téléphone</span>
                      )}
                      {relanceResult[imp.id] && (
                        <span className={`text-xs ${relanceResult[imp.id].success ? "text-green-600" : "text-red-600"}`}>
                          {relanceResult[imp.id].msg}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
