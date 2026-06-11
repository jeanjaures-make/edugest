import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const NOW = new Date();
const MS_IN_DAY = 86400000;

function daysAgo(n) {
  const d = new Date(NOW.getTime() - n * MS_IN_DAY);
  return d.toISOString();
}

const niveauxData = [
  { libelle: '6ème', code: '6E', ordre: 1 },
  { libelle: '5ème', code: '5E', ordre: 2 },
  { libelle: '4ème', code: '4E', ordre: 3 },
  { libelle: '3ème', code: '3E', ordre: 4 },
  { libelle: '2nde', code: '2ND', ordre: 5 },
  { libelle: '1ère', code: '1E', ordre: 6 },
  { libelle: 'Tle', code: 'TLE', ordre: 7 },
];

const classesData = [
  { niveau: '6ème', libelle: '6ème A' },
  { niveau: '6ème', libelle: '6ème B' },
  { niveau: '5ème', libelle: '5ème A' },
  { niveau: '5ème', libelle: '5ème B' },
  { niveau: '4ème', libelle: '4ème A' },
  { niveau: '4ème', libelle: '4ème B' },
  { niveau: '3ème', libelle: '3ème A' },
  { niveau: '3ème', libelle: '3ème B' },
  { niveau: '2nde', libelle: '2nde A' },
  { niveau: '2nde', libelle: '2nde B' },
  { niveau: '1ère', libelle: '1ère A' },
  { niveau: 'Tle', libelle: 'Tle A' },
];

const matieresData = [
  { libelle: 'Mathématiques', code: 'MATH', coefficient: 4 },
  { libelle: 'Français', code: 'FR', coefficient: 4 },
  { libelle: 'Anglais', code: 'ANG', coefficient: 3 },
  { libelle: 'Histoire-Géo', code: 'HG', coefficient: 3 },
  { libelle: 'Sciences Physiques', code: 'SP', coefficient: 3 },
  { libelle: 'SVT', code: 'SVT', coefficient: 2 },
  { libelle: 'EPS', code: 'EPS', coefficient: 1 },
];

const elevesData = [
  { nom: 'Kouassi', prenom: 'Marie', sexe: 'F', classe: '6ème A' },
  { nom: "N'Guessan", prenom: 'Aya', sexe: 'F', classe: '5ème A' },
  { nom: 'Touré', prenom: 'Moussa', sexe: 'M', classe: '4ème B' },
  { nom: 'Diallo', prenom: 'Fatou', sexe: 'F', classe: '3ème A' },
  { nom: 'Konan', prenom: 'Yves', sexe: 'M', classe: '6ème A' },
  { nom: 'Bamba', prenom: 'Lamine', sexe: 'M', classe: '5ème B' },
  { nom: 'Koffi', prenom: 'Amenan', sexe: 'F', classe: '4ème A' },
  { nom: 'Soro', prenom: 'Nabintou', sexe: 'F', classe: '3ème A' },
  { nom: 'Traoré', prenom: 'Mamadou', sexe: 'M', classe: '2nde A' },
  { nom: 'Zadi', prenom: 'Ruth', sexe: 'F', classe: '6ème B' },
  { nom: 'Kouamé', prenom: 'Arnaud', sexe: 'M', classe: '1ère A' },
  { nom: 'Gbahi', prenom: 'Prisca', sexe: 'F', classe: 'Tle A' },
  { nom: 'Tano', prenom: 'Bénédicte', sexe: 'F', classe: '5ème A' },
  { nom: 'Coulibaly', prenom: 'Fousseni', sexe: 'M', classe: '4ème B' },
  { nom: 'Brou', prenom: 'Ange', sexe: 'M', classe: '3ème B' },
  { nom: 'Aka', prenom: 'Esther', sexe: 'F', classe: '6ème A' },
  { nom: 'Yao', prenom: 'Christian', sexe: 'M', classe: '2nde B' },
  { nom: 'Djié', prenom: 'Mariam', sexe: 'F', classe: '1ère A' },
  { nom: 'Ouedraogo', prenom: 'Salif', sexe: 'M', classe: 'Tle A' },
  { nom: 'Akissi', prenom: 'Emma', sexe: 'F', classe: '6ème B' },
];

