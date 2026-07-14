import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"

const env = readFileSync(".env.local", "utf-8")
const vars = {}
for (const line of env.split("\n")) {
  const m = line.match(/^(\w+)=(.*)$/)
  if (m) vars[m[1]] = m[2]
}

// Client anon = respecte les RLS (vrai test comme dans l'app)
const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const EMAIL = "admin@edugest.ci"
const PASSWORD = "Admin123!"

let pass = 0, fail = 0
function ok(msg) { console.log(`  ✅ ${msg}`); pass++ }
function ko(msg) { console.log(`  ❌ ${msg}`); fail++ }

console.log("=== TEST FONCTIONNEL: Cahier de textes + Emploi du temps ===\n")

// 1. Login
console.log("1. Connexion directeur...")
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
if (authErr) { ko(`Login: ${authErr.message}`); process.exit(1) }
ok(`Connecté: ${auth.user.email}`)

// 2. Profil + ecole
const { data: profil } = await supabase.from("profils").select("id, role, ecole_id").eq("user_id", auth.user.id).single()
if (!profil?.ecole_id) { ko("Pas d'ecole_id sur le profil"); process.exit(1) }
ok(`Profil: role=${profil.role}, ecole_id=${profil.ecole_id.slice(0, 8)}...`)

// 3. Récupérer classe + matière
const { data: classes } = await supabase.from("classes").select("id, libelle").eq("ecole_id", profil.ecole_id).limit(1)
const { data: matieres } = await supabase.from("matieres").select("id, libelle").eq("ecole_id", profil.ecole_id).limit(1)
if (!classes?.length) { ko("Aucune classe trouvée"); process.exit(1) }
if (!matieres?.length) { ko("Aucune matière trouvée"); process.exit(1) }
const classe = classes[0], matiere = matieres[0]
ok(`Classe: ${classe.libelle} | Matière: ${matiere.libelle}`)

// ============ CAHIER DE TEXTES ============
console.log("\n2. Cahier de textes")
let cahierId = null

// INSERT
const { data: ins, error: insErr } = await supabase.from("cahier_textes").insert({
  ecole_id: profil.ecole_id,
  classe_id: classe.id,
  matiere_id: matiere.id,
  personnel_id: null,
  date_cours: "2026-07-14",
  chapitre: "[TEST] Chapitre de test",
  contenu: "Contenu de test",
  activites: "Exercices de test",
  devoirs: "Devoirs de test",
  duree: 2,
  statut: "planifie",
}).select().single()
if (insErr) ko(`INSERT: ${insErr.message}`)
else { cahierId = ins.id; ok(`INSERT: entrée créée (${ins.id.slice(0, 8)}...)`) }

// SELECT (RLS)
const { data: sel, error: selErr } = await supabase.from("cahier_textes").select("id, chapitre, classe:classes(libelle), matiere:matieres(libelle)").eq("ecole_id", profil.ecole_id)
if (selErr) ko(`SELECT: ${selErr.message}`)
else ok(`SELECT: ${sel.length} entrée(s) visible(s)`)

// UPDATE
if (cahierId) {
  const { error: updErr } = await supabase.from("cahier_textes").update({ statut: "fait" }).eq("id", cahierId)
  if (updErr) ko(`UPDATE: ${updErr.message}`)
  else ok("UPDATE: statut → fait")
}

// DELETE (cleanup)
if (cahierId) {
  const { error: delErr } = await supabase.from("cahier_textes").delete().eq("id", cahierId)
  if (delErr) ko(`DELETE: ${delErr.message}`)
  else ok("DELETE: entrée supprimée (cleanup)")
}

// ============ EMPLOI DU TEMPS ============
console.log("\n3. Emploi du temps")
let coursId = null

const { data: insC, error: insCErr } = await supabase.from("emplois_du_temps").insert({
  classe_id: classe.id,
  matiere_id: matiere.id,
  enseignant_id: null,
  jour_semaine: 1,
  heure_debut: "08:00",
  heure_fin: "09:00",
  salle: "[TEST] Salle 101",
}).select().single()
if (insCErr) ko(`INSERT: ${insCErr.message}`)
else { coursId = insC.id; ok(`INSERT: cours créé (${insC.id.slice(0, 8)}...)`) }

const { data: selC, error: selCErr } = await supabase.from("emplois_du_temps").select("id, jour_semaine, salle, matiere:matieres(libelle)").eq("classe_id", classe.id)
if (selCErr) ko(`SELECT: ${selCErr.message}`)
else ok(`SELECT: ${selC.length} cours visible(s)`)

if (coursId) {
  const { error: delCErr } = await supabase.from("emplois_du_temps").delete().eq("id", coursId)
  if (delCErr) ko(`DELETE: ${delCErr.message}`)
  else ok("DELETE: cours supprimé (cleanup)")
}

// ============ RÉSUMÉ ============
console.log(`\n=== RÉSULTAT: ${pass} réussis, ${fail} échoués ===`)
await supabase.auth.signOut()
process.exit(fail > 0 ? 1 : 0)
