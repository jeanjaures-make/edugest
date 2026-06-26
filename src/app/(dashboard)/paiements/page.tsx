"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"
import { FileText, Printer } from "lucide-react"
import { formatMontant } from "@/lib/utils"
import { exportCSV } from "@/lib/export"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { staggerContainer, statCardItem } from "@/lib/animations"
import { PaiementDialog } from "./paiement-dialog"

interface PaiementRow {
  id: string
  reference: string
  montant: number
  methode: string
  statut: string
  telephone: string | null
  date_paiement: string
  eleve_nom: string
  eleve_prenom: string
}

const methodes: Record<string, string> = {
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  especes: "Espèces",
  virement: "Virement",
  cheque: "Chèque",
}

const statutVariants: Record<string, "success" | "danger" | "warning"> = {
  confirme: "success",
  echoue: "danger",
  en_attente: "warning",
}

const statutLabels: Record<string, string> = {
  confirme: "Confirmé",
  echoue: "Échoué",
  en_attente: "En attente",
}

export default function PaiementsPage() {
  const { profile } = useUser()
  const [paiements, setPaiements] = useState<PaiementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ mois: 0, orange_money: 0, mtn_momo: 0, especes: 0 })
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    if (!profile?.ecole_id) return
    const { data } = await supabase
      .from("paiements")
      .select("id, reference, montant, methode, statut, telephone, date_paiement, eleve:eleves(nom, prenom)")
      .order("date_paiement", { ascending: false })

    if (data) {
      const rows: PaiementRow[] = (data as unknown as { id: string; reference: string; montant: number; methode: string; statut: string; telephone: string | null; date_paiement: string; eleve: { nom: string; prenom: string } | null }[]).map((p) => ({
        id: p.id,
        reference: p.reference,
        montant: p.montant,
        methode: p.methode,
        statut: p.statut,
        telephone: p.telephone,
        date_paiement: p.date_paiement,
        eleve_nom: p.eleve?.nom ?? "",
        eleve_prenom: p.eleve?.prenom ?? "",
      }))
      setPaiements(rows)

      const now = new Date()
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const confirmes = rows.filter((p) => p.statut === "confirme")
      const duMois = confirmes.filter((p) => p.date_paiement >= debutMois)
      setStats({
        mois: duMois.reduce((s, p) => s + p.montant, 0),
        orange_money: duMois.filter((p) => p.methode === "orange_money").reduce((s, p) => s + p.montant, 0),
        mtn_momo: duMois.filter((p) => p.methode === "mtn_momo").reduce((s, p) => s + p.montant, 0),
        especes: duMois.filter((p) => p.methode === "especes").reduce((s, p) => s + p.montant, 0),
      })
    }
    setLoading(false)
  }, [profile?.ecole_id])

  useEffect(() => { load() }, [load, refreshKey])

  useEffect(() => {
    if (profile === null) {
      const timer = setTimeout(() => { if (loading) setLoading(false) }, 3000)
      return () => clearTimeout(timer)
    }
  }, [profile, loading])

  function handleExport() {
    exportCSV("paiements",
      ["Référence", "Élève", "Montant", "Méthode", "Statut", "Date"],
      paiements.map((p) => [
        p.reference, `${p.eleve_prenom} ${p.eleve_nom}`,
        `${p.montant} FCFA`, methodes[p.methode] || p.methode,
        statutLabels[p.statut] || p.statut,
        new Date(p.date_paiement).toLocaleDateString("fr-CI"),
      ])
    )
  }

  const columns: Column<PaiementRow>[] = [
    {
      key: "reference",
      label: "Réf.",
      sortable: true,
      hideOnMobile: true,
      cell: (p) => <span className="font-mono text-xs text-muted-foreground">{p.reference}</span>,
    },
    {
      key: "eleve",
      label: "Élève",
      sortable: true,
      cell: (p) => <span className="font-medium">{p.eleve_nom} {p.eleve_prenom}</span>,
    },
    {
      key: "montant",
      label: "Montant",
      sortable: true,
      cell: (p) => <span className="font-bold text-foreground">{formatMontant(p.montant)}</span>,
    },
    {
      key: "methode",
      label: "Méthode",
      sortable: true,
      cell: (p) => (
        <Badge variant="info" size="sm">
          {methodes[p.methode] || p.methode}
        </Badge>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      hideOnMobile: true,
      cell: (p) => new Date(p.date_paiement).toLocaleDateString("fr-CI"),
    },
    {
      key: "statut",
      label: "Statut",
      sortable: true,
      cell: (p) => (
        <Badge variant={statutVariants[p.statut] || "default"} dot>
          {statutLabels[p.statut] || p.statut}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      cell: (p) => (
        <Link href={`/paiements/recu/${p.id}`}>
          <Button variant="ghost" size="icon" className="text-blue-600">
            <Printer className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ]

  const StatCardSkeleton = () => (
    <Card><CardContent className="p-4 md:p-6"><Skeleton className="h-3 w-20 mb-2" /><Skeleton className="h-6 w-24 md:h-8" /></CardContent></Card>
  )

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Paiements</h1>
              <p className="text-sm text-muted-foreground">Suivi des paiements et encaissements</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <FileText className="h-4 w-4 mr-2" />Exporter
              </Button>
              <PaiementDialog
                ecoleId={profile?.ecole_id}
                onSuccess={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>
        </FadeInView>

        {loading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 grid-cols-2 md:grid-cols-4"
          >
            <motion.div variants={statCardItem} custom={0}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                  <p className="text-xs md:text-sm text-emerald-100">Encaissements du mois</p>
                  <p className="text-lg md:text-2xl font-bold text-white truncate">
                    {formatMontant(stats.mois)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={statCardItem} custom={1}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <p className="text-xs md:text-sm text-orange-100">Orange Money</p>
                  <p className="text-lg md:text-2xl font-bold text-white truncate">
                    {formatMontant(stats.orange_money)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={statCardItem} custom={2}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                  <p className="text-xs md:text-sm text-yellow-100">MTN MoMo</p>
                  <p className="text-lg md:text-2xl font-bold text-white truncate">
                    {formatMontant(stats.mtn_momo)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={statCardItem} custom={3}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                  <p className="text-xs md:text-sm text-blue-100">En espèces</p>
                  <p className="text-lg md:text-2xl font-bold text-white truncate">
                    {formatMontant(stats.especes)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        <Card>
          <CardContent className="p-4 md:p-6">
            <DataTable
              columns={columns}
              data={paiements}
              loading={loading}
              searchPlaceholder="Rechercher par référence ou élève..."
              emptyMessage="Aucun paiement trouvé"
              getRowKey={(p) => p.id}
              pageSize={10}
              mobileCard={(p) => (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{p.eleve_nom} {p.eleve_prenom}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.reference}</p>
                    </div>
                    <Badge variant={statutVariants[p.statut] || "default"} size="sm" dot>
                      {statutLabels[p.statut] || p.statut}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="info" size="sm">{methodes[p.methode] || p.methode}</Badge>
                      <span>{new Date(p.date_paiement).toLocaleDateString("fr-CI")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{formatMontant(p.montant)}</span>
                      <Link href={`/paiements/recu/${p.id}`}>
                        <Button variant="ghost" size="icon" className="text-blue-600 h-8 w-8">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
