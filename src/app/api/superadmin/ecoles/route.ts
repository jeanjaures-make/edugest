import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { data: profil } = await supabase
    .from("profils")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (profil?.role !== "superadmin") {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: ecoles, error } = await svc.from("ecoles").select("id, nom, adresse, telephone, email, site_web, logo_url, code_etablissement, created_at").order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des écoles" }, { status: 500 })
  }

  const withStats = await Promise.all(
    (ecoles ?? []).map(async (ecole) => {
      const { count: eleves } = await svc.from("eleves").select("*", { count: "exact", head: true }).eq("ecole_id", ecole.id)
      const { count: personnel } = await svc.from("personnel").select("*", { count: "exact", head: true }).eq("ecole_id", ecole.id)
      return { ...ecole, eleves_count: eleves ?? 0, personnel_count: personnel ?? 0 }
    })
  )

  return NextResponse.json({ schools: withStats })
}
