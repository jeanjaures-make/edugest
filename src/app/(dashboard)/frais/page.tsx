"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Save, Loader2 } from "lucide-react"
import { formatMontant } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"

interface Frais {
  id: string
  libelle: string
  montant: number
  type: string
  periodicite: string
}

export default function FraisPage() {
  const { profile } = useUser()
  const [rows, setRows] = useState<Frais[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Frais | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const load = useCallback(async () => {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const { data } = await supabase
      .from("frais_scolarite")
      .select("*")
      .eq("ecole_id", ecoleId)
      .order("libelle", { ascending: true })
    if (data) setRows(data)
    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  const avgScolarite = rows.filter((r) => r.type === "scolarite")
    .reduce((sum, r, _, arr) => sum + (arr.length > 0 ? r.montant / arr.length : 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Frais scolaires</h2>
          <p className="text-sm text-gray-500">Configuration des frais par niveau et type</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Ajouter un frais</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Frais actifs</p><p className="text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Inscription (moy.)</p><p className="text-2xl font-bold">{formatMontant(rows.find((r) => r.type === "inscription")?.montant ?? 0)}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Scolarite annuelle (moy.)</p><p className="text-2xl font-bold">{formatMontant(Math.round(avgScolarite))}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Bareme des frais</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libelle</TableHead><TableHead>Type</TableHead><TableHead>Montant</TableHead><TableHead>Periodicite</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">Aucun frais configure</TableCell>
                  </TableRow>
                ) : rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.libelle}</TableCell>
                    <TableCell><Badge variant="info">{f.type}</Badge></TableCell>
                    <TableCell className="font-bold">{formatMontant(f.montant)}</TableCell>
                    <TableCell className="capitalize">{f.periodicite}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => { setEditTarget(f); setEditOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FraisDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        edit={null}
        ecoleId={profile?.ecole_id}
        onDone={load}
      />
      <FraisDialog
        open={editOpen}
        onOpenChange={(v) => { setEditOpen(v); if (!v) setEditTarget(null) }}
        edit={editTarget}
        ecoleId={profile?.ecole_id}
        onDone={() => { setEditTarget(null); load() }}
      />
    </div>
  )
}

function FraisDialog({ open, onOpenChange, edit, ecoleId, onDone }: {
  open: boolean; onOpenChange: (v: boolean) => void
  edit: Frais | null; ecoleId?: string; onDone: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [libelle, setLibelle] = useState("")
  const [montant, setMontant] = useState("")
  const [type, setType] = useState("scolarite")
  const [periodicite, setPeriodicite] = useState("annuel")

  useEffect(() => {
    if (open) {
      setError("")
      if (edit) {
        setLibelle(edit.libelle)
        setMontant(String(edit.montant))
        setType(edit.type)
        setPeriodicite(edit.periodicite)
      } else {
        setLibelle(""); setMontant(""); setType("scolarite"); setPeriodicite("annuel")
      }
    }
  }, [open, edit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!libelle || !montant || !ecoleId) return
    setSaving(true)
    setError("")
    if (edit) {
      const { error: ue } = await supabase.from("frais_scolarite").update({
        libelle, montant: parseInt(montant), type, periodicite,
      }).eq("id", edit.id)
      if (ue) { setError(ue.message); setSaving(false); return }
    } else {
      const { error: ie } = await supabase.from("frais_scolarite").insert({
        ecole_id: ecoleId, libelle, montant: parseInt(montant), type, periodicite,
      })
      if (ie) { setError(ie.message); setSaving(false); return }
    }
    setSaving(false)
    onOpenChange(false); onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? "Modifier le frais" : "Ajouter un frais"}</DialogTitle>
          <DialogDescription>{edit ? "Modifier les informations du frais" : "Configurer un nouveau type de frais scolaire"}</DialogDescription>
        </DialogHeader>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Libelle</Label>
            <Input required value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Scolarite 6eme" />
          </div>
          <div className="space-y-2">
            <Label>Montant (FCFA)</Label>
            <Input required type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="25000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="inscription">Inscription</option>
                <option value="scolarite">Scolarite</option>
                <option value="cantine">Cantine</option>
                <option value="transport">Transport</option>
                <option value="bibliotheque">Bibliotheque</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Periodicite</Label>
              <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={periodicite} onChange={(e) => setPeriodicite(e.target.value)}>
                <option value="annuel">Annuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="mensuel">Mensuel</option>
                <option value="unique">Unique</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="h-4 w-4 mr-2" />{edit ? "Enregistrer" : "Ajouter le frais"}</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
