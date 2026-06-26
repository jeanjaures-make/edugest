import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { checkRateLimit } from "@/lib/rate-limiter"
import { headers } from "next/headers"

export async function POST(request: Request) {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
  const { allowed, retryAfter } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: "TROP_DE_REQUETES", message: "Trop de tentatives. Réessayez dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

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
  const { email, password, parent, enfant, school_id } = body

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "VALIDATION", message: "Email valide et mot de passe (min 6 caractères) requis" },
      { status: 400 }
    )
  }

  if (!school_id) {
    return NextResponse.json(
      { error: "ECOLE_REQUISE", message: "Veuillez sélectionner un établissement" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error || !data.user) {
    const message =
      error?.code === "email_already_exists"
        ? "Cet email est déjà utilisé"
        : "Échec de l'inscription"
    return NextResponse.json({ error: "SIGNUP_FAILED", message }, { status: 400 })
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: ecole, error: ecoleError } = await svc
    .from("ecoles")
    .select("id")
    .eq("id", school_id)
    .single()

  if (ecoleError || !ecole) {
    await svc.auth.admin.deleteUser(data.user.id)
    return NextResponse.json(
      { error: "ECOLE_INVALIDE", message: "Établissement introuvable" },
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
    await svc.auth.admin.deleteUser(data.user.id)
    return NextResponse.json(
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
