import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { eleve_id, montant, methode, telephone } = body

    if (!eleve_id || !montant || !methode || !telephone) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    if (!["orange_money", "mtn_momo"].includes(methode)) {
      return NextResponse.json({ error: "Méthode de paiement invalide" }, { status: 400 })
    }

    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Find or create an echeancier for this student
    let echeancierId = body.echeancier_id || null
    if (!echeancierId) {
      const { data: existing } = await supabase
        .from("echeanciers")
        .select("id")
        .eq("eleve_id", eleve_id)
        .in("statut", ["en_attente", "partiel"])
        .limit(1)
        .maybeSingle()

      if (existing) {
        echeancierId = existing.id
      } else {
        const { data: eleve } = await supabase
          .from("eleves")
          .select("classe_id, ecole_id, annee_scolaire_id")
          .eq("id", eleve_id)
          .single()

        if (!eleve) {
          return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
        }

        let { data: frais } = await supabase
          .from("frais_scolarite")
          .select("id")
          .eq("ecole_id", eleve.ecole_id)
          .eq("type", "scolarite")
          .limit(1)
          .maybeSingle()

        if (!frais) {
          const { data: newFrais } = await supabase
            .from("frais_scolarite")
            .insert({ ecole_id: eleve.ecole_id, libelle: "Scolarité", montant, type: "scolarite", periodicite: "annuel" })
            .select()
            .maybeSingle()
          frais = newFrais
        }

        const { data: newEch, error: echError } = await supabase
          .from("echeanciers")
          .insert({
            eleve_id,
            classe_id: eleve.classe_id,
            annee_scolaire_id: eleve.annee_scolaire_id,
            frais_id: frais!.id,
            montant_total: montant,
            montant_restant: montant,
            statut: "en_attente",
          })
          .select()
          .single()

        if (echError) {
          console.error("Echeancier Error:", echError)
          return NextResponse.json({ error: "Erreur de création d'échéancier" }, { status: 500 })
        }
        echeancierId = newEch.id
      }
    }

    const { data: paiement, error: insertError } = await supabase
      .from("paiements")
      .insert({
        eleve_id,
        echeancier_id: echeancierId,
        montant,
        methode,
        telephone,
        reference,
        statut: "confirme",
        date_paiement: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert Error:", insertError)
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Paiement effectué avec succès",
      data: paiement,
      recu_url: `/api/recus/${reference}`,
    })
  } catch (error: any) {
    console.error("Mobile Money Error:", error)
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 500 })
  }
}
