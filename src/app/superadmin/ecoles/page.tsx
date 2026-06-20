"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Search, Mail, Phone, MapPin, Users, School, Globe } from "lucide-react"
import { Input } from "@/components/ui/input"

interface EcoleWithStats {
  id: string
  nom: string
  adresse: string
  telephone: string
  email: string
  site_web: string
  logo_url: string
  code_etablissement: string
  created_at: string
  eleves_count: number
  personnel_count: number
}

export default function SuperadminEcolesPage() {
  const [schools, setSchools] = useState<EcoleWithStats[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/superadmin/ecoles")
      const json = await res.json()
      setSchools(json.schools)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = schools.filter(s =>
    s.nom.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Écoles</h1>
        <p className="text-gray-400 text-sm">Gestion de tous les établissements</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une école..."
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((school, i) => (
          <motion.div
            key={school.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {school.logo_url ? (
                  <Image src={school.logo_url} alt="" width={40} height={40} className="rounded-lg object-contain border border-white/10" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20 text-red-400">
                    <School className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{school.nom}</h3>
                  <p className="text-xs text-gray-500">Code: {school.code_etablissement}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {school.eleves_count} élèves</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {school.personnel_count} agents</span>
            </div>

            <div className="space-y-1.5 text-xs text-gray-400">
              {school.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /> {school.email}</p>}
              {school.telephone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /> {school.telephone}</p>}
              {school.adresse && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /> {school.adresse}</p>}
              {school.site_web && <p className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 shrink-0" /> {school.site_web}</p>}
            </div>

            <div className="text-xs text-gray-500">
              Inscrit le {new Date(school.created_at).toLocaleDateString("fr-FR")}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune école trouvée
        </div>
      )}
    </div>
  )
}