const paiementsData = [
  { eleve: 'Kouassi Marie', montant: 50000, methode: 'orange_money', daysAgo: 1 },
  { eleve: "N'Guessan Aya", montant: 350000, methode: 'virement', daysAgo: 3 },
  { eleve: 'Touré Moussa', montant: 55000, methode: 'mtn_momo', daysAgo: 5 },
  { eleve: 'Diallo Fatou', montant: 60000, methode: 'especes', daysAgo: 10 },
  { eleve: 'Konan Yves', montant: 45000, methode: 'orange_money', daysAgo: 2 },
  { eleve: 'Bamba Lamine', montant: 150000, methode: 'virement', daysAgo: 7 },
  { eleve: 'Koffi Amenan', montant: 75000, methode: 'mtn_momo', daysAgo: 14 },
  { eleve: 'Soro Nabintou', montant: 85000, methode: 'especes', daysAgo: 20 },
  { eleve: 'Traoré Mamadou', montant: 250000, methode: 'orange_money', daysAgo: 4 },
  { eleve: 'Zadi Ruth', montant: 95000, methode: 'mtn_momo', daysAgo: 8 },
  { eleve: 'Kouamé Arnaud', montant: 120000, methode: 'virement', daysAgo: 12 },
  { eleve: 'Gbahi Prisca', montant: 65000, methode: 'especes', daysAgo: 6 },
  { eleve: 'Tano Bénédicte', montant: 50000, methode: 'orange_money', daysAgo: 15 },
  { eleve: 'Coulibaly Fousseni', montant: 100000, methode: 'orange_money', daysAgo: 9 },
  { eleve: 'Brou Ange', montant: 70000, methode: 'mtn_momo', daysAgo: 18 },
  { eleve: 'Aka Esther', montant: 45000, methode: 'especes', daysAgo: 25 },
  { eleve: 'Yao Christian', montant: 200000, methode: 'virement', daysAgo: 11 },
  { eleve: 'Djié Mariam', montant: 80000, methode: 'orange_money', daysAgo: 22 },
  { eleve: 'Ouedraogo Salif', montant: 95000, methode: 'mtn_momo', daysAgo: 16 },
  { eleve: 'Akissi Emma', montant: 50000, methode: 'orange_money', daysAgo: 13 },
  { eleve: 'Kouassi Marie', montant: 100000, methode: 'orange_money', daysAgo: 35 },
  { eleve: 'Touré Moussa', montant: 75000, methode: 'especes', daysAgo: 40 },
  { eleve: 'Konan Yves', montant: 35000, methode: 'mtn_momo', daysAgo: 50 },
  { eleve: "N'Guessan Aya", montant: 150000, methode: 'orange_money', daysAgo: 45 },
];

