"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Message {
  id: string
  sujet: string
  destinataire_type: string
  message: string
  type: string
  created_at: string
}

export default function CommunicationPage() {
  const { profile } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const { data } = await supabase
      .from("communications")
      .select("*")
      .eq("ecole_id", ecoleId)
      .order("created_at", { ascending: false })
      .limit(50)
    if (data) setMessages(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [profile])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communication</h2>
          <p className="text-sm text-gray-500">Messagerie interne et notifications</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Send className="h-4 w-4 mr-2" />Nouveau message
        </Button>
      </div>

      {showForm && (
        <NouveauMessageForm onSent={() => { setShowForm(false); load() }} profile={profile} />
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Messages envoyés</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sujet</TableHead><TableHead>Destinataire</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-400 py-8">Aucun message</TableCell>
                  </TableRow>
                ) : messages.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        {m.sujet}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{m.destinataire_type}</TableCell>
                    <TableCell>{format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === "urgence" ? "danger" : m.type === "rappel" ? "warning" : "info"}>
                        {m.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function NouveauMessageForm({ onSent, profile }: { onSent: () => void; profile: any }) {
  const [saving, setSaving] = useState(false)
  const [destinataire_type, setDestType] = useState("tous")
  const [type, setType] = useState("info")
  const [sujet, setSujet] = useState("")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sujet || !message || !profile?.ecole_id) return
    setSaving(true)
    const { error } = await supabase.from("communications").insert({
      ecole_id: profile.ecole_id,
      expediteur_id: profile.id,
      destinataire_type,
      destinataire_id: null,
      sujet,
      message,
      type,
      lu: false,
    })
    setSaving(false)
    if (!error) {
      setSujet("")
      setMessage("")
      onSent()
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Envoyer un message</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Destinataire</Label>
              <select className="flex h-10 w-full rounded-lg border bg-white px-3 text-sm" value={destinataire_type} onChange={(e) => setDestType(e.target.value)}>
                <option value="tous">Tous les parents</option>
                <option value="classe">Par classe</option>
                <option value="niveau">Par niveau</option>
                <option value="individuel">Individuel</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select className="flex h-10 w-full rounded-lg border bg-white px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="info">Information</option>
                <option value="urgence">Urgence</option>
                <option value="rappel">Rappel</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sujet</Label>
            <Input required placeholder="Sujet du message" value={sujet} onChange={(e) => setSujet(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <textarea required rows={5} className="w-full rounded-lg border border-gray-300 p-3 text-sm" placeholder="Contenu du message..." value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Envoi..." : "Envoyer"} <Send className="h-4 w-4 ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
