import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
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

  const { eleve_id, classe_id, frais_inscription } = await request.json()

  if (!eleve_id || !classe_id) {
    return NextResponse.json({ error: "Élève et classe requis" }, { status: 400 })
  }

  const { data: profil } = await supabase
    .from("profils")
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()

  if (!profil?.ecole_id) {
    return NextResponse.json({ error: "Profil école introuvable" }, { status: 400 })
  }

  const { data: annee } = await supabase
    .from("annees_scolaires")
    .select("id")
    .eq("ecole_id", profil.ecole_id)
    .eq("active", true)
    .single()

  const { data: inscription, error } = await supabase
    .from("inscriptions")
    .insert({
      eleve_id,
      classe_id,
      annee_scolaire_id: annee?.id || null,
      frais_inscription: frais_inscription || 0,
      statut: "en_attente",
    })
    .select("id, eleve_id, classe_id, date_inscription, frais_inscription, statut")
    .single()

  if (error) {
    return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 400 })
  }

  if (frais_inscription > 0) {
    if (!annee?.id) {
      return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
    }

    let { data: frais } = await supabase
      .from("frais_scolarite")
      .select("id")
      .eq("ecole_id", profil.ecole_id)
      .eq("type", "inscription")
      .limit(1)
      .maybeSingle()

    if (!frais) {
      const { data: newFrais } = await supabase
        .from("frais_scolarite")
        .insert({ ecole_id: profil.ecole_id, libelle: "Inscription", montant: frais_inscription, type: "inscription", periodicite: "annuel" })
        .select()
        .maybeSingle()
      frais = newFrais
    }

    if (!frais) {
      return NextResponse.json({ error: "Erreur de configuration des frais" }, { status: 500 })
    }

    const { error: echError } = await supabase.from("echeanciers").insert({
      eleve_id,
      classe_id,
      annee_scolaire_id: annee.id,
      frais_id: frais.id,
      montant_total: frais_inscription,
      montant_restant: frais_inscription,
      statut: "en_attente",
    })

    if (echError) {
      console.error("Echeancier insert error:", echError)
      return NextResponse.json({ error: "Erreur de création d'échéancier" }, { status: 500 })
    }
  }

  return NextResponse.json({ inscription })
}
