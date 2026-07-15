import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

async function getAuthAndProfile() {
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
  if (!user) return null
  const { data: profil } = await supabase
    .from("profils")
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil?.ecole_id) return null
  return profil.ecole_id
}

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET /api/frais-scolarite
export async function GET() {
  const ecoleId = await getAuthAndProfile()
  if (!ecoleId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const admin = getAdmin()
  const { data, error } = await admin
    .from("frais_scolarite")
    .select("*")
    .eq("ecole_id", ecoleId)
    .order("libelle", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// POST /api/frais-scolarite
export async function POST(request: Request) {
  const ecoleId = await getAuthAndProfile()
  if (!ecoleId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json()
  const { libelle, montant, type, periodicite } = body

  if (!libelle || !montant || !type || !periodicite) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  const admin = getAdmin()
  const { data, error } = await admin
    .from("frais_scolarite")
    .insert({ ecole_id: ecoleId, libelle, montant: parseInt(montant), type, periodicite })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// PUT /api/frais-scolarite?id=xxx
export async function PUT(request: Request) {
  const ecoleId = await getAuthAndProfile()
  if (!ecoleId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const body = await request.json()
  const { libelle, montant, type, periodicite } = body

  const admin = getAdmin()
  const { data, error } = await admin
    .from("frais_scolarite")
    .update({ libelle, montant: parseInt(montant), type, periodicite })
    .eq("id", id)
    .eq("ecole_id", ecoleId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// DELETE /api/frais-scolarite?id=xxx
export async function DELETE(request: Request) {
  const ecoleId = await getAuthAndProfile()
  if (!ecoleId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const admin = getAdmin()
  const { error } = await admin
    .from("frais_scolarite")
    .delete()
    .eq("id", id)
    .eq("ecole_id", ecoleId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
