"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, AlertCircle, Smartphone, ExternalLink } from "lucide-react"
import { paymentProviders, type PaymentProvider } from "@/lib/mobile-payment"

interface MobilePaymentButtonProps {
  eleveId?: string
  echeancierId?: string
  montant: number
  description?: string
  onSuccess?: () => void
}

export function MobilePaymentButton({
  eleveId,
  echeancierId,
  montant,
  description,
  onSuccess,
}: MobilePaymentButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    status: string
    message?: string
    payUrl?: string
    reference?: string
  } | null>(null)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProvider || !phoneNumber || !montant) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/paiements/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          provider: selectedProvider,
          amount: montant,
          phoneNumber,
          description: description || "Paiement scolarité",
          eleveId,
          echeancierId,
        }),
      })
      const data = await res.json()
      setResult(data)

      if (data.status === "pending" && !data.payUrl) {
        // MTN MoMo: USSD push, no redirect needed
        // Start polling
        pollStatus(selectedProvider, data.transactionId || data.reference)
      }
    } catch {
      setResult({ success: false, status: "failed", message: "Erreur réseau" })
    }
    setLoading(false)
  }

  async function pollStatus(provider: PaymentProvider, txId: string) {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      if (attempts > 30) {
        clearInterval(interval)
        return
      }

      try {
        const res = await fetch("/api/paiements/mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check_status", provider, transactionId: txId }),
        })
        const data = await res.json()

        if (data.status === "success") {
          setResult(data)
          clearInterval(interval)
          onSuccess?.()
        } else if (data.status === "failed") {
          setResult(data)
          clearInterval(interval)
        }
      } catch { /* ignore */ }
    }, 5000)
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        <Smartphone className="h-4 w-4 mr-2" />
        Payer {montant.toLocaleString("fr-FR")} FCFA
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Paiement mobile
          </span>
          <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setResult(null) }}>
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-4">
            {result.status === "success" ? (
              <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Paiement réussi !</p>
                  <p className="text-xs text-green-600 mt-1">
                    Référence : {result.reference}
                  </p>
                </div>
              </div>
            ) : result.status === "pending" && result.payUrl ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4">
                  <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Redirection en cours...</p>
                    <p className="text-xs text-blue-600 mt-1">Cliquez sur le bouton pour finaliser le paiement.</p>
                  </div>
                </div>
                <a href={result.payUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Finaliser le paiement
                  </Button>
                </a>
              </div>
            ) : result.status === "pending" ? (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-4">
                <Loader2 className="h-6 w-6 text-yellow-600 shrink-0 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">En attente de confirmation...</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Validez la demande sur votre téléphone. Vérification automatique en cours.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
                <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Échec du paiement</p>
                  <p className="text-xs text-red-600 mt-1">{result.message}</p>
                </div>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => { setResult(null); setSelectedProvider(null) }}>
              Réessayer
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <Label>Montant</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={montant.toLocaleString("fr-FR")} disabled className="flex-1" />
                <span className="text-sm font-medium text-gray-500">FCFA</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Choisir le moyen de paiement</Label>
              <div className="grid grid-cols-3 gap-2">
                {paymentProviders.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProvider(p.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-all ${selectedProvider === p.id ? "border-primary bg-primary/5" : "border-border hover:border-gray-300"}`}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Numéro de téléphone</Label>
              <Input
                required
                type="tel"
                placeholder="Ex: 0701234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={!selectedProvider || !phoneNumber || loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Traitement...</> : "Payer maintenant"}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Vous recevrez une demande de paiement sur votre téléphone.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
