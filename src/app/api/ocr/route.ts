import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporté. Utilisez PNG, JPG ou PDF" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extrais les informations de ce document scolaire (CNI, acte de naissance, ou bulletin).
                
                Réponds UNIQUEMENT au format JSON sans aucun texte autour :
                {
                  "type_document": "cni" | "acte_naissance" | "bulletin" | "autre",
                  "nom": "",
                  "prenom": "",
                  "date_naissance": "",
                  "lieu_naissance": "",
                  "sexe": "M" | "F" | "",
                  "nationalite": "",
                  "numero_document": "",
                  "confidence": 0.0
                }
                
                Si tu ne peux pas lire le document clairement, mets confidence à 0.`,
              },
              {
                type: "image_url",
                image_url: { url: dataUri },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("OpenRouter OCR error:", errText)
      return NextResponse.json({ error: "Service OCR temporairement indisponible" }, { status: 502 })
    }

    const result = await response.json()
    const text = result.choices?.[0]?.message?.content || ""

    let parsed
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Réponse OCR invalide" }
    } catch {
      parsed = { error: "Impossible d'interpréter le document", raw: text }
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error("OCR Error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}


