"use client"

import { useEffect, useState, useEffectEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Utensils, Trash2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { formatMontant } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface CantineRow {
  id: string
  eleve_nom: string
  eleve_prenom: string
  classe_libelle: string | null
  type: string
  montant: number
  statut: string
  date_debut: string | null
  date_fin: string | null
}

export default function CantinePage() {
  const { profile } = useUser()
  const [rows, setRows] = useState<CantineRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const { data } = await supabase
      .from("cantine_abonnements")
      .select(`
        id, type, montant, statut, date_debut, date_fin,
        eleve:eleves!inner(nom, prenom, ecole_id),
        classe:classes(libelle)
      `)
      .eq("eleve.ecole_id", ecoleId)
      .order("created_at", { ascending: false })
      .limit(100)
    if (data) {
      setRows((data as unknown as { id: string; type: string; montant: number; statut: string; date_debut: string | null; date_fin: string | null; eleve: { nom: string; prenom: string } | null; classe: { libelle: string } | null }[]).map((r) => ({
        id: r.id,
        eleve_nom: r.eleve?.nom ?? "",
        eleve_prenom: r.eleve?.prenom ?? "",
        classe_libelle: r.classe?.libelle ?? null,
        type: r.type,
        montant: r.montant,
        statut: r.statut,
        date_debut: r.date_debut,
        date_fin: r.date_fin,
      })))
    }
    setLoading(false)
  }

  const onLoad = useEffectEvent(() => load())
  useEffect(() => { onLoad() }, [])

  async function supprimer(id: string) {
    if (!confirm("Supprimer cet abonnement ?")) return
    await supabase.from("cantine_abonnements").delete().eq("id", id)
    load()
  }

  const actifs = rows.filter((r) => r.statut === "actif").length
  const ca = rows.reduce((sum, r) => sum + r.montant, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cantine</h2>
          <p className="text-sm text-gray-500">Gestion des abonnements à la cantine</p>
        </div>
        <NouvelAbonnementDialog onCreated={load} ecoleId={profile?.ecole_id} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Abonnements</p><p className="text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Actifs</p><p className="text-2xl font-bold text-green-600">{actifs}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">CA total</p><p className="text-2xl font-bold text-blue-600">{formatMontant(ca)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Liste des abonnements</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">Aucun abonnement</TableCell>
                  </TableRow>
                ) : rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <Utensils className="h-4 w-4 inline mr-2 text-orange-500" />
                      {a.eleve_prenom} {a.eleve_nom}
                    </TableCell>
                    <TableCell>{a.classe_libelle}</TableCell>
                    <TableCell className="capitalize">{a.type}</TableCell>
                    <TableCell>{formatMontant(a.montant)}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {a.date_debut ? format(new Date(a.date_debut), "dd/MM/yyyy", { locale: fr }) : "-"}
                      {" → "}
                      {a.date_fin ? format(new Date(a.date_fin), "dd/MM/yyyy", { locale: fr }) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.statut === "actif" ? "success" : "warning"}>
                        {a.statut === "actif" ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => supprimer(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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

function NouvelAbonnementDialog({ onCreated, ecoleId }: { onCreated: () => void; ecoleId?: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [eleves, setEleves] = useState<{ id: string; nom: string; prenom: string; classe_id: string }[]>([])
  const [eleve_id, setEleveId] = useState("")
  const [type, setType] = useState("mensuel")
  const [montant, setMontant] = useState(15000)
  const [date_debut, setDateDebut] = useState("")
  const [date_fin, setDateFin] = useState("")

  useEffect(() => {
    if (!ecoleId || !open) return
    supabase.from("eleves").select("id, nom, prenom, classe_id").eq("ecole_id", ecoleId).eq("statut", "actif").order("nom")
      .then(({ data }) => { if (data) setEleves(data) })
  }, [ecoleId, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eleve_id) return
    setSaving(true)
    const { error } = await supabase.from("cantine_abonnements").insert({
      eleve_id,
      type,
      montant,
      statut: "actif",
      date_debut: date_debut || null,
      date_fin: date_fin || null,
    })
    setSaving(false)
    if (!error) {
      setOpen(false)
      setEleveId("")
      onCreated()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Nouvel abonnement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel abonnement cantine</DialogTitle>
          <DialogDescription>Ajouter un abonnement à la cantine pour un élève</DialogDescription>
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
            <Label>Type</Label>
            <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="annuel">Annuel</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Montant (FCFA)</Label>
            <Input type="number" value={montant} onChange={(e) => setMontant(Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input type="date" value={date_debut} onChange={(e) => setDateDebut(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input type="date" value={date_fin} onChange={(e) => setDateFin(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Enregistrement..." : "Ajouter l'abonnement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
