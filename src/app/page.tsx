"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useScroll, AnimatePresence } from "framer-motion"
import { Menu, X, Check, ArrowRight, GraduationCap, Users, BarChart3, Shield, CreditCard, Smartphone, Clock, MessageSquare, FileText, Calculator, ChevronRight, Zap, Building2, ClipboardList, HelpCircle, Sparkles, BookOpen, Award, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6 },
}

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, staggerChildren: 0.12 },
}

const features = [
  { icon: Users, title: "Gestion des élèves", desc: "Fiches complètes, inscriptions, matricules, historiques et photos. Toute la vie scolaire au même endroit." },
  { icon: GraduationCap, title: "Notes & Bulletins", desc: "Saisie simplifiée, calcul automatique des moyennes, bulletins PDF et relevés de notes." },
  { icon: CreditCard, title: "Paiements Mobile Money", desc: "Orange Money, MTN MoMo. Encaissements, échéanciers, reçus et relances automatiques." },
  { icon: BarChart3, title: "Statistiques & Rapports", desc: "Tableaux de bord en temps réel, taux de réussite, impayés, effectifs par classe." },
  { icon: Clock, title: "Emploi du temps", desc: "Générateur de planning interactif, gestion des salles et des créneaux." },
  { icon: MessageSquare, title: "Communication", desc: "Notifications aux parents, messagerie interne, alertes SMS et emails groupés." },
  { icon: Smartphone, title: "Portail Parents & Élèves", desc: "Consultation des notes, paiements, absences et emploi du temps depuis n'importe quel appareil." },
  { icon: Shield, title: "Sécurité & Conformité", desc: "Données hébergées en Côte d'Ivoire, conformes au cadre légal. Accès par rôle (directeur, enseignant, parent)." },
]

const testimonials = [
  { name: "Jean Mercier", role: "Directeur, Collège Les Palmiers", text: "EduGest nous a fait gagner un temps précieux. La gestion des inscriptions et des paiements est devenue un jeu d'enfant." },
  { name: "Aïcha Dubois", role: "Directrice, École La Renaissance", text: "Les bulletins automatisés et le portail parents ont révolutionné notre relation avec les familles." },
  { name: "Bernard Fontaine", role: "Directeur, Lycée Saint-Augustin", text: "Le support est exceptionnel et le logiciel parfaitement adapté au système éducatif ivoirien." },
]

const steps = [
  { icon: Building2, title: "1. Créez votre école", desc: "Inscrivez votre établissement en 5 minutes. Niveaux, matières et année scolaire sont configurés automatiquement." },
  { icon: ClipboardList, title: "2. Ajoutez vos élèves", desc: "Importez vos élèves via Excel ou créez-les un par un. Les inscriptions et les classes sont prêtes immédiatement." },
  { icon: Zap, title: "3. Pilotez tout", desc: "Notes, paiements, présences, emploi du temps, communication parents — tout est centralisé et automatisé." },
]

const pricingPlans = [
  {
    name: "Essai",
    price: "Gratuit",
    period: "14 jours",
    desc: "Découvrez toutes les fonctionnalités sans engagement",
    features: ["Toutes les fonctionnalités", "Jusqu'à 100 élèves", "Support WhatsApp", "Sans carte bancaire"],
    cta: "Commencer gratuitement",
    highlight: false,
  },
  {
    name: "Standard",
    price: "15 000",
    period: "FCFA / mois",
    desc: "Pour les petites et moyennes écoles",
    features: ["Élèves illimités", "Paiements Mobile Money", "Bulletins PDF automatiques", "SMS aux parents inclus", "Support prioritaire"],
    cta: "Choisir Standard",
    highlight: true,
  },
  {
    name: "Premium",
    price: "35 000",
    period: "FCFA / mois",
    desc: "Pour les grands établissements et groupes",
    features: ["Tout le plan Standard", "Multi-sites", "API & intégrations", "Gestion comptable avancée", "Account manager dédié"],
    cta: "Contacter l'équipe",
    highlight: false,
  },
]

