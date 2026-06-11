"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"
import { Plus, Download } from "lucide-react"
import { CountUp } from "@/components/animations/count-up"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { exportCSV } from "@/lib/export"
import { motion } from "framer-motion"
import { staggerContainer, statCardItem } from "@/lib/animations"
import { Skeleton } from "@/components/ui/skeleton"

interface EleveRow {
  id: string
  matricule: string
  nom: string
  prenom: string
  sexe: string | null
  statut: string
  classe_libelle: string | null
}

export default function ElevesPage() {
  const { profile } = useUser()
  const [eleves, setEleves] = useState<EleveRow[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, actifs: 0, garcons: 0, filles: 0 })

  useEffect(() => {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    async function load() {
      const { data } = await supabase
        .from("eleves")
        .select("id, matricule, nom, prenom, sexe, statut, classe:classes(libelle)")
        .eq("ecole_id", ecoleId)
        .order("nom", { ascending: true })
      if (data) {
        const rows = data.map((e: any) => ({
          id: e.id,
          matricule: e.matricule,
          nom: e.nom,
          prenom: e.prenom,
          sexe: e.sexe,
          statut: e.statut,
          classe_libelle: e.classe?.libelle ?? null,
        }))
        setEleves(rows)
        setStats({
          total: rows.length,
          actifs: rows.filter((r) => r.statut === "actif").length,
          garcons: rows.filter((r) => r.sexe === "M").length,
          filles: rows.filter((r) => r.sexe === "F").length,
        })
      }
      setLoading(false)
    }
    load()
  }, [profile])

  function handleExport() {
    exportCSV("eleves",
      ["Matricule", "Nom", "Prénom", "Sexe", "Classe", "Statut"],
      eleves.map((e) => [e.matricule, e.nom, e.prenom, e.sexe || "", e.classe_libelle || "", e.statut])
    )
  }

  const columns: Column<EleveRow>[] = [
    {
      key: "matricule",
      label: "Matricule",
      sortable: true,
      hideOnMobile: true,
      cell: (e) => <span className="font-mono text-xs text-muted-foreground">{e.matricule}</span>,
    },
    {
      key: "nom",
      label: "Nom",
      sortable: true,
      cell: (e) => <span className="font-medium">{e.nom}</span>,
    },
    {
      key: "prenom",
      label: "Prénom",
      sortable: true,
      cell: (e) => e.prenom,
    },
    {
      key: "classe",
      label: "Classe",
      sortable: true,
      cell: (e) => e.classe_libelle ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: "sexe",
      label: "Sexe",
      sortable: true,
      hideOnMobile: true,
      cell: (e) => e.sexe === "M" ? "Masculin" : e.sexe === "F" ? "Féminin" : "—",
    },
    {
      key: "statut",
      label: "Statut",
      sortable: true,
      cell: (e) => (
        <Badge variant={e.statut === "actif" ? "success" : "warning"} dot>
          {e.statut === "actif" ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Élèves</h1>
              <p className="text-sm text-muted-foreground">Gestion des dossiers élèves</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />Exporter
              </Button>
              <Link href="/eleves/nouveau">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />Nouvel élève
                </Button>
              </Link>
            </div>
          </div>
        </FadeInView>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))}
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
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                  <p className="text-xs md:text-sm text-blue-100">Total</p>
                  <p className="text-xl md:text-2xl font-bold"><CountUp end={stats.total} /></p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={statCardItem} custom={1}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                  <p className="text-xs md:text-sm text-emerald-100">Actifs</p>
                  <p className="text-xl md:text-2xl font-bold"><CountUp end={stats.actifs} /></p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={statCardItem} custom={2}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-violet-600 to-violet-700 text-white">
                  <p className="text-xs md:text-sm text-violet-100">Garçons</p>
                  <p className="text-xl md:text-2xl font-bold"><CountUp end={stats.garcons} /></p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={statCardItem} custom={3}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <p className="text-xs md:text-sm text-orange-100">Filles</p>
                  <p className="text-xl md:text-2xl font-bold"><CountUp end={stats.filles} /></p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        <Card>
          <CardContent className="p-4 md:p-6">
            <DataTable
              columns={columns}
              data={eleves}
              loading={loading}
              searchPlaceholder="Rechercher un élève (nom, prénom, matricule)..."
              emptyMessage="Aucun élève trouvé"
              getRowKey={(e) => e.id}
              onRowClick={(e) => window.location.href = `/eleves/${e.id}`}
              pageSize={10}
              mobileCard={(e) => (
                <Link href={`/eleves/${e.id}`} className="block">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary text-xs font-bold">
                        {e.prenom.charAt(0)}{e.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{e.nom} {e.prenom}</p>
                        <p className="text-xs text-muted-foreground">{e.matricule}</p>
                      </div>
                    </div>
                    <Badge variant={e.statut === "actif" ? "success" : "warning"} size="sm">
                      {e.statut === "actif" ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{e.classe_libelle || "—"}</span>
                    <span>{e.sexe === "M" ? "Masculin" : e.sexe === "F" ? "Féminin" : "—"}</span>
                  </div>
                </Link>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
