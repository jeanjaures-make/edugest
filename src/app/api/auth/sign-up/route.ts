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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const body = await request.json()
  const { email, password, parent, enfant } = body

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error || !data.user) {
    return Response.json(
      { error: "SIGNUP_FAILED", message: "Échec de l'inscription" },
      { status: 400 }
    )
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: ecole } = await svc
    .from("ecoles")
    .select("id")
    .limit(1)
    .single()

  if (!ecole) {
    return Response.json(
      { error: "NO_SCHOOL", message: "Aucune école configurée" },
      { status: 400 }
    )
  }

  const { data: profil, error: profilError } = await svc
    .from("profils")
    .insert({
      user_id: data.user.id,
      ecole_id: ecole.id,
      nom: parent?.nom || "",
      prenom: parent?.prenom || "",
      telephone: parent?.telephone || "",
      role: "parent",
    })
    .select()
    .single()

  if (profilError) {
    return Response.json(
      { error: "PROFIL_FAILED", message: "Erreur lors de la création du profil" },
      { status: 400 }
    )
  }

  let eleve = null
  if (enfant?.nom && enfant?.prenom) {
    const matricule = `EL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
    const { data: newEleve, error: eleveError } = await svc
      .from("eleves")
      .insert({
        ecole_id: ecole.id,
        parent_id: profil.id,
        matricule,
        nom: enfant.nom,
        prenom: enfant.prenom,
        date_naissance: enfant.date_naissance || null,
        lieu_naissance: enfant.lieu_naissance || null,
        sexe: enfant.sexe || null,
        nationalite: enfant.nationalite || "Ivoirienne",
        statut: "actif",
      })
      .select()
      .single()

    if (!eleveError) eleve = newEleve
  }

  return NextResponse.json({ user: data.user, profil, eleve })
}
