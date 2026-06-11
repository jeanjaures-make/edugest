"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Save, Building, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"

export default function EcolePage() {
  const router = useRouter()
  const { profile } = useUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nom, setNom] = useState("")
  const [adresse, setAdresse] = useState("")
  const [telephone, setTelephone] = useState("")
  const [email, setEmail] = useState("")
  const [siteWeb, setSiteWeb] = useState("")
  const [codeEtablissement, setCodeEtablissement] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    async function load() {
      const { data } = await supabase
        .from("ecoles")
        .select("*")
        .eq("id", ecoleId)
        .single()

      if (data) {
        setNom(data.nom || "")
        setAdresse(data.adresse || "")
        setTelephone(data.telephone || "")
        setEmail(data.email || "")
        setSiteWeb(data.site_web || "")
        setCodeEtablissement(data.code_etablissement || "")
      }
      setLoading(false)
    }
    load()
  }, [profile])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.ecole_id) return
    setSaving(true)
    setError("")
    setSuccess(false)

    const { error: updateError } = await supabase
      .from("ecoles")
      .update({ nom, adresse, telephone, email, site_web: siteWeb, updated_at: new Date().toISOString() })
      .eq("id", profile.ecole_id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parametres" className="text-sm text-gray-500 hover:text-gray-900">← Retour aux paramètres</Link>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">Mon école</h2>
        <p className="text-sm text-gray-500">Informations de votre établissement</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Informations générales</CardTitle>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {success && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">Établissement mis à jour</div>}

          <div className="flex items-center gap-6 mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Building className="h-10 w-10" />
            </div>
            <div>
              <h3 className="font-medium">{nom || "Mon école"}</h3>
              <p className="text-sm text-gray-500">Code : {codeEtablissement}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de l'établissement</Label>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Code établissement</Label>
              <Input value={codeEtablissement} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site">Site web</Label>
              <Input id="site" value={siteWeb} onChange={(e) => setSiteWeb(e.target.value)} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
