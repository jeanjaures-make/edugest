import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
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
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profil } = await supabase
    .from("profils")
    .select("role, ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil) return NextResponse.json({ error: "Profil introuvable" }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const classeId = searchParams.get("classe_id")
  const matiereId = searchParams.get("matiere_id")
  const date = searchParams.get("date")

  let query = supabase
    .from("cahier_textes")
    .select(`
      id, date_cours, chapitre, contenu, activites, devoirs, duree, statut, created_at,
      classe:classes(id, libelle),
      matiere:matieres(id, libelle),
      personnel:personnel(id, nom, prenom)
    `)
    .eq("ecole_id", profil.ecole_id)
    .order("date_cours", { ascending: false })

  if (classeId) query = query.eq("classe_id", classeId)
  if (matiereId) query = query.eq("matiere_id", matiereId)
  if (date) query = query.eq("date_cours", date)

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ entries: data })
}

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
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profil } = await supabase
    .from("profils")
    .select("role, ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil) return NextResponse.json({ error: "Profil introuvable" }, { status: 400 })

  if (profil.role !== "directeur" && profil.role !== "enseignant") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await request.json()
  const { classe_id, matiere_id, date_cours, chapitre, contenu, activites, devoirs, duree, statut } = body

  if (!classe_id || !matiere_id || !date_cours || !chapitre) {
    return NextResponse.json({ error: "Classe, matière, date et chapitre requis" }, { status: 400 })
  }

  // Get personnel_id for enseignant
  let personnelId = body.personnel_id
  if (!personnelId && profil.role === "enseignant") {
    const { data: personnel } = await supabase
      .from("personnel")
      .select("id")
      .eq("user_id", user.id)
      .single()
    personnelId = personnel?.id
  }

  const { data, error } = await supabase
    .from("cahier_textes")
    .insert({
      ecole_id: profil.ecole_id,
      classe_id,
      matiere_id,
      personnel_id: personnelId || null,
      date_cours,
      chapitre,
      contenu: contenu || null,
      activites: activites || null,
      devoirs: devoirs || null,
      duree: duree || 2,
      statut: statut || "planifie",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ entry: data })
}

export async function PUT(request: Request) {
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
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profil } = await supabase
    .from("profils")
    .select("role, ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil) return NextResponse.json({ error: "Profil introuvable" }, { status: 400 })

  const body = await request.json()
  const { id, chapitre, contenu, activites, devoirs, duree, statut } = body

  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

  const { data, error } = await supabase
    .from("cahier_textes")
    .update({
      chapitre, contenu, activites, devoirs, duree, statut,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("ecole_id", profil.ecole_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(request: Request) {
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
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profil } = await supabase
    .from("profils")
    .select("role, ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil) return NextResponse.json({ error: "Profil introuvable" }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

  const { error } = await supabase
    .from("cahier_textes")
    .delete()
    .eq("id", id)
    .eq("ecole_id", profil.ecole_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
