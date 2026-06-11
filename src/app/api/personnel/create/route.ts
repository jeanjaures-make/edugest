import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const body = await request.json()
  const { nom, prenom, email, telephone, type } = body

  if (!nom || !prenom || !email || !type) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  const { data: profil } = await supabase
    .from("profils")
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()

  if (!profil?.ecole_id) {
    return NextResponse.json({ error: "Profil école introuvable" }, { status: 400 })
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const tempPassword = `Temp${Math.random().toString(36).slice(2, 8)}1!`

  const { data: authUser, error: authError } = await svc.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) {
    return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 400 })
  }

  const { data: newProfil, error: profilError } = await svc
    .from("profils")
    .insert({
      user_id: authUser.user.id,
      ecole_id: profil.ecole_id,
      nom,
      prenom,
      telephone: telephone || "",
      role: type === "enseignant" ? "enseignant" : "comptable",
    })
    .select()
    .single()

  if (profilError) {
    return NextResponse.json({ error: "Erreur lors de la création du profil" }, { status: 400 })
  }

  const matricule = `PER-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`

  const { data: personnel, error: personnelError } = await supabase
    .from("personnel")
    .insert({
      ecole_id: profil.ecole_id,
      profil_id: newProfil.id,
      matricule,
      nom,
      prenom,
      telephone: telephone || null,
      email,
      type,
      statut: "actif",
    })
    .select()
    .single()

  if (personnelError) {
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du personnel" }, { status: 400 })
  }

  return NextResponse.json({ personnel })
}
