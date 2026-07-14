import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { sendSMS, sendBulkSMS, notifyParents, notifyParentOfEleve, smsTemplates, normalizePhoneCI } from "@/lib/sms"

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

  const { data: profil } = await supabase
    .from("profils")
    .select("role, ecole_id")
    .eq("user_id", user.id)
    .single()

  if (!profil || (profil.role !== "directeur" && profil.role !== "comptable")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  const body = await request.json()
  const { action } = body

  switch (action) {
    case "send_single": {
      const { to, message } = body
      if (!to || !message) {
        return NextResponse.json({ error: "Numéro et message requis" }, { status: 400 })
      }
      const result = await sendSMS({ to, body: message })
      return NextResponse.json(result)
    }

    case "send_bulk": {
      const { messages } = body
      if (!Array.isArray(messages)) {
        return NextResponse.json({ error: "Messages doit être un tableau" }, { status: 400 })
      }
      const results = await sendBulkSMS(messages)
      return NextResponse.json({ results })
    }

    case "notify_class": {
      const { classeId, message } = body
      if (!classeId || !message) {
        return NextResponse.json({ error: "Classe et message requis" }, { status: 400 })
      }
      const results = await notifyParents(profil.ecole_id, message, { classeId })
      return NextResponse.json({ results, count: results.length })
    }

    case "notify_eleve": {
      const { eleveId, template, data: tplData } = body
      if (!eleveId) {
        return NextResponse.json({ error: "ID élève requis" }, { status: 400 })
      }

      let message = body.message
      if (template) {
        const d = tplData || {}
        switch (template) {
          case "inscription":
            message = smsTemplates.inscription(d.eleve ?? "", d.classe ?? "")
            break
          case "paiement":
            message = smsTemplates.paiement(d.eleve ?? "", d.montant ?? 0)
            break
          case "bulletin":
            message = smsTemplates.bulletin(d.eleve ?? "", d.trimestre ?? 0, d.moyenne ?? 0)
            break
          case "absence":
            message = smsTemplates.absence(d.eleve ?? "", d.date ?? "")
            break
          case "retard":
            message = smsTemplates.retard(d.eleve ?? "")
            break
          case "relancePaiement":
            message = smsTemplates.relancePaiement(d.eleve ?? "", d.montant ?? 0)
            break
        }
      }

      if (!message) {
        return NextResponse.json({ error: "Message ou template requis" }, { status: 400 })
      }

      const result = await notifyParentOfEleve(eleveId, message)
      return NextResponse.json(result)
    }

    case "send_to_parents": {
      const { message } = body
      if (!message) {
        return NextResponse.json({ error: "Message requis" }, { status: 400 })
      }
      const results = await notifyParents(profil.ecole_id, message)
      return NextResponse.json({ results, count: results.length })
    }

    default:
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    provider: process.env.SMS_PROVIDER || "mock",
    configured: !!process.env.SMS_API_KEY,
    sender: process.env.SMS_SENDER || "EduGest",
  })
}
