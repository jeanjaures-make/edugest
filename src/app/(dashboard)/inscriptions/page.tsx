"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, X, Plus, Trash2, Loader2, Download, Search, Printer } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { exportCSV } from "@/lib/export"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"
import { CountUp } from "@/components/animations/count-up"
import { motion } from "framer-motion"
import { staggerContainer, statCardItem } from "@/lib/animations"
import { formatMontant } from "@/lib/utils"

interface InscriptionRow {
  id: string
  eleve_id: string
  eleve_nom: string
  eleve_prenom: string
  classe_libelle: string | null
  date_inscription: string
  frais_inscription: number
  statut: string
}

export default function InscriptionsPage() {
  const { profile } = useUser()
  const [rows, setRows] = useState<InscriptionRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!profile?.ecole_id) return
    const { data } = await supabase
      .from("inscriptions")
      .select(`
        id, eleve_id, date_inscription, frais_inscription, statut,
        eleve:eleves!inner(nom, prenom, ecole_id),
        classe:classes(libelle)
      `)
      .eq("eleve.ecole_id", profile.ecole_id)
      .order("date_inscription", { ascending: false })
    if (data) {
      setRows((data as unknown as { id: string; eleve_id: string; date_inscription: string; frais_inscription: number; statut: string; eleve: { nom: string; prenom: string } | null; classe: { libelle: string } | null }[]).map((r) => ({
        id: r.id,
        eleve_id: r.eleve_id,
        eleve_nom: r.eleve?.nom ?? "",
        eleve_prenom: r.eleve?.prenom ?? "",
        classe_libelle: r.classe?.libelle ?? null,
        date_inscription: r.date_inscription,
        frais_inscription: r.frais_inscription,
        statut: r.statut,
      })))
    }
    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  async function updateStatut(id: string, statut: string) {
    await supabase.from("inscriptions").update({ statut }).eq("id", id); load()
  }

  async function supprimer(id: string) {
    await supabase.from("inscriptions").delete().eq("id", id); load()
  }

  const total = rows.length
  const confirmees = rows.filter((r) => r.statut === "confirmee").length
  const enAttente = rows.filter((r) => r.statut === "en_attente").length
  const montantTotal = rows.reduce((sum, r) => sum + r.frais_inscription, 0)

  function handleExport() {
    exportCSV("inscriptions", ["Eleve", "Classe", "Date", "Frais", "Statut"], rows.map((r) => [
      `${r.eleve_prenom} ${r.eleve_nom}`, r.classe_libelle || "",
      new Date(r.date_inscription).toLocaleDateString("fr-CI"),
      `${r.frais_inscription} FCFA`, r.statut,
    ]))
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Inscriptions</h1>
              <p className="text-sm text-muted-foreground">Gerer les inscriptions des eleves</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exporter</Button>
              <NouvelleInscriptionDialog onCreated={load} ecoleId={profile?.ecole_id} />
            </div>
          </div>
        </FadeInView>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <motion.div variants={statCardItem} custom={0}>
            <Card className="overflow-hidden border-0"><CardContent className="p-4 md:p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <p className="text-xs md:text-sm text-blue-100">Total</p>
              <p className="text-xl md:text-2xl font-bold"><CountUp end={total} /></p>
            </CardContent></Card>
          </motion.div>
          <motion.div variants={statCardItem} custom={1}>
            <Card className="overflow-hidden border-0"><CardContent className="p-4 md:p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
              <p className="text-xs md:text-sm text-emerald-100">Confirmees</p>
              <p className="text-xl md:text-2xl font-bold"><CountUp end={confirmees} /></p>
            </CardContent></Card>
          </motion.div>
          <motion.div variants={statCardItem} custom={2}>
            <Card className="overflow-hidden border-0"><CardContent className="p-4 md:p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <p className="text-xs md:text-sm text-orange-100">En attente</p>
              <p className="text-xl md:text-2xl font-bold"><CountUp end={enAttente} /></p>
            </CardContent></Card>
          </motion.div>
          <motion.div variants={statCardItem} custom={3}>
            <Card className="overflow-hidden border-0"><CardContent className="p-4 md:p-6 bg-gradient-to-br from-violet-600 to-violet-700 text-white">
              <p className="text-xs md:text-sm text-violet-100">Montant total</p>
              <p className="text-xl md:text-2xl font-bold">{formatMontant(montantTotal)}</p>
            </CardContent></Card>
          </motion.div>
        </motion.div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Liste des inscriptions</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Eleve</TableHead><TableHead>Classe</TableHead><TableHead>Date</TableHead><TableHead>Frais</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">Aucune inscription</TableCell></TableRow>
                  ) : rows.map((ins) => (
                    <TableRow key={ins.id}>
                      <TableCell className="font-medium">{ins.eleve_prenom} {ins.eleve_nom}</TableCell>
                      <TableCell>{ins.classe_libelle}</TableCell>
                      <TableCell>{format(new Date(ins.date_inscription), "dd/MM/yyyy", { locale: fr })}</TableCell>
                      <TableCell>{formatMontant(ins.frais_inscription)}</TableCell>
                      <TableCell>
                        <Badge variant={ins.statut === "confirmee" ? "success" : ins.statut === "annulee" ? "danger" : "warning"}>
                          {ins.statut === "confirmee" ? "Confirmee" : ins.statut === "annulee" ? "Annulee" : "En attente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {ins.statut === "en_attente" && (
                            <>
                              <Button variant="ghost" size="icon" className="text-green-600" onClick={() => updateStatut(ins.id, "confirmee")}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-600" onClick={() => updateStatut(ins.id, "annulee")}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Link href={`/inscriptions/recu/${ins.id}`}>
                            <Button variant="ghost" size="icon" className="text-blue-600">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => { if (confirm("Supprimer cette inscription ?")) supprimer(ins.id) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}

function NouvelleInscriptionDialog({ onCreated, ecoleId }: { onCreated: () => void; ecoleId?: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<"eleve" | "creation">("eleve")
  const [eleves, setEleves] = useState<{ id: string; nom: string; prenom: string }[]>([])
  const [search, setSearch] = useState("")
  const [classes, setClasses] = useState<{ id: string; libelle: string; frais_inscription: number; frais_scolarite: number }[]>([])
  const [eleve_id, setEleveId] = useState("")
  const [classe_id, setClasseId] = useState("")
  const [frais_inscription, setFrais] = useState(0)

  const [newForm, setNewForm] = useState({
    nom: "", prenom: "", date_naissance: "", lieu_naissance: "", sexe: "",
    nationalite: "Ivoirienne", adresse: "", telephone: "", email: "",
  })

  useEffect(() => {
    if (!ecoleId || !open) return
    Promise.all([
      supabase.from("eleves").select("id, nom, prenom").eq("ecole_id", ecoleId).eq("statut", "actif").order("nom"),
      supabase.from("classes").select("id, libelle, frais_inscription, frais_scolarite").eq("ecole_id", ecoleId).order("libelle"),
    ]).then(([elevesRes, classesRes]) => {
      if (elevesRes.data) setEleves(elevesRes.data)
      if (classesRes.data) setClasses(classesRes.data)
    })
  }, [ecoleId, open])

  useEffect(() => {
    const c = classes.find((c) => c.id === classe_id)
    if (c) setFrais(c.frais_inscription)
  }, [classe_id, classes])

  const filteredEleves = eleves.filter((e) =>
    `${e.prenom} ${e.nom}`.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!classe_id || !ecoleId) return
    setSaving(true)

    let finalEleveId = eleve_id

    if (step === "creation") {
      if (!newForm.nom || !newForm.prenom) { setSaving(false); return }
      const res = await fetch("/api/eleves/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newForm, classe_id }),
      })
      const data = await res.json()
      if (!res.ok) { setSaving(false); return }
      finalEleveId = data.eleve.id
    }

    if (!finalEleveId) { setSaving(false); return }

    const { data: annees } = await supabase
      .from("annees_scolaires").select("id").eq("ecole_id", ecoleId).eq("active", true).single()

    const { error } = await supabase.from("inscriptions").insert({
      eleve_id: finalEleveId, classe_id,
      annee_scolaire_id: annees?.id || null,
      frais_inscription,
      statut: "en_attente",
    })

    setSaving(false)
    if (!error) {
      setOpen(false)
      setStep("eleve"); setEleveId(""); setClasseId(""); setFrais(0)
      setNewForm({ nom: "", prenom: "", date_naissance: "", lieu_naissance: "", sexe: "", nationalite: "Ivoirienne", adresse: "", telephone: "", email: "" })
      onCreated()
    }
  }

  function update(field: string, value: string) {
    setNewForm((prev) => ({ ...prev, [field]: value }))
  }

  const selectedClasse = classes.find((c) => c.id === classe_id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle inscription</DialogTitle>
          <DialogDescription>Inscrire un eleve dans une classe</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step selector */}
          <div className="flex gap-2 p-1 rounded-lg bg-gray-100">
            <button type="button" className={`flex-1 py-2 px-3 text-sm rounded-md font-medium transition-colors ${step === "eleve" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => setStep("eleve")}>
              Eleve existant
            </button>
            <button type="button" className={`flex-1 py-2 px-3 text-sm rounded-md font-medium transition-colors ${step === "creation" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              onClick={() => setStep("creation")}>
              Nouvel eleve
            </button>
          </div>

          {step === "eleve" ? (
            <div className="space-y-2">
              <Label>Eleve</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un eleve..." />
              </div>
              <select size={Math.min(5, filteredEleves.length) || 1} required
                className="flex h-auto w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={eleve_id} onChange={(e) => setEleveId(e.target.value)}>
                {filteredEleves.length === 0 && <option value="">Aucun eleve trouve</option>}
                {filteredEleves.map((e) => (
                  <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nom *</Label>
                <Input required value={newForm.nom} onChange={(e) => update("nom", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Prenom *</Label>
                <Input required value={newForm.prenom} onChange={(e) => update("prenom", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Date naissance</Label>
                <Input type="date" value={newForm.date_naissance} onChange={(e) => update("date_naissance", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Lieu naissance</Label>
                <Input value={newForm.lieu_naissance} onChange={(e) => update("lieu_naissance", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Sexe</Label>
                <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={newForm.sexe} onChange={(e) => update("sexe", e.target.value)}>
                  <option value="">-</option>
                  <option value="M">Masculin</option>
                  <option value="F">Feminin</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Nationalite</Label>
                <Input value={newForm.nationalite} onChange={(e) => update("nationalite", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Telephone</Label>
                <Input value={newForm.telephone} onChange={(e) => update("telephone", e.target.value)} />
              </div>
            </div>
          )}

          {/* Classe + Frais */}
          <div className="space-y-2">
            <Label>Classe</Label>
            <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={classe_id} onChange={(e) => setClasseId(e.target.value)}>
              <option value="">Selectionner une classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.libelle}</option>
              ))}
            </select>
          </div>

          {selectedClasse && (
            <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Frais d&apos;inscription</span>
                <span className="font-bold">{formatMontant(selectedClasse.frais_inscription)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scolarite annuelle</span>
                <span className="font-bold">{formatMontant(selectedClasse.frais_scolarite)}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label>Montant inscription (FCFA)</Label>
            <Input type="number" value={frais_inscription} onChange={(e) => setFrais(Number(e.target.value))} />
          </div>

          <Button type="submit" className="w-full" disabled={saving || !classe_id || (step === "eleve" && !eleve_id)}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Inscription...</> : <><Plus className="h-4 w-4 mr-2" />Inscrire</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
