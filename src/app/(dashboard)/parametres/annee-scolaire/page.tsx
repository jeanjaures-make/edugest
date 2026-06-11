"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Check, Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"

interface AnneeScolaire {
  id: string
  libelle: string
  date_debut: string
  date_fin: string
  active: boolean
}

export default function AnneeScolairePage() {
  const { profile } = useUser()
  const [rows, setRows] = useState<AnneeScolaire[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  async function load() {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const { data } = await supabase
      .from("annees_scolaires")
      .select("*")
      .eq("ecole_id", ecoleId)
      .order("date_debut", { ascending: false })
    if (data) setRows(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [profile])

  async function toggleActive(id: string) {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    await supabase.from("annees_scolaires").update({ active: false }).eq("ecole_id", ecoleId).neq("id", id)
    await supabase.from("annees_scolaires").update({ active: true }).eq("id", id)
    load()
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/parametres" className="text-gray-500 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Annees scolaires</h1>
                <p className="text-sm text-muted-foreground">Gerer les annees scolaires de l'etablissement</p>
              </div>
            </div>
            <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle annee</Button>
          </div>
        </FadeInView>

        <Card>
          <CardHeader><CardTitle className="text-lg">Liste des annees scolaires</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
            ) : rows.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucune annee scolaire. Creez la premiere annee.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Libelle</TableHead>
                    <TableHead>Date debut</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.libelle}</TableCell>
                      <TableCell>{a.date_debut}</TableCell>
                      <TableCell>{a.date_fin}</TableCell>
                      <TableCell>
                        {a.active ? (
                          <Badge variant="success" dot>Active</Badge>
                        ) : (
                          <Badge variant="warning">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!a.active && (
                          <Button variant="outline" size="sm" onClick={() => toggleActive(a.id)}>
                            <Check className="h-3 w-3 mr-1" />Activer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AjouterDialog open={addOpen} onOpenChange={setAddOpen} ecoleId={profile?.ecole_id} onDone={() => { setAddOpen(false); load() }} />
      </div>
    </PageTransition>
  )
}

function AjouterDialog({ open, onOpenChange, ecoleId, onDone }: {
  open: boolean; onOpenChange: (v: boolean) => void; ecoleId?: string; onDone: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [libelle, setLibelle] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!libelle || !dateDebut || !dateFin || !ecoleId) return
    setSaving(true)
    setError("")
    const { error: ie } = await supabase.from("annees_scolaires").insert({
      ecole_id: ecoleId, libelle, date_debut: dateDebut, date_fin: dateFin, active: false,
    })
    setSaving(false)
    if (ie) { setError(ie.message); return }
    onOpenChange(false); onDone()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle annee scolaire</DialogTitle>
          <DialogDescription>Creer une nouvelle annee scolaire</DialogDescription>
        </DialogHeader>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Libelle</Label>
            <Input required value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="2025-2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date debut</Label>
              <Input required type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input required type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creation...</> : <><Save className="h-4 w-4 mr-2" />Creer l'annee scolaire</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
