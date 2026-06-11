"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"

interface Niveau { id: string; libelle: string; code: string; ordre: number }
interface Classe { id: string; libelle: string; niveau: { libelle: string } | null; frais_scolarite: number; frais_inscription: number }
interface Matiere { id: string; libelle: string; code: string; coefficient: number }

export default function ClassesPage() {
  const { profile } = useUser()

  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [matieres, setMatieres] = useState<Matiere[]>([])
  const [personnel, setPersonnel] = useState<{ id: string; nom: string; prenom: string }[]>([])
  const [assignations, setAssignations] = useState<{ id: string; enseignant: { nom: string; prenom: string } | null; classe: { libelle: string } | null; matiere: { libelle: string } | null }[]>([])
  const [loading, setLoading] = useState(true)

  const [newNiveau, setNewNiveau] = useState({ libelle: "", code: "", ordre: "" })
  const [newClasse, setNewClasse] = useState({ libelle: "", niveau_id: "", frais_scolarite: "", frais_inscription: "" })
  const [newMatiere, setNewMatiere] = useState({ libelle: "", code: "", coefficient: "1" })
  const [newAssign, setNewAssign] = useState({ enseignant_id: "", classe_id: "", matiere_id: "" })
  const [tab, setTab] = useState("niveaux")

  async function reload() {
    if (!profile?.ecole_id) return
    const [n, c, m, p, a] = await Promise.all([
      supabase.from("niveaux").select("*").eq("ecole_id", profile.ecole_id).order("ordre"),
      supabase.from("classes").select("*, niveau:niveaux(libelle)").eq("ecole_id", profile.ecole_id).order("libelle"),
      supabase.from("matieres").select("*").eq("ecole_id", profile.ecole_id).order("libelle"),
      supabase.from("personnel").select("id, nom, prenom").eq("ecole_id", profile.ecole_id).eq("type", "enseignant").eq("statut", "actif").order("nom"),
      supabase.from("enseignants_classes").select("id, enseignant:personnel(nom, prenom), classe:classes(libelle), matiere:matieres(libelle)").eq("...enseignant.ecole_id", profile.ecole_id),
    ])
    if (n.data) setNiveaux(n.data)
    if (c.data) setClasses(c.data as unknown as Classe[])
    if (m.data) setMatieres(m.data)
    if (p.data) setPersonnel(p.data)
    if (a.data) setAssignations(a.data as unknown as typeof assignations)
  }

  useEffect(() => {
    if (!profile?.ecole_id) { setLoading(false); return }
    reload().finally(() => setLoading(false))
  }, [profile?.ecole_id])

  async function addNiveau() {
    if (!profile?.ecole_id || !newNiveau.libelle || !newNiveau.code) return
    await supabase.from("niveaux").insert({
      ecole_id: profile.ecole_id, libelle: newNiveau.libelle,
      code: newNiveau.code, ordre: parseInt(newNiveau.ordre) || 0,
    })
    setNewNiveau({ libelle: "", code: "", ordre: "" })
    reload()
  }

  async function deleteNiveau(id: string) {
    await supabase.from("niveaux").delete().eq("id", id)
    reload()
  }

  async function addClasse() {
    if (!profile?.ecole_id || !newClasse.libelle) return
    const { data: annee } = await supabase
      .from("annees_scolaires").select("id").eq("ecole_id", profile.ecole_id).eq("active", true).single()
    await supabase.from("classes").insert({
      ecole_id: profile.ecole_id, libelle: newClasse.libelle,
      niveau_id: newClasse.niveau_id || null,
      annee_scolaire_id: annee?.id ?? null,
      frais_scolarite: parseInt(newClasse.frais_scolarite) || 0,
      frais_inscription: parseInt(newClasse.frais_inscription) || 0,
    })
    setNewClasse({ libelle: "", niveau_id: "", frais_scolarite: "", frais_inscription: "" })
    reload()
  }

  async function deleteClasse(id: string) {
    await supabase.from("classes").delete().eq("id", id)
    reload()
  }

  async function addMatiere() {
    if (!profile?.ecole_id || !newMatiere.libelle || !newMatiere.code) return
    await supabase.from("matieres").insert({
      ecole_id: profile.ecole_id, libelle: newMatiere.libelle,
      code: newMatiere.code, coefficient: parseInt(newMatiere.coefficient) || 1,
    })
    setNewMatiere({ libelle: "", code: "", coefficient: "1" })
    reload()
  }

  async function deleteMatiere(id: string) {
    await supabase.from("matieres").delete().eq("id", id)
    reload()
  }

  async function addAssignation() {
    if (!profile?.ecole_id || !newAssign.enseignant_id || !newAssign.classe_id || !newAssign.matiere_id) return
    const { data: annee } = await supabase
      .from("annees_scolaires").select("id").eq("ecole_id", profile.ecole_id).eq("active", true).single()
    await supabase.from("enseignants_classes").insert({
      enseignant_id: newAssign.enseignant_id,
      classe_id: newAssign.classe_id,
      matiere_id: newAssign.matiere_id,
      annee_scolaire_id: annee?.id ?? null,
    })
    setNewAssign({ enseignant_id: "", classe_id: "", matiere_id: "" })
    reload()
  }

  async function deleteAssignation(id: string) {
    await supabase.from("enseignants_classes").delete().eq("id", id)
    reload()
  }

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Classes & Matières</h2>
        <p className="text-sm text-gray-500">Gérer les niveaux, classes et matières</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="niveaux">Niveaux</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="matieres">Matières</TabsTrigger>
          <TabsTrigger value="assignations">Professeurs</TabsTrigger>
        </TabsList>

        <TabsContent value="niveaux" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ajouter un niveau</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="space-y-1 flex-1">
                  <Label>Libellé</Label>
                  <Input value={newNiveau.libelle} onChange={(e) => setNewNiveau({ ...newNiveau, libelle: e.target.value })} placeholder="ex: 6ème" />
                </div>
                <div className="space-y-1 w-24">
                  <Label>Code</Label>
                  <Input value={newNiveau.code} onChange={(e) => setNewNiveau({ ...newNiveau, code: e.target.value })} placeholder="6E" />
                </div>
                <div className="space-y-1 w-20">
                  <Label>Ordre</Label>
                  <Input type="number" value={newNiveau.ordre} onChange={(e) => setNewNiveau({ ...newNiveau, ordre: e.target.value })} />
                </div>
                <Button onClick={addNiveau}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Ordre</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {niveaux.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-8">Aucun niveau</TableCell></TableRow>
                  ) : niveaux.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>{n.libelle}</TableCell>
                      <TableCell className="font-mono text-xs">{n.code}</TableCell>
                      <TableCell>{n.ordre}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteNiveau(n.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ajouter une classe</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-40">
                  <Label>Libellé</Label>
                  <Input value={newClasse.libelle} onChange={(e) => setNewClasse({ ...newClasse, libelle: e.target.value })} placeholder="ex: 6ème A" />
                </div>
                <div className="space-y-1 w-36">
                  <Label>Niveau</Label>
                  <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" value={newClasse.niveau_id} onChange={(e) => setNewClasse({ ...newClasse, niveau_id: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {niveaux.map((n) => <option key={n.id} value={n.id}>{n.libelle}</option>)}
                  </select>
                </div>
                <div className="space-y-1 w-28">
                  <Label>Inscription</Label>
                  <Input type="number" value={newClasse.frais_inscription} onChange={(e) => setNewClasse({ ...newClasse, frais_inscription: e.target.value })} placeholder="FCFA" />
                </div>
                <div className="space-y-1 w-28">
                  <Label>Scolarité</Label>
                  <Input type="number" value={newClasse.frais_scolarite} onChange={(e) => setNewClasse({ ...newClasse, frais_scolarite: e.target.value })} placeholder="FCFA" />
                </div>
                <Button onClick={addClasse}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classe</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead>Scolarité</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">Aucune classe</TableCell></TableRow>
                  ) : classes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.libelle}</TableCell>
                      <TableCell>{c.niveau?.libelle ?? "-"}</TableCell>
                      <TableCell>{c.frais_inscription.toLocaleString()} FCFA</TableCell>
                      <TableCell>{c.frais_scolarite.toLocaleString()} FCFA</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteClasse(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matieres" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ajouter une matière</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="space-y-1 flex-1">
                  <Label>Libellé</Label>
                  <Input value={newMatiere.libelle} onChange={(e) => setNewMatiere({ ...newMatiere, libelle: e.target.value })} placeholder="ex: Mathématiques" />
                </div>
                <div className="space-y-1 w-24">
                  <Label>Code</Label>
                  <Input value={newMatiere.code} onChange={(e) => setNewMatiere({ ...newMatiere, code: e.target.value })} placeholder="MATH" />
                </div>
                <div className="space-y-1 w-20">
                  <Label>Coeff</Label>
                  <Input type="number" value={newMatiere.coefficient} onChange={(e) => setNewMatiere({ ...newMatiere, coefficient: e.target.value })} />
                </div>
                <Button onClick={addMatiere}><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matière</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Coefficient</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matieres.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-8">Aucune matière</TableCell></TableRow>
                  ) : matieres.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.libelle}</TableCell>
                      <TableCell className="font-mono text-xs">{m.code}</TableCell>
                      <TableCell>{m.coefficient}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMatiere(m.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignations" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Assigner un professeur</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="space-y-1 flex-1 min-w-40">
                  <Label>Professeur</Label>
                  <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={newAssign.enseignant_id} onChange={(e) => setNewAssign({ ...newAssign, enseignant_id: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {personnel.map((p) => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
                  </select>
                </div>
                <div className="space-y-1 w-36">
                  <Label>Classe</Label>
                  <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={newAssign.classe_id} onChange={(e) => setNewAssign({ ...newAssign, classe_id: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                  </select>
                </div>
                <div className="space-y-1 w-36">
                  <Label>Matière</Label>
                  <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={newAssign.matiere_id} onChange={(e) => setNewAssign({ ...newAssign, matiere_id: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {matieres.map((m) => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                  </select>
                </div>
                <Button onClick={addAssignation}><Plus className="h-4 w-4 mr-1" />Assigner</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Professeur</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Matière</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignations.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-8">Aucune assignation</TableCell></TableRow>
                  ) : assignations.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.enseignant?.prenom} {a.enseignant?.nom}</TableCell>
                      <TableCell>{a.classe?.libelle}</TableCell>
                      <TableCell>{a.matiere?.libelle}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteAssignation(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
