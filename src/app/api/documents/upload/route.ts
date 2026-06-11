import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

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

  const formData = await request.formData()
  const file = formData.get("file") as File
  const eleveId = formData.get("eleve_id") as string
  const type = formData.get("type") as string

  if (!file || !eleveId || !type) {
    return NextResponse.json({ error: "Fichier, élève et type requis" }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 })
  }

  const { data: profil } = await supabase
    .from("profils")
    .select("ecole_id")
    .eq("user_id", user.id)
    .single()

  if (!profil?.ecole_id) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 400 })
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const bucketName = "documents"
  const { data: buckets } = await svc.storage.listBuckets()
  if (!buckets?.find((b) => b.name === bucketName)) {
    await svc.storage.createBucket(bucketName, { public: true, fileSizeLimit: 10485760 })
  }

  const ext = file.name.split(".").pop()
  const fileName = `${eleveId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await svc.storage.from(bucketName).upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { data: urlData } = svc.storage.from(bucketName).getPublicUrl(fileName)

  const { data: doc, error: dbError } = await supabase
    .from("documents_eleves")
    .insert({
      eleve_id: eleveId,
      type,
      nom: file.name,
      url: urlData.publicUrl,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ document: doc })
}
