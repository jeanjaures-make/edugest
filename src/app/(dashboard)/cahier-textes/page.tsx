"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Plus, Edit2, Trash2, Loader2, X, Calendar, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface CahierEntry {
  id: string
  date_cours: string
  chapitre: string
  contenu: string | null
  activites: string | null
  devoirs: string | null
  duree: number
  statut: string
  classe?: { id: string; libelle: string } | null
  matiere?: { id: string; libelle: string } | null
  personnel?: { id: string; nom: string; prenom: string } | null
}

interface Option {
  id: string
  libelle: string
}

export default function CahierTextesPage() {
  const { profile } = useUser()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<CahierEntry[]>([])
  const [classes, setClasses] = useState<Option[]>([])
  const [matieres, setMatieres] = useState<Option[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CahierEntry | null>(null)
  const [filterClasse, setFilterClasse] = useState("")

  const load = useCallback(async () => {
    if (!profile?.ecole_id) return
    setLoading(true)

    const { data: classesData } = await supabase
      .from("classes")
      .select("id, libelle")
      .eq("ecole_id", profile.ecole_id)
      .order("libelle")
    if (classesData) setClasses(classesData)

    const { data: matieresData } = await supabase
      .from("matieres")
      .select("id, libelle")
      .eq("ecole_id", profile.ecole_id)
      .order("libelle")
    if (matieresData) setMatieres(matieresData)

    let query = supabase
      .from("cahier_textes")
      .select(`
        id, date_cours, chapitre, contenu, activites, devoirs, duree, statut, created_at,
        classe:classes(id, libelle),
        matiere:matieres(id, libelle),
        personnel:personnel(id, nom, prenom)
      `)
      .eq("ecole_id", profile.ecole_id)
      .order("date_cours", { ascending: false })

    if (filterClasse) query = query.eq("classe_id", filterClasse)

    const { data } = await query.limit(50)
    setEntries((data || []) as unknown as CahierEntry[])
    setLoading(false)
  }, [profile, filterClasse])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette entrée du cahier de textes ?")) return
    const { error } = await supabase
      .from("cahier_textes")
      .delete()
      .eq("id", id)
      .eq("ecole_id", profile?.ecole_id)
    if (!error) load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cahier de textes</h1>
          <p className="text-sm text-gray-500">Suivi pédagogique des cours enseignés</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(!showForm) }}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? "Annuler" : "Nouvelle entrée"}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-gray-500">Filtrer par classe :</Label>
        <select
          className="flex h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm"
          value={filterClasse}
          onChange={(e) => setFilterClasse(e.target.value)}
        >
          <option value="">Toutes les classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.libelle}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <CahierForm
          classes={classes}
          matieres={matieres}
          editing={editing}
          ecoleId={profile?.ecole_id}
          onSaved={() => { setShowForm(false); setEditing(null); load() }}
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucune entrée dans le cahier de textes.</p>
              <p className="text-xs text-gray-400 mt-1">Cliquez sur &quot;Nouvelle entrée&quot; pour commencer.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="info">{entry.classe?.libelle ?? "N/A"}</Badge>
                      <Badge variant="default">{entry.matiere?.libelle ?? "N/A"}</Badge>
                      <Badge variant={entry.statut === "fait" ? "success" : entry.statut === "annule" ? "danger" : "warning"}>
                        {entry.statut === "fait" ? "Fait" : entry.statut === "annule" ? "Annulé" : "Planifié"}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{entry.chapitre}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(entry.date_cours), "EEEE dd MMMM yyyy", { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {entry.duree}h
                      </span>
                      {entry.personnel && (
                        <span>par {entry.personnel.prenom} {entry.personnel.nom}</span>
                      )}
                    </div>
                    {entry.contenu && (
                      <p className="text-sm text-gray-600 mt-2"><b>Contenu :</b> {entry.contenu}</p>
                    )}
                    {entry.activites && (
                      <p className="text-sm text-gray-600 mt-1"><b>Activités :</b> {entry.activites}</p>
                    )}
                    {entry.devoirs && (
                      <p className="text-sm text-gray-600 mt-1"><b>Devoirs :</b> {entry.devoirs}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditing(entry); setShowForm(true) }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CahierForm({
  classes,
  matieres,
  editing,
  ecoleId,
  onSaved,
  onCancel,
}: {
  classes: Option[]
  matieres: Option[]
  editing: CahierEntry | null
  ecoleId: string | undefined
  onSaved: () => void
  onCancel: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classeId, setClasseId] = useState(editing?.classe?.id ?? "")
  const [matiereId, setMatiereId] = useState(editing?.matiere?.id ?? "")
  const [dateCours, setDateCours] = useState(editing?.date_cours ?? format(new Date(), "yyyy-MM-dd"))
  const [chapitre, setChapitre] = useState(editing?.chapitre ?? "")
  const [contenu, setContenu] = useState(editing?.contenu ?? "")
  const [activites, setActivites] = useState(editing?.activites ?? "")
  const [devoirs, setDevoirs] = useState(editing?.devoirs ?? "")
  const [duree, setDuree] = useState(editing?.duree ?? 2)
  const [statut, setStatut] = useState(editing?.statut ?? "planifie")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!classeId || !matiereId || !dateCours || !chapitre || !ecoleId) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/cahier-textes", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing
            ? { id: editing.id, chapitre, contenu, activites, devoirs, duree, statut }
            : { classe_id: classeId, matiere_id: matiereId, date_cours: dateCours, chapitre, contenu, activites, devoirs, duree, statut }
        ),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Erreur ${res.status}`)
        setSaving(false)
        return
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau")
    }
    setSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {editing ? "Modifier l'entrée" : "Nouvelle entrée"}
          </span>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Classe *</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
                required
                disabled={!!editing}
              >
                <option value="">Sélectionner...</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Matière *</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={matiereId}
                onChange={(e) => setMatiereId(e.target.value)}
                required
                disabled={!!editing}
              >
                <option value="">Sélectionner...</option>
                {matieres.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Date du cours *</Label>
              <Input
                type="date"
                required
                value={dateCours}
                onChange={(e) => setDateCours(e.target.value)}
                disabled={!!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>Durée (heures)</Label>
              <Input
                type="number"
                min={1}
                max={8}
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
              >
                <option value="planifie">Planifié</option>
                <option value="fait">Fait</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chapitre / Titre du cours *</Label>
            <Input
              required
              placeholder="Ex: Chapitre 3 - Les équations du second degré"
              value={chapitre}
              onChange={(e) => setChapitre(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Contenu du cours</Label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              placeholder="Notions abordées, objectifs, démarche pédagogique..."
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Activités en classe</Label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              placeholder="Exercices, travaux dirigés, travaux de groupe..."
              value={activites}
              onChange={(e) => setActivites(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Devoirs / Travaux à la maison</Label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm"
              placeholder="Exercices à faire, leçon à réviser..."
              value={devoirs}
              onChange={(e) => setDevoirs(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</> : editing ? "Modifier" : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
