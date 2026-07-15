import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

async function getAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/emplois-du-temps?classe_id=xxx
export async function GET(request: Request) {
  const supabase = await getAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profil } = await supabase
    .from("profils")
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil?.ecole_id) return NextResponse.json({ error: "Profil école introuvable" }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const classeId = searchParams.get("classe_id")
  if (!classeId) return NextResponse.json({ error: "classe_id requis" }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from("emplois_du_temps")
    .select("id, jour_semaine, heure_debut, heure_fin, salle, matiere:matieres(libelle), enseignant:personnel(nom, prenom)")
    .eq("classe_id", classeId)
    .order("jour_semaine")
    .order("heure_debut")

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// POST /api/emplois-du-temps
export async function POST(request: Request) {
  const supabase = await getAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profil } = await supabase
    .from("profils")
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil?.ecole_id) return NextResponse.json({ error: "Profil école introuvable" }, { status: 400 })

  const body = await request.json()
  const { classe_id, matiere_id, enseignant_id, jour_semaine, heure_debut, heure_fin, salle } = body

  if (!classe_id || !matiere_id || !jour_semaine || !heure_debut || !heure_fin) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  // Vérifier que la classe appartient à l'école
  const admin = getAdminClient()
  const { data: classe } = await admin
    .from("classes")
    .select("id")
    .eq("id", classe_id)
    .eq("ecole_id", profil.ecole_id)
    .maybeSingle()
  if (!classe) return NextResponse.json({ error: "Classe introuvable dans votre école" }, { status: 403 })

  const { data, error } = await admin
    .from("emplois_du_temps")
    .insert({
      classe_id,
      matiere_id,
      enseignant_id: enseignant_id || null,
      jour_semaine: parseInt(jour_semaine),
      heure_debut,
      heure_fin,
      salle: salle || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// DELETE /api/emplois-du-temps?id=xxx
export async function DELETE(request: Request) {
  const supabase = await getAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profil } = await supabase
    .from("profils")
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil?.ecole_id) return NextResponse.json({ error: "Profil école introuvable" }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const admin = getAdminClient()
  const { error } = await admin
    .from("emplois_du_temps")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
