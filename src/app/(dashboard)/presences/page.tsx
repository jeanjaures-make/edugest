"use client"

import { useEffect, useState, useEffectEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X, Clock, Ban, Download, Save, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { exportCSV } from "@/lib/export"

interface PresenceRow {
  id: string
  eleve_nom: string
  eleve_prenom: string
  classe_libelle: string | null
  date: string
  statut: string
  motif: string | null
}

interface ElevePresence {
  id: string
  eleve_id: string
  nom: string
  prenom: string
  statut: string
  motif: string
}

const statutOptions = [
  { value: "present", label: "Présent", icon: Check, color: "text-green-600 bg-green-100 hover:bg-green-200" },
  { value: "absent", label: "Absent", icon: X, color: "text-red-600 bg-red-100 hover:bg-red-200" },
  { value: "retard", label: "Retard", icon: Clock, color: "text-orange-600 bg-orange-100 hover:bg-orange-200" },
  { value: "exclu", label: "Exclu", icon: Ban, color: "text-gray-600 bg-gray-100 hover:bg-gray-200" },
]

export default function PresencesPage() {
  const { profile } = useUser()
  const [rows, setRows] = useState<PresenceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState<{ id: string; libelle: string }[]>([])
  const [selectedClasse, setSelectedClasse] = useState("")
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [eleves, setEleves] = useState<ElevePresence[]>([])
  const [saving, setSaving] = useState(false)
  const [elevesLoading, setElevesLoading] = useState(false)

  async function loadPresences() {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const { data } = await supabase
      .from("presences")
      .select(`
        id, date, statut, motif,
        eleve:eleves!inner(nom, prenom, ecole_id),
        classe:classes(libelle)
      `)
      .eq("eleve.ecole_id", ecoleId)
      .order("date", { ascending: false })
      .limit(100)
    if (data) {
      setRows((data as unknown as { id: string; date: string; statut: string; motif: string | null; eleve: { nom: string; prenom: string } | null; classe: { libelle: string } | null }[]).map((r) => ({
        id: r.id,
        eleve_nom: r.eleve?.nom ?? "",
        eleve_prenom: r.eleve?.prenom ?? "",
        classe_libelle: r.classe?.libelle ?? null,
        date: r.date,
        statut: r.statut,
        motif: r.motif,
      })))
    }
    setLoading(false)
  }

  const onInit = useEffectEvent(() => {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    loadPresences()
    supabase.from("classes").select("id, libelle").eq("ecole_id", ecoleId).order("libelle").then(({ data }) => {
      if (data) setClasses(data)
    })
  })
  useEffect(() => { onInit() }, [])

  async function chargerEleves() {
    const ecoleId = profile?.ecole_id
    if (!selectedClasse || !ecoleId) return
    setElevesLoading(true)
    const { data: elevesData } = await supabase
      .from("eleves")
      .select("id, nom, prenom")
      .eq("ecole_id", ecoleId)
      .eq("classe_id", selectedClasse)
      .eq("statut", "actif")
      .order("nom")

    if (elevesData) {
      const { data: existing } = await supabase
        .from("presences")
        .select("eleve_id, statut, motif")
        .eq("date", selectedDate)
        .in("eleve_id", elevesData.map((e) => e.id))
        .eq("classe_id", selectedClasse)

      const existingMap = new Map(((existing || []) as unknown as { eleve_id: string; statut: string; motif: string | null }[]).map((e) => [e.eleve_id, e]))
      setEleves(elevesData.map((e) => ({
        id: crypto.randomUUID(),
        eleve_id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        statut: existingMap.get(e.id)?.statut || "",
        motif: existingMap.get(e.id)?.motif || "",
      })))
    }
    setElevesLoading(false)
  }

  const onClasseOrDateChange = useEffectEvent(() => { if (selectedClasse) chargerEleves() })
  useEffect(() => { onClasseOrDateChange() }, [selectedClasse, selectedDate])

  function setStatut(eleveId: string, statut: string) {
    setEleves((prev) => prev.map((e) => e.eleve_id === eleveId ? { ...e, statut, motif: statut !== "absent" ? "" : e.motif } : e))
  }

  function setMotif(eleveId: string, motif: string) {
    setEleves((prev) => prev.map((e) => e.eleve_id === eleveId ? { ...e, motif } : e))
  }

  async function handleSave() {
    const ecoleId = profile?.ecole_id
    if (!selectedClasse || !ecoleId) return
    setSaving(true)

    const toSave = eleves.filter((e) => e.statut)
    if (toSave.length === 0) { setSaving(false); return }

    const { data: existing } = await supabase
      .from("presences")
      .select("eleve_id, id")
      .eq("date", selectedDate)
      .eq("classe_id", selectedClasse)

    const existingIds = new Set(((existing || []) as unknown as { eleve_id: string; id: string }[]).map((e) => e.eleve_id))
    const existingRecordIds = new Map(((existing || []) as unknown as { eleve_id: string; id: string }[]).map((e) => [e.eleve_id, e.id]))

    const toInsert = toSave.filter((e) => !existingIds.has(e.eleve_id)).map((e) => ({
      eleve_id: e.eleve_id,
      classe_id: selectedClasse,
      date: selectedDate,
      statut: e.statut,
      motif: e.motif || null,
    }))

    const toUpdate = toSave.filter((e) => existingIds.has(e.eleve_id))

    if (toInsert.length > 0) {
      await supabase.from("presences").insert(toInsert)
    }

    for (const e of toUpdate) {
      await supabase.from("presences").update({
        statut: e.statut,
        motif: e.motif || null,
      }).eq("id", existingRecordIds.get(e.eleve_id))
    }

    setSaving(false)
    await loadPresences()
  }

  const aujourdHui = rows.filter((r) => r.date === format(new Date(), "yyyy-MM-dd"))
  const presents = aujourdHui.filter((r) => r.statut === "present").length
  const absents = aujourdHui.filter((r) => r.statut === "absent").length
  const retards = aujourdHui.filter((r) => r.statut === "retard").length

  const statutVariant: Record<string, "success" | "danger" | "warning" | "default"> = {
    present: "success",
    absent: "danger",
    retard: "warning",
    exclu: "default",
  }

  function handleExport() {
    exportCSV("presences", ["Élève", "Classe", "Date", "Statut", "Motif"], rows.map((r) => [
      `${r.eleve_prenom} ${r.eleve_nom}`, r.classe_libelle || "",
      new Date(r.date).toLocaleDateString("fr-CI"), r.statut, r.motif || "",
    ]))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Présences</h2>
          <p className="text-sm text-gray-500">Marquage et suivi des présences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exporter</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Marquage des présences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Classe</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.libelle}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
          </div>

          {selectedClasse && (
            <>
              {elevesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
              ) : (
                <div className="space-y-2">
                  {eleves.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Aucun élève dans cette classe</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {eleves.map((eleve) => (
                        <motion.div
                          key={eleve.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 py-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{eleve.prenom} {eleve.nom}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {statutOptions.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStatut(eleve.eleve_id, opt.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  eleve.statut === opt.value
                                    ? opt.color + " ring-2 ring-offset-1"
                                    : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                                }`}
                              >
                                <opt.icon className="h-3.5 w-3.5" />
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {eleve.statut === "absent" && (
                            <Input
                              placeholder="Motif..."
                              className="h-8 text-xs max-w-[200px]"
                              value={eleve.motif}
                              onChange={(e) => setMotif(eleve.eleve_id, e.target.value)}
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <Button onClick={handleSave} disabled={saving || eleves.every((e) => !e.statut)} className="mt-4">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? "Enregistrement..." : "Enregistrer les présences"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Marqués aujourd&apos;hui</p><p className="text-2xl font-bold">{aujourdHui.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Présents</p><p className="text-2xl font-bold text-green-600">{presents}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Absents</p><p className="text-2xl font-bold text-red-600">{absents}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Retards</p><p className="text-2xl font-bold text-orange-500">{retards}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Registre des présences</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead><TableHead>Classe</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead>Motif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">Aucune présence enregistrée</TableCell></TableRow>
                ) : rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.eleve_prenom} {p.eleve_nom}</TableCell>
                    <TableCell>{p.classe_libelle}</TableCell>
                    <TableCell>{format(new Date(p.date), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>
                      <Badge variant={statutVariant[p.statut]}>{p.statut}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{p.motif || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
