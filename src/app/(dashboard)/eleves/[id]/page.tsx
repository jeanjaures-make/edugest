"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Download, FileText, Check, X, Clock, AlertTriangle, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatMontant } from "@/lib/utils"

interface EleveDetail {
  id: string
  matricule: string
  nom: string
  prenom: string
  date_naissance: string | null
  lieu_naissance: string | null
  sexe: string | null
  nationalite: string | null
  adresse: string | null
  telephone: string | null
  email: string | null
  photo_url: string | null
  statut: string
  classe: { libelle: string } | null
  parent: { nom: string; prenom: string; telephone: string | null } | null
}

interface NoteRow {
  id: string
  valeur: number
  appreciation: string | null
  evaluation: { libelle: string; coefficient: number; type: string; matiere: { libelle: string } | null } | null
}

interface PresenceRow {
  id: string
  date: string
  statut: string
  motif: string | null
}

interface PaiementRow {
  id: string
  reference: string
  montant: number
  methode: string
  statut: string
  telephone: string | null
  date_paiement: string
}

interface Inscription {
  id: string
  date_inscription: string
  statut: string
  classe: { libelle: string } | null
  annee_scolaire: { libelle: string } | null
}

interface Document {
  id: string
  type: string
  nom: string
  url: string
}

export default function EleveDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("infos")
  const [eleve, setEleve] = useState<EleveDetail | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState("")
  const [editForm, setEditForm] = useState({ nom: "", prenom: "", date_naissance: "", lieu_naissance: "", sexe: "", nationalite: "", adresse: "", telephone: "", email: "", statut: "" })
  const [inscriptions, setInscriptions] = useState<Inscription[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [presences, setPresences] = useState<PresenceRow[]>([])
  const [paiements, setPaiements] = useState<PaiementRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return
    const id = params.id as string
    async function load() {
      const { data: e } = await supabase
        .from("eleves")
        .select("*, classe:classes(libelle), parent:profils!parent_id(nom, prenom, telephone)")
        .eq("id", id)
        .single()
      if (e) setEleve(e as unknown as EleveDetail)

      const { data: ins } = await supabase
        .from("inscriptions")
        .select("id, date_inscription, statut, classe:classes(libelle), annee_scolaire:annees_scolaires(libelle)")
        .eq("eleve_id", id)
        .order("date_inscription", { ascending: false })
      if (ins) setInscriptions(ins as unknown as Inscription[])

      const { data: docs } = await supabase
        .from("documents_eleves")
        .select("id, type, nom, url")
        .eq("eleve_id", id)
      if (docs) setDocuments(docs as unknown as Document[])

      const { data: n } = await supabase
        .from("notes")
        .select("id, valeur, appreciation, evaluation: evaluations!inner(libelle, coefficient, type, matiere: matieres!inner(libelle))")
        .eq("eleve_id", id)
      if (n) setNotes(n as unknown as NoteRow[])

      const { data: p } = await supabase
        .from("presences")
        .select("id, date, statut, motif")
        .eq("eleve_id", id)
        .order("date", { ascending: false })
        .limit(30)
      if (p) setPresences(p as unknown as PresenceRow[])

      const { data: pm } = await supabase
        .from("paiements")
        .select("id, reference, montant, methode, statut, telephone, date_paiement")
        .eq("eleve_id", id)
        .order("date_paiement", { ascending: false })
      if (pm) setPaiements(pm as unknown as PaiementRow[])

      setLoading(false)
    }
    load()
  }, [params?.id])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!eleve) {
    return <div className="text-center py-20 text-gray-500">Élève introuvable</div>
  }

  const initials = `${eleve.prenom.charAt(0)}${eleve.nom.charAt(0)}`

  function formatDate(date: string | null) {
    if (!date) return "-"
    return format(new Date(date), "dd/MM/yyyy", { locale: fr })
  }

  return (
    <div className="space-y-6">
      <Link href="/eleves" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Retour à la liste
      </Link>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{eleve.prenom} {eleve.nom}</h2>
            <p className="text-sm text-gray-500">Élève{eleve.classe ? ` - ${eleve.classe.libelle}` : ""}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant={eleve.statut === "actif" ? "success" : "warning"}>
                {eleve.statut === "actif" ? "Actif" : "Inactif"}
              </Badge>
              <Badge variant="info">Matricule: {eleve.matricule}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Exporter dossier</Button>
          <Button onClick={() => {
            setEditForm({
              nom: eleve.nom, prenom: eleve.prenom,
              date_naissance: eleve.date_naissance ? eleve.date_naissance.split("T")[0] : "",
              lieu_naissance: eleve.lieu_naissance ?? "",
              sexe: eleve.sexe ?? "", nationalite: eleve.nationalite ?? "Ivoirienne",
              adresse: eleve.adresse ?? "", telephone: eleve.telephone ?? "",
              email: eleve.email ?? "", statut: eleve.statut,
            })
            setEditError("")
            setEditOpen(true)
          }}>Modifier</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="infos">Informations</TabsTrigger>
          <TabsTrigger value="scolarite">Scolarité</TabsTrigger>
          <TabsTrigger value="notes">Notes & bulletins</TabsTrigger>
          <TabsTrigger value="presences">Présences</TabsTrigger>
          <TabsTrigger value="paiements">Paiements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Identité</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Nom" value={eleve.nom} />
                <Row label="Prénom" value={eleve.prenom} />
                <Row label="Date naissance" value={formatDate(eleve.date_naissance)} />
                <Row label="Lieu naissance" value={eleve.lieu_naissance ?? "-"} />
                <Row label="Sexe" value={eleve.sexe === "M" ? "Masculin" : eleve.sexe === "F" ? "Féminin" : "-"} />
                <Row label="Nationalité" value={eleve.nationalite ?? "Ivoirienne"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Contact & Parent</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Adresse" value={eleve.adresse ?? "-"} />
                <Row label="Téléphone" value={eleve.telephone ?? "-"} />
                <Row label="Email" value={eleve.email ?? "-"} />
                <Row label="Parent" value={eleve.parent ? `${eleve.parent.prenom} ${eleve.parent.nom}` : "-"} />
                <Row label="Tél. parent" value={eleve.parent?.telephone ?? "-"} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scolarite" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Parcours scolaire</CardTitle></CardHeader>
            <CardContent>
              {inscriptions.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune inscription</p>
              ) : (
                <div className="space-y-4">
                  {inscriptions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="text-sm font-medium">{s.annee_scolaire?.libelle ?? "-"}</p>
                        <p className="text-xs text-gray-500">{s.classe?.libelle ?? "-"}</p>
                      </div>
                      <Badge variant={s.statut === "confirmee" ? "success" : s.statut === "annulee" ? "danger" : "warning"}>
                        {s.statut === "confirmee" ? "Inscrit" : s.statut === "annulee" ? "Annulé" : "En attente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Relevé de notes</CardTitle></CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune note disponible.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matière</TableHead>
                      <TableHead>Évaluation</TableHead>
                      <TableHead>Note /20</TableHead>
                      <TableHead>Coeff.</TableHead>
                      <TableHead>Appréciation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notes.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell className="font-medium">{n.evaluation?.matiere?.libelle ?? "-"}</TableCell>
                        <TableCell className="text-xs">{n.evaluation?.libelle ?? "-"}</TableCell>
                        <TableCell>
                          <span className={n.valeur >= 10 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {n.valeur.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>{n.evaluation?.coefficient ?? 1}</TableCell>
                        <TableCell className="text-xs text-gray-500">{n.appreciation || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presences" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Assiduité</CardTitle></CardHeader>
            <CardContent>
              {presences.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune donnée de présence.</p>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <StatBox label="Total" value={presences.length.toString()} color="text-gray-900" />
                    <StatBox label="Présent" value={presences.filter((p) => p.statut === "present").length.toString()} color="text-green-600" />
                    <StatBox label="Absent" value={presences.filter((p) => p.statut === "absent").length.toString()} color="text-red-600" />
                    <StatBox label="Retard" value={presences.filter((p) => p.statut === "retard").length.toString()} color="text-orange-600" />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Motif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {presences.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{format(new Date(p.date), "dd/MM/yyyy", { locale: fr })}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {p.statut === "present" && <Check className="h-4 w-4 text-green-500" />}
                              {p.statut === "absent" && <X className="h-4 w-4 text-red-500" />}
                              {p.statut === "retard" && <Clock className="h-4 w-4 text-orange-500" />}
                              {p.statut === "exclu" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              <Badge variant={
                                p.statut === "present" ? "success" :
                                p.statut === "absent" ? "danger" :
                                p.statut === "retard" ? "warning" : "danger"
                              }>
                                {p.statut === "present" ? "Présent" :
                                 p.statut === "absent" ? "Absent" :
                                 p.statut === "retard" ? "Retard" : "Exclu"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{p.motif || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paiements" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Historique des paiements</CardTitle></CardHeader>
            <CardContent>
              {paiements.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun paiement enregistré.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatBox
                      label="Total payé"
                      value={formatMontant(paiements.filter((p) => p.statut === "confirme").reduce((s, p) => s + p.montant, 0))}
                      color="text-green-600"
                    />
                    <StatBox
                      label="En attente"
                      value={paiements.filter((p) => p.statut === "en_attente").length.toString()}
                      color="text-orange-600"
                    />
                    <StatBox
                      label="Échoué"
                      value={paiements.filter((p) => p.statut === "echoue").length.toString()}
                      color="text-red-600"
                    />
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Réf.</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paiements.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                          <TableCell className="font-bold">{formatMontant(p.montant)}</TableCell>
                          <TableCell className="text-xs">{p.methode === "orange_money" ? "Orange Money" : p.methode === "mtn_momo" ? "MTN MoMo" : p.methode === "especes" ? "Espèces" : p.methode === "virement" ? "Virement" : "Chèque"}</TableCell>
                          <TableCell className="text-xs">{format(new Date(p.date_paiement), "dd/MM/yyyy", { locale: fr })}</TableCell>
                          <TableCell>
                            <Badge variant={p.statut === "confirme" ? "success" : p.statut === "echoue" ? "danger" : "warning"}>
                              {p.statut === "confirme" ? "Confirmé" : p.statut === "echoue" ? "Échoué" : "En attente"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
              <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-2" />Ajouter un document</Button>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun document</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm">{doc.nom}</span>
                      <Badge variant="info">{doc.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ModifierEleveDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        form={editForm}
        setForm={setEditForm}
        saving={editSaving}
        error={editError}
        onSave={async () => {
          setEditSaving(true)
          setEditError("")
          const { error } = await supabase.from("eleves").update({
            nom: editForm.nom, prenom: editForm.prenom,
            date_naissance: editForm.date_naissance || null,
            lieu_naissance: editForm.lieu_naissance || null,
            sexe: editForm.sexe || null,
            nationalite: editForm.nationalite,
            adresse: editForm.adresse || null,
            telephone: editForm.telephone || null,
            email: editForm.email || null,
            statut: editForm.statut,
          }).eq("id", params.id)
          setEditSaving(false)
          if (error) { setEditError(error.message); return }
          setEditOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}

function ModifierEleveDialog({ open, onOpenChange, form, setForm, saving, error, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void
  form: { nom: string; prenom: string; date_naissance: string; lieu_naissance: string; sexe: string; nationalite: string; adresse: string; telephone: string; email: string; statut: string }
  setForm: (f: { nom: string; prenom: string; date_naissance: string; lieu_naissance: string; sexe: string; nationalite: string; adresse: string; telephone: string; email: string; statut: string }) => void; saving: boolean; error: string; onSave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;élève</DialogTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date naissance</Label>
              <Input type="date" value={form.date_naissance} onChange={(e) => setForm({ ...form, date_naissance: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Lieu naissance</Label>
              <Input value={form.lieu_naissance} onChange={(e) => setForm({ ...form, lieu_naissance: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sexe</Label>
              <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })}>
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nationalité</Label>
              <Input value={form.nationalite} onChange={(e) => setForm({ ...form, nationalite: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="ancien">Ancien</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="h-4 w-4 mr-2" />Enregistrer</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
