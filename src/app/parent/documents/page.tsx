"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Download } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface DocumentItem {
  id: string
  nom: string
  type: string
  url: string | null
  created_at: string
  eleve?: { nom: string; prenom: string } | null
}

export default function ParentDocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<DocumentItem[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profil } = await supabase
        .from("profils")
        .select("id")
        .eq("user_id", user.id)
        .single()
      if (!profil) return

      const { data: enfants } = await supabase
        .from("eleves")
        .select("id")
        .eq("parent_id", profil.id)
        .eq("statut", "actif")

      const enfantIds = (enfants || []).map(e => e.id)

      // Récupérer les documents liés aux enfants
      if (enfantIds.length > 0) {
        const { data } = await supabase
          .from("documents")
          .select("id, nom, type, url, created_at, eleve:eleves(nom, prenom)")
          .in("eleve_id", enfantIds)
          .order("created_at", { ascending: false })
        setDocuments((data || []) as unknown as DocumentItem[])
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500">Documents officiels de vos enfants</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documents disponibles ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun document disponible pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.nom}</p>
                      <p className="text-xs text-gray-500">
                        {doc.eleve?.prenom} {doc.eleve?.nom} · {format(new Date(doc.created_at), "dd MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
