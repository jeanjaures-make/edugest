"use client"

import { useEffect, useState, useCallback, useEffectEvent } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { GraduationCap, LayoutDashboard, Building2, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileDrawer } from "@/components/ui/mobile-drawer"

const superadminLinks = [
  { label: "Tableau de bord", href: "/superadmin/dashboard", icon: LayoutDashboard },
  { label: "Écoles", href: "/superadmin/ecoles", icon: Building2 },
]

async function getSupabase() {
  const { supabase } = await import("@/lib/supabase")
  return supabase
}

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const onPathnameChange = useEffectEvent(() => { setMobileOpen(false) })
  useEffect(() => { onPathnameChange() }, [pathname])

  const checkAuth = useCallback(async () => {
    const supabase = await getSupabase()
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    if (error || !authUser) { router.push("/connexion"); return }

    const { data: profil } = await supabase
      .from("profils")
      .select("role")
      .eq("user_id", authUser.id)
      .single()

    if (profil?.role !== "superadmin") {
      router.push("/dashboard")
      return
    }

    setUser({ email: authUser.email ?? "" })
    setLoading(false)
  }, [router])

  const onCheckAuth = useEffectEvent(() => { checkAuth() })
  useEffect(() => { onCheckAuth() }, [])

  async function handleSignOut() {
    const supabase = await getSupabase()
    await supabase.auth.signOut()
    router.push("/connexion")
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gray-950">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <GraduationCap className="h-8 w-8 text-white" />
        </motion.div>
      </div>
    )
  }

  const sidebar = (
    <>
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">EduGest SuperAdmin</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/10 md:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {superadminLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <div className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-red-600/20 text-red-400" : "text-gray-400 hover:text-white hover:bg-white/10"
              )}>
                <Icon className="h-5 w-5 shrink-0" />
                {link.label}
              </div>
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400">
          <div className="flex-1 truncate">{user?.email}</div>
          <button onClick={handleSignOut} className="text-gray-500 hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-950 text-white">
      <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center border-b border-white/10 bg-gray-950 px-3 md:hidden">
        <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5 text-white" />
        </Button>
        <span className="ml-2 font-bold text-sm text-white">EduGest SuperAdmin</span>
      </div>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <div className="flex h-full flex-col bg-gray-950 text-white">{sidebar}</div>
      </MobileDrawer>

      <aside className="hidden md:flex md:w-60 flex-col border-r border-white/10 bg-gray-950 shrink-0">
        {sidebar}
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6">
        {children}
      </main>
    </div>
  )
}
