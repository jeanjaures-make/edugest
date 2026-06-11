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

  const [
    { count: schools },
    { count: students },
    { count: teachers },
    { count: users },
    { data: schoolsData },
  ] = await Promise.all([
    svc.from("ecoles").select("*", { count: "exact", head: true }),
    svc.from("eleves").select("*", { count: "exact", head: true }),
    svc.from("personnel").select("*", { count: "exact", head: true }).eq("type", "enseignant"),
    svc.from("profils").select("*", { count: "exact", head: true }),
    svc.from("ecoles").select("id, nom, email, telephone, created_at").order("created_at", { ascending: false }).limit(5),
  ])

  return NextResponse.json({
    stats: {
      totalSchools: schools ?? 0,
      totalStudents: students ?? 0,
      totalTeachers: teachers ?? 0,
      totalUsers: users ?? 0,
    },
    recentSchools: schoolsData ?? [],
  })
}
