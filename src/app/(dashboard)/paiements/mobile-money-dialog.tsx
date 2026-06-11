"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Smartphone } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface MobileMoneyDialogProps {
  ecoleId?: string
  onSuccess: () => void
}

export function MobileMoneyDialog({ ecoleId, onSuccess }: MobileMoneyDialogProps) {
  const [open, setOpen] = useState(false)
  const [eleves, setEleves] = useState<{ id: string; label: string }[]>([])
  const [eleveId, setEleveId] = useState("")
  const [montant, setMontant] = useState("")
  const [methode, setMethode] = useState("orange_money")
  const [telephone, setTelephone] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !ecoleId) return
    supabase
      .from("eleves")
      .select("id, nom, prenom")
      .eq("ecole_id", ecoleId)
      .eq("statut", "actif")
      .order("nom")
      .then(({ data }) => {
        if (data) setEleves(data.map((e) => ({ id: e.id, label: `${e.nom} ${e.prenom}` })))
      })
  }, [open, ecoleId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!eleveId || !montant || !telephone) {
      setError("Tous les champs sont obligatoires")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/paiements/mobile-money", {
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
    setEleveId("")
    setMontant("")
    setTelephone("")
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button>
          <Smartphone className="h-4 w-4 mr-2" />Nouveau paiement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paiement Mobile Money</DialogTitle>
          <DialogDescription>
            Encaisser un paiement par Orange Money ou MTN MoMo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="eleve">Élève</Label>
            <Select value={eleveId} onValueChange={setEleveId}>
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
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              placeholder="50000"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="methode">Méthode</Label>
            <Select value={methode} onValueChange={setMethode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="orange_money">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-orange-500" />Orange Money
                  </div>
                </SelectItem>
                <SelectItem value="mtn_momo">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-yellow-500" />MTN MoMo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              placeholder="+225 01 02 03 04 05"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting} loading={submitting}>
            {submitting ? "Traitement..." : "Effectuer le paiement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
