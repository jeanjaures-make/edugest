"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { supabase } from "@/lib/supabase"
import type { UserRole } from "@/types"
import { motion } from "framer-motion"
import { GraduationCap } from "lucide-react"

interface UserInfo {
  nom: string
  prenom: string
  role: UserRole
  ecole: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      if (error || !authUser) { router.push("/connexion"); return }

      const { data: profil } = await supabase
        .from("profils")
        .select("nom, prenom, role, ecole:ecoles(nom)")
        .eq("user_id", authUser.id)
        .single()

      const role = (profil?.role as UserRole) ?? "directeur"

      if (role === "superadmin") {
        router.push("/superadmin/dashboard")
        return
      }

      setUser({
        nom: profil?.nom ?? authUser.email?.split("@")[0] ?? "Utilisateur",
        prenom: profil?.prenom ?? "",
        role,
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
            <p className="text-xs text-muted-foreground">Préparation de votre espace</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          nom={user.nom}
          prenom={user.prenom}
          role={user.role}
          nomEcole={user.ecole}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-6 pb-16 md:pb-6 pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
