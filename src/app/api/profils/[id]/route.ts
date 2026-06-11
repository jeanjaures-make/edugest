import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

async function verifyAuth() {
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
  if (!user) return null

  const { data: profil } = await supabase
    .from("profils")
    .select("id, ecole_id, role")
    .eq("user_id", user.id)
    .single()

  return profil
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await verifyAuth()
  if (!currentUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: target } = await svc
    .from("profils")
    .select("ecole_id")
    .eq("id", id)
    .single()

  if (!target) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 })
  }

  if (target.ecole_id !== currentUser.ecole_id) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  const { error } = await svc.from("profils").update(body).eq("id", id)
  if (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await verifyAuth()
  if (!currentUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { id } = await params

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: target } = await svc
    .from("profils")
    .select("ecole_id")
    .eq("id", id)
    .single()

  if (!target) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 })
  }

  if (target.ecole_id !== currentUser.ecole_id) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
  }

  const { error } = await svc.from("profils").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
