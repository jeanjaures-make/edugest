"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Bus, Trash2, Loader2 } from "lucide-react"
import { formatMontant } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"

interface Route {
  id: string
  libelle: string
  zones: string[]
  montant: number
}

interface Inscription {
  id: string
  eleve_nom: string
  eleve_prenom: string
  route_libelle: string
  type: string
  statut: string
}

export default function TransportPage() {
  const { profile } = useUser()
  const [routes, setRoutes] = useState<Route[]>([])
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const [routesRes, inscRes] = await Promise.all([
      supabase.from("transport_routes").select("*").eq("ecole_id", ecoleId).order("libelle"),
      supabase
        .from("transport_inscriptions")
        .select(`
          id, type, statut,
          eleve:eleves!inner(nom, prenom, ecole_id),
          route:transport_routes(libelle)
        `)
        .eq("eleve.ecole_id", ecoleId)
        .limit(100),
    ])
    if (routesRes.data) setRoutes(routesRes.data)
    if (inscRes.data) {
      setInscriptions((inscRes.data as unknown as { id: string; type: string; statut: string; eleve: { nom: string; prenom: string } | null; route: { libelle: string } | null }[]).map((r) => ({
        id: r.id,
        eleve_nom: r.eleve?.nom ?? "",
        eleve_prenom: r.eleve?.prenom ?? "",
        route_libelle: r.route?.libelle ?? "",
        type: r.type,
        statut: r.statut,
      })))
    }
    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  async function supprimerRoute(id: string) {
    if (!confirm("Supprimer cette route ?")) return
    await supabase.from("transport_routes").delete().eq("id", id)
    load()
  }

  async function supprimerInscription(id: string) {
    if (!confirm("Supprimer cette inscription ?")) return
    await supabase.from("transport_inscriptions").delete().eq("id", id)
    load()
  }

  const totalInscrits = inscriptions.filter((i) => i.statut === "actif").length
  const ca = routes.reduce((sum, r) => sum + r.montant, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transport scolaire</h2>
          <p className="text-sm text-gray-500">Gestion des routes et inscriptions</p>
        </div>
        <div className="flex gap-2">
          <NouvelleInscriptionTransportDialog onCreated={load} ecoleId={profile?.ecole_id} />
          <NouvelleRouteDialog onCreated={load} ecoleId={profile?.ecole_id} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Inscrits (actifs)</p><p className="text-2xl font-bold">{totalInscrits}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Routes actives</p><p className="text-2xl font-bold">{routes.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">CA transport</p><p className="text-2xl font-bold text-green-600">{formatMontant(ca)}</p></CardContent></Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Routes</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead><TableHead>Zones</TableHead><TableHead>Montant</TableHead><TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-400 py-8">Aucune route</TableCell>
                    </TableRow>
                  ) : routes.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <Bus className="h-4 w-4 inline mr-2 text-blue-500" />
                        {r.libelle}
                      </TableCell>
                      <TableCell className="text-xs">{r.zones?.join(", ") || "-"}</TableCell>
                      <TableCell>{formatMontant(r.montant)}/mois</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => supprimerRoute(r.id)}>
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
            <CardHeader><CardTitle className="text-lg">Inscriptions transport</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead><TableHead>Route</TableHead><TableHead>Type</TableHead><TableHead>Statut</TableHead><TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-8">Aucune inscription</TableCell>
                    </TableRow>
                  ) : inscriptions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.eleve_prenom} {t.eleve_nom}</TableCell>
                      <TableCell className="text-xs">{t.route_libelle}</TableCell>
                      <TableCell className="capitalize">{t.type.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge variant={t.statut === "actif" ? "success" : "warning"}>
                          {t.statut === "actif" ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => supprimerInscription(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

function NouvelleRouteDialog({ onCreated, ecoleId }: { onCreated: () => void; ecoleId?: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [libelle, setLibelle] = useState("")
  const [zones, setZones] = useState("")
  const [montant, setMontant] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!libelle || !ecoleId) return
    setSaving(true)
    const { error } = await supabase.from("transport_routes").insert({
      ecole_id: ecoleId,
      libelle,
      zones: zones ? zones.split(",").map((z) => z.trim()) : [],
      montant,
    })
    setSaving(false)
    if (!error) { setOpen(false); setLibelle(""); onCreated() }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Route</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle route</DialogTitle>
          <DialogDescription>Ajouter une route de transport scolaire</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Libellé</Label>
            <Input required value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Ex: Route Nord" />
          </div>
          <div className="space-y-2">
            <Label>Zones (séparées par des virgules)</Label>
            <Input value={zones} onChange={(e) => setZones(e.target.value)} placeholder="Ex: Cocody, Riviera, Palmeraie" />
          </div>
          <div className="space-y-2">
            <Label>Montant mensuel (FCFA)</Label>
            <Input type="number" value={montant} onChange={(e) => setMontant(Number(e.target.value))} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Ajout..." : "Ajouter la route"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function NouvelleInscriptionTransportDialog({ onCreated, ecoleId }: { onCreated: () => void; ecoleId?: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [eleves, setEleves] = useState<{ id: string; nom: string; prenom: string }[]>([])
  const [routes, setRoutes] = useState<{ id: string; libelle: string; montant: number }[]>([])
  const [eleve_id, setEleveId] = useState("")
  const [route_id, setRouteId] = useState("")
  const [type, setType] = useState("aller_retour")

  useEffect(() => {
    if (!ecoleId || !open) return
    Promise.all([
      supabase.from("eleves").select("id, nom, prenom").eq("ecole_id", ecoleId).eq("statut", "actif").order("nom"),
      supabase.from("transport_routes").select("id, libelle, montant").eq("ecole_id", ecoleId).order("libelle"),
    ]).then(([e, r]) => {
      if (e.data) setEleves(e.data)
      if (r.data) setRoutes(r.data)
    })
  }, [ecoleId, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eleve_id || !route_id) return
    setSaving(true)
    const route = routes.find((r) => r.id === route_id)
    const { error } = await supabase.from("transport_inscriptions").insert({
      eleve_id,
      route_id,
      type,
      montant: route?.montant || 0,
      statut: "actif",
    })
    setSaving(false)
    if (!error) { setOpen(false); setEleveId(""); onCreated() }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Inscription transport</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inscription transport</DialogTitle>
          <DialogDescription>Inscrire un élève à une route</DialogDescription>
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
            <Label>Route</Label>
            <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={route_id} onChange={(e) => setRouteId(e.target.value)}>
              <option value="">Sélectionner</option>
              {routes.map((r) => (<option key={r.id} value={r.id}>{r.libelle}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="aller">Aller</option>
              <option value="retour">Retour</option>
              <option value="aller_retour">Aller/Retour</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Inscription..." : "Inscrire"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