const faqs = [
  { q: "Comment fonctionne l'essai gratuit ?", a: "Vous avez accès à toutes les fonctionnalités pendant 14 jours, sans carte bancaire. À la fin de l'essai, vous choisissez le plan qui vous convient." },
  { q: "Les paiements Mobile Money sont-ils inclus ?", a: "Oui, EduGest CI supporte Orange Money, MTN MoMo et les paiements en espèces. Les parents peuvent payer directement depuis leur téléphone." },
  { q: "Mes données sont-elles sécurisées ?", a: "Vos données sont hébergées sur des serveurs sécurisés et conformes au cadre légal ivoirien. Chaque école a un accès isolé et protégé." },
  { q: "Puis-je importer mes élèves existants ?", a: "Oui, vous pouvez importer vos élèves en masse via un fichier Excel. Le matricule, le nom, la classe et les informations des parents sont importés automatiquement." },
  { q: "Y a-t-il une formation pour mon équipe ?", a: "Oui, nous proposons une session de prise en main gratuite de 1h, ainsi qu'un support WhatsApp pour vous et vos enseignants." },
  { q: "Que se passe-t-il si je résilie ?", a: "Vous pouvez résilier à tout moment sans frais. Vos données sont conservées pendant 90 jours puis supprimées définitivement." },
]

const trustBadges = [
  { icon: CreditCard, label: "Orange Money" },
  { icon: Smartphone, label: "MTN MoMo" },
  { icon: Shield, label: "Données protégées" },
  { icon: GraduationCap, label: "Adapté au système ivoirien" },
]

const stats = [
  { label: "Écoles inscrites", value: "150+" },
  { label: "Élèves gérés", value: "25 000+" },
  { label: "Enseignants", value: "1 200+" },
  { label: "Paiements traités", value: "10 000+" },
]

function useCountUp(end: number, duration = 2) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const increment = Math.ceil(end / (duration * 60))
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(start)
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [end, duration])
  return count
}

function StatItem({ label, value }: { label: string; value: string }) {
  const num = parseInt(value.replace(/\D/g, ""))
  const count = useCountUp(isNaN(num) ? 0 : num)
  const display = isNaN(num) ? value : count.toLocaleString("fr-FR") + (value.includes("+") ? "+" : "")
  return (
    <motion.div variants={fadeIn} className="text-center p-6">
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">{display}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </motion.div>
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    const u = scrollY.on("change", (v) => setScrolled(v > 20))
    return () => u()
  }, [scrollY])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all"
      style={scrolled ? { backgroundColor: "rgba(10,10,15,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" } : {}}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size="md" />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Témoignages</a>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/connexion"><Button variant="ghost" className="text-gray-200 hover:text-white hover:bg-white/10">Connexion</Button></Link>
          <Link href="/onboarding"><Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0">Créer mon école <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
        <button className="md:hidden p-2 text-gray-200" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-gray-950 md:hidden">
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
              <Logo size="sm" />
              <button className="p-2 text-gray-200" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col p-6 gap-4">
              <a href="#features" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 text-gray-200">Fonctionnalités</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 text-gray-200">Tarifs</a>
              <a href="#faq" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 text-gray-200">FAQ</a>
              <a href="#testimonials" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2 text-gray-200">Témoignages</a>
              <hr className="my-2 border-white/10" />
              <Link href="/connexion" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full border-white/20 text-white">Connexion</Button></Link>
              <Link href="/onboarding" onClick={() => setMobileOpen(false)}><Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">Créer mon école <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gray-950 pt-16">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=2070&q=80"
          alt=""
          className="h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/70 to-gray-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-gray-950/50" />
      </div>

      {/* Glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-amber-500/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400 mb-6">
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                Le logiciel de gestion scolaire 100% en ligne
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]"
            >
              Libérez-vous de la paperasse.
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Pilotez votre école en un clic.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="mx-auto lg:mx-0 mt-6 max-w-xl text-lg text-gray-400 leading-relaxed"
            >
              Inscriptions, notes, bulletins, paiements Mobile Money, communication parents —
              EduGest CI centralise toute la vie de votre établissement dans une plateforme simple, rapide et sécurisée.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link href="/onboarding">
                <Button size="lg" className="h-13 px-8 text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg shadow-orange-500/20">
                  Créer mon école gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/connexion">
                <Button variant="outline" size="lg" className="h-13 px-8 text-base border-white/20 text-white bg-white/5 hover:bg-white/10 hover:text-white">
                  J&apos;ai déjà un compte
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Essai gratuit 14 jours</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Sans carte bancaire</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Support WhatsApp</div>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3"
            >
              {trustBadges.map((b, i) => (
                <div key={i} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-300 backdrop-blur-sm">
                  <b.icon className="h-3.5 w-3.5 text-orange-400" />
                  {b.label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Image collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block relative"
          >
            <div className="relative grid grid-cols-2 gap-4">
              {/* Main image */}
              <div className="col-span-2 rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/10 border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80"
                  alt="Élèves africains en classe"
                  className="w-full h-64 object-cover"
                />
              </div>
              {/* Small images */}
              <div className="rounded-2xl overflow-hidden shadow-xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1503676263748-1bb8c0da4a24?auto=format&fit=crop&w=400&q=80"
                  alt="Livre et cahier"
                  className="w-full h-32 object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80"
                  alt="Étudiants"
                  className="w-full h-32 object-cover"
                />
              </div>
            </div>

            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1 }}
              className="absolute -bottom-6 -left-6 rounded-2xl border border-white/10 bg-gray-900/90 backdrop-blur-xl p-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">+40%</p>
                  <p className="text-xs text-gray-400">de temps gagné</p>
                </div>
              </div>
            </motion.div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.2 }}
              className="absolute -top-4 -right-4 rounded-2xl border border-white/10 bg-gray-900/90 backdrop-blur-xl p-3 shadow-2xl"
            >
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-400" />
                <span className="text-xs font-medium text-white">N°1 en Côte d&apos;Ivoire</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section id="stats" className="relative py-20 md:py-28 bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-orange-500/5 blur-[100px]" />
      <motion.div variants={stagger} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2 variants={fadeIn} className="text-center text-3xl md:text-4xl font-bold text-white mb-4">
          Ils nous font confiance
        </motion.h2>
        <motion.p variants={fadeIn} className="text-center text-gray-400 mb-12 max-w-xl mx-auto">
          Des établissements de toute la Côte d&apos;Ivoire utilisent EduGest CI au quotidien
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((s) => <StatItem key={s.label} {...s} />)}
        </div>
      </motion.div>
    </section>
  )
}

