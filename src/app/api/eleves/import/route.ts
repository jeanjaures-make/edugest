import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import * as XLSX from "xlsx"

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

  const formData = await request.formData()
  const file = formData.get("file") as File
  const classeId = formData.get("classe_id") as string

  if (!file) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
  }

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })

    if (rows.length === 0) {
      return NextResponse.json({ error: "Le fichier est vide" }, { status: 400 })
    }

    // Normaliser les colonnes (accepter plusieurs variantes de noms)
    const normalized = rows.map((row) => {
      const get = (keys: string[]) => {
        for (const key of keys) {
          for (const rowKey of Object.keys(row)) {
            if (rowKey.toLowerCase().trim() === key.toLowerCase().trim()) {
              return String(row[rowKey] ?? "").trim()
            }
          }
        }
        return ""
      }

      return {
        matricule: get(["matricule", "matr", "id", "numero"]),
        nom: get(["nom", "lastname", "surname"]),
        prenom: get(["prenom", "prénom", "firstname", "name"]),
        date_naissance: get(["date_naissance", "date de naissance", "naissance", "dob", "date nais"]),
        lieu_naissance: get(["lieu_naissance", "lieu de naissance", "lieu", "birthplace"]),
        sexe: get(["sexe", "gender", "genre"]),
        nationalite: get(["nationalite", "nationalité", "nationality"]) || "Ivoirienne",
        telephone: get(["telephone", "téléphone", "phone", "tel", "contact"]),
        email: get(["email", "mail", "e-mail"]),
        adresse: get(["adresse", "address", "domicile"]),
      }
    })

    // Filtrer les lignes vides (sans nom ET sans prénom)
    const valid = normalized.filter((r) => r.nom || r.prenom)
    const skipped = normalized.length - valid.length

    if (valid.length === 0) {
      return NextResponse.json({ error: "Aucune ligne valide trouvée. Colonnes attendues: matricule, nom, prenom, date_naissance, sexe..." }, { status: 400 })
    }

    // Valider le matricule (obligatoire)
    const missingMatricule = valid.filter((r) => !r.matricule)
    if (missingMatricule.length > 0) {
      return NextResponse.json({
        error: `${missingMatricule.length} élève(s) sans matricule. Le matricule est obligatoire.`,
        missingCount: missingMatricule.length,
      }, { status: 400 })
    }

    // Insérer en lot
    const elevesToInsert = valid.map((r) => ({
      ecole_id: profil.ecole_id,
      matricule: r.matricule,
      nom: r.nom,
      prenom: r.prenom,
      date_naissance: r.date_naissance || null,
      lieu_naissance: r.lieu_naissance || null,
      sexe: r.sexe === "M" || r.sexe === "F" ? r.sexe : null,
      nationalite: r.nationalite || "Ivoirienne",
      telephone: r.telephone || null,
      email: r.email || null,
      adresse: r.adresse || null,
      classe_id: classeId || null,
      statut: "actif",
    }))

    const { data: inserted, error } = await supabase
      .from("eleves")
      .insert(elevesToInsert)
      .select("id, matricule, nom, prenom")

    if (error) {
      // Vérifier si c'est une erreur de doublon de matricule
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return NextResponse.json({
          error: "Doublon de matricule détecté. Vérifiez que les matricules ne sont pas déjà utilisés.",
          detail: error.message,
        }, { status: 400 })
      }
      return NextResponse.json({ error: "Erreur lors de l'import", detail: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      imported: inserted?.length || 0,
      skipped,
      total: normalized.length,
      eleves: inserted,
    })
  } catch (err) {
    return NextResponse.json({
      error: "Erreur lors de la lecture du fichier",
      detail: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 })
  }
}
