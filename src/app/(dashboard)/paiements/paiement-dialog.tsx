"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Smartphone, DollarSign, Landmark, Banknote } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatMontant } from "@/lib/utils"

interface PaiementDialogProps {
  ecoleId?: string
  onSuccess: () => void
  eleveId?: string
  montantSuggestion?: number
}

const METHODES = [
  { value: "orange_money", label: "Orange Money", icon: Smartphone, color: "text-orange-500" },
  { value: "mtn_momo", label: "MTN MoMo", icon: Smartphone, color: "text-yellow-500" },
  { value: "especes", label: "Espèces", icon: DollarSign, color: "text-green-600" },
  { value: "cheque", label: "Chèque", icon: Landmark, color: "text-blue-600" },
  { value: "virement", label: "Virement", icon: Banknote, color: "text-purple-600" },
]

export function PaiementDialog({ ecoleId, onSuccess, eleveId: preselectedEleveId, montantSuggestion }: PaiementDialogProps) {
  const [open, setOpen] = useState(false)
  const [eleves, setEleves] = useState<{ id: string; label: string }[]>([])
  const [eleveId, setEleveId] = useState(preselectedEleveId || "")
  const [montant, setMontant] = useState(montantSuggestion?.toString() || "")
  const [methode, setMethode] = useState("orange_money")
  const [telephone, setTelephone] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [echeancierInfo, setEcheancierInfo] = useState<{ total: number; restant: number } | null>(null)

  useEffect(() => {
    if (!ecoleId) return
    supabase
      .from("eleves")
      .select("id, nom, prenom")
      .eq("ecole_id", ecoleId)
      .eq("statut", "actif")
      .order("nom")
      .then(({ data }) => {
        if (data) setEleves(data.map((e) => ({ id: e.id, label: `${e.nom} ${e.prenom}` })))
      })
  }, [ecoleId])

  useEffect(() => {
    if (!eleveId) { setEcheancierInfo(null); return }
    supabase
      .from("echeanciers")
      .select("montant_total, montant_restant")
      .eq("eleve_id", eleveId)
      .in("statut", ["en_attente", "partiel"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEcheancierInfo({ total: data.montant_total, restant: data.montant_restant })
        else setEcheancierInfo(null)
      })
  }, [eleveId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eleveId || !montant || !methode) {
      setError("Élève, montant et méthode requis")
      return
    }
    if (["orange_money", "mtn_momo"].includes(methode) && !telephone) {
      setError("Téléphone requis pour le Mobile Money")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/paiements/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eleve_id: eleveId, montant: parseInt(montant), methode, telephone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de paiement")
      setOpen(false)
      reset()
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setEleveId(preselectedEleveId || "")
    setMontant(montantSuggestion?.toString() || "")
    setTelephone("")
    setError("")
    setEcheancierInfo(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button>Nouveau paiement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
          <DialogDescription>Enregistrer un paiement</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
          )}
          <div className="space-y-2">
            <Label>Élève</Label>
            <Select value={eleveId} onValueChange={setEleveId} disabled={!!preselectedEleveId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un élève" />
              </SelectTrigger>
              <SelectContent>
                {eleves.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {echeancierInfo && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total dû</span><span className="font-bold">{formatMontant(echeancierInfo.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reste à payer</span><span className="font-bold text-red-600">{formatMontant(echeancierInfo.restant)}</span></div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Montant (FCFA)</Label>
            <Input type="number" placeholder="50000" value={montant} onChange={(e) => setMontant(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Méthode</Label>
            <Select value={methode} onValueChange={setMethode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex items-center gap-2">
                      <m.icon className={`h-4 w-4 ${m.color}`} />{m.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {["orange_money", "mtn_momo"].includes(methode) && (
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input placeholder="+225 01 02 03 04 05" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting} loading={submitting}>
            {submitting ? "Enregistrement..." : "Enregistrer le paiement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
