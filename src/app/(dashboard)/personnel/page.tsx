"use client"

import { useEffect, useState, useEffectEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageTransition } from "@/components/animations/page-transition"
import { FadeInView } from "@/components/animations/fade-in-view"
import { Plus, Mail, Phone, Pencil, Save, Loader2 } from "lucide-react"
import { CountUp } from "@/components/animations/count-up"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { staggerContainer, statCardItem } from "@/lib/animations"

interface PersonnelRow {
  id: string
  matricule: string
  nom: string
  prenom: string
  type: string
  telephone: string | null
  email: string | null
  statut: string
}

export default function PersonnelPage() {
  const { profile } = useUser()
  const [rows, setRows] = useState<PersonnelRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<PersonnelRow | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState("")
  const [editForm, setEditForm] = useState({ nom: "", prenom: "", telephone: "", type: "", statut: "" })

  async function load() {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const { data } = await supabase
      .from("personnel")
      .select("*")
      .eq("ecole_id", ecoleId)
      .order("nom", { ascending: true })
    if (data) setRows(data)
    setLoading(false)
  }

  const onLoad = useEffectEvent(() => load())
  useEffect(() => { onLoad() }, [])

  const actifs = rows.filter((r) => r.statut === "actif").length
  const enseignants = rows.filter((r) => r.type === "enseignant").length
  const administratifs = rows.filter((r) => r.type === "administratif").length

  const columns: Column<PersonnelRow>[] = [
    {
      key: "nom",
      label: "Nom & Prénom",
      sortable: true,
      cell: (p) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary text-xs font-bold">
            {p.prenom.charAt(0)}{p.nom.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{p.nom} {p.prenom}</p>
            <p className="text-xs text-muted-foreground font-mono">{p.matricule}</p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      cell: (p) => (
        <Badge variant={p.type === "enseignant" ? "info" : "default"}>
          {p.type === "enseignant" ? "Enseignant" : "Administratif"}
        </Badge>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      hideOnMobile: true,
      cell: (p) => (
        <div className="flex flex-col text-xs text-muted-foreground">
          {p.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>}
          {p.telephone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.telephone}</span>}
        </div>
      ),
    },
    {
      key: "statut",
      label: "Statut",
      sortable: true,
      cell: (p) => (
        <Badge variant={p.statut === "actif" ? "success" : "warning"} dot>
          {p.statut === "actif" ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      cell: (p) => (
        <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setEditTarget(p); setEditForm({ nom: p.nom, prenom: p.prenom, telephone: p.telephone ?? "", type: p.type, statut: p.statut }); setEditError(""); setEditOpen(true) }}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        <FadeInView>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Personnel</h1>
              <p className="text-sm text-muted-foreground">Gestion des enseignants et administratifs</p>
            </div>
            <AjouterMembreDialog onCreated={() => { load() }} ecoleId={profile?.ecole_id} />
          </div>
        </FadeInView>

        {loading ? (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-12" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 grid-cols-2 md:grid-cols-4"
          >
            <motion.div variants={statCardItem} custom={0}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                  <p className="text-xs md:text-sm text-blue-100">Total</p>
                  <p className="text-xl md:text-2xl font-bold"><CountUp end={rows.length} /></p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={statCardItem} custom={1}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                  <p className="text-xs md:text-sm text-emerald-100">Actifs</p>
                  <p className="text-xl md:text-2xl font-bold"><CountUp end={actifs} /></p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={statCardItem} custom={2}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-violet-600 to-violet-700 text-white">
                  <p className="text-xs md:text-sm text-violet-100">Enseignants</p>
                  <p className="text-xl md:text-2xl font-bold"><CountUp end={enseignants} /></p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={statCardItem} custom={3}>
              <Card className="overflow-hidden border-0">
                <CardContent className="p-4 md:p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <p className="text-xs md:text-sm text-orange-100">Administratifs</p>
                  <p className="text-xl md:text-2xl font-bold"><CountUp end={administratifs} /></p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}

        <Card>
          <CardContent className="p-4 md:p-6">
            <DataTable
              columns={columns}
              data={rows}
              loading={loading}
              searchPlaceholder="Rechercher un membre..."
              emptyMessage="Aucun membre trouvé"
              getRowKey={(p) => p.id}
              pageSize={10}
              mobileCard={(p) => (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary text-xs font-bold">
                        {p.prenom.charAt(0)}{p.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.nom} {p.prenom}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.matricule}</p>
                      </div>
                    </div>
                    <Badge variant={p.statut === "actif" ? "success" : "warning"} size="sm" dot>
                      {p.statut === "actif" ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant={p.type === "enseignant" ? "info" : "default"} size="sm">
                      {p.type === "enseignant" ? "Enseignant" : "Administratif"}
                    </Badge>
                    {p.email && <span>{p.email}</span>}
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>

      <ModifierMembreDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        form={editForm}
        setForm={setEditForm}
        saving={editSaving}
        error={editError}
        target={editTarget}
        onSave={async () => {
          if (!editTarget) return
          setEditSaving(true)
          setEditError("")
          const { error } = await supabase.from("personnel").update({
            nom: editForm.nom, prenom: editForm.prenom,
            telephone: editForm.telephone || null,
            type: editForm.type, statut: editForm.statut,
          }).eq("id", editTarget.id)
          setEditSaving(false)
          if (error) { setEditError(error.message); return }
          setEditOpen(false); setEditTarget(null); load()
        }}
      />
    </PageTransition>
  )
}

function ModifierMembreDialog({ open, onOpenChange, form, setForm, saving, error, target, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void
  form: { nom: string; prenom: string; telephone: string; type: string; statut: string }
  setForm: (f: { nom: string; prenom: string; telephone: string; type: string; statut: string }) => void; saving: boolean; error: string
  target: PersonnelRow | null; onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier un membre</DialogTitle>
          <DialogDescription>{target?.prenom} {target?.nom}</DialogDescription>
        </DialogHeader>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); onSave() }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+225 01 02 03 04 05" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="enseignant">Enseignant</option>
                <option value="administratif">Administratif</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="h-4 w-4 mr-2" />Enregistrer</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AjouterMembreDialog({ onCreated, ecoleId }: { onCreated: () => void; ecoleId?: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [email, setEmail] = useState("")
  const [telephone, setTelephone] = useState("")
  const [type, setType] = useState("enseignant")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom || !prenom || !email || !ecoleId) return
    setSaving(true)
    setError("")
    setSuccess("")
    const res = await fetch("/api/personnel/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, prenom, email, telephone, type }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || "Erreur"); return }
    setSuccess(`Compte créé ! Email: ${email} / Mot de passe provisoire: ${data.tempPassword}`)
    setTimeout(() => { setOpen(false); setSuccess(""); setNom(""); setPrenom(""); setEmail(""); setTelephone(""); onCreated() }, 4000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Ajouter un membre</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>Créer un compte pour un nouveau membre du personnel</DialogDescription>
        </DialogHeader>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {success && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Kouassi" />
            </div>
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input required value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Jean" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jean.kouassi@ecole.ci" />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+225 01 02 03 04 05" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select required className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="enseignant">Enseignant</option>
              <option value="administratif">Administratif</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Création en cours..." : "Créer le compte"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
