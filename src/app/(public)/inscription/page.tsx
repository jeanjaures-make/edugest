"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowLeft, ArrowRight, Check } from "lucide-react"

type Step = "parent" | "enfant" | "documents" | "confirmation"

export default function InscriptionPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("parent")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [parent, setParent] = useState({
    nom: "", prenom: "", email: "", telephone: "",
    password: "", confirmPassword: "",
  })
  const [enfant, setEnfant] = useState({
    nom: "", prenom: "", date_naissance: "", lieu_naissance: "",
    sexe: "", nationalite: "Ivoirienne",
  })
  const [documents, setDocuments] = useState<File[]>([])

  const steps = [
    { key: "parent", label: "Parent", number: 1 },
    { key: "enfant", label: "Enfant", number: 2 },
    { key: "documents", label: "Documents", number: 3 },
    { key: "confirmation", label: "Confirmation", number: 4 },
  ]
  const currentStepIndex = steps.findIndex((s) => s.key === step)

  function canProceedFromParent() {
    return parent.nom && parent.prenom && parent.email && parent.telephone && parent.password && parent.password === parent.confirmPassword
  }

  function canProceedFromEnfant() {
    return enfant.nom && enfant.prenom && enfant.date_naissance && enfant.sexe
  }

  async function handleSubmit() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: parent.email,
          password: parent.password,
          parent: {
            nom: parent.nom,
            prenom: parent.prenom,
            telephone: parent.telephone,
          },
          enfant: {
            nom: enfant.nom,
            prenom: enfant.prenom,
            date_naissance: enfant.date_naissance,
            lieu_naissance: enfant.lieu_naissance,
            sexe: enfant.sexe,
            nationalite: enfant.nationalite,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Inscription échouée")
      }
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="mb-6">
        <Logo size="md" />
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i <= currentStepIndex ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {i < currentStepIndex ? <Check className="h-4 w-4" /> : s.number}
                </div>
                <span className={`text-sm hidden sm:inline ${i <= currentStepIndex ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <div className="hidden sm:block w-8 h-px bg-gray-300" />}
              </div>
            ))}
          </div>
          <CardTitle className="text-xl">
            {step === "parent" && "Informations du parent"}
            {step === "enfant" && "Informations de l'enfant"}
            {step === "documents" && "Documents requis"}
            {step === "confirmation" && "Vérification et confirmation"}
          </CardTitle>
          <CardDescription>
            {step === "parent" && "Créez votre compte parent pour inscrire votre enfant"}
            {step === "enfant" && "Renseignez les informations de votre enfant"}
            {step === "documents" && "Téléchargez les pièces justificatives"}
            {step === "confirmation" && "Vérifiez les informations avant de valider"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          {step === "parent" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={parent.nom} onChange={(e) => setParent({ ...parent, nom: e.target.value })} placeholder="Kouassi" />
                </div>
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input value={parent.prenom} onChange={(e) => setParent({ ...parent, prenom: e.target.value })} placeholder="Jean" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={parent.email} onChange={(e) => setParent({ ...parent, email: e.target.value })} placeholder="jean.kouassi@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={parent.telephone} onChange={(e) => setParent({ ...parent, telephone: e.target.value })} placeholder="+225 01 02 03 04 05" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <Input type="password" value={parent.password} onChange={(e) => setParent({ ...parent, password: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmer mot de passe</Label>
                  <Input type="password" value={parent.confirmPassword} onChange={(e) => setParent({ ...parent, confirmPassword: e.target.value })} placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}

          {step === "enfant" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={enfant.nom} onChange={(e) => setEnfant({ ...enfant, nom: e.target.value })} placeholder="Kouassi" />
                </div>
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input value={enfant.prenom} onChange={(e) => setEnfant({ ...enfant, prenom: e.target.value })} placeholder="Marie" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de naissance</Label>
                  <Input type="date" value={enfant.date_naissance} onChange={(e) => setEnfant({ ...enfant, date_naissance: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Lieu de naissance</Label>
                  <Input value={enfant.lieu_naissance} onChange={(e) => setEnfant({ ...enfant, lieu_naissance: e.target.value })} placeholder="Abidjan" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sexe</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={enfant.sexe}
                    onChange={(e) => setEnfant({ ...enfant, sexe: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Nationalité</Label>
                  <Input value={enfant.nationalite} onChange={(e) => setEnfant({ ...enfant, nationalite: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {step === "documents" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                Téléchargez une photo ou un scan des documents suivants. L'OCR extraira automatiquement les informations.
              </p>
              {["CNI du parent", "Acte de naissance de l'enfant", "Photo d'identité de l'enfant"].map((doc) => (
                <div key={doc} className="rounded-lg border-2 border-dashed p-6 text-center hover:border-blue-400 cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm font-medium">{doc}</p>
                  <p className="text-xs text-gray-400">PNG, JPG ou PDF (max 5 Mo)</p>
                  <input type="file" className="hidden" accept="image/*,application/pdf" />
                </div>
              ))}
            </div>
          )}

          {step === "confirmation" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-medium mb-2">Parent</h4>
                <p className="text-sm text-gray-600">{parent.prenom} {parent.nom}</p>
                <p className="text-sm text-gray-600">{parent.email} | {parent.telephone}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="font-medium mb-2">Enfant</h4>
                <p className="text-sm text-gray-600">{enfant.prenom} {enfant.nom}</p>
                <p className="text-sm text-gray-600">Né(e) le {enfant.date_naissance} à {enfant.lieu_naissance}</p>
                <p className="text-sm text-gray-600">{enfant.sexe === "M" ? "Masculin" : "Féminin"} - {enfant.nationalite}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-xs text-blue-700">
                <p>En validant, vous acceptez que les informations soient traitées pour la gestion scolaire et que les documents soient numérisés par OCR.</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {currentStepIndex > 0 ? (
              <Button variant="outline" onClick={() => setStep(steps[currentStepIndex - 1].key as Step)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour
              </Button>
            ) : (
              <Link href="/connexion">
                <Button variant="ghost">Déjà un compte ?</Button>
              </Link>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <Button
                onClick={() => setStep(steps[currentStepIndex + 1].key as Step)}
                disabled={step === "parent" && !canProceedFromParent() || step === "enfant" && !canProceedFromEnfant()}
              >
                Suivant <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Inscription en cours..." : "Confirmer et créer mon compte"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