async function seed() {
  console.log('🔍 Vérification des données existantes...');

  // Check if ecole exists
  let { data: ecoles } = await supabase.from('ecoles').select('*').limit(1);
  let ecoleId;

  if (ecoles && ecoles.length > 0) {
    ecoleId = ecoles[0].id;
    console.log(`✓ École existante: ${ecoles[0].nom} (${ecoleId})`);
  } else {
    console.log('Création de l\'école...');
    const { data, error } = await supabase.from('ecoles').insert({
      nom: 'Groupe Scolaire les Bambous',
      adresse: 'Abidjan, Cocody',
      telephone: '+225 01 02 03 04 05',
      email: 'contact@bambous.ci',
      code_etablissement: 'GSB001',
    }).select().single();
    if (error) { console.error('Erreur école:', error.message); return; }
    ecoleId = data.id;
    console.log(`✓ École créée: ${data.nom}`);
  }

  // Check academic year
  let { data: annees } = await supabase.from('annees_scolaires').select('*').eq('ecole_id', ecoleId).limit(1);
  let anneeId;

  if (annees && annees.length > 0) {
    anneeId = annees[0].id;
    console.log(`✓ Année scolaire existante: ${annees[0].libelle}`);
  } else {
    const { data, error } = await supabase.from('annees_scolaires').insert({
      ecole_id: ecoleId,
      libelle: '2025-2026',
      date_debut: '2025-09-01',
      date_fin: '2026-08-31',
      active: true,
    }).select().single();
    if (error) { console.error('Erreur année:', error.message); return; }
    anneeId = data.id;
    console.log(`✓ Année scolaire créée: ${data.libelle}`);
  }

  // Create niveaux
  const niveauMap = {};
  for (const n of niveauxData) {
    let { data: existing } = await supabase.from('niveaux').select('id').eq('ecole_id', ecoleId).eq('code', n.code).limit(1);
    if (existing && existing.length > 0) {
      niveauMap[n.libelle] = existing[0].id;
    } else {
      const { data, error } = await supabase.from('niveaux').insert({ ...n, ecole_id: ecoleId }).select().single();
      if (!error && data) niveauMap[n.libelle] = data.id;
    }
  }
  console.log(`✓ ${Object.keys(niveauMap).length} niveaux`);

  // Create classes
  const classeMap = {};
  for (const c of classesData) {
    const niveauId = niveauMap[c.niveau];
    if (!niveauId) continue;
    let { data: existing } = await supabase.from('classes').select('id').eq('ecole_id', ecoleId).eq('libelle', c.libelle).eq('annee_scolaire_id', anneeId).limit(1);
    if (existing && existing.length > 0) {
      classeMap[c.libelle] = existing[0].id;
    } else {
      const { data, error } = await supabase.from('classes').insert({
        ecole_id: ecoleId, niveau_id: niveauId, annee_scolaire_id: anneeId,
        libelle: c.libelle, frais_scolarite: 250000, frais_inscription: 50000,
      }).select().single();
      if (!error && data) classeMap[c.libelle] = data.id;
    }
  }
  console.log(`✓ ${Object.keys(classeMap).length} classes`);

  // Create matieres
  for (const m of matieresData) {
    let { data: existing } = await supabase.from('matieres').select('id').eq('ecole_id', ecoleId).eq('code', m.code).limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from('matieres').insert({ ...m, ecole_id: ecoleId });
    }
  }
  console.log(`✓ ${matieresData.length} matières`);

  // Create students
  const eleveMap = {};
  for (const e of elevesData) {
    const classeId = classeMap[e.classe];
    if (!classeId) continue;

    const matricule = `GSB${String(Math.floor(Math.random() * 90000) + 10000)}`;
    let { data: existing } = await supabase.from('eleves').select('id').eq('ecole_id', ecoleId).eq('nom', e.nom).eq('prenom', e.prenom).limit(1);
    if (existing && existing.length > 0) {
      eleveMap[`${e.nom} ${e.prenom}`] = existing[0].id;
    } else {
      const { data, error } = await supabase.from('eleves').insert({
        ecole_id: ecoleId, matricule, nom: e.nom, prenom: e.prenom,
        date_naissance: `${2008 + Math.floor(Math.random() * 6)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        sexe: e.sexe, classe_id: classeId, annee_scolaire_id: anneeId,
        statut: 'actif',
      }).select().single();
      if (!error && data) eleveMap[`${e.nom} ${e.prenom}`] = data.id;
    }
  }
  console.log(`✓ ${Object.keys(eleveMap).length} élèves`);

  // Create frais_scolarite
  let { data: fraisList } = await supabase.from('frais_scolarite').select('id').eq('ecole_id', ecoleId).limit(1);
  let fraisId;
  if (fraisList && fraisList.length > 0) {
    fraisId = fraisList[0].id;
  } else {
    const { data } = await supabase.from('frais_scolarite').insert({
      ecole_id: ecoleId, libelle: 'Scolarité annuelle', montant: 250000,
      type: 'scolarite', periodicite: 'annuel',
    }).select().single();
    if (data) fraisId = data.id;
  }

  // Create echeanciers for each student
  const echeancierMap = {};
  for (const [key, eleveId] of Object.entries(eleveMap)) {
    if (!fraisId) continue;
    const { data: existing } = await supabase.from('echeanciers').select('id').eq('eleve_id', eleveId).eq('annee_scolaire_id', anneeId).limit(1);
    if (existing && existing.length > 0) {
      echeancierMap[key] = existing[0].id;
    } else {
      const { data, error } = await supabase.from('echeanciers').insert({
        eleve_id: eleveId, classe_id: classeMap[elevesData.find(e => `${e.nom} ${e.prenom}` === key)?.classe || ''],
        annee_scolaire_id: anneeId, frais_id: fraisId,
        montant_total: 250000, montant_restant: 250000 - (Math.floor(Math.random() * 200000)), statut: Math.random() > 0.5 ? 'partiel' : 'en_attente',
      }).select().single();
      if (!error && data) echeancierMap[key] = data.id;
    }
  }
  console.log(`✓ ${Object.keys(echeancierMap).length} échéanciers`);

  // Create paiements
  const methodesTel = {
    orange_money: '+225 05 04 03 02 01',
    mtn_momo: '+225 05 10 20 30 40',
    especes: null,
    virement: null,
  };

  let inserted = 0;
  for (const p of paiementsData) {
    const eleveId = eleveMap[p.eleve];
    const echeancierId = echeancierMap[p.eleve];
    if (!eleveId) continue;

    const reference = `PAY-${new Date(NOW.getTime() - p.daysAgo * MS_IN_DAY).toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const statuts = ['confirme', 'confirme', 'confirme', 'en_attente', 'echoue'];
    const statut = p.montant > 100000 ? 'confirme' : statuts[Math.floor(Math.random() * statuts.length)];

    const { error } = await supabase.from('paiements').insert({
      eleve_id: eleveId,
      montant: p.montant,
      methode: p.methode,
      telephone: methodesTel[p.methode] || null,
      reference,
      statut,
      date_paiement: daysAgo(p.daysAgo),
      echeancier_id: echeancierId || null,
    });

    if (error) {
      console.error(`  ✗ ${p.eleve}: ${error.message}`);
    } else {
      inserted++;
    }
  }
  console.log(`✓ ${inserted} paiements insérés`);

  console.log(`\n✅ Seed terminé avec succès !`);
  console.log(`📊 ${Object.keys(eleveMap).length} élèves · ${inserted} paiements`);
}

seed();
