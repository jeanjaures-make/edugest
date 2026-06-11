import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const paiementsExemple = [
  { nom: "Kouassi", prenom: "Marie", montant: 50000, methode: "orange_money" },
  { nom: "N'Guessan", prenom: "Aya", montant: 350000, methode: "virement" },
  { nom: "Touré", prenom: "Moussa", montant: 55000, methode: "mtn_momo" },
  { nom: "Diallo", prenom: "Fatou", montant: 60000, methode: "especes" },
  { nom: "Konan", prenom: "Yves", montant: 45000, methode: "orange_money" },
  { nom: "Bamba", prenom: "Lamine", montant: 150000, methode: "virement" },
  { nom: "Koffi", prenom: "Amenan", montant: 75000, methode: "mtn_momo" },
  { nom: "Soro", prenom: "Nabintou", montant: 85000, methode: "especes" },
  { nom: "Traoré", prenom: "Mamadou", montant: 250000, methode: "orange_money" },
  { nom: "Zadi", prenom: "Ruth", montant: 95000, methode: "mtn_momo" },
  { nom: "Kouamé", prenom: "Arnaud", montant: 120000, methode: "virement" },
  { nom: "Gbahi", prenom: "Prisca", montant: 65000, methode: "especes" },
]

async function seedPaiements() {
  console.log("Fetching eleves...");
  const { data: eleves, error: eleveError } = await supabase
    .from("eleves")
    .select("id, nom, prenom")
    .eq("statut", "actif");

  if (eleveError) { console.error("Error fetching eleves:", eleveError); return; }
  if (!eleves || eleves.length === 0) {
    console.log("No active students found. Creating sample paiements without eleve_id...");
  }

  console.log(`Found ${eleves?.length ?? 0} active students`);

  let inserted = 0;

  for (const p of paiementsExemple) {
    const eleve = eleves?.find(
      (e) => e.nom.toLowerCase() === p.nom.toLowerCase() && e.prenom.toLowerCase() === p.prenom.toLowerCase()
    );

    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const reference = `PAY-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const statuts = ["confirme", "confirme", "confirme", "en_attente", "echoue"];
    const statut = statuts[Math.floor(Math.random() * statuts.length)];

    const paiement = {
      eleve_id: eleve?.id ?? null,
      montant: p.montant,
      methode: p.methode,
      telephone: eleve ? `+225 01 ${String(Math.floor(Math.random() * 90) + 10).padStart(2, "0")} ${String(Math.floor(Math.random() * 90) + 10).padStart(2, "0")} ${String(Math.floor(Math.random() * 90) + 10).padStart(2, "0")}` : null,
      reference,
      statut,
      date_paiement: date.toISOString(),
    };

    const { error } = await supabase.from("paiements").insert(paiement);
    if (error) {
      console.error(`Error inserting paiement for ${p.nom} ${p.prenom}:`, error.message);
    } else {
      inserted++;
      console.log(`  ✓ ${reference} - ${p.prenom} ${p.nom} - ${(p.montant / 1000).toFixed(0)}k FCFA (${statut})`);
    }
  }

  console.log(`\n✅ ${inserted} paiements insérés avec succès`);
}

seedPaiements();
