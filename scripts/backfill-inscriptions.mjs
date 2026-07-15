import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

const env = readFileSync(".env.local", "utf-8")
const vars = {}
for (const line of env.split("\n")) {
  const m = line.match(/^(\w+)=(.*)$/)
  if (m) vars[m[1]] = m[2]
}

const admin = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY)

const DRY_RUN = process.argv.includes("--apply") ? false : true

console.log(`=== RATTRAPAGE INSCRIPTIONS ${DRY_RUN ? "(DRY-RUN, aucune ecriture)" : "(APPLICATION REELLE)"} ===\n`)

// 1. Tous les eleves avec une classe assignee
const { data: eleves } = await admin
  .from("eleves")
  .select("id, ecole_id, classe_id, nom, prenom")
  .not("classe_id", "is", null)

// 2. Inscriptions existantes (pour ne pas dupliquer)
const { data: existing } = await admin.from("inscriptions").select("eleve_id")
const dejaInscrit = new Set((existing || []).map((i) => i.eleve_id))

// 3. Annees scolaires actives par ecole
const { data: annees } = await admin.from("annees_scolaires").select("id, ecole_id").eq("active", true)
const anneeParEcole = new Map((annees || []).map((a) => [a.ecole_id, a.id]))

// 4. Frais par classe
const { data: classes } = await admin.from("classes").select("id, frais_inscription, frais_scolarite")
const fraisParClasse = new Map((classes || []).map((c) => [c.id, c]))

const aCreer = []
let sansAnnee = 0
for (const e of eleves || []) {
  if (dejaInscrit.has(e.id)) continue
  const anneeId = anneeParEcole.get(e.ecole_id)
  if (!anneeId) { sansAnnee++; continue }
  const c = fraisParClasse.get(e.classe_id)
  aCreer.push({
    eleve_id: e.id,
    classe_id: e.classe_id,
    annee_scolaire_id: anneeId,
    frais_inscription: c?.frais_inscription ?? 0,
    frais_scolarite: c?.frais_scolarite ?? 0,
    statut: "confirmee",
  })
}

console.log(`Eleves avec classe: ${eleves?.length ?? 0}`)
console.log(`Deja inscrits: ${dejaInscrit.size}`)
console.log(`Ignores (ecole sans annee active): ${sansAnnee}`)
console.log(`Inscriptions a creer: ${aCreer.length}\n`)

if (aCreer.length === 0) {
  console.log("Rien a faire.")
  process.exit(0)
}

if (DRY_RUN) {
  console.log("DRY-RUN : relance avec --apply pour creer les inscriptions.")
  process.exit(0)
}

const { data: created, error } = await admin.from("inscriptions").insert(aCreer).select("id")
if (error) { console.log("ERREUR:", error.message); process.exit(1) }
console.log(`✅ ${created?.length ?? 0} inscription(s) creee(s).`)
