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

  const body = await request.json()
  const { matricule, nom, prenom, date_naissance, lieu_naissance, sexe, nationalite, adresse, telephone, email, classe_id } = body

  if (!nom || !prenom) {
    return NextResponse.json({ error: "Nom et prénom sont requis" }, { status: 400 })
  }

  if (!matricule) {
    return NextResponse.json({ error: "Le matricule est requis" }, { status: 400 })
  }

  const { data: profil } = await supabase
    .from("profils")
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()

  if (!profil?.ecole_id) {
    return NextResponse.json({ error: "Profil école introuvable" }, { status: 400 })
  }

  // matricule is provided manually (national ID)

  const { data: eleve, error } = await supabase
    .from("eleves")
    .insert({
      ecole_id: profil.ecole_id,
      matricule,
      nom,
      prenom,
      date_naissance: date_naissance || null,
      lieu_naissance: lieu_naissance || null,
      sexe: sexe || null,
      nationalite: nationalite || "Ivoirienne",
      adresse: adresse || null,
      telephone: telephone || null,
      email: email || null,
      classe_id: classe_id || null,
      statut: "actif",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la création de l'élève" }, { status: 400 })
  }

  // Créer l'inscription correspondante si une classe est assignée
  if (classe_id) {
    const { data: annee } = await supabase
      .from("annees_scolaires")
      .select("id")
      .eq("ecole_id", profil.ecole_id)
      .eq("active", true)
      .maybeSingle()

    if (annee?.id) {
      const { data: classe } = await supabase
        .from("classes")
        .select("frais_inscription, frais_scolarite")
        .eq("id", classe_id)
        .maybeSingle()

      await supabase.from("inscriptions").insert({
        eleve_id: eleve.id,
        classe_id,
        annee_scolaire_id: annee.id,
        frais_inscription: classe?.frais_inscription ?? 0,
        frais_scolarite: classe?.frais_scolarite ?? 0,
        statut: "confirmee",
      })
    }
  }

  return NextResponse.json({ eleve })
}
