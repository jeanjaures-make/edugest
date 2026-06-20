"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Menu, X, Check, ArrowRight, GraduationCap, Users, BarChart3, Shield, BookOpen, CreditCard, Smartphone, Clock, MessageSquare, FileText, Calculator, ChevronRight } from "lucide-react"
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
  { name: "Jean Mercier", role: "Directeur d'école", text: "EduGest nous a fait gagner un temps précieux. La gestion des inscriptions et des paiements est devenue un jeu d'enfant." },
  { name: "Aïcha Dubois", role: "Directrice d'école", text: "Les bulletins automatisés et le portail parents ont révolutionné notre relation avec les familles." },
  { name: "Bernard Fontaine", role: "Directeur d'école", text: "Le support est exceptionnel et le logiciel parfaitement adapté au système éducatif ivoirien." },
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
  const display = isNaN(num) ? value : useCountUp(num).toLocaleString("fr-FR") + (value.includes("+") ? "+" : "")
  return (
    <motion.div variants={fadeIn} className="text-center p-6">
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 via-primary to-accent bg-clip-text text-transparent">{display}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </motion.div>
  )
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1])

  useEffect(() => {
    const u = scrollY.on("change", (v) => setScrolled(v > 20))
    return () => u()
  }, [scrollY])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all"
      style={scrolled ? { backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" } : {}}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size="md" />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-primary transition-colors">Fonctionnalités</a>
          <a href="#stats" className="hover:text-primary transition-colors">Chiffres</a>
          <a href="#testimonials" className="hover:text-primary transition-colors">Témoignages</a>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link href="/connexion"><Button variant="ghost">Connexion</Button></Link>
          <Link href="/onboarding"><Button>Créer mon école <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
        <button className="md:hidden p-2" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-white md:hidden">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <Logo size="sm" />
              <button className="p-2" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-col p-6 gap-4">
              <a href="#features" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2">Fonctionnalités</a>
              <a href="#stats" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2">Chiffres</a>
              <a href="#testimonials" onClick={() => setMobileOpen(false)} className="text-lg font-medium py-2">Témoignages</a>
              <hr className="my-2" />
              <Link href="/connexion" onClick={() => setMobileOpen(false)}><Button variant="outline" className="w-full">Connexion</Button></Link>
              <Link href="/onboarding" onClick={() => setMobileOpen(false)}><Button className="w-full">Créer mon école <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white pt-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-200/30 via-primary/10 to-transparent blur-3xl animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-green-200/20 via-accent/10 to-transparent blur-3xl animate-float" style={{ animationDelay: "-1.5s" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary/5 via-orange-100/10 to-transparent blur-3xl animate-gradient-shift" />
        <div className="absolute top-20 left-10 w-20 h-20 rounded-full border border-primary/20 animate-float" />
        <div className="absolute bottom-40 right-20 w-14 h-14 rounded-full border border-orange-200/40 animate-float" style={{ animationDelay: "-1s" }} />
        <div className="absolute top-1/2 right-1/4 w-8 h-8 rounded-full bg-primary/10 animate-float" style={{ animationDelay: "-2s" }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700 mb-6">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              Le premier logiciel de gestion scolaire 100% ivoirien
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]"
          >
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Libérez-vous de la paperasse.
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Pilotez votre école en un clic.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            Inscriptions, notes, bulletins, paiements Mobile Money, communication parents — 
            EduGest CI centralise toute la vie de votre établissement dans une plateforme simple, rapide et sécurisée.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/onboarding">
              <Button size="lg" className="h-13 px-8 text-base shadow-lg shadow-primary/20">
                Créer mon école gratuitement
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/connexion">
              <Button variant="outline" size="lg" className="h-13 px-8 text-base">
                J&apos;ai déjà un compte
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Essai gratuit 14 jours</div>
            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Sans carte bancaire</div>
            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Support WhatsApp prioritaire</div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section id="stats" className="relative py-20 md:py-28 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
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
    <section className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger}>
          <motion.h2 variants={fadeIn} className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Vous reconnaissez-vous ?
          </motion.h2>
          <motion.p variants={fadeIn} className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Chaque jour, des directeurs d&apos;école perdent un temps précieux sur ces tâches
          </motion.p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {problems.map((p, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 hover:border-orange-200 hover:bg-orange-50/30 transition-all"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
                  <p.icon className="h-5 w-5" />
                </div>
                <p className="text-lg font-medium text-gray-700">{p.text}</p>
                <ChevronRight className="h-5 w-5 text-gray-300 ml-auto shrink-0" />
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeIn} className="relative mt-12 mx-auto max-w-2xl text-center">
            <div className="rounded-2xl bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border border-primary/10 p-8">
              <p className="text-lg font-semibold text-gray-800 mb-2">Et si vous passiez au numérique ?</p>
              <p className="text-muted-foreground">Avec EduGest CI, tout devient fluide, automatisé et accessible depuis votre téléphone.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger}>
          <motion.div variants={fadeIn} className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">Fonctionnalités</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Tout ce dont votre école a besoin
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Un seul outil pour gérer votre établissement de A à Z
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
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
    <section id="testimonials" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div variants={stagger}>
          <motion.h2 variants={fadeIn} className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ce qu&apos;en disent les directeurs
          </motion.h2>
          <motion.p variants={fadeIn} className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Rejoignez les établissements qui ont déjà adopté EduGest CI
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
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
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-accent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <motion.div variants={stagger} className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2 variants={fadeIn} className="text-3xl md:text-5xl font-bold text-white leading-tight">
          Prêt à moderniser votre établissement ?
        </motion.h2>
        <motion.p variants={fadeIn} className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
          Créez votre compte en 5 minutes. Essayez gratuitement pendant 14 jours, sans engagement.
        </motion.p>

        <motion.div variants={fadeIn} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/onboarding">
            <Button size="lg" className="h-13 px-10 text-base bg-white text-primary hover:bg-white/90 shadow-xl shadow-black/20">
              Créer mon école
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }) }}>
            <Button variant="outline" size="lg" className="h-13 px-8 text-base border-white/20 text-white hover:bg-white/10 hover:text-white">
              Voir les fonctionnalités
            </Button>
          </a>
        </motion.div>

        <motion.div variants={fadeIn} className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/60">
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
    <footer className="bg-gray-950 text-gray-400 py-12">
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
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <StatsSection />
      <ProblemsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
