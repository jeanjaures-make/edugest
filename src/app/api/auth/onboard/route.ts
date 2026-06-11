import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  const body = await request.json()
  const { school, admin } = body

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: ecole, error: ecoleError } = await svc
    .from("ecoles")
    .insert({
      nom: school.nom,
      adresse: school.adresse || "",
      telephone: school.telephone || "",
      email: school.email || "",
      logo_url: school.logo_url || null,
      code_etablissement: school.code_etablissement || `ETAB-${Date.now().toString().slice(-6)}`,
    })
    .select()
    .single()

  if (ecoleError) {
    return NextResponse.json(
      { error: "SCHOOL_FAILED", message: "Erreur lors de la création de l'établissement" },
      { status: 400 }
    )
  }

  const { data: authUser, error: authError } = await svc.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    await svc.from("ecoles").delete().eq("id", ecole.id)
    return NextResponse.json(
      { error: "AUTH_FAILED", message: "Échec de la création du compte administrateur" },
      { status: 400 }
    )
  }

  const { error: profilError } = await svc
    .from("profils")
    .insert({
      user_id: authUser.user.id,
      ecole_id: ecole.id,
      nom: admin.nom,
      prenom: admin.prenom,
      telephone: admin.telephone || "",
      role: "directeur",
    })

  if (profilError) {
    await svc.auth.admin.deleteUser(authUser.user.id)
    await svc.from("ecoles").delete().eq("id", ecole.id)
    return NextResponse.json(
      { error: "PROFIL_FAILED", message: "Erreur lors de la création du profil" },
      { status: 400 }
    )
  }

  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  await svc.from("annees_scolaires").insert({
    ecole_id: ecole.id,
    libelle: `${currentYear}-${nextYear}`,
    date_debut: `${currentYear}-09-01`,
    date_fin: `${nextYear}-08-31`,
    active: true,
  })

  return NextResponse.json({
    success: true,
    ecole: { id: ecole.id, nom: ecole.nom },
    email: admin.email,
  })
}
