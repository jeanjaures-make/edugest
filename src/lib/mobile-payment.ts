/**
 * Service de paiement mobile pour EduGest CI
 * 
 * Supporte :
 * - Orange Money CI
 * - MTN MoMo CI
 * - Moov Money CI
 * 
 * Configuration via variables d'environnement :
 * - ORANGE_MONEY_API_KEY
 * - ORANGE_MONEY_MERCHANT_ID
 * - MTN_MOMO_API_KEY
 * - MTN_MOMO_SUBSCRIPTION_KEY
 * - MOOV_MONEY_API_KEY
 * - MOOV_MONEY_MERCHANT_ID
 */

export type PaymentProvider = "orange_money" | "mtn_momo" | "moov_money"

export interface PaymentRequest {
  provider: PaymentProvider
  amount: number
  phoneNumber: string
  description: string
  reference: string
  eleveId?: string
  echeancierId?: string
  ecoleId?: string
}

export interface PaymentResult {
  success: boolean
  provider: PaymentProvider
  transactionId?: string
  status: "pending" | "success" | "failed"
  message?: string
  payUrl?: string
}

/**
 * Normalise un numéro de téléphone au format international CI
 */
export function normalizePhone(phone: string): string {
  const p = phone.replace(/[\s\-\.]/g, "")
  if (p.startsWith("+225")) return p
  if (p.startsWith("225")) return "+" + p
  if (p.startsWith("0")) return "+225" + p
  if (p.startsWith("7") || p.startsWith("5") || p.startsWith("01")) return "+225" + p
  return p
}

/**
 * Initie un paiement mobile
 */
export async function initiatePayment(req: PaymentRequest): Promise<PaymentResult> {
  const phone = normalizePhone(req.phoneNumber)

  switch (req.provider) {
    case "orange_money":
      return initiateOrangeMoney(req, phone)
    case "mtn_momo":
      return initiateMTNMoMo(req, phone)
    case "moov_money":
      return initiateMoovMoney(req, phone)
    default:
      return { success: false, provider: req.provider, status: "failed", message: "Provider non supporté" }
  }
}

/**
 * Vérifie le statut d'une transaction
 */
export async function checkPaymentStatus(provider: PaymentProvider, transactionId: string): Promise<PaymentResult> {
  switch (provider) {
    case "orange_money":
      return checkOrangeMoneyStatus(transactionId)
    case "mtn_momo":
      return checkMTNMoMoStatus(transactionId)
    case "moov_money":
      return checkMoovMoneyStatus(transactionId)
    default:
      return { success: false, provider, status: "failed", message: "Provider non supporté" }
  }
}

// --- Orange Money CI ---

async function initiateOrangeMoney(req: PaymentRequest, phone: string): Promise<PaymentResult> {
  const apiKey = process.env.ORANGE_MONEY_API_KEY
  const merchantId = process.env.ORANGE_MONEY_MERCHANT_ID

  if (!apiKey || !merchantId) {
    return {
      success: false,
      provider: "orange_money",
      status: "failed",
      message: "Orange Money non configuré. Définissez ORANGE_MONEY_API_KEY et ORANGE_MONEY_MERCHANT_ID.",
    }
  }

  try {
    // Orange Money CI Web Payment API
    const res = await fetch("https://api.orange.com/orange-money-webpay/cm/v1/webpayment", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_key: merchantId,
        currency: "XOF",
        order_id: req.reference,
        amount: req.amount,
        ref_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paiements/callback`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiements?status=cancelled`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiements?status=success`,
        lang: "fr",
        customer_phone: phone,
        description: req.description,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, provider: "orange_money", status: "failed", message: err }
    }

    const data = await res.json()
    return {
      success: true,
      provider: "orange_money",
      transactionId: data?.order_id || data?.pay_token,
      status: "pending",
      payUrl: data?.payment_url,
    }
  } catch (err) {
    return {
      success: false,
      provider: "orange_money",
      status: "failed",
      message: err instanceof Error ? err.message : "Erreur réseau",
    }
  }
}

async function checkOrangeMoneyStatus(transactionId: string): Promise<PaymentResult> {
  const apiKey = process.env.ORANGE_MONEY_API_KEY
  if (!apiKey) {
    return { success: false, provider: "orange_money", status: "failed", message: "Non configuré" }
  }

  try {
    const res = await fetch(`https://api.orange.com/orange-money-webpay/cm/v1/order/${transactionId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    })
    const data = await res.json()
    const status = data?.status === "SUCCESS" ? "success" : data?.status === "PENDING" ? "pending" : "failed"
    return { success: status === "success", provider: "orange_money", transactionId, status, message: data?.status }
  } catch {
    return { success: false, provider: "orange_money", status: "failed", transactionId, message: "Erreur" }
  }
}

// --- MTN MoMo CI ---

async function initiateMTNMoMo(req: PaymentRequest, phone: string): Promise<PaymentResult> {
  const apiKey = process.env.MTN_MOMO_API_KEY
  const subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY

  if (!apiKey || !subscriptionKey) {
    return {
      success: false,
      provider: "mtn_momo",
      status: "failed",
      message: "MTN MoMo non configuré. Définissez MTN_MOMO_API_KEY et MTN_MOMO_SUBSCRIPTION_KEY.",
    }
  }

  try {
    const referenceId = crypto.randomUUID()
    const res = await fetch("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": "production",
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: req.amount.toString(),
        currency: "XOF",
        externalId: req.reference,
        payer: { partyIdType: "MSISDN", partyId: phone.replace("+", "") },
        payerMessage: req.description,
        payeeNote: `EduGest - ${req.reference}`,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, provider: "mtn_momo", status: "failed", message: err }
    }

    return {
      success: true,
      provider: "mtn_momo",
      transactionId: referenceId,
      status: "pending",
    }
  } catch (err) {
    return {
      success: false,
      provider: "mtn_momo",
      status: "failed",
      message: err instanceof Error ? err.message : "Erreur réseau",
    }
  }
}

