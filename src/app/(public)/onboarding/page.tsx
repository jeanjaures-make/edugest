"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, User, CheckCircle, ChevronLeft, ChevronRight, Mail, Lock, Phone, MapPin, School } from "lucide-react"

type Step = "school" | "admin" | "confirm"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("school")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [school, setSchool] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    email: "",
  })

  const [admin, setAdmin] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  function validateSchool() {
    if (!school.nom.trim()) { setError("Le nom de l'établissement est requis"); return false }
    setError("")
    return true
  }

  function validateAdmin() {
    if (!admin.nom.trim() || !admin.prenom.trim()) { setError("Nom et prénom requis"); return false }
    if (!admin.email.trim()) { setError("Email requis"); return false }
    if (admin.password.length < 6) { setError("Mot de passe : min 6 caractères"); return false }
    if (admin.password !== admin.confirmPassword) { setError("Les mots de passe ne correspondent pas"); return false }
    setError("")
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school, admin: { ...admin, confirmPassword: undefined } }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Une erreur est survenue")

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-teal-50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <Card className="border-white/50 bg-white/80 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
              >
                <CheckCircle className="h-8 w-8 text-green-600" />
              </motion.div>
              <CardTitle className="text-2xl">Établissement créé !</CardTitle>
              <CardDescription>
                Votre compte administrateur est prêt. Utilisez vos identifiants pour vous connecter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 text-left space-y-1">
                <p><strong>Établissement :</strong> {school.nom}</p>
                <p><strong>Email :</strong> {admin.email}</p>
              </div>
              <Button className="w-full h-11" onClick={() => router.push("/connexion")}>
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const stepConfig = [
    { key: "school" as Step, icon: Building2, title: "Votre établissement", desc: "Informations sur l'école" },
    { key: "admin" as Step, icon: User, title: "Administrateur", desc: "Compte du directeur" },
    { key: "confirm" as Step, icon: CheckCircle, title: "Confirmation", desc: "Vérifiez les informations" },
  ]

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-orange-50" />
      <motion.div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Logo size="lg" />
      </motion.div>

      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2">
          {stepConfig.map((s, i) => {
            const idx = stepConfig.findIndex(x => x.key === step)
            const active = i <= idx
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className={`h-px w-8 ${active ? "bg-primary" : "bg-gray-300"}`} />}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  <s.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-white/50 bg-white/80 backdrop-blur-xl shadow-xl shadow-blue-900/5">
              <CardHeader>
                <CardTitle className="text-xl">
                  {step === "school" ? "Informations de l'établissement" :
                   step === "admin" ? "Compte administrateur" : "Confirmation"}
                </CardTitle>
                <CardDescription>
                  {step === "school" ? "Renseignez les informations de votre école" :
                   step === "admin" ? "Créez le compte du directeur" :
                   "Vérifiez les informations avant de valider"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-center gap-2"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {step === "school" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="school-nom">Nom de l'établissement *</Label>
                      <div className="relative">
                        <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input id="school-nom" value={school.nom} onChange={e => setSchool(s => ({ ...s, nom: e.target.value }))}
                          placeholder="Groupe Scolaire ..." className="pl-9" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input id="school-email" type="email" value={school.email} onChange={e => setSchool(s => ({ ...s, email: e.target.value }))}
                          placeholder="contact@ecole.ci" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-phone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input id="school-phone" value={school.telephone} onChange={e => setSchool(s => ({ ...s, telephone: e.target.value }))}
                          placeholder="+225 01 02 03 04" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="school-address">Adresse</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input id="school-address" value={school.adresse} onChange={e => setSchool(s => ({ ...s, adresse: e.target.value }))}
                          placeholder="Abidjan, Cocody" className="pl-9" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button onClick={() => { if (validateSchool()) setStep("admin") }}>
                        Suivant <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === "admin" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-nom">Nom *</Label>
                        <Input id="admin-nom" value={admin.nom} onChange={e => setAdmin(a => ({ ...a, nom: e.target.value }))}
                          placeholder="Koné" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-prenom">Prénom *</Label>
                        <Input id="admin-prenom" value={admin.prenom} onChange={e => setAdmin(a => ({ ...a, prenom: e.target.value }))}
                          placeholder="Mamadou" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-telephone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input id="admin-telephone" value={admin.telephone} onChange={e => setAdmin(a => ({ ...a, telephone: e.target.value }))}
                          placeholder="+225 01 02 03 04" className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input id="admin-email" type="email" value={admin.email} onChange={e => setAdmin(a => ({ ...a, email: e.target.value }))}
                          placeholder="directeur@ecole.ci" className="pl-9" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Mot de passe *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input id="admin-password" type="password" value={admin.password}
                            onChange={e => setAdmin(a => ({ ...a, password: e.target.value }))}
                            placeholder="Min 6 caractères" className="pl-9" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-confirm">Confirmer *</Label>
                        <Input id="admin-confirm" type="password" value={admin.confirmPassword}
                          onChange={e => setAdmin(a => ({ ...a, confirmPassword: e.target.value }))}
                          placeholder="Retaper le mot de passe" required />
                      </div>
                    </div>
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep("school")}>
                        <ChevronLeft className="h-4 w-4" /> Retour
                      </Button>
                      <Button onClick={() => { if (validateAdmin()) setStep("confirm") }}>
                        Suivant <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {step === "confirm" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-gray-50 p-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Établissement</p>
                        <p className="font-medium">{school.nom}</p>
                        {school.email && <p className="text-muted-foreground">{school.email}</p>}
                        {school.telephone && <p className="text-muted-foreground">{school.telephone}</p>}
                        {school.adresse && <p className="text-muted-foreground">{school.adresse}</p>}
                      </div>
                      <div className="border-t pt-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Administrateur</p>
                        <p className="font-medium">{admin.prenom} {admin.nom}</p>
                        <p className="text-muted-foreground">{admin.email}</p>
                        {admin.telephone && <p className="text-muted-foreground">{admin.telephone}</p>}
                      </div>
                    </div>
                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep("admin")}>
                        <ChevronLeft className="h-4 w-4" /> Retour
                      </Button>
                      <Button onClick={handleSubmit} loading={loading} className="bg-gradient-to-r from-primary to-accent">
                        {loading ? "Création..." : "Créer mon établissement"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
