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
  const { nom, prenom, date_naissance, lieu_naissance, sexe, nationalite, adresse, telephone, email, classe_id } = body

  if (!nom || !prenom) {
    return NextResponse.json({ error: "Nom et prénom sont requis" }, { status: 400 })
  }

  const { data: profil } = await supabase
    .from("profils")
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()

  if (!profil?.ecole_id) {
    return NextResponse.json({ error: "Profil école introuvable" }, { status: 400 })
  }

  const matricule = `EL-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`

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
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ eleve })
}
