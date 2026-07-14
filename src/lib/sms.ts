import { createClient } from "@supabase/supabase-js"

/**
 * Service d'envoi de SMS pour EduGest CI
 * 
 * Supporte plusieurs providers :
 * - Orange SMS CI (https://api.orange.com/sms)
 * - MTN CI SMS
 * - Twilio (fallback international)
 * 
 * Configuration via variables d'environnement :
 * - SMS_PROVIDER : "orange" | "twilio" | "mock"
 * - SMS_API_KEY : clé API du provider
 * - SMS_SENDER : nom de l'expéditeur
 */

type SMSProvider = "orange" | "twilio" | "mock"

interface SMSMessage {
  to: string
  body: string
  type?: "alert" | "info" | "payment" | "bulletin"
}

interface SMSResult {
  success: boolean
  provider: SMSProvider
  messageId?: string
  error?: string
}

const provider: SMSProvider = (process.env.SMS_PROVIDER as SMSProvider) || "mock"
const apiKey = process.env.SMS_API_KEY || ""
const sender = process.env.SMS_SENDER || "EduGest"
const apiUrl = process.env.SMS_API_URL || ""

/**
 * Normalise un numéro de téléphone au format international CI
 * Ex: 0701234567 -> +2250701234567
 */
export function normalizePhoneCI(phone: string): string {
  let p = phone.replace(/[\s\-\.]/g, "")
  if (p.startsWith("+225")) return p
  if (p.startsWith("225")) return "+" + p
  if (p.startsWith("0")) return "+225" + p
  if (p.startsWith("7") || p.startsWith("5") || p.startsWith("01")) return "+225" + p
  return p
}

/**
 * Envoie un SMS via le provider configuré
 */
export async function sendSMS(message: SMSMessage): Promise<SMSResult> {
  const to = normalizePhoneCI(message.to)

  switch (provider) {
    case "orange":
      return sendViaOrange(to, message.body)
    case "twilio":
      return sendViaTwilio(to, message.body)
    case "mock":
    default:
      console.log(`[SMS MOCK] To: ${to} | Body: ${message.body}`)
      return { success: true, provider: "mock", messageId: `mock_${Date.now()}` }
  }
}

/**
 * Envoie plusieurs SMS en lot
 */
export async function sendBulkSMS(messages: SMSMessage[]): Promise<SMSResult[]> {
  const results = await Promise.allSettled(messages.map((m) => sendSMS(m)))
  return results.map((r) => {
    if (r.status === "fulfilled") return r.value
    return { success: false, provider, error: r.reason?.message || "Unknown error" }
  })
}

// --- Provider implementations ---

async function sendViaOrange(to: string, body: string): Promise<SMSResult> {
  try {
    const res = await fetch(`${apiUrl}/smsmessaging/v1/outbound/tel%3A%2B${sender}/requests`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: `tel:${to}`,
          senderAddress: `tel:+${sender}`,
          senderName: "EduGest",
          outboundSMSTextMessage: { message: body },
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, provider: "orange", error: err }
    }

    const data = await res.json()
    return {
      success: true,
      provider: "orange",
      messageId: data?.outboundSMSMessageRequest?.resourceURL,
    }
  } catch (err) {
    return { success: false, provider: "orange", error: err instanceof Error ? err.message : "Unknown" }
  }
}

async function sendViaTwilio(to: string, body: string): Promise<SMSResult> {
  try {
    const accountSid = process.env.SMS_ACCOUNT_SID || ""
    const authToken = process.env.SMS_AUTH_TOKEN || ""
    const from = process.env.SMS_FROM || sender

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, provider: "twilio", error: err }
    }

    const data = await res.json()
    return { success: true, provider: "twilio", messageId: data?.sid }
  } catch (err) {
    return { success: false, provider: "twilio", error: err instanceof Error ? err.message : "Unknown" }
  }
}

// --- Templates de SMS ---

export const smsTemplates = {
  inscription: (eleve: string, classe: string) =>
    `EduGest: Inscription de ${eleve} en ${classe} confirmée. Bienvenue !`,

  paiement: (eleve: string, montant: number) =>
    `EduGest: Paiement de ${montant.toLocaleString("fr-FR")} FCFA reçu pour ${eleve}. Merci !`,

  bulletin: (eleve: string, trimestre: number, moyenne: number) =>
    `EduGest: Bulletin de ${eleve} - Trimestre ${trimestre} - Moyenne: ${moyenne.toFixed(2)}/20 disponible.`,

  absence: (eleve: string, date: string) =>
    `EduGest: ${eleve} a été absent(e) le ${date}. Contactez l'école pour justification.`,

  retard: (eleve: string) =>
    `EduGest: ${eleve} est arrivé(e) en retard aujourd'hui.`,

  relancePaiement: (eleve: string, montant: number) =>
    `EduGest: Rappel - Solde de ${montant.toLocaleString("fr-FR")} FCFA pour ${eleve}. Merci de régulariser.`,
}

// --- Fonctions métier ---

/**
 * Envoie une notification SMS à tous les parents d'une école
 */
export async function notifyParents(
  ecoleId: string,
  message: string,
  filter?: { classeId?: string }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let query = supabase
    .from("eleves")
    .select("id, nom, prenom, parent_id, parent:profils!parent_id(telephone)")
    .eq("ecole_id", ecoleId)
    .eq("statut", "actif")
    .not("parent_id", "is", null)

  if (filter?.classeId) {
    query = query.eq("classe_id", filter.classeId)
  }

  const { data: eleves } = await query

  if (!eleves || eleves.length === 0) return []

  const messages: SMSMessage[] = []
  for (const eleve of eleves) {
    const parent = eleve.parent as unknown as { telephone: string } | null
    if (parent?.telephone) {
      messages.push({ to: parent.telephone, body: message })
    }
  }

  return sendBulkSMS(messages)
}

/**
 * Envoie un SMS à un parent spécifique via l'ID élève
 */
export async function notifyParentOfEleve(eleveId: string, message: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: eleve } = await supabase
    .from("eleves")
    .select("parent:profils!parent_id(telephone)")
    .eq("id", eleveId)
    .single()

  const parent = eleve?.parent as unknown as { telephone: string } | null
  if (!parent?.telephone) {
    return { success: false, provider, error: "No phone number" }
  }

  return sendSMS({ to: parent.telephone, body: message })
}
