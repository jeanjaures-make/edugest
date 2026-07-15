"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"
import { Plus, Trash2, Loader2, Printer } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface ClasseItem { id: string; libelle: string }
interface MatiereItem { id: string; libelle: string }
interface EnseignantItem { id: string; nom: string; prenom: string }
interface CoursItem {
  id: string
  jour_semaine: number
  heure_debut: string
  heure_fin: string
  salle: string | null
  matiere: { libelle: string } | null
  enseignant: { nom: string; prenom: string } | null
}

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
const CRENEAUX = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"]
const COLORS = ["bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-purple-100 text-purple-700", "bg-orange-100 text-orange-700", "bg-pink-100 text-pink-700", "bg-teal-100 text-teal-700"]

export default function EmploiDuTempsPage() {
  const { profile } = useUser()
  const [classes, setClasses] = useState<ClasseItem[]>([])
  const [matieres, setMatieres] = useState<MatiereItem[]>([])
  const [enseignants, setEnseignants] = useState<EnseignantItem[]>([])
  const [enseignantsMatieres, setEnseignantsMatieres] = useState<Record<string, string[]>>({})
  const [cours, setCours] = useState<CoursItem[]>([])
  const [loading, setLoading] = useState(true)
  const [classeId, setClasseId] = useState("")

  const [newCours, setNewCours] = useState({ matiere_id: "", enseignant_id: "", jour: "1", heure_debut: "08:00", heure_fin: "09:00", salle: "" })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadInitial = useCallback(async () => {
    if (!profile?.ecole_id) { setLoading(false); return }
    const [c, m, e, em] = await Promise.all([
      supabase.from("classes").select("id, libelle").eq("ecole_id", profile.ecole_id).order("libelle"),
      supabase.from("matieres").select("id, libelle").eq("ecole_id", profile.ecole_id).order("libelle"),
      supabase.from("personnel").select("id, nom, prenom").eq("ecole_id", profile.ecole_id).eq("type", "enseignant").eq("statut", "actif").order("nom"),
      supabase.from("enseignants_matieres").select("enseignant_id, matiere_id"),
    ])
    if (c.data) setClasses(c.data)
    if (m.data) setMatieres(m.data)
    if (e.data) setEnseignants(e.data)
    if (em.data) {
      const map: Record<string, string[]> = {}
      for (const row of em.data) {
        if (!map[row.matiere_id]) map[row.matiere_id] = []
        map[row.matiere_id].push(row.enseignant_id)
      }
      setEnseignantsMatieres(map)
    }
    setLoading(false)
  }, [profile])

  useEffect(() => { loadInitial() }, [loadInitial])

  const loadCours = useCallback(async () => {
    if (!classeId) { setCours([]); return }
    const res = await fetch(`/api/emplois-du-temps?classe_id=${classeId}`)
    const json = await res.json()
    if (json.data) setCours(json.data as unknown as CoursItem[])
  }, [classeId])

  useEffect(() => { loadCours() }, [loadCours])

  async function addCours() {
    if (!classeId || !newCours.matiere_id) return
    setSaving(true)
    const res = await fetch("/api/emplois-du-temps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classe_id: classeId,
        matiere_id: newCours.matiere_id,
        enseignant_id: newCours.enseignant_id || null,
        jour_semaine: parseInt(newCours.jour),
        heure_debut: newCours.heure_debut,
        heure_fin: newCours.heure_fin,
        salle: newCours.salle || null,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      alert("Erreur lors de l'ajout du cours: " + (json.error || "Erreur inconnue"))
      return
    }
    setNewCours({ matiere_id: "", enseignant_id: "", jour: "1", heure_debut: "08:00", heure_fin: "09:00", salle: "" })
    setDialogOpen(false)
    loadCours()
  }

  async function deleteCours(id: string) {
    const res = await fetch(`/api/emplois-du-temps?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      const json = await res.json()
      alert("Erreur lors de la suppression: " + (json.error || "Erreur inconnue"))
      return
    }
    loadCours()
  }

  function getCours(jour: number, creneau: string): CoursItem[] {
    return cours.filter((c) => c.jour_semaine === jour && c.heure_debut.slice(0, 5) === creneau)
  }

  function handlePrint() {
    const classeLibelle = classes.find((c) => c.id === classeId)?.libelle ?? ""
    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return

    const jours = JOURS
    const creneaux = CRENEAUX

    const rows = creneaux.map((creneau) => {
      const cells = jours.map((_, jourIdx) => {
        const jourNum = jourIdx + 1
        const coursList = getCours(jourNum, creneau)
        return `<td style="border:1px solid #ccc;padding:6px;vertical-align:top;height:50px;width:14%">${
          coursList.map((c) =>
            `<div style="margin-bottom:4px;padding:4px;border-radius:4px;background:#e0e7ff;color:#3730a3;font-size:11px">${
              `<div style="font-weight:600">${c.matiere?.libelle ?? "?"}</div>` +
              (c.salle ? `<div>${c.salle}</div>` : "") +
              (c.enseignant ? `<div style="opacity:0.7">${c.enseignant.prenom} ${c.enseignant.nom}</div>` : "")
            }</div>`
          ).join("")
        }</td>`
      }).join("")
      return `<tr><td style="border:1px solid #ccc;padding:6px;font-weight:600;font-size:12px;text-align:right;width:60px">${creneau}</td>${cells}</tr>`
    }).join("")

    const headerDays = jours.map((j) =>
      `<th style="border:1px solid #ccc;padding:8px;background:#f3f4f6;font-size:13px">${j}</th>`
    ).join("")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Emploi du temps - ${classeLibelle}</title>
        <style>
          * { font-family: Arial, Helvetica, sans-serif; }
          body { margin: 24px; color: #1f2937; }
          h1 { font-size: 20px; margin: 0 0 4px 0; }
          h2 { font-size: 14px; font-weight: 400; color: #6b7280; margin: 0 0 20px 0; }
          table { border-collapse: collapse; width: 100%; }
          th, td { text-align: left; }
          .footer { margin-top: 20px; font-size: 11px; color: #9ca3af; text-align: center; }
          @media print { body { margin: 12px; } }
        </style>
      </head>
      <body>
        <h1>Emploi du temps</h1>
        <h2>Classe: ${classeLibelle} | Année scolaire ${new Date().getFullYear()}-${new Date().getFullYear() + 1}</h2>
        <table>
          <thead>
            <tr><th style="border:1px solid #ccc;padding:8px;background:#f3f4f6;width:60px"></th>${headerDays}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Document généré par EduGest CI — ${new Date().toLocaleDateString("fr-FR")}</div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Emploi du temps</h1>
              <p className="text-sm text-muted-foreground">Planning des cours par classe</p>
            </div>
            <div className="flex gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Classe</Label>
                <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={classeId} onChange={(e) => setClasseId(e.target.value)}>
                  <option value="">Sélectionner</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                </select>
              </div>
              <Button variant="outline" disabled={!classeId || cours.length === 0} onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Imprimer</Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!classeId} onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Ajouter un cours</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Ajouter un cours</DialogTitle><DialogDescription>Planifier un nouveau cours dans l&apos;emploi du temps</DialogDescription></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label>Matière</Label>
                      {matieres.length === 0 ? (
                        <p className="text-sm text-red-500">Aucune matière trouvée. Vérifiez que votre école a des matières configurées.</p>
                      ) : (
                        <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" value={newCours.matiere_id} onChange={(e) => setNewCours({ ...newCours, matiere_id: e.target.value, enseignant_id: "" })}>
                          <option value="">Sélectionner</option>
                          {matieres.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Enseignant</Label>
                      <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" value={newCours.enseignant_id} onChange={(e) => setNewCours({ ...newCours, enseignant_id: e.target.value })}>
                        <option value="">Non assigné</option>
                        {(newCours.matiere_id ? enseignants.filter((e) => (enseignantsMatieres[newCours.matiere_id] || []).includes(e.id)) : enseignants).map((e) => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Jour</Label>
                        <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" value={newCours.jour} onChange={(e) => setNewCours({ ...newCours, jour: e.target.value })}>
                          {JOURS.map((j, i) => <option key={i + 1} value={String(i + 1)}>{j}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Début</Label>
                        <Input type="time" value={newCours.heure_debut} onChange={(e) => setNewCours({ ...newCours, heure_debut: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Fin</Label>
                        <Input type="time" value={newCours.heure_fin} onChange={(e) => setNewCours({ ...newCours, heure_fin: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Salle</Label>
                      <Input value={newCours.salle} onChange={(e) => setNewCours({ ...newCours, salle: e.target.value })} placeholder="ex: Salle 101" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                      <Button onClick={addCours} disabled={!newCours.matiere_id || saving}>
                        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ajout...</> : newCours.matiere_id ? "Ajouter" : "Sélectionnez une matière"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </FadeInView>

        {!classeId ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Sélectionnez une classe pour voir l&apos;emploi du temps</CardContent></Card>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid" style={{ gridTemplateColumns: `80px repeat(6, 1fr)` }}>
                <div className="p-2" />
                {JOURS.map((j) => (
                  <div key={j} className="p-2 text-center font-medium text-sm bg-muted/50 rounded-t-lg border-b-2 border-primary">
                    {j}
                  </div>
                ))}
                {CRENEAUX.map((creneau) => (
                  <React.Fragment key={creneau}>
                    <div className="p-1 text-xs text-muted-foreground font-medium flex items-start justify-end pr-2 border-b border-r">
                      {creneau}
                    </div>
                    {JOURS.map((_, jourIdx) => {
                      const jourNum = jourIdx + 1
                      const coursList = getCours(jourNum, creneau)
                      return (
                        <div key={`${jourNum}-${creneau}`} className="min-h-[60px] border-b border-r p-1 text-xs relative group">
                          {coursList.map((c) => (
                            <div key={c.id} className={`rounded p-1 mb-1 ${COLORS[Math.abs(c.id.charCodeAt(0)) % COLORS.length]} relative`}>
                              <p className="font-medium truncate">{c.matiere?.libelle ?? "?"}</p>
                              <p className="opacity-75 truncate">{c.salle ?? ""}</p>
                              {c.enseignant && <p className="opacity-60 truncate">{c.enseignant.prenom}</p>}
                              <button className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-red-500" onClick={() => deleteCours(c.id)}>
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
