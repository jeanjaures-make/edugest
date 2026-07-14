"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Message {
  id: string
  expediteur_id: string
  destinataire_id: string
  contenu: string
  lu: boolean
  created_at: string
  expediteur?: { nom: string; prenom: string } | null
}

export default function ParentCommunicationPage() {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [profilId, setProfilId] = useState<string | null>(null)
  const [nouveauMessage, setNouveauMessage] = useState("")

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
      setProfilId(profil.id)

      const { data } = await supabase
        .from("messages")
        .select("id, expediteur_id, destinataire_id, contenu, lu, created_at, expediteur:profils!expediteur_id(nom, prenom)")
        .or(`destinataire_id.eq.${profil.id},expediteur_id.eq.${profil.id}`)
        .order("created_at", { ascending: false })
        .limit(30)

      setMessages((data || []) as unknown as Message[])
      setLoading(false)
    }
    load()
  }, [])

  async function sendMessage() {
    if (!nouveauMessage.trim() || !profilId) return

    // Récupérer le directeur de l'école
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: monProfil } = await supabase
      .from("profils")
      .select("ecole_id")
      .eq("user_id", user.id)
      .single()

    if (!monProfil?.ecole_id) return

    const { data: directeur } = await supabase
      .from("profils")
      .select("id")
      .eq("ecole_id", monProfil.ecole_id)
      .eq("role", "directeur")
      .limit(1)
      .single()

    if (!directeur) return

    const { data } = await supabase
      .from("messages")
      .insert({
        expediteur_id: profilId,
        destinataire_id: directeur.id,
        contenu: nouveauMessage.trim(),
        lu: false,
      })
      .select("id, expediteur_id, destinataire_id, contenu, lu, created_at, expediteur:profils!expediteur_id(nom, prenom)")
      .single()

    if (data) {
      setMessages(prev => [data as unknown as Message, ...prev])
      setNouveauMessage("")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
        <p className="text-sm text-gray-500">Échangez avec l&apos;administration de l&apos;école</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Nouveau message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={nouveauMessage}
              onChange={(e) => setNouveauMessage(e.target.value)}
              placeholder="Tapez votre message..."
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage() }}
            />
            <Button onClick={sendMessage} disabled={!nouveauMessage.trim()}>
              <Send className="h-4 w-4 mr-1" />
              Envoyer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun message. Démarrez la conversation avec l&apos;administration.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const isMine = m.expediteur_id === profilId
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${isMine ? "bg-primary text-white" : "bg-muted"}`}
                    >
                      {!isMine && m.expediteur && (
                        <p className="text-xs font-medium mb-1 text-gray-500">
                          {m.expediteur.prenom} {m.expediteur.nom}
                        </p>
                      )}
                      <p className="text-sm">{m.contenu}</p>
                      <p className={`text-xs mt-1 ${isMine ? "text-white/70" : "text-gray-400"}`}>
                        {format(new Date(m.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
