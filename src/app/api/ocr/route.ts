import { NextResponse } from "next/server"
import { createWorker } from "tesseract.js"
import os from "os"
import path from "path"

export const maxDuration = 120

const OCR_TIMEOUT = 90_000

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let id: ReturnType<typeof setTimeout>
  const timer = new Promise<never>((_, reject) => {
    id = setTimeout(() => reject(new Error(`Timeout après ${ms / 1000}s`)), ms)
  })
  return Promise.race([promise, timer]).finally(() => clearTimeout(id))
}

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

    const cachePath = path.join(os.tmpdir(), "tessdata")

    const worker = await timeout(
      createWorker("fra", undefined, {
        cachePath,
        cacheMethod: "write",
        logger: (m) => { if (m.status === "loading language traineddata") void m },
      }),
      OCR_TIMEOUT
    )

    const { data } = await worker.recognize(buffer)
    await worker.terminate()

    return NextResponse.json({ text: data.text.trim() })
  } catch (err) {
    const message = err instanceof Error ? err.message : "inconnue"
    return NextResponse.json(
      { error: "Erreur lors de l'OCR: " + message },
      { status: 500 }
    )
  }
}
