import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkRateLimit } from "@/lib/rate-limiter"
import { headers } from "next/headers"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPassword(password: string): boolean {
  return password.length >= 6 && /[A-Z]/.test(password) && /[0-9]/.test(password)
}

export async function POST(request: Request) {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
  const { allowed, retryAfter } = checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: "TROP_DE_REQUETES", message: "Trop de tentatives. Réessayez dans quelques instants." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const formData = await request.formData()

  const school = {
    nom: formData.get("school_nom") as string,
    adresse: (formData.get("school_adresse") as string) || "",
    telephone: (formData.get("school_telephone") as string) || "",
    email: (formData.get("school_email") as string) || "",
    site_web: (formData.get("school_site_web") as string) || "",
    code_etablissement: (formData.get("school_code_etablissement") as string) || "",
  }

  const admin = {
    nom: formData.get("admin_nom") as string,
    prenom: formData.get("admin_prenom") as string,
    email: formData.get("admin_email") as string,
    telephone: (formData.get("admin_telephone") as string) || "",
    password: formData.get("admin_password") as string,
  }

  if (!school.nom || !admin.nom || !admin.prenom || !admin.email || !admin.password) {
    return NextResponse.json(
      { error: "VALIDATION", message: "Tous les champs obligatoires doivent être remplis" },
      { status: 400 }
    )
  }

  if (!isValidEmail(admin.email)) {
    return NextResponse.json(
      { error: "VALIDATION", message: "Format d'email invalide" },
      { status: 400 }
    )
  }

  if (!isValidPassword(admin.password)) {
    return NextResponse.json(
      { error: "VALIDATION", message: "Mot de passe : min 6 caractères, 1 majuscule, 1 chiffre" },
      { status: 400 }
    )
  }

  const logoFile = formData.get("logo") as File | null

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: ecole, error: ecoleError } = await svc
    .from("ecoles")
    .insert({
      nom: school.nom,
      adresse: school.adresse,
      telephone: school.telephone,
      email: school.email,
      site_web: school.site_web,
      code_etablissement: school.code_etablissement || `ETAB-${Date.now().toString().slice(-6)}`,
    })
    .select()
    .single()

  if (ecoleError) {
    return NextResponse.json(
      { error: "SCHOOL_FAILED", message: "Erreur lors de la création de l'établissement" },
      { status: 400 }
    )
  }

  let logoUrl: string | null = null
  if (logoFile && logoFile.size > 0) {
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]
    if (!allowed.includes(logoFile.type)) {
      await svc.from("ecoles").delete().eq("id", ecole.id)
      return NextResponse.json(
        { error: "LOGO_FORMAT", message: "Format non supporté (PNG, JPG, WEBP, SVG)" },
        { status: 400 }
      )
    }
    if (logoFile.size > 2 * 1024 * 1024) {
      await svc.from("ecoles").delete().eq("id", ecole.id)
      return NextResponse.json(
        { error: "LOGO_SIZE", message: "Fichier trop volumineux (max 2 Mo)" },
        { status: 400 }
      )
    }

    const bucketName = "logos"
    const { data: buckets } = await svc.storage.listBuckets()
    if (!buckets?.find((b) => b.name === bucketName)) {
      await svc.storage.createBucket(bucketName, { public: true, fileSizeLimit: 2097152 })
    }

    const ext = logoFile.name.split(".").pop()
    const fileName = `${ecole.id}/logo.${ext}`
    const buffer = Buffer.from(await logoFile.arrayBuffer())

    const { error: uploadError } = await svc.storage.from(bucketName).upload(fileName, buffer, {
      contentType: logoFile.type,
      upsert: true,
    })

    if (!uploadError) {
      const { data: urlData } = svc.storage.from(bucketName).getPublicUrl(fileName)
      logoUrl = urlData.publicUrl
      await svc.from("ecoles").update({ logo_url: logoUrl }).eq("id", ecole.id)
    }
  }

  const { data: authUser, error: authError } = await svc.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    await svc.from("ecoles").delete().eq("id", ecole.id)
    return NextResponse.json(
      { error: "AUTH_FAILED", message: "Échec de la création du compte administrateur" },
      { status: 400 }
    )
  }

  const { error: profilError } = await svc
    .from("profils")
    .insert({
      user_id: authUser.user.id,
      ecole_id: ecole.id,
      nom: admin.nom,
      prenom: admin.prenom,
      telephone: admin.telephone || "",
      role: "directeur",
    })

  if (profilError) {
    await svc.auth.admin.deleteUser(authUser.user.id)
    await svc.from("ecoles").delete().eq("id", ecole.id)
    return NextResponse.json(
      { error: "PROFIL_FAILED", message: "Erreur lors de la création du profil" },
      { status: 400 }
    )
  }

  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  await svc.from("annees_scolaires").insert({
    ecole_id: ecole.id,
    libelle: `${currentYear}-${nextYear}`,
    date_debut: `${currentYear}-09-01`,
    date_fin: `${nextYear}-08-31`,
    active: true,
  })

  const niveauxParDefaut = [
    { libelle: "CP", code: "CP", ordre: 1 },
    { libelle: "CE1", code: "CE1", ordre: 2 },
    { libelle: "CE2", code: "CE2", ordre: 3 },
    { libelle: "CM1", code: "CM1", ordre: 4 },
    { libelle: "CM2", code: "CM2", ordre: 5 },
    { libelle: "6ème", code: "6E", ordre: 6 },
    { libelle: "5ème", code: "5E", ordre: 7 },
    { libelle: "4ème", code: "4E", ordre: 8 },
    { libelle: "3ème", code: "3E", ordre: 9 },
    { libelle: "2nde", code: "2ND", ordre: 10 },
    { libelle: "1ère", code: "1E", ordre: 11 },
    { libelle: "Tle", code: "TLE", ordre: 12 },
  ]
  await svc.from("niveaux").insert(
    niveauxParDefaut.map((n) => ({ ...n, ecole_id: ecole.id }))
  )

  const matieresParDefaut = [
    { libelle: "Mathématiques", code: "MATH", coefficient: 5 },
    { libelle: "Français", code: "FR", coefficient: 5 },
    { libelle: "Anglais", code: "ANG", coefficient: 3 },
    { libelle: "Histoire-Géographie", code: "HG", coefficient: 3 },
    { libelle: "Sciences de la Vie et de la Terre", code: "SVT", coefficient: 3 },
    { libelle: "Physique-Chimie", code: "PC", coefficient: 3 },
    { libelle: "Philosophie", code: "PHILO", coefficient: 3 },
    { libelle: "Éducation Physique et Sportive", code: "EPS", coefficient: 2 },
    { libelle: "Arts Plastiques", code: "AP", coefficient: 1 },
    { libelle: "Musique", code: "MUS", coefficient: 1 },
    { libelle: "Éducation Civique et Morale", code: "ECM", coefficient: 2 },
    { libelle: "TIC", code: "TIC", coefficient: 2 },
  ]
  await svc.from("matieres").insert(
    matieresParDefaut.map((m) => ({ ...m, ecole_id: ecole.id }))
  )

  return NextResponse.json({
    success: true,
    ecole: { id: ecole.id, nom: ecole.nom, logo_url: logoUrl },
    email: admin.email,
  })
}
