import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function GET() {
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
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()
  if (!profil?.ecole_id) return NextResponse.json({ error: "Profil école introuvable" }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Get active school year
  const { data: annee } = await admin
    .from("annees_scolaires")
    .select("id")
    .eq("ecole_id", profil.ecole_id)
    .eq("active", true)
    .maybeSingle()

  // 2. Get all inscriptions for this school (with eleve + classe + parent)
  let inscriptionsQuery = admin
    .from("inscriptions")
    .select(`
      id, eleve_id, classe_id, frais_scolarite, frais_inscription, statut, date_inscription,
      eleve:eleves(id, nom, prenom, matricule, parent:profils!parent_id(telephone, nom, prenom)),
      classe:classes(id, libelle)
    `)
    .eq("eleve.ecole_id", profil.ecole_id)
    .order("date_inscription", { ascending: false })

  if (annee?.id) {
    inscriptionsQuery = inscriptionsQuery.eq("annee_scolaire_id", annee.id)
  }

  const { data: inscriptions, error: insErr } = await inscriptionsQuery
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })

  // 3. Get all confirmed paiements for these students
  const eleveIds = (inscriptions || []).map((i: any) => i.eleve_id).filter(Boolean)
  let paiementsMap: Record<string, number> = {}
  if (eleveIds.length > 0) {
    const { data: paiements } = await admin
      .from("paiements")
      .select("eleve_id, montant, statut")
      .in("eleve_id", eleveIds)
      .eq("statut", "confirme")
    for (const p of paiements || []) {
      paiementsMap[p.eleve_id] = (paiementsMap[p.eleve_id] || 0) + p.montant
    }
  }

  // 4. Get echeanciers for additional info
  let echeanciersMap: Record<string, { montant_total: number; montant_restant: number; statut: string }> = {}
  if (eleveIds.length > 0) {
    const { data: echeanciers } = await admin
      .from("echeanciers")
      .select("eleve_id, montant_total, montant_restant, statut")
      .in("eleve_id", eleveIds)
    for (const e of echeanciers || []) {
      echeanciersMap[e.eleve_id] = {
        montant_total: e.montant_total,
        montant_restant: e.montant_restant,
        statut: e.statut,
      }
    }
  }

  // 5. Compute remaining balance per student
  const impayes = (inscriptions || [])
    .filter((ins: any) => ins.frais_scolarite > 0 || ins.frais_inscription > 0)
    .map((ins: any) => {
      const totalDu = (ins.frais_scolarite || 0) + (ins.frais_inscription || 0)
      const totalPaye = paiementsMap[ins.eleve_id] || 0
      const restant = totalDu - totalPaye
      return {
        id: ins.id,
        eleve_id: ins.eleve_id,
        montant_total: totalDu,
        montant_paye: totalPaye,
        montant_restant: restant,
        statut: restant <= 0 ? "payer" : (totalPaye > 0 ? "partiel" : "en_attente"),
        date_inscription: ins.date_inscription,
        eleve: ins.eleve,
        classe: ins.classe,
        has_echeancier: !!echeanciersMap[ins.eleve_id],
      }
    })
    .filter((i: any) => i.montant_restant > 0)

  return NextResponse.json({ data: impayes })
}
