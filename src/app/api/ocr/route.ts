import { NextResponse } from "next/server"
import { createWorker } from "tesseract.js"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
  }

  const allowed = ["image/png", "image/jpeg", "image/webp"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (PNG, JPG, WEBP)" }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    const worker = await createWorker("fra")
    const { data } = await worker.recognize(buffer)
    await worker.terminate()

    return NextResponse.json({ text: data.text.trim() })
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur lors de l'OCR: " + (err instanceof Error ? err.message : "inconnue") },
      { status: 500 }
    )
  }
}