async function checkMTNMoMoStatus(transactionId: string): Promise<PaymentResult> {
  const apiKey = process.env.MTN_MOMO_API_KEY
  const subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY
  if (!apiKey || !subscriptionKey) {
    return { success: false, provider: "mtn_momo", status: "failed", message: "Non configuré" }
  }

  try {
    const res = await fetch(`https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${transactionId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Target-Environment": "production",
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    })
    const data = await res.json()
    const status = data?.status === "SUCCESSFUL" ? "success" : data?.status === "PENDING" ? "pending" : "failed"
    return { success: status === "success", provider: "mtn_momo", transactionId, status, message: data?.status }
  } catch {
    return { success: false, provider: "mtn_momo", status: "failed", transactionId, message: "Erreur" }
  }
}

// --- Moov Money CI ---

async function initiateMoovMoney(req: PaymentRequest, phone: string): Promise<PaymentResult> {
  const apiKey = process.env.MOOV_MONEY_API_KEY
  const merchantId = process.env.MOOV_MONEY_MERCHANT_ID

  if (!apiKey || !merchantId) {
    return {
      success: false,
      provider: "moov_money",
      status: "failed",
      message: "Moov Money non configuré. Définissez MOOV_MONEY_API_KEY et MOOV_MONEY_MERCHANT_ID.",
    }
  }

  // Moov Money CI API (similaire à Orange Money)
  try {
    const res = await fetch("https://api.moov.ci/v1/payment", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: req.amount,
        currency: "XOF",
        phone: phone.replace("+", ""),
        reference: req.reference,
        description: req.description,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paiements/callback`,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { success: false, provider: "moov_money", status: "failed", message: err }
    }

    const data = await res.json()
    return {
      success: true,
      provider: "moov_money",
      transactionId: data?.transaction_id || data?.reference,
      status: "pending",
      payUrl: data?.payment_url,
    }
  } catch (err) {
    return {
      success: false,
      provider: "moov_money",
      status: "failed",
      message: err instanceof Error ? err.message : "Erreur réseau",
    }
  }
}

async function checkMoovMoneyStatus(transactionId: string): Promise<PaymentResult> {
  const apiKey = process.env.MOOV_MONEY_API_KEY
  if (!apiKey) {
    return { success: false, provider: "moov_money", status: "failed", message: "Non configuré" }
  }

  try {
    const res = await fetch(`https://api.moov.ci/v1/payment/${transactionId}/status`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    })
    const data = await res.json()
    const status = data?.status === "success" ? "success" : data?.status === "pending" ? "pending" : "failed"
    return { success: status === "success", provider: "moov_money", transactionId, status, message: data?.status }
  } catch {
    return { success: false, provider: "moov_money", status: "failed", transactionId, message: "Erreur" }
  }
}

export const paymentProviders = [
  {
    id: "orange_money" as const,
    name: "Orange Money",
    color: "#ff6600",
    icon: "🟠",
  },
  {
    id: "mtn_momo" as const,
    name: "MTN MoMo",
    color: "#ffcc00",
    icon: "🟡",
  },
  {
    id: "moov_money" as const,
    name: "Moov Money",
    color: "#0066cc",
    icon: "🔵",
  },
]
