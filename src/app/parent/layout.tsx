"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { GraduationCap, LayoutDashboard, Users, ClipboardList, CalendarCheck, CreditCard, MessageSquare, FileText, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState as useReactState } from "react"
import { Menu, X, LogOut } from "lucide-react"

const parentNav: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Accueil", href: "/parent", icon: LayoutDashboard },
  { label: "Mes enfants", href: "/parent/enfants", icon: Users },
  { label: "Bulletins", href: "/parent/bulletins", icon: ClipboardList },
  { label: "Présences", href: "/parent/presences", icon: CalendarCheck },
  { label: "Paiements", href: "/parent/paiements", icon: CreditCard },
  { label: "Communication", href: "/parent/communication", icon: MessageSquare },
  { label: "Documents", href: "/parent/documents", icon: FileText },
]

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ nom: string; prenom: string; ecole: string } | null>(null)
  const [mobileOpen, setMobileOpen] = useReactState(false)

  const loadUser = useCallback(async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      if (error || !authUser) { router.push("/connexion"); return }

      const { data: profil } = await supabase
        .from("profils")
        .select("nom, prenom, role, ecole:ecoles(nom)")
        .eq("user_id", authUser.id)
        .single()

      if (profil?.role === "superadmin") { router.push("/superadmin/dashboard"); return }
      if (profil?.role !== "parent") { router.push("/dashboard"); return }

      setUser({
        nom: profil?.nom ?? authUser.email?.split("@")[0] ?? "Parent",
        prenom: profil?.prenom ?? "",
        ecole: (profil?.ecole as unknown as { nom: string } | null)?.nom ?? "Établissement",
      })
    } catch {
      router.push("/connexion")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadUser() }, [loadUser])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg"
          >
            <GraduationCap className="h-7 w-7 text-white" />
          </motion.div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Chargement...</p>
            <p className="text-xs text-muted-foreground">Espace parent</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">EduGest CI</span>
            <span className="text-xs text-muted-foreground">Espace Parent</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {parentNav.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
            const Icon = link.icon
            return (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary-light text-primary" : "text-gray-500 hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {link.label}
              </a>
            )
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-3">
            <p className="text-sm font-medium text-foreground">{user.prenom} {user.nom}</p>
            <p className="text-xs text-muted-foreground">{user.ecole}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-bold">EduGest CI</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-muted">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4" onClick={(e) => e.stopPropagation()}>
            <nav className="space-y-1 mt-12">
              {parentNav.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
                const Icon = link.icon
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-primary-light text-primary" : "text-gray-500 hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {link.label}
                  </a>
                )
              })}
            </nav>
            <div className="mt-4 border-t border-border pt-4">
              <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6 pb-16 md:pb-6 pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
