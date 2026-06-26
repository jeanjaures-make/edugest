import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
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
    const { eleve_id, montant, methode, echeancier_id, reference: refCustom } = body

    if (!eleve_id || !montant || !methode) {
      return NextResponse.json({ error: "Élève, montant et méthode requis" }, { status: 400 })
    }

    const methodesValides = ["orange_money", "mtn_momo", "especes", "virement", "cheque"]
    if (!methodesValides.includes(methode)) {
      return NextResponse.json({ error: "Méthode de paiement invalide" }, { status: 400 })
    }

    const reference = refCustom || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    let targetEcheancierId = echeancier_id || null

    if (!targetEcheancierId) {
      const { data: existing } = await supabase
        .from("echeanciers")
        .select("id")
        .eq("eleve_id", eleve_id)
        .in("statut", ["en_attente", "partiel"])
        .limit(1)
        .maybeSingle()

      if (existing) {
        targetEcheancierId = existing.id
      } else {
        const { data: eleve } = await supabase
          .from("eleves")
          .select("classe_id, ecole_id, annee_scolaire_id")
          .eq("id", eleve_id)
          .single()

        if (!eleve) {
          return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
        }

        let classeId = eleve.classe_id
        let anneeScolaireId = eleve.annee_scolaire_id

        if (!classeId || !anneeScolaireId) {
          const { data: inscription } = await supabase
            .from("inscriptions")
            .select("classe_id, annee_scolaire_id")
            .eq("eleve_id", eleve_id)
            .order("date_inscription", { ascending: false })
            .limit(1)
            .maybeSingle()

          if (inscription) {
            classeId = classeId || inscription.classe_id
            anneeScolaireId = anneeScolaireId || inscription.annee_scolaire_id
          }
        }

        if (!anneeScolaireId) {
          const { data: annee } = await supabase
            .from("annees_scolaires")
            .select("id")
            .eq("ecole_id", eleve.ecole_id)
            .eq("active", true)
            .maybeSingle()
          if (annee) anneeScolaireId = annee.id
        }

        if (!classeId) {
          return NextResponse.json({ error: "Élève sans classe — inscrivez-le d'abord" }, { status: 400 })
        }
        if (!anneeScolaireId) {
          return NextResponse.json({ error: "Aucune année scolaire active" }, { status: 400 })
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

        if (!frais) {
          return NextResponse.json({ error: "Erreur de configuration des frais de scolarité" }, { status: 500 })
        }

        const { data: newEch, error: echError } = await supabase
          .from("echeanciers")
          .insert({
            eleve_id,
            classe_id: classeId,
            annee_scolaire_id: anneeScolaireId,
            frais_id: frais.id,
            montant_total: montant,
            montant_restant: montant,
            statut: "en_attente",
          })
          .select()
          .single()

        if (echError) {
          console.error("Echeancier insert error:", echError)
          return NextResponse.json({ error: "Erreur de création d'échéancier" }, { status: 500 })
        }
        targetEcheancierId = newEch.id
      }
    }

    const { data: paiement, error: insertError } = await supabase
      .from("paiements")
      .insert({
        eleve_id,
        echeancier_id: targetEcheancierId,
        montant,
        methode,
        reference,
        statut: "confirme",
        date_paiement: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Paiement insert error:", insertError)
      return NextResponse.json({ error: `Erreur lors de l'enregistrement: ${insertError.message}` }, { status: 500 })
    }

    const { data: echeancier } = await supabase
      .from("echeanciers")
      .select("montant_restant, montant_total")
      .eq("id", targetEcheancierId)
      .single()

    const nouveauRestant = Math.max(0, (echeancier?.montant_restant ?? 0) - montant)
    const nouveauStatut = nouveauRestant <= 0 ? "payer" : "partiel"

    await supabase
      .from("echeanciers")
      .update({ montant_restant: nouveauRestant, statut: nouveauStatut })
      .eq("id", targetEcheancierId)

    return NextResponse.json({
      success: true,
      message: "Paiement enregistré avec succès",
      data: paiement,
      echeancier: { montant_restant: nouveauRestant, statut: nouveauStatut },
    })
  } catch (error: unknown) {
    console.error("Paiement create error:", error)
    return NextResponse.json({ error: "Erreur de paiement" }, { status: 500 })
  }
}
