import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ECOLE_ID = 'cc466919-c754-4003-95c2-916286c8d51d';
const ANNEE_ID = '3f71c04b-1746-40ec-95bc-4472362a5d21';
const CLASSE_ID = '6f35cdba-ebd4-457f-bccb-28d54d10536a'; // 6ème A
const TRIMESTRE = 2;

const MATIERES = [
  { id: '7c91c77e-4c9a-432e-a0f4-676a67335510', libelle: 'Mathématiques', coeff: 4 },
  { id: 'ce7452c9-8084-4c1a-9f99-9a770f438a04', libelle: 'Français', coeff: 4 },
  { id: '0e31e0df-b4e3-4224-9cf5-4ab28b9feee4', libelle: 'Anglais', coeff: 3 },
  { id: '776ec6fd-094a-4d80-be49-09e3c1340507', libelle: 'Histoire-Géo', coeff: 3 },
  { id: 'cd3727a9-e55f-47bf-8994-fc9b05c67bbe', libelle: 'Sciences Physiques', coeff: 3 },
  { id: '340cf947-1b1d-4eaa-ba90-d00aa0f877ab', libelle: 'SVT', coeff: 2 },
  { id: '65e78c5f-4623-4ee3-a77e-2ae44aa0dd6d', libelle: 'EPS', coeff: 1 },
];

const ENSEIGNANT_ID = '34d7c2cd-3e3c-4dcd-b161-e9314c558194'; // Konan Koffi

