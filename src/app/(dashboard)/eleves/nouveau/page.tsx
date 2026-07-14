"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Upload, Scan, X, FileText, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import Image from "next/image"
import { useUser } from "@/lib/hooks/use-user"

interface ClasseOption {
  id: string
  libelle: string
  frais_inscription: number
}

const FIELD_LABELS: [string, string[]][] = [
  ["nom", ["NOM", "NOM DE FAMILLE"]],
  ["prenom", ["PRENOM", "PRENOMS", "PRÉNOM", "PRÉNOMS"]],
  ["date_naissance", ["DATE DE NAISSANCE", "DATE NAISSANCE", "NÉ LE", "NEE LE", "NÉE LE", "DATE NAISS"]],
  ["lieu_naissance", ["LIEU DE NAISSANCE", "LIEU NAISSANCE", "NÉ A", "NEE A", "NÉE A"]],
  ["sexe", ["SEXE"]],
  ["nationalite", ["NATIONALITE", "NATIONALITÉ"]],
  ["adresse", ["ADRESSE", "DOMICILE"]],
  ["telephone", ["TELEPHONE", "TÉLÉPHONE", "TEL", "TÉL", "CONTACT"]],
  ["email", ["EMAIL", "E-MAIL", "MAIL", "COURRIEL"]],
]

function isValidValue(v: string): boolean {
  const s = v.trim()
  if (!s || s === "-" || s === "--" || s === "—") return false
  if (s.length > 150) return false
  return true
}

function matchLabel(line: string, labels: string[]): string | null {
  const upper = line.toUpperCase().trim()
  for (const label of labels) {
    const idx = upper.indexOf(label.toUpperCase())
    if (idx === 0 || (idx > 0 && /[\s:]/.test(upper[idx - 1]))) {
      return label
    }
  }
  return null
}

function extractValueFromLine(line: string, matchedLabel: string): string {
  const upper = line.toUpperCase().trim()
  const idx = upper.indexOf(matchedLabel.toUpperCase())
  if (idx === -1) return ""
  const after = line.slice(idx + matchedLabel.length).trim()
  return after.replace(/^[:;]\s*/, "").trim()
}

function extractFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l)

  for (const [key, labels] of FIELD_LABELS) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const matchedLabel = matchLabel(line, labels)
      if (!matchedLabel) continue

      const val = extractValueFromLine(line, matchedLabel)

      if (val && isValidValue(val)) {
        fields[key] = val
        break
      }

      if (i + 1 < lines.length) {
        const nextVal = lines[i + 1].trim()

        if (isValidValue(nextVal)) {
          const short = nextVal.length < 60
          const noSpace = !nextVal.includes(" ")
          if (short || noSpace) {
            fields[key] = nextVal
            break
          }
        }

        if (i + 2 < lines.length && isValidValue(nextVal) && nextVal.length < 60) {
          const nextNext = lines[i + 2].trim()
          if (!matchLabel(nextNext, labels)) {
            fields[key] = nextVal + " " + nextNext
            break
          }
        }
      }
    }
  }

  if (!fields["nom"] && fields["prenom"]) {
    const fallback = text.match(/(?:NOM|PRENOM)[:\s]*([A-Za-zÀ-ÿ\s\-]+)/i)
    if (fallback) {
      const parts = fallback[1].trim().split(/\s+/)
      if (parts.length >= 2) {
        fields["nom"] = parts[0]
        fields["prenom"] = parts.slice(1).join(" ")
      }
    }
  }

  if (!fields["date_naissance"]) {
    const dateMatch = text.match(/(\d{1,2})[\s\/\-]+(\d{1,2})[\s\/\-]+(\d{2,4})/)
    if (dateMatch) {
      const d1 = dateMatch[1], d2 = dateMatch[2], d3 = dateMatch[3]
      const year = d3.length === 2 ? "20" + d3 : d3
      if (d1.length === 4) {
        fields["date_naissance"] = `${d1}-${d2.padStart(2, "0")}-${d3.padStart(2, "0")}`
      } else {
        fields["date_naissance"] = `${year}-${d2.padStart(2, "0")}-${d1.padStart(2, "0")}`
      }
    }
  }

  if (fields["date_naissance"]) {
    const d = fields["date_naissance"].replace(/\s+/g, "/").replace(/[^0-9/]/g, "")
    const parts = d.split("/").filter(Boolean)
    if (parts.length >= 3) {
      const [a, b] = parts
      let c = parts[2]
      if (c.length === 2) c = "20" + c
      if (a.length === 4) {
        fields["date_naissance"] = `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`
      } else {
        fields["date_naissance"] = `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`
      }
    }
  }

  if (!fields["sexe"]) {
    const sexeMatch = text.match(/\b([MF])\b/i)
    if (sexeMatch) {
      const s = sexeMatch[1].toUpperCase()
      if (s === "M" || s === "F") fields["sexe"] = s
    }
  }

  if (fields["sexe"]) {
    const s = fields["sexe"].replace(/[^MFmf]/g, "").toUpperCase()
    fields["sexe"] = s === "M" ? "M" : s === "F" ? "F" : fields["sexe"].includes("Masculin") ? "M" : fields["sexe"].includes("Féminin") || fields["sexe"].includes("Feminin") ? "F" : ""
  }

  if (fields["telephone"]) {
    fields["telephone"] = fields["telephone"].replace(/[^+\d\s]/g, "").trim()
  }

  if (fields["email"]) {
    const emailMatch = fields["email"].match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    if (emailMatch) fields["email"] = emailMatch[0]
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
  const [creerInscription, setCreerInscription] = useState(false)
  const [fraisInscription, setFraisInscription] = useState(0)
  const [successDialog, setSuccessDialog] = useState<{ eleveId: string; inscriptionId: string | null } | null>(null)

  const [form, setForm] = useState({
    matricule: "",
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
      .select("id, libelle, frais_inscription")
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
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 100_000)

      const fd = new FormData()
      fd.append("file", ocrFile)
      const res = await fetch("/api/ocr", { method: "POST", body: fd, signal: controller.signal })
      clearTimeout(timeoutId)

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
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("L'analyse OCR a pris trop de temps. Réessayez avec une image plus légère.")
      } else {
        setError(err instanceof Error ? err.message : "Erreur OCR")
      }
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

      let inscriptionId: string | null = null

      if (creerInscription && form.classe_id && fraisInscription > 0) {
        const insRes = await fetch("/api/inscriptions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eleve_id: data.eleve.id,
            classe_id: form.classe_id,
            frais_inscription: fraisInscription,
          }),
        })
        const insData = await insRes.json()
        if (insRes.ok && insData.inscription) {
          inscriptionId = insData.inscription.id
        }
      }

      if (inscriptionId) {
        setSuccessDialog({ eleveId: data.eleve.id, inscriptionId })
      } else {
        router.push(`/eleves/${data.eleve.id}`)
      }
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
                <Image src={ocrPreview} alt="Aperçu" width={128} height={128} className="rounded-lg border border-border object-cover" />
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
                <div className="text-xs">
                  <p className="text-muted-foreground mb-1">Texte extrait par l&apos;OCR :</p>
                  <pre className="max-h-32 overflow-y-auto rounded bg-gray-50 p-2.5 whitespace-pre-wrap font-mono text-[11px] leading-relaxed border border-border">{ocrText}</pre>
                </div>
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="matricule">Matricule national *</Label>
              <Input id="matricule" required value={form.matricule} onChange={(e) => update("matricule", e.target.value)} placeholder="Ex: CI001234567" />
              <p className="text-xs text-gray-400">Matricule officiel de l'&apos;élève (CNI, passeport ou numéro national).</p>
            </div>
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
                onChange={(e) => {
                  update("classe_id", e.target.value)
                  const c = classes.find((cl) => cl.id === e.target.value)
                  if (c) setFraisInscription(c.frais_inscription)
                }}
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

        {form.classe_id && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Inscription</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={creerInscription}
                  onChange={(e) => setCreerInscription(e.target.checked)}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Créer une inscription pour cet élève</span>
              </label>
              {creerInscription && (
                <div className="space-y-2 pl-7">
                  <Label htmlFor="frais_inscription">Frais d&apos;inscription (FCFA)</Label>
                  <Input
                    id="frais_inscription"
                    type="number"
                    min={0}
                    value={fraisInscription}
                    onChange={(e) => setFraisInscription(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-400">
                    Le reçu d&apos;inscription sera disponible après validation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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

      <Dialog open={successDialog !== null} onOpenChange={(open) => { if (!open) { setSuccessDialog(null); if (successDialog) router.push(`/eleves/${successDialog.eleveId}`) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <FileText className="h-5 w-5" />
              Élève créé avec succès
            </DialogTitle>
            <DialogDescription>
              {successDialog?.inscriptionId
                ? "L'inscription a été créée. Vous pouvez imprimer le reçu."
                : "L'élève a été enregistré."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            {successDialog?.inscriptionId && (
              <Button asChild>
                <Link href={`/inscriptions/recu/${successDialog.inscriptionId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir le reçu d&apos;inscription
                </Link>
              </Button>
            )}
            <Button asChild variant={successDialog?.inscriptionId ? "outline" : "default"}>
              <Link href={`/eleves/${successDialog?.eleveId}`}>
                Voir la fiche élève
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