function ProblemsSection() {
  const problems = [
    { icon: FileText, text: "Vous gérez encore les inscriptions sur papier ?" },
    { icon: Calculator, text: "Les notes sont calculées à la main ?" },
    { icon: CreditCard, text: "Les paiements sont un casse-tête chaque mois ?" },
    { icon: MessageSquare, text: "Contacter les parents est une galère ?" },
  ]

  return (
    <section className="py-20 md:py-28 bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger}>
          <motion.h2 variants={fadeIn} className="text-center text-3xl md:text-4xl font-bold text-white mb-4">
            Vous reconnaissez-vous ?
          </motion.h2>
          <motion.p variants={fadeIn} className="text-center text-gray-400 mb-16 max-w-xl mx-auto">
            Chaque jour, des directeurs d&apos;école perdent un temps précieux sur ces tâches
          </motion.p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {problems.map((p, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-gray-800/50 p-6 hover:border-orange-500/30 hover:bg-gray-800 transition-all"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                  <p.icon className="h-5 w-5" />
                </div>
                <p className="text-lg font-medium text-gray-200">{p.text}</p>
                <ChevronRight className="h-5 w-5 text-gray-600 ml-auto shrink-0" />
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeIn} className="relative mt-12 mx-auto max-w-2xl text-center">
            <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/20 p-8">
              <p className="text-lg font-semibold text-white mb-2">Et si vous passiez au numérique ?</p>
              <p className="text-gray-400">Avec EduGest CI, tout devient fluide, automatisé et accessible depuis votre téléphone.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger}>
          <motion.div variants={fadeIn} className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400 mb-4">
              <Sparkles className="h-4 w-4" /> Mise en route
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Comment ça marche ?
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              Démarrez en 3 étapes simples, sans installation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeIn} className="relative text-center">
                <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-gray-900 border border-white/10 shadow-lg shadow-orange-500/5 mb-5">
                  <s.icon className="h-8 w-8 text-orange-400" />
                  <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger}>
          <motion.div variants={fadeIn} className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400 mb-4">Tarifs</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Des prix adaptés à votre école
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              Transparent, sans frais cachés. Annulez à tout moment.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl border-2 p-6 ${plan.highlight ? "border-orange-500/50 bg-gradient-to-b from-orange-500/10 to-gray-900 shadow-xl shadow-orange-500/10" : "border-white/10 bg-gray-800/50"}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1 text-xs font-semibold text-white">
                    Le plus populaire
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{plan.desc}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    {plan.period !== "14 jours" && <span className="text-sm text-gray-400 ml-1">{plan.period}</span>}
                    {plan.period === "14 jours" && <span className="text-sm text-gray-400 ml-1">/ {plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/onboarding" className="block">
                  <Button className={`w-full ${plan.highlight ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0" : ""}`} variant={plan.highlight ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <section id="faq" className="py-20 md:py-28 bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger}>
          <motion.div variants={fadeIn} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400 mb-4">
              <HelpCircle className="h-4 w-4" /> FAQ
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Questions fréquentes
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeIn} className="rounded-xl border border-white/10 bg-gray-800/50 overflow-hidden">
                <button
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <ChevronRight className={`h-5 w-5 text-gray-500 shrink-0 transition-transform ${openIdx === i ? "rotate-90" : ""}`} />
                </button>
                <AnimatePresence>
                  {openIdx === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ImageShowcaseSection() {
  return (
    <section className="py-20 md:py-28 bg-gray-950 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger} className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeIn}>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400 mb-4">
              <BookOpen className="h-4 w-4" /> Conçu pour l&apos;Afrique
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Une solution pensée pour les écoles ivoiriennes
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              EduGest CI s&apos;adapte au système éducatif de Côte d&apos;Ivoire : niveaux du CP au Tle,
              matières du programme national, paiements Mobile Money, et communication en français.
              Tout est prêt pour votre établissement.
            </p>
            <div className="space-y-4">
              {[
                { icon: GraduationCap, text: "Niveaux et matières pré-configurés selon le programme ivoirien" },
                { icon: CreditCard, text: "Orange Money et MTN MoMo intégrés pour les paiements" },
                { icon: MessageSquare, text: "SMS automatiques aux parents en français" },
                { icon: Shield, text: "Données hébergées et conformes au cadre légal local" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                    <item.icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <p className="text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 col-span-2">
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80"
                  alt="Élèves africains étudiant"
                  className="w-full h-56 object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1456513080510-7bf31984b5a0?auto=format&fit=crop&w=400&q=80"
                  alt="Bibliothèque"
                  className="w-full h-36 object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1427504494785-985a5d3b3104?auto=format&fit=crop&w=400&q=80"
                  alt="Élève lisant"
                  className="w-full h-36 object-cover"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger}>
          <motion.div variants={fadeIn} className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400 mb-4">Fonctionnalités</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Tout ce dont votre école a besoin
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              Un seul outil pour gérer votre établissement de A à Z
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group relative rounded-2xl border border-white/10 bg-gray-800/50 p-6 hover:border-orange-500/30 hover:bg-gray-800 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:py-28 bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger}>
          <motion.h2 variants={fadeIn} className="text-center text-3xl md:text-4xl font-bold text-white mb-4">
            Ce qu&apos;en disent les directeurs
          </motion.h2>
          <motion.p variants={fadeIn} className="text-center text-gray-400 mb-16 max-w-xl mx-auto">
            Rejoignez les établissements qui ont déjà adopté EduGest CI
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-2xl border border-white/10 bg-gray-800/50 p-6 hover:border-orange-500/20 transition-colors"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="h-4 w-4 text-orange-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="border-t border-white/10 pt-4">
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-gray-400">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-gray-950">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db744?auto=format&fit=crop&w=2070&q=80"
          alt=""
          className="h-full w-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/80 to-gray-950" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[120px]" />

      <motion.div variants={stagger} className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-bold text-white leading-tight">
          Prêt à moderniser votre établissement ?
        </motion.h2>
        <motion.p variants={fadeIn} className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Créez votre compte en 5 minutes. Essayez gratuitement pendant 14 jours, sans engagement.
        </motion.p>

        <motion.div variants={fadeIn} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/onboarding">
            <Button size="lg" className="h-13 px-10 text-base bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 hover:from-orange-600 hover:to-amber-600 shadow-xl shadow-orange-500/20">
              Créer mon école
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }) }}>
            <Button variant="outline" size="lg" className="h-13 px-8 text-base border-white/20 text-white bg-white/5 hover:bg-white/10 hover:text-white">
              Voir les fonctionnalités
            </Button>
          </a>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
          <span>Essai gratuit 14 jours</span>
          <span className="hidden sm:inline">•</span>
          <span>Sans carte bancaire</span>
          <span className="hidden sm:inline">•</span>
          <span>Support prioritaire</span>
          <span className="hidden sm:inline">•</span>
          <span>Résiliation à tout moment</span>
        </motion.div>
      </motion.div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-white/5 text-gray-500 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex gap-6 text-sm">
            <span>© {new Date().getFullYear()} EduGest CI</span>
            <span className="hidden sm:inline">•</span>
            <a href="mailto:contact@edugest.ci" className="hover:text-white transition-colors">contact@edugest.ci</a>
            <span className="hidden sm:inline">•</span>
            <span>Fait en Côte d&apos;Ivoire 🇨🇮</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Hero />
      <StatsSection />
      <ProblemsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ImageShowcaseSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
