"use client"

import { useEffect, useState, useEffectEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Book, Search, Trash2, RotateCcw, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Ouvrage {
  id: string
  titre: string
  auteur: string
  isbn: string | null
  quantite: number
  disponibles: number
}

interface Pret {
  id: string
  eleve_nom: string
  eleve_prenom: string
  ouvrage_id: string
  ouvrage_titre: string
  date_pret: string
  date_retour_prevue: string
  date_retour_reelle: string | null
  statut: string
}

export default function BibliothequePage() {
  const { profile } = useUser()
  const [ouvrages, setOuvrages] = useState<Ouvrage[]>([])
  const [prets, setPrets] = useState<Pret[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const [ouvRes, pretsRes] = await Promise.all([
      supabase.from("bibliotheque_ouvrages").select("*").eq("ecole_id", ecoleId).order("titre"),
      supabase
        .from("bibliotheque_prets")
        .select(`
          id, ouvrage_id, date_pret, date_retour_prevue, date_retour_reelle, statut,
          eleve:eleves!inner(nom, prenom, ecole_id),
          ouvrage:bibliotheque_ouvrages(titre)
        `)
        .eq("eleve.ecole_id", ecoleId)
        .order("date_pret", { ascending: false })
        .limit(50),
    ])
    if (ouvRes.data) setOuvrages(ouvRes.data)
    if (pretsRes.data) {
      setPrets((pretsRes.data as unknown as { id: string; ouvrage_id: string; date_pret: string; date_retour_prevue: string; date_retour_reelle: string | null; statut: string; eleve: { nom: string; prenom: string } | null; ouvrage: { titre: string } | null }[]).map((r) => ({
        id: r.id,
        eleve_nom: r.eleve?.nom ?? "",
        eleve_prenom: r.eleve?.prenom ?? "",
        ouvrage_id: r.ouvrage_id,
        ouvrage_titre: r.ouvrage?.titre ?? "",
        date_pret: r.date_pret,
        date_retour_prevue: r.date_retour_prevue,
        date_retour_reelle: r.date_retour_reelle,
        statut: r.statut,
      })))
    }
    setLoading(false)
  }

  const onLoad = useEffectEvent(() => load())
  useEffect(() => { onLoad() }, [])

  async function retournerPret(id: string) {
    await supabase.from("bibliotheque_prets").update({
      statut: "rendu",
      date_retour_reelle: new Date().toISOString(),
    }).eq("id", id)
    load()
  }

  async function supprimerOuvrage(id: string) {
    if (!confirm("Supprimer cet ouvrage ?")) return
    await supabase.from("bibliotheque_ouvrages").delete().eq("id", id)
    load()
  }

  const totalOuvrages = ouvrages.reduce((s, o) => s + o.quantite, 0)
  const totalDispos = ouvrages.reduce((s, o) => s + o.disponibles, 0)
  const pretsEnCours = prets.filter((p) => p.statut === "en_cours").length
  const enRetard = prets.filter((p) => p.statut === "retard").length

  const filtered = ouvrages.filter((o) =>
    !search || `${o.titre} ${o.auteur} ${o.isbn || ""}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bibliothèque</h2>
          <p className="text-sm text-gray-500">Gestion des ouvrages et prêts</p>
        </div>
        <div className="flex gap-2">
          <NouveauPretDialog onCreated={load} ecoleId={profile?.ecole_id} />
          <NouvelOuvrageDialog onCreated={load} ecoleId={profile?.ecole_id} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Ouvrages</p><p className="text-2xl font-bold">{totalOuvrages}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Disponibles</p><p className="text-2xl font-bold text-green-600">{totalDispos}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Prêts en cours</p><p className="text-2xl font-bold text-blue-600">{pretsEnCours}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">En retard</p><p className="text-2xl font-bold text-red-500">{enRetard}</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Rechercher un livre..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ouvrages</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead><TableHead>Auteur</TableHead><TableHead>Dispo</TableHead><TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-400 py-8">Aucun ouvrage</TableCell>
                    </TableRow>
                  ) : filtered.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium"><Book className="h-4 w-4 inline mr-2 text-blue-500" />{o.titre}</TableCell>
                      <TableCell>{o.auteur}</TableCell>
                      <TableCell>
                        <Badge variant={o.disponibles > 1 ? "success" : o.disponibles === 1 ? "warning" : "danger"}>
                          {o.disponibles}/{o.quantite}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => supprimerOuvrage(o.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Prêts récents</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead><TableHead>Ouvrage</TableHead><TableHead>Retour prévu</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-8">Aucun prêt</TableCell>
                    </TableRow>
                  ) : prets.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.eleve_prenom} {p.eleve_nom}</TableCell>
                      <TableCell className="text-xs">{p.ouvrage_titre}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(p.date_retour_prevue), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.statut === "rendu" ? "success" : p.statut === "retard" ? "danger" : "info"}>
                          {p.statut === "en_cours" ? "En cours" : p.statut === "rendu" ? "Rendu" : "Retard"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.statut !== "rendu" && (
                          <Button variant="ghost" size="icon" className="text-green-600" onClick={() => retournerPret(p.id)}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function NouvelOuvrageDialog({ onCreated, ecoleId }: { onCreated: () => void; ecoleId?: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [titre, setTitre] = useState("")
  const [auteur, setAuteur] = useState("")
  const [isbn, setIsbn] = useState("")
  const [quantite, setQuantite] = useState(1)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre || !auteur || !ecoleId) return
    setSaving(true)
    const { error } = await supabase.from("bibliotheque_ouvrages").insert({
      ecole_id: ecoleId,
      titre, auteur,
      isbn: isbn || null,
      quantite,
      disponibles: quantite,
    })
    setSaving(false)
    if (!error) { setOpen(false); setTitre(""); setAuteur(""); onCreated() }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Ouvrage</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un ouvrage</DialogTitle>
          <DialogDescription>Ajouter un livre à la bibliothèque</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input required value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Auteur</Label>
            <Input required value={auteur} onChange={(e) => setAuteur(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ISBN</Label>
              <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input type="number" min={1} value={quantite} onChange={(e) => setQuantite(Number(e.target.value))} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Ajout..." : "Ajouter l'ouvrage"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function NouveauPretDialog({ onCreated, ecoleId }: { onCreated: () => void; ecoleId?: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [eleves, setEleves] = useState<{ id: string; nom: string; prenom: string }[]>([])
  const [ouvrages, setOuvrages] = useState<{ id: string; titre: string; disponibles: number }[]>([])
  const [eleve_id, setEleveId] = useState("")
  const [ouvrage_id, setOuvrageId] = useState("")
  const [date_retour_prevue, setDateRetour] = useState("")

  useEffect(() => {
    if (!ecoleId || !open) return
    Promise.all([
      supabase.from("eleves").select("id, nom, prenom").eq("ecole_id", ecoleId).eq("statut", "actif").order("nom"),
      supabase.from("bibliotheque_ouvrages").select("id, titre, disponibles").eq("ecole_id", ecoleId).gt("disponibles", 0).order("titre"),
    ]).then(([e, o]) => {
      if (e.data) setEleves(e.data)
      if (o.data) setOuvrages(o.data)
    })
  }, [ecoleId, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eleve_id || !ouvrage_id || !date_retour_prevue) return
    setSaving(true)
    const { error } = await supabase.from("bibliotheque_prets").insert({
      eleve_id,
      ouvrage_id,
      date_pret: new Date().toISOString(),
      date_retour_prevue,
      statut: "en_cours",
    })
    if (!error) {
      await supabase.from("bibliotheque_ouvrages").update({
        disponibles: (ouvrages.find((o) => o.id === ouvrage_id)?.disponibles ?? 0) - 1,
      }).eq("id", ouvrage_id)
    }
    setSaving(false)
    if (!error) { setOpen(false); setEleveId(""); setOuvrageId(""); onCreated() }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Nouveau prêt</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau prêt</DialogTitle>
          <DialogDescription>Enregistrer un prêt de livre</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Élève</Label>
            <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={eleve_id} onChange={(e) => setEleveId(e.target.value)}>
              <option value="">Sélectionner</option>
              {eleves.map((e) => (<option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Ouvrage</Label>
            <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={ouvrage_id} onChange={(e) => setOuvrageId(e.target.value)}>
              <option value="">Sélectionner</option>
              {ouvrages.map((o) => (<option key={o.id} value={o.id}>{o.titre} ({o.disponibles} dispo)</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Date de retour prévue</Label>
            <Input required type="date" value={date_retour_prevue} onChange={(e) => setDateRetour(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer le prêt"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
