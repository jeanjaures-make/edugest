"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Building2, Users, School, TrendingUp } from "lucide-react"

interface Stats {
  totalSchools: number
  totalStudents: number
  totalTeachers: number
  totalUsers: number
}

interface RecentEcole {
  id: string
  nom: string
  email: string
  telephone: string
  site_web: string
  logo_url: string
  code_etablissement: string
  created_at: string
}

export default function SuperadminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalSchools: 0, totalStudents: 0, totalTeachers: 0, totalUsers: 0 })
  const [recentSchools, setRecentSchools] = useState<RecentEcole[]>([])

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/superadmin/stats")
      const json = await res.json()
      setStats(json.stats)
      setRecentSchools(json.recentSchools)
    }
    load()
  }, [])

  const cards = [
    { label: "Écoles", value: stats.totalSchools, icon: Building2, color: "bg-blue-500/20 text-blue-400" },
    { label: "Élèves", value: stats.totalStudents, icon: Users, color: "bg-green-500/20 text-green-400" },
    { label: "Enseignants", value: stats.totalTeachers, icon: School, color: "bg-purple-500/20 text-purple-400" },
    { label: "Utilisateurs", value: stats.totalUsers, icon: TrendingUp, color: "bg-orange-500/20 text-orange-400" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord SuperAdmin</h1>
        <p className="text-gray-400 text-sm">Vue d&apos;ensemble de toutes les écoles</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-gray-400">{card.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold">Dernières écoles inscrites</h2>
        </div>
        <div className="divide-y divide-white/10">
          {recentSchools.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">Aucune école pour le moment</p>
          ) : (
            recentSchools.map((school) => (
              <div key={school.id} className="flex items-center justify-between p-4 text-sm">
                <div className="flex items-center gap-3">
                  {school.logo_url ? (
                    <Image src={school.logo_url} alt="" width={32} height={32} className="rounded object-contain border border-white/10" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600/20 text-red-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{school.nom}</p>
                    <p className="text-gray-400 text-xs">{school.code_etablissement}</p>
                    <p className="text-gray-500 text-xs">{school.email || school.telephone}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(school.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
