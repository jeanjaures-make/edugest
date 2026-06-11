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
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { classe_id, trimestre } = await request.json()
  if (!classe_id || !trimestre) return NextResponse.json({ error: "classe_id et trimestre requis" }, { status: 400 })

  const { data: profil } = await supabase
    .from("profils").select("ecole_id").eq("user_id", user.id).single()
  if (!profil?.ecole_id) return NextResponse.json({ error: "Profil introuvable" }, { status: 400 })

  const { data: annee } = await supabase
    .from("annees_scolaires").select("id").eq("ecole_id", profil.ecole_id).eq("active", true).single()
  if (!annee) return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })

  const { data: evaluData } = await supabase
    .from("evaluations")
    .select("id, matiere_id, coefficient, matiere:matieres(coefficient)")
    .eq("classe_id", classe_id)
    .eq("trimestre", trimestre)
    .eq("annee_scolaire_id", annee.id)
  if (!evaluData || evaluData.length === 0) return NextResponse.json({ error: "Aucune évaluation pour cette classe/trimestre" }, { status: 400 })

  const evalIds = evaluData.map((e) => e.id)

  const { data: noteData } = await supabase
    .from("notes")
    .select("eleve_id, valeur, evaluation_id")
    .in("evaluation_id", evalIds)
  if (!noteData || noteData.length === 0) return NextResponse.json({ error: "Aucune note saisie" }, { status: 400 })

  const evalCoeffMap: Record<string, number> = {}
  for (const e of evaluData) {
    const matCoeff = (e.matiere as unknown as { coefficient: number })?.coefficient ?? 1
    evalCoeffMap[e.id] = (e.coefficient ?? 1) * matCoeff
  }

  const studentNotes: Record<string, { total: number; coeff: number }> = {}
  for (const n of noteData) {
    if (!studentNotes[n.eleve_id]) studentNotes[n.eleve_id] = { total: 0, coeff: 0 }
    const coeff = evalCoeffMap[n.evaluation_id] ?? 1
    studentNotes[n.eleve_id].total += n.valeur * coeff
    studentNotes[n.eleve_id].coeff += coeff
  }

  const averages: { eleve_id: string; moyenne: number }[] = []
  for (const [eleve_id, data] of Object.entries(studentNotes)) {
    averages.push({ eleve_id, moyenne: data.coeff > 0 ? data.total / data.coeff : 0 })
  }

  averages.sort((a, b) => b.moyenne - a.moyenne)
  const rankings: Record<string, number> = {}
  averages.forEach((a, i) => { rankings[a.eleve_id] = i + 1 })

  const { data: classInfo } = await supabase
    .from("classes").select("id").eq("id", classe_id).single()
  if (!classInfo) return NextResponse.json({ error: "Classe introuvable" }, { status: 400 })

  await supabase.from("bulletins").delete().eq("classe_id", classe_id).eq("trimestre", trimestre).eq("annee_scolaire_id", annee.id)

  const bulletins = averages.map((a) => ({
    eleve_id: a.eleve_id,
    classe_id,
    trimestre,
    annee_scolaire_id: annee.id,
    moyenne_generale: Math.round(a.moyenne * 10) / 10,
    rang: rankings[a.eleve_id],
    appreciation: getAppreciation(a.moyenne),
  }))

  const { error } = await supabase.from("bulletins").insert(bulletins)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ count: bulletins.length })
}

function getAppreciation(moyenne: number): string {
  if (moyenne >= 16) return "Excellent trimestre"
  if (moyenne >= 14) return "Très bon trimestre"
  if (moyenne >= 12) return "Bon trimestre"
  if (moyenne >= 10) return "Trimestre satisfaisant"
  if (moyenne >= 8) return "Peut mieux faire"
  return "Trimestre insuffisant"
}