function randomNote(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

function getAppreciation(moy) {
  if (moy >= 16) return 'Excellent';
  if (moy >= 14) return 'Très bien';
  if (moy >= 12) return 'Bien';
  if (moy >= 10) return 'Assez bien';
  if (moy >= 8) return 'Passable';
  return 'Insuffisant';
}

async function main() {
  console.log('=== SEED COMPLET BULLETIN — 6ème A T2 ===\n');

  // 1. Récupérer les élèves de 6ème A
  const { data: eleves, error: errEleves } = await supabase
    .from('eleves')
    .select('id, nom, prenom, matricule, sexe, date_naissance, lieu_naissance, nationalite')
    .eq('ecole_id', ECOLE_ID)
    .eq('classe_id', CLASSE_ID)
    .eq('statut', 'actif')
    .order('nom');

  if (errEleves || !eleves || eleves.length === 0) {
    console.error('Aucun élève en 6ème A:', errEleves);
    return;
  }
  console.log(`✓ ${eleves.length} élèves trouvés en 6ème A`);
  eleves.forEach(e => console.log(`  - ${e.prenom} ${e.nom} (${e.matricule})`));

  // 2. Supprimer les anciennes évaluations/notes/bulletins pour cette classe/trimestre
  console.log('\n=== Nettoyage des anciennes données ===');
  const { data: oldEvals } = await supabase
    .from('evaluations')
    .select('id')
    .eq('classe_id', CLASSE_ID)
    .eq('trimestre', TRIMESTRE)
    .eq('annee_scolaire_id', ANNEE_ID);

  if (oldEvals && oldEvals.length > 0) {
    await supabase.from('notes').delete().in('evaluation_id', oldEvals.map(e => e.id));
    await supabase.from('evaluations').delete().in('id', oldEvals.map(e => e.id));
    console.log(`✓ ${oldEvals.length} anciennes évaluations supprimées`);
  }

  await supabase.from('bulletins').delete()
    .eq('classe_id', CLASSE_ID)
    .eq('trimestre', TRIMESTRE)
    .eq('annee_scolaire_id', ANNEE_ID);

  // 3. Créer des évaluations pour TOUTES les matières
  console.log('\n=== Création des évaluations ===');
  const evalTypes = [
    { type: 'devoir', libelle: 'Devoir', coeff: 1 },
    { type: 'composition', libelle: 'Composition', coeff: 2 },
  ];

  let evalCount = 0;
  const evalMap = []; // { id, matiere_id, coefficient }

  for (const mat of MATIERES) {
    for (const et of evalTypes) {
      const { data, error } = await supabase.from('evaluations').insert({
        classe_id: CLASSE_ID,
        matiere_id: mat.id,
        enseignant_id: ENSEIGNANT_ID,
        type: et.type,
        libelle: `${et.libelle} ${mat.libelle} T${TRIMESTRE}`,
        coefficient: et.coeff,
        date: new Date(2026, 2 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        trimestre: TRIMESTRE,
        annee_scolaire_id: ANNEE_ID,
      }).select().single();

      if (error) {
        console.error(`  ✗ ${mat.libelle} ${et.libelle}: ${error.message}`);
      } else {
        evalMap.push({ id: data.id, matiere_id: mat.id, coefficient: et.coeff, matiere_coeff: mat.coeff });
        evalCount++;
      }
    }
  }
  console.log(`✓ ${evalCount} évaluations créées (${MATIERES.length} matières × 2 types)`);

  // 4. Créer des notes pour tous les élèves
  console.log('\n=== Création des notes ===');
  let noteCount = 0;

  // Profils de notes par élève (certains bons, certains moyens, certains faibles)
  const profiles = eleves.map((_, i) => {
    const base = 8 + (i % 5) * 2.5; // 8, 10.5, 13, 15.5, 18 puis cycle
    return { base, variance: 3 };
  });

  for (const ev of evalMap) {
    for (let i = 0; i < eleves.length; i++) {
      const el = eleves[i];
      const prof = profiles[i];
      // Note autour du profil de l'élève avec variation
      let valeur = randomNote(Math.max(2, prof.base - prof.variance), Math.min(20, prof.base + prof.variance));
      const appreciations = ['Excellent travail', 'Très bien', 'Bien', 'Assez bien', 'Passable', 'Peut mieux faire', 'Travail insuffisant', null, null];
      const appr = appreciations[Math.floor(Math.random() * appreciations.length)];

      const { error } = await supabase.from('notes').insert({
        eleve_id: el.id,
        evaluation_id: ev.id,
        valeur,
        appreciation: appr,
      });

      if (!error) noteCount++;
    }
  }
  console.log(`✓ ${noteCount} notes créées`);

  // 5. Créer des présences
  console.log('\n=== Création des présences ===');
  // Supprimer anciennes présences pour cette classe
  await supabase.from('presences').delete().eq('classe_id', CLASSE_ID);

  const presencesCount = { present: 0, absent: 0, retard: 0, exclu: 0 };
  const dates = [];
  const today = new Date();
  for (let d = 0; d < 30; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() !== 0) { // Pas dimanche
      dates.push(date.toISOString().split('T')[0]);
    }
  }

  for (const el of eleves) {
    for (const dateStr of dates.slice(0, 20)) {
      const rand = Math.random();
      let statut = 'present';
      let motif = null;

      if (rand > 0.92) {
        statut = 'absent';
        motif = Math.random() > 0.5 ? 'Maladie' : null;
      } else if (rand > 0.88) {
        statut = 'retard';
      }

      await supabase.from('presences').insert({
        eleve_id: el.id,
        classe_id: CLASSE_ID,
        date: dateStr,
        statut,
        motif,
        enseignant_id: ENSEIGNANT_ID,
      });
      presencesCount[statut]++;
    }
  }
  console.log(`✓ Présences: ${presencesCount.present} présents, ${presencesCount.absent} absents, ${presencesCount.retard} retards`);

  // 6. Calculer les moyennes et générer les bulletins
  console.log('\n=== Génération des bulletins ===');

  // Calculer la moyenne par matière pour chaque élève
  const studentSubjectMoy = {}; // { eleve_id: { matiere_id: moyenne } }
  const classSubjectMoy = {}; // { matiere_id: [moyennes] }

  for (const mat of MATIERES) {
    classSubjectMoy[mat.id] = [];
    const matEvals = evalMap.filter(e => e.matiere_id === mat.id);

    for (const el of eleves) {
      let total = 0;
      let coeffSum = 0;
      for (const ev of matEvals) {
        const { data: noteData } = await supabase
          .from('notes')
          .select('valeur')
          .eq('eleve_id', el.id)
          .eq('evaluation_id', ev.id)
          .maybeSingle();

        if (noteData) {
          const evalCoeff = ev.coefficient;
          const matCoeff = ev.matiere_coeff;
          const totalCoeff = evalCoeff * matCoeff;
          total += noteData.valeur * totalCoeff;
          coeffSum += totalCoeff;
        }
      }

      const moy = coeffSum > 0 ? total / coeffSum : 0;
      if (!studentSubjectMoy[el.id]) studentSubjectMoy[el.id] = {};
      studentSubjectMoy[el.id][mat.id] = moy;
      classSubjectMoy[mat.id].push(moy);
    }
  }

  // Calculer la moyenne générale par élève
  const averages = eleves.map(el => {
    let total = 0;
    let coeffSum = 0;
    for (const mat of MATIERES) {
      const moy = studentSubjectMoy[el.id]?.[mat.id] ?? 0;
      total += moy * mat.coeff;
      coeffSum += mat.coeff;
    }
    return {
      eleve_id: el.id,
      moyenne: coeffSum > 0 ? total / coeffSum : 0,
    };
  });

  // Trier par moyenne décroissante pour le rang
  averages.sort((a, b) => b.moyenne - a.moyenne);
  averages.forEach((a, i) => { a.rang = i + 1; });

  // Insérer les bulletins
  const bulletins = averages.map(a => ({
    eleve_id: a.eleve_id,
    classe_id: CLASSE_ID,
    trimestre: TRIMESTRE,
    annee_scolaire_id: ANNEE_ID,
    moyenne_generale: Math.round(a.moyenne * 10) / 10,
    rang: a.rang,
    appreciation: getAppreciation(a.moyenne),
  }));

  const { error: bulError } = await supabase.from('bulletins').insert(bulletins);
  if (bulError) {
    console.error('Erreur insertion bulletins:', bulError);
  } else {
    console.log(`✓ ${bulletins.length} bulletins générés`);
  }

  // Afficher le classement
  console.log('\n=== CLASSEMENT 6ème A — T2 ===');
  for (const a of averages) {
    const el = eleves.find(e => e.id === a.eleve_id);
    console.log(`  ${a.rang}e — ${el.prenom} ${el.nom} — ${a.moyenne.toFixed(2)}/20 — ${getAppreciation(a.moyenne)}`);
  }

  // Stats de classe
  const moyGenerales = averages.map(a => a.moyenne);
  const moyClasse = moyGenerales.reduce((a, b) => a + b, 0) / moyGenerales.length;
  const maxClasse = Math.max(...moyGenerales);
  const minClasse = Math.min(...moyGenerales);
  console.log(`\nMoyenne classe: ${moyClasse.toFixed(2)} | Max: ${maxClasse.toFixed(2)} | Min: ${minClasse.toFixed(2)}`);

  console.log('\n=== TERMINÉ ===');
  console.log('Connecte-toi en tant que directeur, va sur /bulletins,');
  console.log('sélectionne 6ème A et Trimestre 2, puis télécharge un bulletin !\n');
}

main().catch(console.error);
