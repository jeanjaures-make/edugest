import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { initiatePayment, checkPaymentStatus, type PaymentProvider } from "@/lib/mobile-payment"

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

  const body = await request.json()
  const { action } = body

  if (action === "initiate") {
    const { provider, amount, phoneNumber, description, eleveId, echeancierId } = body

    if (!provider || !amount || !phoneNumber) {
      return NextResponse.json({ error: "Provider, montant et téléphone requis" }, { status: 400 })
    }

    const reference = `EDG-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Enregistrer le paiement en attente
    const { data: paiement } = await supabase
      .from("paiements")
      .insert({
        eleve_id: eleveId || null,
        echeancier_id: echeancierId || null,
        montant: amount,
        methode: provider,
        reference,
        statut: "en_attente",
        telephone: phoneNumber,
      })
      .select()
      .single()

    // Initier le paiement
    const result = await initiatePayment({
      provider: provider as PaymentProvider,
      amount,
      phoneNumber,
      description: description || `Paiement scolarité - ${reference}`,
      reference,
      eleveId,
      echeancierId,
    })

    // Mettre à jour avec l'ID de transaction
    if (paiement && result.transactionId) {
      await supabase
        .from("paiements")
        .update({ reference: result.transactionId })
        .eq("id", paiement.id)
    }

    return NextResponse.json({ ...result, paiementId: paiement?.id, reference })
  }

  if (action === "check_status") {
    const { provider, transactionId } = body
    if (!provider || !transactionId) {
      return NextResponse.json({ error: "Provider et transactionId requis" }, { status: 400 })
    }

    const result = await checkPaymentStatus(provider as PaymentProvider, transactionId)

    // Si succès, mettre à jour le paiement en base
    if (result.status === "success") {
      await supabase
        .from("paiements")
        .update({ statut: "confirme", date_paiement: new Date().toISOString() })
        .eq("reference", transactionId)
    }

    return NextResponse.json(result)
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
}
