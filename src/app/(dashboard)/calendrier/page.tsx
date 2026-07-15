"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, ChevronLeft, ChevronRight, Trash2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/lib/hooks/use-user"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns"
import { fr } from "date-fns/locale"

interface Evenement {
  id: string
  titre: string
  type: string
  date_debut: string
  date_fin: string
  description: string | null
  classe_id: string | null
}

const typeStyles: Record<string, string> = {
  cours: "bg-blue-100 text-blue-700 border-blue-200",
  reunion: "bg-orange-100 text-orange-700 border-orange-200",
  evenement: "bg-green-100 text-green-700 border-green-200",
  examen: "bg-red-100 text-red-700 border-red-200",
  vacance: "bg-purple-100 text-purple-700 border-purple-200",
}

export default function CalendrierPage() {
  const { profile } = useUser()
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const ecoleId = profile?.ecole_id
    if (!ecoleId) return
    const debut = startOfMonth(currentMonth)
    const fin = endOfMonth(currentMonth)
    const { data } = await supabase
      .from("calendrier_evenements")
      .select("*")
      .eq("ecole_id", ecoleId)
      .gte("date_debut", debut.toISOString())
      .lte("date_fin", fin.toISOString())
      .order("date_debut", { ascending: true })
    if (data) setEvenements(data)
    setLoading(false)
  }, [profile, currentMonth])

  useEffect(() => { load() }, [load])

  async function supprimer(id: string) {
    if (!confirm("Supprimer cet événement ?")) return
    await supabase.from("calendrier_evenements").delete().eq("id", id)
    load()
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const moisLabel = format(currentMonth, "MMMM yyyy", { locale: fr })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendrier scolaire</h2>
          <p className="text-sm text-gray-500">Événements, examens et vacances</p>
        </div>
        <NouvelEvenementDialog onCreated={load} ecoleId={profile?.ecole_id} />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold min-w-[200px] text-center capitalize">{moisLabel}</h3>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Aujourd&apos;hui</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-lg">Calendrier</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                  <div key={d} className="p-2 text-xs font-medium text-gray-500">{d}</div>
                ))}
                {Array.from({ length: getDay(startOfMonth(currentMonth)) === 0 ? 6 : getDay(startOfMonth(currentMonth)) - 1 }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const evts = evenements.filter((e) =>
                    format(new Date(e.date_debut), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                  )
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[60px] rounded-lg border p-1 text-sm ${
                        evts.length > 0 ? "bg-blue-50 border-blue-200" : "border-gray-100"
                      } ${format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "bg-orange-50 border-orange-200" : ""}`}
                    >
                      <span className={`font-medium ${
                        format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "text-orange-600" : ""
                      }`}>{format(day, "d")}</span>
                      {evts.slice(0, 2).map((e) => (
                        <p key={e.id} className="text-[10px] leading-tight mt-0.5 text-blue-700 truncate">{e.titre}</p>
                      ))}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Événements du mois</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {evenements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun événement</p>
              ) : evenements.map((e) => (
                <div key={e.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                  <div className={`rounded-lg border px-2 py-1 text-center min-w-[48px] ${typeStyles[e.type] || ""}`}>
                    <p className="text-xs font-bold">{format(new Date(e.date_debut), "d")}</p>
                    <p className="text-[10px]">{format(new Date(e.date_debut), "MMM", { locale: fr })}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{e.titre}</p>
                        <p className="text-xs text-gray-500 capitalize">{e.type}</p>
                        {e.description && <p className="text-xs text-gray-400 mt-0.5">{e.description}</p>}
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-400 shrink-0" onClick={() => supprimer(e.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function NouvelEvenementDialog({ onCreated, ecoleId }: { onCreated: () => void; ecoleId?: string }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("evenement")
  const [date_debut, setDateDebut] = useState("")
  const [date_fin, setDateFin] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titre || !date_debut || !ecoleId) return
    setSaving(true)
    const { error } = await supabase.from("calendrier_evenements").insert({
      ecole_id: ecoleId,
      titre,
      description: description || null,
      type,
      date_debut: new Date(date_debut).toISOString(),
      date_fin: date_fin ? new Date(date_fin).toISOString() : new Date(date_debut).toISOString(),
    })
    setSaving(false)
    if (!error) { setOpen(false); setTitre(""); onCreated() }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Ajouter un événement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel événement</DialogTitle>
          <DialogDescription>Ajouter un événement au calendrier</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input required value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="evenement">Événement</option>
              <option value="cours">Cours</option>
              <option value="examen">Examen</option>
              <option value="reunion">Réunion</option>
              <option value="vacance">Vacance</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input required type="date" value={date_debut} onChange={(e) => setDateDebut(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input type="date" value={date_fin} onChange={(e) => setDateFin(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea rows={3} className="w-full rounded-lg border border-gray-300 p-3 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optionnelle" />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Ajout..." : "Ajouter l'événement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
