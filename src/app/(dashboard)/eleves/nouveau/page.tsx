"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"

interface ClasseOption {
  id: string
  libelle: string
}

export default function NouvelElevePage() {
  const router = useRouter()
  const { profile } = useUser()
  const [classes, setClasses] = useState<ClasseOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    sexe: "",
    nationalite: "Ivoirienne",
    adresse: "",
    telephone: "",
    email: "",
    classe_id: "",
  })

  useEffect(() => {
    if (!profile?.ecole_id) return
    supabase
      .from("classes")
      .select("id, libelle")
      .eq("ecole_id", profile.ecole_id)
      .order("libelle")
      .then(({ data }) => { if (data) setClasses(data) })
  }, [profile?.ecole_id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/eleves/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création")
      }

      router.push(`/eleves/${data.eleve.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setSaving(false)
    }
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <Link href="/eleves" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Retour à la liste
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nouvel élève</h2>
        <p className="text-sm text-gray-500">Ajouter un élève à l&apos;établissement</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">Identité</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" required value={form.nom} onChange={(e) => update("nom", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input id="prenom" required value={form.prenom} onChange={(e) => update("prenom", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_naissance">Date de naissance</Label>
              <Input id="date_naissance" type="date" value={form.date_naissance} onChange={(e) => update("date_naissance", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
              <Input id="lieu_naissance" value={form.lieu_naissance} onChange={(e) => update("lieu_naissance", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sexe">Sexe</Label>
              <select
                id="sexe"
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.sexe}
                onChange={(e) => update("sexe", e.target.value)}
              >
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalite">Nationalité</Label>
              <Input id="nationalite" value={form.nationalite} onChange={(e) => update("nationalite", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Contact</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" value={form.adresse} onChange={(e) => update("adresse", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" value={form.telephone} onChange={(e) => update("telephone", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Classe</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="classe_id">Classe d&apos;affectation</Label>
              <select
                id="classe_id"
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.classe_id}
                onChange={(e) => update("classe_id", e.target.value)}
              >
                <option value="">Non affecté</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.libelle}</option>
                ))}
              </select>
              {classes.length === 0 && (
                <p className="text-xs text-gray-400">Aucune classe créée. Allez dans Paramètres pour ajouter des classes.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer l'élève"}
          </Button>
          <Link href="/eleves">
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
