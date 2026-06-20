"use client"

import { useEffect, useState, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Upload, X } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"

export default function EcolePage() {
  const { profile } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [nom, setNom] = useState("")
  const [adresse, setAdresse] = useState("")
  const [telephone, setTelephone] = useState("")
  const [email, setEmail] = useState("")
  const [siteWeb, setSiteWeb] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
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
        setLogoUrl(data.logo_url || "")
        setCodeEtablissement(data.code_etablissement || "")
      }
      setLoading(false)
    }
    load()
  }, [profile])

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
    if (!allowed.includes(file.type)) { setError("Format non supporté"); return }
    if (file.size > 2 * 1024 * 1024) { setError("Fichier trop volumineux (max 2 Mo)"); return }
    setError("")
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleLogoRemove() {
    setLogoFile(null)
    setLogoUrl("")
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function uploadLogoAndSave(): Promise<string | null> {
    if (!logoFile || !profile?.ecole_id) return null
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", logoFile)
      formData.append("school_id", profile.ecole_id)
      const res = await fetch("/api/upload-logo", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Échec de l'upload")
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      setLogoPreview(null)
      setLogoFile(null)
      return data.url
    } catch { return null }
    finally { setUploading(false) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.ecole_id) return
    setSaving(true)
    setError("")
    setSuccess(false)

    let finalLogoUrl = logoUrl
    if (logoFile) {
      const uploaded = await uploadLogoAndSave()
      if (!uploaded) { setSaving(false); return }
      finalLogoUrl = uploaded
    }
    const { error: updateError } = await supabase
      .from("ecoles")
      .update({ nom, adresse, telephone, email, site_web: siteWeb, logo_url: finalLogoUrl, updated_at: new Date().toISOString() })
      .eq("id", profile.ecole_id)
    if (!updateError) setLogoUrl(finalLogoUrl)

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
            <Button onClick={handleSave} disabled={saving || uploading} loading={saving || uploading}>
              {saving || uploading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          {success && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">Établissement mis à jour</div>}

          <div className="flex items-center gap-6 mb-6">
            {(logoPreview || logoUrl) ? (
              <div className="relative h-20 w-20 shrink-0">
                <img src={logoPreview || logoUrl} alt="Logo" className="h-full w-full rounded-xl object-contain border border-border" />
                <button type="button" onClick={handleLogoRemove} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="h-20 w-20 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-primary transition-colors shrink-0">
                <Upload className="h-5 w-5" />
                <span className="text-[10px]">Logo</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoSelect} className="hidden" />
            <div>
              <h3 className="font-medium">{nom || "Mon école"}</h3>
              <p className="text-sm text-gray-500">Code : {codeEtablissement}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de l&apos;établissement</Label>
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
