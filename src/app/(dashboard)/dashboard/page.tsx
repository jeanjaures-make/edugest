"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/dashboard/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users, UserPlus, DollarSign, GraduationCap,
  AlertTriangle, TrendingUp, Calendar, Activity,
} from "lucide-react"
import { motion } from "framer-motion"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"
import { StaggerChildren } from "@/components/animations/stagger-children"
import { staggerContainer, statCardItem } from "@/lib/animations"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { formatMontant } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Nouvelle inscription": UserPlus,
  "Paiement reçu": DollarSign,
  "Bulletin généré": GraduationCap,
  "Absence signalée": AlertTriangle,
  "Réunion programmée": Calendar,
}

const activityColors: Record<string, string> = {
  "Nouvelle inscription": "bg-blue-500",
  "Paiement reçu": "bg-green-500",
  "Bulletin généré": "bg-purple-500",
  "Absence signalée": "bg-orange-500",
  "Réunion programmée": "bg-violet-500",
}

const mois = ["Sep", "Oct", "Nov", "Déc", "Jan", "Fév", "Mar", "Avr", "Mai", "Jun"]

export default function DashboardPage() {
  const { profile } = useUser()
  const [loading, setLoading] = useState(true)
  const [totalEleves, setTotalEleves] = useState(0)
  const [totalInscriptions, setTotalInscriptions] = useState(0)
  const [tauxPresence, setTauxPresence] = useState(0)
  const [totalImpayes, setTotalImpayes] = useState(0)
  const [chartData, setChartData] = useState<{ month: string; inscriptions: number }[]>([])
  const [activites, setActivites] = useState<{ action: string; detail: string; time: string }[]>([])
  const [repartition, setRepartition] = useState<{ niveau: string; garcons: number; filles: number }[]>([])
  const [anneeCourante, setAnneeCourante] = useState("")

  useEffect(() => {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return

    async function load() {
      const [
        { count: elevesCount },
        { data: inscriptionsData },
        { data: presencesData },
        { data: echeanciersData },
        { data: inscriptionsAnnee },
        { data: paiementsRecents },
        { data: inscriptionsRecentes },
        { data: niveauxData },
        { data: annee },
      ] = await Promise.all([
        supabase.from("eleves").select("*", { count: "exact", head: true }).eq("ecole_id", ecoleId).eq("statut", "actif"),
        supabase.from("inscriptions").select("*, eleve:eleves!inner(ecole_id)").eq("eleve.ecole_id", ecoleId),
        supabase.from("presences").select("statut").eq("classe_id", ecoleId),
        supabase.from("echeanciers").select("montant_restant").eq("...classe_id", ecoleId),
        supabase.from("inscriptions").select("created_at, eleve:eleves!inner(ecole_id)").eq("eleve.ecole_id", ecoleId).gte("created_at", new Date(new Date().getFullYear(), 8, 1).toISOString()),
        supabase.from("paiements").select("montant, methode, created_at, eleve:eleves!inner(nom, prenom, ecole_id)").eq("eleve.ecole_id", ecoleId).order("created_at", { ascending: false }).limit(10),
        supabase.from("inscriptions").select("created_at, eleve:eleves!inner(nom, prenom, ecole_id), classe:classes!inner(libelle)").eq("eleve.ecole_id", ecoleId).order("created_at", { ascending: false }).limit(5),
        supabase.from("niveaux").select("id, libelle").eq("ecole_id", ecoleId).order("ordre"),
        supabase.from("annees_scolaires").select("libelle").eq("ecole_id", ecoleId).eq("active", true).single(),
      ])

      if (elevesCount !== null) setTotalEleves(elevesCount || 0)
      if (inscriptionsData) setTotalInscriptions(inscriptionsData.length)

      if (presencesData && presencesData.length > 0) {
        const presents = (presencesData as unknown as { statut: string }[]).filter((p) => p.statut === "present" || p.statut === "retard").length
        setTauxPresence(Math.round((presents / presencesData.length) * 100))
      }

      if (echeanciersData) {
        const total = (echeanciersData as unknown as { montant_restant: number }[]).reduce((s: number, e) => s + (e.montant_restant || 0), 0)
        setTotalImpayes(total)
      }

      if (inscriptionsAnnee) {
        const counts = mois.map((m) => ({
          month: m,
          inscriptions: (inscriptionsAnnee as unknown as { created_at: string }[]).filter((i) => {
            const d = new Date(i.created_at)
            return d.getMonth() === mois.indexOf(m) + 8 || (mois.indexOf(m) < 4 && d.getFullYear() === new Date().getFullYear() + 1)
          }).length,
        }))
        setChartData(counts)
      }

      if (annee) setAnneeCourante(annee.libelle)

      const acts: { action: string; detail: string; time: string }[] = []

      if (paiementsRecents) {
        (paiementsRecents as unknown as { montant: number; methode: string; created_at: string; eleve: { nom: string; prenom: string } | null }[]).forEach((p) => {
          acts.push({
            action: "Paiement reçu",
            detail: `${p.methode === "orange_money" ? "Orange Money" : p.methode === "mtn_momo" ? "MTN MoMo" : p.methode} - ${formatMontant(p.montant)}`,
            time: format(new Date(p.created_at), "dd/MM HH:mm", { locale: fr }),
          })
        })
      }
      if (inscriptionsRecentes) {
        (inscriptionsRecentes as unknown as { created_at: string; eleve: { nom: string; prenom: string } | null; classe: { libelle: string } | null }[]).forEach((i) => {
          const nom = `${i.eleve?.prenom || ""} ${i.eleve?.nom || ""}`
          acts.push({
            action: "Nouvelle inscription",
            detail: `${nom} - ${i.classe?.libelle || ""}`,
            time: format(new Date(i.created_at), "dd/MM HH:mm", { locale: fr }),
          })
        })
      }
      acts.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10)
      setActivites(acts)

      if (niveauxData && elevesCount) {
        const niveauIds = (niveauxData as unknown as { id: string; libelle: string }[]).map((n) => n.id)
        const { data: classesData } = await supabase
          .from("classes")
          .select("id, niveau_id")
          .in("niveau_id", niveauIds)
          .eq("ecole_id", ecoleId)
        if (classesData) {
          const classeIds = (classesData as unknown as { id: string; niveau_id: string }[]).map((c) => c.id)
          const { data: elevesParClasse } = await supabase
            .from("eleves")
            .select("classe_id, sexe")
            .in("classe_id", classeIds)
            .eq("ecole_id", ecoleId)
            .eq("statut", "actif")
          if (elevesParClasse) {
            const niveauMap = new Map((classesData as unknown as { id: string; niveau_id: string }[]).map((c) => [c.id, c.niveau_id]))
            const niveauLibelle = new Map((niveauxData as unknown as { id: string; libelle: string }[]).map((n) => [n.id, n.libelle]))
            const parNiveau: Record<string, { garcons: number; filles: number }> = {}
            for (const e of elevesParClasse) {
              const nId = niveauMap.get(e.classe_id)
              const lib = nId ? niveauLibelle.get(nId) || "" : ""
              if (!parNiveau[lib]) parNiveau[lib] = { garcons: 0, filles: 0 }
              if (e.sexe === "M") parNiveau[lib].garcons++
              else parNiveau[lib].filles++
            }
            setRepartition(Object.entries(parNiveau).map(([niveau, v]) => ({ niveau, ...v })))
          }
        }
      }

      setLoading(false)
    }

    load()
  }, [profile])

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
              <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de votre établissement</p>
            </div>
            {anneeCourante && (
              <Badge variant="gradient" size="lg" className="hidden sm:inline-flex">
                {anneeCourante}
              </Badge>
            )}
          </div>
        </FadeInView>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={statCardItem} custom={0}>
              <StatCard label="Effectif total" value={totalEleves} icon={Users} gradient="blue" delay={0} />
            </motion.div>
            <motion.div variants={statCardItem} custom={1}>
              <StatCard label="Nouvelles inscriptions" value={totalInscriptions} icon={UserPlus} gradient="green" delay={0.1} />
            </motion.div>
            <motion.div variants={statCardItem} custom={2}>
              <StatCard label="Taux de présence" value={`${tauxPresence}%`} icon={GraduationCap} gradient="orange" delay={0.2} />
            </motion.div>
            <motion.div variants={statCardItem} custom={3}>
              <StatCard label="Impayés" value={formatMontant(totalImpayes)} icon={DollarSign} gradient="purple" delay={0.3} />
            </motion.div>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-7">
          <FadeInView className="lg:col-span-4" delay={0.2}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Inscriptions</CardTitle>
                  <p className="text-sm text-muted-foreground">Évolution sur l&apos;année scolaire</p>
                </div>
                <Badge variant="info" dot>En direct</Badge>
              </CardHeader>
              <CardContent>
                <div className="relative h-64">
                  <div className="absolute inset-0 flex items-end justify-between gap-2">
                    {chartData.length === 0 && !loading ? (
                      <div className="flex w-full h-full items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
                    ) : chartData.map((item, i) => {
                      const maxVal = Math.max(...chartData.map((d) => d.inscriptions), 1)
                      return (
                        <motion.div
                          key={item.month}
                          className="flex flex-col items-center gap-2 flex-1"
                        >
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(item.inscriptions / maxVal) * 100}%` }}
                            transition={{ delay: 0.5 + i * 0.05, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
                            className="w-full max-w-[32px] rounded-lg bg-gradient-to-t from-primary to-blue-400 relative group cursor-pointer"
                            whileHover={{ scale: 1.05, opacity: 0.9 }}
                          >
                            <motion.div
                              initial={{ opacity: 0 }}
                              whileHover={{ opacity: 1 }}
                              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap"
                            >
                              {item.inscriptions} inscrits
                            </motion.div>
                          </motion.div>
                          <span className="text-xs text-muted-foreground">{item.month}</span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeInView>

          <FadeInView className="lg:col-span-3" delay={0.3}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Activités récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <StaggerChildren className="space-y-0">
                  {activites.length === 0 && !loading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Aucune activité récente</p>
                  ) : activites.map((item, i) => {
                    const Icon = activityIcons[item.action] || Activity
                    const color = activityColors[item.action] || "bg-gray-500"
                    return (
                      <motion.div
                        key={i}
                        variants={{
                          hidden: { opacity: 0, x: -8 },
                          visible: { opacity: 1, x: 0 },
                        }}
                        className="flex items-center gap-3 border-b border-border/50 py-3 last:border-0 group"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}/10`}>
                          <Icon className={`h-4 w-4 ${color.replace("bg-", "text-")}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.action}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                      </motion.div>
                    )
                  })}
                </StaggerChildren>
              </CardContent>
            </Card>
          </FadeInView>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <FadeInView delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition par niveau</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>
                ) : repartition.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun élève inscrit</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {repartition.map((item, i) => {
                        const total = item.garcons + item.filles
                        const pctG = total > 0 ? (item.garcons / total) * 100 : 0
                        return (
                          <motion.div
                            key={item.niveau}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="font-medium w-16 text-foreground">{item.niveau}</span>
                            <div className="flex-1 mx-4">
                              <div className="flex h-2.5 rounded-full bg-muted overflow-hidden">
                                <motion.div
                                  className="bg-primary"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pctG}%` }}
                                  transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
                                />
                                <motion.div
                                  className="bg-secondary"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${100 - pctG}%` }}
                                  transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
                                />
                              </div>
                            </div>
                            <span className="text-muted-foreground text-xs w-16 text-right">{total} élèves</span>
                          </motion.div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded bg-primary" />
                        Garçons
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="h-2.5 w-2.5 rounded bg-secondary" />
                        Filles
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </FadeInView>

          <FadeInView delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alertes & Échéances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alertes</p>
                      {totalImpayes > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 rounded-lg p-3 border border-border/50 bg-red-50/50"
                        >
                          <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-red-800">{totalImpayes.toLocaleString()} FCFA d&apos;impayés</p>
                            <p className="text-xs text-red-600 mt-0.5">Relances nécessaires</p>
                          </div>
                        </motion.div>
                      )}
                      {totalImpayes === 0 && (
                        <div className="flex items-start gap-3 rounded-lg p-3 border border-border/50 bg-green-50/50">
                          <TrendingUp className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-green-800">Aucun impayé en cours</p>
                            <p className="text-xs text-green-600 mt-0.5">Tous les paiements sont à jour</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Échéances</p>
                      <p className="text-sm text-muted-foreground">Consultez le calendrier pour voir les échéances</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </FadeInView>
        </div>
      </div>
    </PageTransition>
  )
}
