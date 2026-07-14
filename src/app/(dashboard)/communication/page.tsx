"use client"

import { useEffect, useState, useEffectEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MessageSquare, Send, Loader2, Smartphone, Users, CheckCircle2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useUser, type UserProfile } from "@/lib/hooks/use-user"
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

interface ClasseOption {
  id: string
  libelle: string
}

export default function CommunicationPage() {
  const { profile } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"messages" | "sms">("messages")

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

  const onLoad = useEffectEvent(() => load())
  useEffect(() => { onLoad() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communication</h2>
          <p className="text-sm text-gray-500">Messagerie interne et notifications SMS</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "messages" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-foreground"}`}
        >
          <MessageSquare className="h-4 w-4" />
          Messages
        </button>
        <button
          onClick={() => setActiveTab("sms")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "sms" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-foreground"}`}
        >
          <Smartphone className="h-4 w-4" />
          SMS
        </button>
      </div>

      {activeTab === "messages" && (
        <>
          <div className="flex justify-end">
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
        </>
      )}

      {activeTab === "sms" && (
        <SMSPanel profile={profile} />
      )}
    </div>
  )
}

function SMSPanel({ profile }: { profile: UserProfile | null }) {
  const [classes, setClasses] = useState<ClasseOption[]>([])
  const [smsConfig, setSmsConfig] = useState<{ provider: string; configured: boolean; sender: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null)
  const [smsMode, setSmsMode] = useState<"class" | "all" | "single">("class")
  const [selectedClasse, setSelectedClasse] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function load() {
      if (profile?.ecole_id) {
        const { data } = await supabase
          .from("classes")
          .select("id, libelle")
          .eq("ecole_id", profile.ecole_id)
          .order("libelle")
        if (data) setClasses(data)
      }
      try {
        const res = await fetch("/api/sms/send")
        const data = await res.json()
        setSmsConfig(data)
      } catch { /* ignore */ }
    }
    load()
  }, [profile?.ecole_id])

  async function handleSendSMS(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setResult(null)

    try {
      const payload: Record<string, unknown> = { message }
      if (smsMode === "class") {
        payload.action = "notify_class"
        payload.classeId = selectedClasse
      } else if (smsMode === "all") {
        payload.action = "send_to_parents"
      } else {
        payload.action = "send_single"
        payload.to = phoneNumber
      }

      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok) {
        if (data.results) {
          const successCount = data.results.filter((r: { success: boolean }) => r.success).length
          setResult({ success: true, count: successCount })
        } else if (data.success) {
          setResult({ success: true, count: 1 })
        } else {
          setResult({ success: false, error: data.error || "Échec d'envoi" })
        }
      } else {
        setResult({ success: false, error: data.error || "Erreur" })
      }
    } catch {
      setResult({ success: false, error: "Erreur réseau" })
    }
    setSending(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${smsConfig?.configured ? "bg-green-50" : "bg-orange-50"}`}>
              {smsConfig?.configured ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-orange-600" />}
            </div>
            <div>
              <p className="text-sm font-medium">
                Provider : {smsConfig?.provider ?? "mock"} · Expéditeur : {smsConfig?.sender ?? "EduGest"}
              </p>
              <p className="text-xs text-gray-500">
                {smsConfig?.configured
                  ? "SMS configuré et prêt à l'emploi"
                  : "SMS en mode simulation (mock). Configurez SMS_PROVIDER et SMS_API_KEY dans .env.local"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Envoyer un SMS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendSMS} className="space-y-4">
            <div className="space-y-2">
              <Label>Destinataires</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSmsMode("class")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border ${smsMode === "class" ? "border-primary bg-primary-light text-primary" : "border-border text-gray-500"}`}>
                  <Users className="h-4 w-4" /> Par classe
                </button>
                <button type="button" onClick={() => setSmsMode("all")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border ${smsMode === "all" ? "border-primary bg-primary-light text-primary" : "border-border text-gray-500"}`}>
                  <Users className="h-4 w-4" /> Tous les parents
                </button>
                <button type="button" onClick={() => setSmsMode("single")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border ${smsMode === "single" ? "border-primary bg-primary-light text-primary" : "border-border text-gray-500"}`}>
                  <Smartphone className="h-4 w-4" /> Numéro unique
                </button>
              </div>
            </div>

            {smsMode === "class" && (
              <div className="space-y-2">
                <Label>Classe</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                  required
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.libelle}</option>
                  ))}
                </select>
              </div>
            )}

            {smsMode === "single" && (
              <div className="space-y-2">
                <Label>Numéro de téléphone</Label>
                <Input
                  required
                  placeholder="Ex: 0701234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Message ({message.length}/160)</Label>
              <textarea
                required
                rows={4}
                maxLength={160}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm"
                placeholder="Contenu du SMS..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {message.length > 0 && (
                <p className="text-xs text-gray-400">
                  {message.length > 160 ? "Message trop long (max 160 caractères)" : `${160 - message.length} caractères restants`}
                </p>
              )}
            </div>

            {result && (
              <div className={`rounded-lg p-3 text-sm ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {result.success
                  ? `✓ ${result.count} SMS envoyé(s) avec succès`
                  : `✗ Erreur : ${result.error}`}
              </div>
            )}

            <Button type="submit" disabled={sending || !message.trim()}>
              {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi...</> : <><Send className="h-4 w-4 mr-2" /> Envoyer</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function NouveauMessageForm({ onSent, profile }: { onSent: () => void; profile: UserProfile | null }) {
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
