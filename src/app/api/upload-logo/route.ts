import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  const schoolId = formData.get("school_id") as string | null

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 2 Mo)" }, { status: 400 })
  }

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (PNG, JPG, WEBP, SVG)" }, { status: 400 })
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const bucketName = "logos"
  const { data: buckets } = await svc.storage.listBuckets()
  if (!buckets?.find((b) => b.name === bucketName)) {
    await svc.storage.createBucket(bucketName, { public: true, fileSizeLimit: 2097152 })
  }

  const ext = file.name.split(".").pop()
  const fileName = schoolId
    ? `${schoolId}/logo.${ext}`
    : `temp/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await svc.storage.from(bucketName).upload(fileName, buffer, {
    contentType: file.type,
    upsert: !!schoolId,
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { data: urlData } = svc.storage.from(bucketName).getPublicUrl(fileName)

  return NextResponse.json({ url: urlData.publicUrl })
}
