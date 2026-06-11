"use client"

import { useEffect, useState, useRef, useEffectEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"
import { CountUp } from "@/components/animations/count-up"
import { motion } from "framer-motion"
import { staggerContainer, statCardItem } from "@/lib/animations"
import { Save, Plus, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"


interface ClasseItem { id: string; libelle: string }
interface MatiereItem { id: string; libelle: string; coefficient: number }
interface EleveItem { id: string; nom: string; prenom: string }
interface NoteRow { id?: string; eleve_id: string; note: string; appreciation: string }
interface EvalItem { id: string; libelle: string; type: string; coefficient: number; date: string }

export default function NotesPage() {
  const { profile } = useUser()
  const [classes, setClasses] = useState<ClasseItem[]>([])
  const [matieres, setMatieres] = useState<MatiereItem[]>([])
  const [eleves, setEleves] = useState<EleveItem[]>([])
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [evals, setEvals] = useState<EvalItem[]>([])
  const [loading, setLoading] = useState(true)

  const [classeId, setClasseId] = useState("")
  const [matiereId, setMatiereId] = useState("")
  const [trimestre, setTrimestre] = useState("1")
  const [selectedEvalId, setSelectedEvalId] = useState("")
  const [evalType, setEvalType] = useState("devoir")
  const [evalLibelle, setEvalLibelle] = useState("")
  const [evalCoeff, setEvalCoeff] = useState("1")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)
  const noteRefs = useRef<(HTMLInputElement | null)[]>([])

  const onLoadInitial = useEffectEvent(() => {
    if (!profile?.ecole_id) { setLoading(false); return }
    Promise.all([
      supabase.from("classes").select("id, libelle").eq("ecole_id", profile.ecole_id).order("libelle"),
      supabase.from("matieres").select("id, libelle, coefficient").eq("ecole_id", profile.ecole_id).order("libelle"),
    ]).then(([c, m]) => {
      if (c.data) setClasses(c.data)
      if (m.data) setMatieres(m.data)
      setLoading(false)
    })
  })
  useEffect(() => { onLoadInitial() }, [])

  const onClasseIdChange = useEffectEvent(() => {
    if (!classeId) { setEleves([]); setNotes([]); return }
    supabase.from("eleves").select("id, nom, prenom").eq("classe_id", classeId).eq("statut", "actif").order("nom").then(({ data }) => {
      if (data) {
        setEleves(data)
        setNotes(data.map((e) => ({ eleve_id: e.id, note: "", appreciation: "" })))
      }
    })
  })
  useEffect(() => { onClasseIdChange() }, [classeId])

  const onFiltersChange = useEffectEvent(() => {
    if (!classeId || !matiereId) { setEvals([]); setSelectedEvalId(""); return }
    supabase.from("evaluations").select("id, libelle, type, coefficient, date")
      .eq("classe_id", classeId).eq("matiere_id", matiereId).eq("trimestre", parseInt(trimestre))
      .order("date", { ascending: false }).then(({ data }) => {
        setEvals(data ?? [])
        setSelectedEvalId("")
      })
  })
  useEffect(() => { onFiltersChange() }, [classeId, matiereId, trimestre])

  const onEvalChange = useEffectEvent(() => {
    if (!selectedEvalId) return
    supabase.from("notes").select("*").eq("evaluation_id", selectedEvalId).then(({ data }) => {
      if (data && data.length > 0) {
        setNotes((prev) => prev.map((n) => {
          const found = data.find((d) => d.eleve_id === n.eleve_id)
          return found ? { ...n, id: found.id, note: String(found.valeur), appreciation: found.appreciation ?? "" } : n
        }))
      } else {
        setNotes((prev) => prev.map((n) => ({ ...n, id: undefined, note: "", appreciation: "" })))
      }
    })
  })
  useEffect(() => { onEvalChange() }, [selectedEvalId])

  async function createEvaluation() {
    if (!profile?.ecole_id || !classeId || !matiereId || !evalLibelle) return
    const { data: annee } = await supabase
      .from("annees_scolaires").select("id").eq("ecole_id", profile.ecole_id).eq("active", true).single()
    const { data } = await supabase.from("evaluations").insert({
      classe_id: classeId, matiere_id: matiereId,
      type: evalType, libelle: evalLibelle,
      coefficient: parseInt(evalCoeff) || 1,
      trimestre: parseInt(trimestre),
      annee_scolaire_id: annee?.id ?? null,
      date: new Date().toISOString().split("T")[0],
    }).select().single()
    if (data) {
      setEvals((prev) => [data as EvalItem, ...prev])
      setSelectedEvalId(data.id)
      setEvalLibelle("")
      setMessage({ text: "Evaluation creee et selectionnee", type: "success" })
    }
  }

  function updateNote(eleveId: string, field: "note" | "appreciation", value: string) {
    setNotes((prev) => prev.map((n) => n.eleve_id === eleveId ? { ...n, [field]: value } : n))
  }

  function handleNoteKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      const next = noteRefs.current[index + 1]
      if (next) next.focus()
    }
  }

  async function saveNotes() {
    if (!selectedEvalId) return
    setSaving(true)
    setMessage(null)
    let count = 0
    for (const n of notes) {
      if (n.note === "") continue
      const payload = {
        eleve_id: n.eleve_id,
        evaluation_id: selectedEvalId,
        valeur: parseFloat(n.note),
        appreciation: n.appreciation || null,
      }
      if (n.id) {
        const { error } = await supabase.from("notes").update(payload).eq("id", n.id)
        if (error) { setMessage({ text: error.message, type: "error" }); setSaving(false); return }
      } else {
        const { error } = await supabase.from("notes").insert(payload)
        if (error) { setMessage({ text: error.message, type: "error" }); setSaving(false); return }
      }
      count++
    }
    setSaving(false)
    setMessage({ text: `${count} note(s) enregistree(s)`, type: "success" })
    supabase.from("notes").select("*").eq("evaluation_id", selectedEvalId).then(({ data }) => {
      if (data) {
        setNotes((prev) => prev.map((n) => {
          const found = data.find((d) => d.eleve_id === n.eleve_id)
          return found ? { ...n, id: found.id, note: String(found.valeur), appreciation: found.appreciation ?? "" } : n
        }))
      }
    })
  }

  const saisies = notes.filter((n) => n.note !== "").length
  const moy = saisies > 0 ? (notes.reduce((s, n) => s + (n.note ? parseFloat(n.note) : 0), 0) / saisies) : 0

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saisie des notes</h1>
            <p className="text-sm text-muted-foreground">Saisir les notes par classe et matiere</p>
          </div>
        </FadeInView>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <motion.div variants={statCardItem} custom={0}>
            <Card className="overflow-hidden border-0">
              <CardContent className="p-4 md:p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <p className="text-xs md:text-sm text-blue-100">Eleves</p>
                <p className="text-xl md:text-2xl font-bold"><CountUp end={eleves.length} /></p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={statCardItem} custom={1}>
            <Card className="overflow-hidden border-0">
              <CardContent className="p-4 md:p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                <p className="text-xs md:text-sm text-emerald-100">Notes saisies</p>
                <p className="text-xl md:text-2xl font-bold"><CountUp end={saisies} /></p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={statCardItem} custom={2}>
            <Card className="overflow-hidden border-0">
              <CardContent className="p-4 md:p-6 bg-gradient-to-br from-violet-600 to-violet-700 text-white">
                <p className="text-xs md:text-sm text-violet-100">Moyenne</p>
                <p className="text-xl md:text-2xl font-bold">{moy > 0 ? moy.toFixed(1) : "-"}/20</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={statCardItem} custom={3}>
            <Card className="overflow-hidden border-0">
              <CardContent className="p-4 md:p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <p className="text-xs md:text-sm text-orange-100">Taux saisie</p>
                <p className="text-xl md:text-2xl font-bold">{eleves.length > 0 ? Math.round((saisies / eleves.length) * 100) : 0}%</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Selection</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="space-y-1">
                <Label>Classe</Label>
                <select className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm w-44" value={classeId} onChange={(e) => { setClasseId(e.target.value); setSelectedEvalId(""); setMessage(null) }}>
                  <option value="">Selectionner</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Matiere</Label>
                <select className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm w-44" value={matiereId} onChange={(e) => { setMatiereId(e.target.value); setSelectedEvalId(""); setMessage(null) }}>
                  <option value="">Selectionner</option>
                  {matieres.map((m) => <option key={m.id} value={m.id}>{m.libelle} (coef {m.coefficient})</option>)}
                </select>
              </div>
              <div className="space-y-1 w-24">
                <Label>Trimestre</Label>
                <select className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm" value={trimestre} onChange={(e) => { setTrimestre(e.target.value); setSelectedEvalId(""); setMessage(null) }}>
                  <option value="1">Trimestre 1</option>
                  <option value="2">Trimestre 2</option>
                  <option value="3">Trimestre 3</option>
                </select>
              </div>
            </div>

            {classeId && matiereId && (
              <div className="border-t pt-4">
                <div className="flex items-end gap-4 flex-wrap">
                  <div className="space-y-1 min-w-[200px]">
                    <Label>Evaluation existante</Label>
                    <select className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm w-full" value={selectedEvalId} onChange={(e) => { setSelectedEvalId(e.target.value); setMessage(null) }}>
                      <option value="">-- Creer une nouvelle --</option>
                      {evals.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.libelle} ({ev.type}, coef {ev.coefficient})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {!selectedEvalId && (
                  <div className="flex gap-4 items-end flex-wrap mt-3">
                    <div className="space-y-1">
                      <Label>Type</Label>
                      <select className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm" value={evalType} onChange={(e) => setEvalType(e.target.value)}>
                        <option value="devoir">Devoir</option>
                        <option value="composition">Composition</option>
                        <option value="examen">Examen</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Libelle</Label>
                      <Input className="w-44" value={evalLibelle} onChange={(e) => setEvalLibelle(e.target.value)} placeholder="Devoir n°1" />
                    </div>
                    <div className="space-y-1 w-20">
                      <Label>Coef</Label>
                      <Input type="number" value={evalCoeff} onChange={(e) => setEvalCoeff(e.target.value)} />
                    </div>
                    <Button onClick={createEvaluation} disabled={!evalLibelle}>
                      <Plus className="h-4 w-4 mr-2" />Creer
                    </Button>
                  </div>
                )}
              </div>
            )}

            {message && (
              <Badge variant={message.type === "success" ? "success" : "danger"} className="mt-2">
                {message.text}
              </Badge>
            )}
          </CardContent>
        </Card>

        {classeId && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Notes des eleves
                  {selectedEvalId && evals.find((e) => e.id === selectedEvalId) && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      - {evals.find((e) => e.id === selectedEvalId)?.libelle}
                    </span>
                  )}
                </CardTitle>
                <Button onClick={saveNotes} disabled={!selectedEvalId || saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedEvalId ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Selectionnez une evaluation existante ou creez-en une nouvelle
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Eleve</TableHead>
                        <TableHead className="w-28">Note /20</TableHead>
                        <TableHead>Appreciation</TableHead>
                        <TableHead className="w-16">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eleves.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">Aucun eleve dans cette classe</TableCell></TableRow>
                      ) : eleves.map((eleve, i) => {
                        const note = notes.find((n) => n.eleve_id === eleve.id)
                        const hasNote = note && note.note !== ""
                        return (
                          <TableRow key={eleve.id}>
                            <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                            <TableCell className="font-medium">{eleve.prenom} {eleve.nom}</TableCell>
                            <TableCell>
                              <Input
                                ref={(el) => { noteRefs.current[i] = el }}
                                type="number" min={0} max={20} step={0.5} className="w-24"
                                value={note?.note ?? ""}
                                onChange={(e) => updateNote(eleve.id, "note", e.target.value)}
                                onKeyDown={(e) => handleNoteKeyDown(e, i)}
                                placeholder="/20" />
                            </TableCell>
                            <TableCell>
                              <Input placeholder="Appreciation" className="max-w-xs"
                                value={note?.appreciation ?? ""}
                                onChange={(e) => updateNote(eleve.id, "appreciation", e.target.value)} />
                            </TableCell>
                            <TableCell>
                              {hasNote ? (
                                <Badge variant="success" size="sm" dot>Saisie</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
