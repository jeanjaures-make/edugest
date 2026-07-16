"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Building2, User, CheckCircle, ArrowLeft, ArrowRight, Mail, Lock, Phone, MapPin, Eye, EyeOff, Upload, X } from "lucide-react"

type Step = "ecole" | "admin" | "confirmation"

export default function OnboardingPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("ecole")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [school, setSchool] = useState({
    nom: "",
    adresse: "",
    telephone: "",
    email: "",
    site_web: "",
    code_etablissement: "",
    logo_url: "",
  })

  const [admin, setAdmin] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
  })
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (step !== "confirmation") return
    if (countdown <= 0) { router.push("/connexion"); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [step, countdown, router])

  function updateSchool(field: string, value: string) {
    setSchool((prev) => ({ ...prev, [field]: value }))
  }

  function updateAdmin(field: string, value: string) {
    setAdmin((prev) => ({ ...prev, [field]: value }))
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
    if (!allowed.includes(file.type)) {
      setError("Format non supporté (PNG, JPG, WEBP, SVG)")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 2 Mo)")
      return
    }

    setError("")
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleLogoRemove() {
    setLogoFile(null)
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(null)
    updateSchool("logo_url", "")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }


  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordErrors: string[] = []
  if (admin.password.length > 0) {
    if (admin.password.length < 6) passwordErrors.push("Minimum 6 caractères")
    if (!/[A-Z]/.test(admin.password)) passwordErrors.push("1 majuscule")
    if (!/[0-9]/.test(admin.password)) passwordErrors.push("1 chiffre")
  }

  function isSchoolValid() {
    return school.nom.trim().length >= 2
  }

  function isAdminValid() {
    return (
      admin.nom.trim().length >= 2 &&
      admin.prenom.trim().length >= 2 &&
      emailRegex.test(admin.email) &&
      admin.password.length >= 6 &&
      /[A-Z]/.test(admin.password) &&
      /[0-9]/.test(admin.password)
    )
  }

  async function handleSubmit() {
    setLoading(true)
    setError("")

    try {
      const fd = new FormData()
      fd.append("school_nom", school.nom)
      fd.append("school_adresse", school.adresse)
      fd.append("school_telephone", school.telephone)
      fd.append("school_email", school.email)
      fd.append("school_site_web", school.site_web)
      fd.append("school_code_etablissement", school.code_etablissement)
      fd.append("admin_nom", admin.nom)
      fd.append("admin_prenom", admin.prenom)
      fd.append("admin_email", admin.email)
      fd.append("admin_telephone", admin.telephone)
      fd.append("admin_password", admin.password)
      if (logoFile) fd.append("logo", logoFile)

      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        body: fd,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Une erreur est survenue")
      }

      if (data.ecole?.logo_url) {
        updateSchool("logo_url", data.ecole.logo_url)
      }

      setStep("confirmation")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = step === "ecole" ? 0 : step === "admin" ? 1 : 2
  const steps = ["École", "Administrateur", "Confirmation"]

  function getStepIcon(iconStep: number) {
    if (iconStep < stepIndex) return <CheckCircle className="h-5 w-5 text-orange-500" />
    if (iconStep === stepIndex) return <div className="h-5 w-5 rounded-full border-2 border-orange-500" />
    return <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-950 p-4">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1503676263748-1bb8c0da4a24?auto=format&fit=crop&w=2070&q=80"
          alt=""
          className="h-full w-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/90 via-gray-950/85 to-gray-950" />
      </div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-amber-500/8 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <Logo size="lg" />
      </motion.div>

      {step !== "confirmation" && (
        <div className="w-full max-w-md mb-6">
          <div className="flex items-center justify-between">
            {steps.map((label, idx) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {getStepIcon(idx)}
                  <span
                    className={`text-sm font-medium hidden sm:inline ${
                      idx <= stepIndex ? "text-orange-400" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 w-8 mx-2 ${idx < stepIndex ? "bg-orange-500" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="border-white/10 bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-orange-500/5">
          <AnimatePresence mode="wait">
            {step === "ecole" && (
              <motion.div
                key="ecole"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                    Créer mon école
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Commencez par renseigner les informations de votre établissement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setError("")
                      setStep("admin")
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>Logo de l&apos;établissement</Label>
                      <div className="flex items-center gap-4">
                        {logoPreview ? (
                          <div className="relative h-20 w-20 rounded-lg border border-border overflow-hidden shrink-0">
                            <Image
                              src={logoPreview}
                              alt="Aperçu logo"
                              fill
                              sizes="80px"
                              className="object-contain"
                            />
                            <button
                              type="button"
                              onClick={handleLogoRemove}
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-20 w-20 rounded-lg border-2 border-dashed border-white/15 hover:border-orange-500 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-orange-400 transition-colors shrink-0"
                          >
                            <Upload className="h-5 w-5" />
                            <span className="text-[10px]">Logo</span>
                          </button>
                        )}
                        <div className="text-xs text-gray-500">
                          <p>PNG, JPG, WEBP ou SVG</p>
                          <p>Max 2 Mo</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleLogoSelect}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school-nom">Nom de l&apos;établissement *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="school-nom"
                          placeholder="Ex: Groupe Scolaire Abidjan"
                          value={school.nom}
                          onChange={(e) => updateSchool("nom", e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school-email">Email de l&apos;établissement</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="school-email"
                          type="email"
                          placeholder="contact@ecole.ci"
                          value={school.email}
                          onChange={(e) => updateSchool("email", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school-telephone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="school-telephone"
                          type="tel"
                          placeholder="+225 01 02 03 04"
                          value={school.telephone}
                          onChange={(e) => updateSchool("telephone", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school-adresse">Adresse</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="school-adresse"
                          placeholder="Abidjan, Cocody"
                          value={school.adresse}
                          onChange={(e) => updateSchool("adresse", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="school-code">Code établissement</Label>
                        <Input
                          id="school-code"
                          placeholder="Ex: GSA-2026"
                          value={school.code_etablissement}
                          onChange={(e) => updateSchool("code_etablissement", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="school-site">Site web</Label>
                        <Input
                          id="school-site"
                          placeholder="https://ecole.ci"
                          value={school.site_web}
                          onChange={(e) => updateSchool("site_web", e.target.value)}
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600"
                      >
                        {error}
                      </motion.div>
                    )}

                    <Button type="submit" className="w-full h-11" disabled={!isSchoolValid()}>
                      Suivant
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Déjà un compte ?{" "}
                      <Link href="/connexion" className="font-medium text-primary hover:underline">
                        Se connecter
                      </Link>
                    </p>
                  </form>
                </CardContent>
              </motion.div>
            )}

            {step === "admin" && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-orange-400" />
                  </div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                    Administrateur
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Créez le compte administrateur de votre établissement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSubmit()
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="admin-nom">Nom *</Label>
                        <Input
                          id="admin-nom"
                          placeholder="Kouamé"
                          value={admin.nom}
                          onChange={(e) => updateAdmin("nom", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-prenom">Prénom *</Label>
                        <Input
                          id="admin-prenom"
                          placeholder="Jean"
                          value={admin.prenom}
                          onChange={(e) => updateAdmin("prenom", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="admin-email"
                          type="email"
                          placeholder="jean.kouame@ecole.ci"
                          value={admin.email}
                          onChange={(e) => updateAdmin("email", e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-telephone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="admin-telephone"
                          type="tel"
                          placeholder="+225 01 02 03 04 05"
                          value={admin.telephone}
                          onChange={(e) => updateAdmin("telephone", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Mot de passe *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="admin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 caractères, 1 majuscule, 1 chiffre"
                          value={admin.password}
                          onChange={(e) => updateAdmin("password", e.target.value)}
                          className="pl-9 pr-9"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.length > 0 && (
                        <div className="space-y-1">
                          {passwordErrors.map((err) => (
                            <p key={err} className="text-xs text-red-500 flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-red-500" />
                              {err}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-11 border-white/15 text-white bg-white/5 hover:bg-white/10"
                        onClick={() => setStep("ecole")}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                      </Button>

                      <Button
                        type="submit"
                        className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
                        disabled={!isAdminValid() || loading}
                        loading={loading}
                      >
                        {loading ? "Création..." : "Créer mon école"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </motion.div>
            )}

            {step === "confirmation" && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center"
                  >
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </motion.div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                    École créée avec succès !
                  </CardTitle>
                  {logoPreview && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                      className="mx-auto mt-3 h-16 w-16 rounded-lg border border-border overflow-hidden relative"
                    >
                      <Image
                        src={logoPreview}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-contain"
                      />
                    </motion.div>
                  )}
                  <CardDescription className="text-gray-400">
                    Votre établissement <strong>{school.nom}</strong> a été enregistré.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-4 text-sm text-orange-300 text-left space-y-1">
                    <p className="font-medium">Informations de connexion :</p>
                    <p>Email : <strong>{admin.email}</strong></p>
                    <p className="text-xs text-orange-400/70">
                      Un email de confirmation a été envoyé à cette adresse.
                    </p>
                  </div>

                  <Button
                    className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
                    onClick={() => router.push("/connexion")}
                  >
                    Aller à la connexion{countdown > 0 ? ` (${countdown}s)` : ""}
                  </Button>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-xs text-gray-500"
      >
        &copy; {new Date().getFullYear()} EduGest CI. Tous droits réservés.
      </motion.p>
    </div>
  )
}
