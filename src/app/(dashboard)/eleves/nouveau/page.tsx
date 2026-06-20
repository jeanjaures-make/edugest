"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Upload, Scan, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"

interface ClasseOption {
  id: string
  libelle: string
}

function extractFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {}

  const patterns: [string, RegExp][] = [
    ["nom", /(?:\bNOM\b|\bNom\b|\bNOM\s*:\s*)([A-Za-zÀ-ÿ\s\-]+?)(?:\n|,\s*\n|\s{2,}|$)/],
    ["prenom", /(?:\bPRENOMS?\b|\bPrénoms?\b|\bPrenoms?\b|\bPRENOM\b|\bPrénom\b|\bPrenom\b)\s*:?\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\n|,\s*\n|\s{2,}|$)/],
    ["date_naissance", /(?:\bDATE\s*DE\s*NAISSANCE\b|\bDate\s*de\s*naissance\b|\bNÉE?\s*LE\b|\bNee?\s*le\b)\s*:?\s*(\d{1,2}[/\s-]\d{1,2}[/\s-]\d{2,4})/],
    ["lieu_naissance", /(?:\bLIEU\s*DE\s*NAISSANCE\b|\bLieu\s*de\s*naissance\b|\bNÉE?\s*A\b|\bNee?\s*a\b)\s*:?\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\n|$)/],
    ["sexe", /(?:\bSEXE\b|\bSexe\b)\s*:?\s*([MF])/],
    ["nationalite", /(?:\bNATIONALITE?\b|\bNationalité\b|\bNationalite\b)\s*:?\s*([A-Za-zÀ-ÿ\s\-]+?)(?:\n|$)/],
    ["adresse", /(?:\bADRESSE\b|\bAdresse\b|\bDOMICILE\b|\bDomicile\b)\s*:?\s*([A-Za-zÀ-ÿ0-9\s\-,.]+?)(?:\n{2,}|$)/],
    ["telephone", /(?:\bTELEPHONE\b|\bTéléphone\b|\bTelephone\b|\bTEL\b|\bTel\b)\s*:?\s*([+\d\s\-]{8,})/],
    ["email", /(?:\bEMAIL\b|\bEmail\b|\bE-MAIL\b|\bCourriel\b|\bMAIL\b)\s*:?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/],
  ]

  for (const [key, regex] of patterns) {
    const match = text.match(regex)
    if (match && match[1]) {
      fields[key] = match[1].trim()
    }
  }

  if (fields["date_naissance"]) {
    const d = fields["date_naissance"].replace(/\s+/g, "/")
    const parts = d.split("/")
    if (parts.length === 3) {
      let [d1, d2, d3] = parts
      if (d3.length === 2) d3 = "20" + d3
      if (d1.length === 4) {
        fields["date_naissance"] = `${d1}-${d2.padStart(2, "0")}-${d3.padStart(2, "0")}`
      } else {
        fields["date_naissance"] = `${d3}-${d2.padStart(2, "0")}-${d1.padStart(2, "0")}`
      }
    }
  }

  if (fields["sexe"]) {
    const s = fields["sexe"].toUpperCase()
    fields["sexe"] = s === "M" ? "M" : s === "F" ? "F" : ""
  }

  return fields
}

export default function NouvelElevePage() {
  const router = useRouter()
  const { profile } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [classes, setClasses] = useState<ClasseOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrFile, setOcrFile] = useState<File | null>(null)
  const [ocrPreview, setOcrPreview] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState("")
  const [ocrFieldsFound, setOcrFieldsFound] = useState<string[]>([])

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

  useEffect(() => {
    return () => { if (ocrPreview) URL.revokeObjectURL(ocrPreview) }
  }, [ocrPreview])

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleOcrFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["image/png", "image/jpeg", "image/webp"]
    if (!allowed.includes(file.type)) { setError("Format non supporté (PNG, JPG, WEBP)"); return }
    if (file.size > 10 * 1024 * 1024) { setError("Fichier trop volumineux (max 10 Mo)"); return }
    setError("")
    setOcrFile(file)
    setOcrPreview(URL.createObjectURL(file))
    setOcrText("")
    setOcrFieldsFound([])
  }

  function handleOcrRemove() {
    setOcrFile(null)
    if (ocrPreview) URL.revokeObjectURL(ocrPreview)
    setOcrPreview(null)
    setOcrText("")
    setOcrFieldsFound([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleOcrScan() {
    if (!ocrFile) return
    setOcrLoading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", ocrFile)
      const res = await fetch("/api/ocr", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Échec de l'OCR")
      setOcrText(data.text)

      const extracted = extractFields(data.text)
      const found: string[] = []
      for (const [key, value] of Object.entries(extracted)) {
        if (value) {
          update(key, value)
          found.push(key)
        }
      }
      setOcrFieldsFound(found)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur OCR")
    } finally {
      setOcrLoading(false)
    }
  }

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

  const labelMap: Record<string, string> = {
    nom: "Nom", prenom: "Prénom", date_naissance: "Date naissance",
    lieu_naissance: "Lieu naissance", sexe: "Sexe", nationalite: "Nationalité",
    adresse: "Adresse", telephone: "Téléphone", email: "Email",
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            Scanner un document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Téléchargez une photo de la pièce d&apos;identité (CNI, passeport) ou de la fiche d&apos;inscription
            pour préremplir automatiquement le formulaire.
          </p>

          <div className="flex items-start gap-4">
            {ocrPreview ? (
              <div className="relative shrink-0">
                <img src={ocrPreview} alt="Aperçu" className="h-32 w-32 rounded-lg border border-border object-cover" />
                <button
                  type="button"
                  onClick={handleOcrRemove}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-32 w-32 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary transition-colors shrink-0"
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs">Document</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleOcrFileSelect}
              className="hidden"
            />

            <div className="space-y-3 flex-1">
              {ocrFieldsFound.length > 0 && (
                <div className="text-sm space-y-1">
                  <p className="text-green-600 font-medium">Champs détectés :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ocrFieldsFound.map((k) => (
                      <span key={k} className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                        {labelMap[k] || k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOcrScan}
                  disabled={!ocrFile || ocrLoading}
                  loading={ocrLoading}
                >
                  {ocrLoading ? "Analyse..." : "Lancer l'OCR"}
                </Button>
              </div>

              {ocrText && (
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-600">Texte brut OCR</summary>
                  <pre className="mt-1 max-h-24 overflow-y-auto rounded bg-gray-50 p-2 whitespace-pre-wrap font-mono text-[10px] leading-tight">{ocrText}</pre>
                </details>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
