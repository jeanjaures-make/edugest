"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Upload, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Document {
  id: string
  nom: string
  type: string
  url: string
  created_at: string
  eleve_nom: string
  eleve_prenom: string
}

export default function DocumentsPage() {
  const { profile } = useUser()
  const [rows, setRows] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const { data } = await supabase
      .from("documents_eleves")
      .select(`
        id, nom, type, url, created_at,
        eleve:eleves!inner(nom, prenom, ecole_id)
      `)
      .eq("eleve.ecole_id", ecoleId)
      .order("created_at", { ascending: false })
      .limit(100)
    if (data) {
      setRows((data as unknown as { id: string; nom: string; type: string; url: string; created_at: string; eleve: { nom: string; prenom: string } | null }[]).map((r) => ({
        id: r.id,
        nom: r.nom,
        type: r.type,
        url: r.url,
        created_at: r.created_at,
        eleve_nom: r.eleve?.nom ?? "",
        eleve_prenom: r.eleve?.prenom ?? "",
      })))
    }
    setLoading(false)
  }, [profile])

  useEffect(() => { load() }, [load])

  const total = rows.length
  const bulletins = rows.filter((r) => r.type === "bulletin").length
  const cntActes = rows.filter((r) => r.type === "cni" || r.type === "acte_naissance").length
  const certificats = rows.filter((r) => r.type === "certificat").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-500">Archives et documents administratifs</p>
        </div>
        <UploadDocumentDialog onCreated={load} ecoleId={profile?.ecole_id} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Documents totaux</p><p className="text-2xl font-bold">{total}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Bulletins</p><p className="text-2xl font-bold text-blue-600">{bulletins}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">CNI / Actes</p><p className="text-2xl font-bold text-orange-500">{cntActes}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Certificats</p><p className="text-2xl font-bold text-green-600">{certificats}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Documents récents</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead><TableHead>Type</TableHead><TableHead>Élève</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">Aucun document</TableCell>
                  </TableRow>
                ) : rows.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      <FileText className="h-4 w-4 inline mr-2 text-gray-400" />
                      {d.nom}
                    </TableCell>
                    <TableCell><Badge variant="info">{d.type.replace("_", " ")}</Badge></TableCell>
                    <TableCell>{d.eleve_prenom} {d.eleve_nom}</TableCell>
                    <TableCell>{format(new Date(d.created_at), "dd/MM/yyyy", { locale: fr })}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={d.url} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
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

function UploadDocumentDialog({ onCreated, ecoleId }: { onCreated: () => void; ecoleId?: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [eleves, setEleves] = useState<{ id: string; nom: string; prenom: string }[]>([])
  const [eleveId, setEleveId] = useState("")
  const [type, setType] = useState("autre")
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!ecoleId || !open) return
    supabase.from("eleves").select("id, nom, prenom").eq("ecole_id", ecoleId).eq("statut", "actif").order("nom").then(({ data }) => {
      if (data) setEleves(data)
    })
  }, [ecoleId, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !eleveId) return
    setSaving(true)
    setError("")
    const formData = new FormData()
    formData.append("file", file)
    formData.append("eleve_id", eleveId)
    formData.append("type", type)
    const res = await fetch("/api/documents/upload", { method: "POST", body: formData })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || "Erreur"); return }
    setOpen(false); setFile(null); setEleveId(""); onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Upload className="h-4 w-4 mr-2" />Uploader un document</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Uploader un document</DialogTitle>
          <DialogDescription>Ajouter un document à un dossier élève</DialogDescription>
        </DialogHeader>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Élève</Label>
            <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={eleveId} onChange={(e) => setEleveId(e.target.value)}>
              <option value="">Sélectionner</option>
              {eleves.map((e) => (<option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Type de document</Label>
            <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="cni">CNI</option>
              <option value="acte_naissance">Acte de naissance</option>
              <option value="photo">Photo d&apos;identité</option>
              <option value="bulletin">Bulletin</option>
              <option value="certificat">Certificat</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Fichier (max 10 Mo)</Label>
            <Input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} accept="image/*,application/pdf" />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {saving ? "Upload en cours..." : "Uploader"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
