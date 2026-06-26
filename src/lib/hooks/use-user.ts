"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface UserProfile {
  id: string
  user_id: string
  ecole_id: string
  nom: string
  prenom: string
  telephone: string | null
  role: string
}

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from("profils")
        .select("id, user_id, ecole_id, nom, prenom, telephone, role")
        .eq("user_id", user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  return { profile, loading }
}
