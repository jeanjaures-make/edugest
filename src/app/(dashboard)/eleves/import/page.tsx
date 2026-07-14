"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"

interface ClasseOption {
  id: string
  libelle: string
}

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  total: number
  eleves?: { id: string; matricule: string; nom: string; prenom: string }[]
  error?: string
  detail?: string
}

export default function ImportElevesPage() {
  const { profile } = useUser()
  const [classes, setClasses] = useState<ClasseOption[]>([])
  const [selectedClasse, setSelectedClasse] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const loadClasses = useCallback(async () => {
    if (!profile?.ecole_id) return
    const { data } = await supabase
      .from("classes")
      .select("id, libelle")
      .eq("ecole_id", profile.ecole_id)
      .order("libelle")
    if (data) setClasses(data)
  }, [profile?.ecole_id])

  useEffect(() => { loadClasses() }, [loadClasses])

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (selectedClasse) formData.append("classe_id", selectedClasse)

      const res = await fetch("/api/eleves/import", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, imported: 0, skipped: 0, total: 0, error: "Erreur réseau" })
    }
    setUploading(false)
  }

  function downloadTemplate() {
    const headers = ["matricule", "nom", "prenom", "date_naissance", "lieu_naissance", "sexe", "nationalite", "telephone", "email", "adresse"]
    const example = ["CI001234567", "Kouassi", "Marie", "2010-05-15", "Abidjan", "F", "Ivoirienne", "0701234567", "marie@example.com", "Cocody"]
    const csv = [headers.join(","), example.join(",")].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "modele_import_eleves.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Link href="/eleves" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Retour aux élèves
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Excel / CSV</h1>
        <p className="text-sm text-gray-500">Importez massivement des élèves depuis un fichier</p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Format du fichier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Le fichier doit contenir les colonnes suivantes (la première ligne est l&apos;en-tête) :
          </p>
          <div className="rounded-lg bg-muted p-3 text-xs font-mono">
            matricule, nom, prenom, date_naissance, lieu_naissance, sexe, nationalite, telephone, email, adresse
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <p><b>matricule</b> : Matricule national (obligatoire)</p>
            <p><b>nom</b> : Nom de l&apos;élève (obligatoire)</p>
            <p><b>prenom</b> : Prénom de l&apos;élève (obligatoire)</p>
            <p><b>sexe</b> : M ou F</p>
            <p><b>date_naissance</b> : Format YYYY-MM-DD (ex: 2010-05-15)</p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger le modèle CSV
          </Button>
        </CardContent>
      </Card>

      {/* Formulaire d'import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Importer un fichier</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-2">
              <Label>Classe (optionnel)</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={selectedClasse}
                onChange={(e) => setSelectedClasse(e.target.value)}
              >
                <option value="">Aucune (à affecter plus tard)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.libelle}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Tous les élèves importés seront affectés à cette classe si sélectionnée.</p>
            </div>

            <div className="space-y-2">
              <Label>Fichier Excel ou CSV</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="flex h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-white hover:file:bg-primary/90"
                />
              </div>
              {file && (
                <p className="text-xs text-gray-500">
                  Fichier sélectionné : {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <Button type="submit" disabled={!file || uploading}>
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Import en cours...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Importer</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Résultat */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            {result.success ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">
                    Import réussi : {result.imported} élève(s) importé(s)
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-xs text-gray-500">{result.skipped} ligne(s) ignorée(s)</p>
                  )}
                  {result.eleves && result.eleves.length > 0 && (
                    <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Matricule</th>
                            <th className="p-2 text-left">Nom</th>
                            <th className="p-2 text-left">Prénom</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.eleves.map((e) => (
                            <tr key={e.id} className="border-t border-border">
                              <td className="p-2">{e.matricule}</td>
                              <td className="p-2">{e.nom}</td>
                              <td className="p-2">{e.prenom}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700">Échec de l&apos;import</p>
                  <p className="text-xs text-gray-600 mt-1">{result.error}</p>
                  {result.detail && (
                    <p className="text-xs text-gray-400 mt-1 font-mono">{result.detail}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
