import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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

const APPRECIATIONS = ['Très Bien', 'Assez Bien', 'Passable', 'Insuffisant', 'Très Faible'];

async function main() {
  // Get the teacher
  const { data: ens } = await supabase.from('personnel')
    .select('id').eq('email', 'konan.teacher@edugest.ci').single();
  const enseignantId = ens?.id || null;
  console.log(`Enseignant: ${enseignantId}`);

  // Get students in 6ème A
  const { data: eleves } = await supabase.from('eleves')
    .select('id, nom, prenom').eq('classe_id', CLASSE_ID).eq('statut', 'actif');
  if (!eleves || eleves.length === 0) { console.log('Aucun élève'); return; }
  console.log(`Élèves: ${eleves.map(e => e.prenom + ' ' + e.nom).join(', ')}`);

  // Delete old evaluations + notes for this class
  const { data: oldEvals } = await supabase.from('evaluations')
    .select('id').eq('classe_id', CLASSE_ID).eq('trimestre', TRIMESTRE);
  if (oldEvals?.length) {
    await supabase.from('notes').delete().in('evaluation_id', oldEvals.map(e => e.id));
    await supabase.from('evaluations').delete().in('id', oldEvals.map(e => e.id));
  }

  // Delete old bulletins
  await supabase.from('bulletins').delete().eq('classe_id', CLASSE_ID).eq('trimestre', TRIMESTRE);

  // Create evaluations: devoir, composition, examen for each subject
  let evalCount = 0;
  for (const mat of MATIERES) {
    const isTeacherSubject = mat.libelle === 'Mathématiques' || mat.libelle === 'Sciences Physiques';
    for (const type of ['devoir', 'composition', 'examen']) {
      const coeff = type === 'devoir' ? 1 : type === 'composition' ? 2 : 3;
      const { error } = await supabase.from('evaluations').insert({
        classe_id: CLASSE_ID,
        matiere_id: mat.id,
        enseignant_id: isTeacherSubject ? enseignantId : null,
        type,
        libelle: `${type === 'devoir' ? 'Devoir' : type === 'composition' ? 'Composition' : 'Examen'} ${mat.libelle} - T${TRIMESTRE}`,
        coefficient: coeff,
        date: new Date(2026, 1 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        trimestre: TRIMESTRE,
        annee_scolaire_id: ANNEE_ID,
      });
      if (!error) evalCount++;
    }
  }
  console.log(`✓ ${evalCount} évaluations créées`);

  // Create notes for each student
  const { data: evaluations } = await supabase.from('evaluations')
    .select('id, matiere_id').eq('classe_id', CLASSE_ID).eq('trimestre', TRIMESTRE);

  // Per-subject grade profiles (moyenne, écart-type) for realistic notes
  const gradeProfiles = {
    'Mathématiques': { mean: 11, std: 4 },
    'Français': { mean: 12, std: 3 },
    'Anglais': { mean: 10, std: 4 },
    'Histoire-Géo': { mean: 13, std: 3 },
    'Sciences Physiques': { mean: 11, std: 4 },
    'SVT': { mean: 14, std: 3 },
    'EPS': { mean: 15, std: 3 },
  };

  let noteCount = 0;
  for (const ev of evaluations || []) {
    // Find which subject this evaluation is for
    const matiere = MATIERES.find(m => m.id === ev.matiere_id);
    const profile = gradeProfiles[matiere?.libelle || ''] || { mean: 10, std: 4 };

    for (const el of eleves) {
      // Use a deterministic-ish grade per student per subject for consistency
      const seed = el.nom.length + el.prenom.length + matiere?.libelle.length;
      const pseudo = ((seed * 7 + 13) % 20) / 20; // 0..1

      // Different eval types get different levels of difficulty
      const difficulty = ev.libelle?.startsWith('Devoir') ? 0.5 : ev.libelle?.startsWith('Composition') ? 0 : -0.5;
      let valeur = Math.round((profile.mean + (pseudo - 0.5) * 2 * profile.std + difficulty) * 10) / 10;
      valeur = Math.max(2, Math.min(20, valeur));

      const appr = APPRECIATIONS[Math.floor(pseudo * APPRECIATIONS.length)];

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

  // Generate bulletins
  const { data: evals } = await supabase
    .from('evaluations')
    .select('id, matiere_id, coefficient, matiere:matieres(coefficient)')
    .eq('classe_id', CLASSE_ID)
    .eq('trimestre', TRIMESTRE)
    .eq('annee_scolaire_id', ANNEE_ID);

  const evalIds = evals.map(e => e.id);
  const evalCoeffMap = {};
  for (const e of evals) {
    const matCoeff = e.matiere?.coefficient ?? 1;
    evalCoeffMap[e.id] = (e.coefficient ?? 1) * matCoeff;
  }

  const { data: noteData } = await supabase.from('notes')
    .select('eleve_id, valeur, evaluation_id').in('evaluation_id', evalIds);

  const studentNotes = {};
  for (const n of noteData || []) {
    if (!studentNotes[n.eleve_id]) studentNotes[n.eleve_id] = { total: 0, coeff: 0 };
    const coeff = evalCoeffMap[n.evaluation_id] ?? 1;
    studentNotes[n.eleve_id].total += (n.valeur ?? 0) * coeff;
    studentNotes[n.eleve_id].coeff += coeff;
  }

  const averages = Object.entries(studentNotes).map(([eleve_id, d]) => ({
    eleve_id, moyenne: d.coeff > 0 ? d.total / d.coeff : 0
  }));
  averages.sort((a, b) => b.moyenne - a.moyenne);
  averages.forEach((a, i) => a.rank = i + 1);

  const bulletins = averages.map(a => ({
    eleve_id: a.eleve_id,
    classe_id: CLASSE_ID,
    trimestre: TRIMESTRE,
    annee_scolaire_id: ANNEE_ID,
    moyenne_generale: Math.round(a.moyenne * 10) / 10,
    rang: a.rank,
    appreciation: a.moyenne >= 16 ? 'Excellent trimestre' :
      a.moyenne >= 14 ? 'Très bon trimestre' :
      a.moyenne >= 12 ? 'Bon trimestre' :
      a.moyenne >= 10 ? 'Trimestre satisfaisant' :
      a.moyenne >= 8 ? 'Peut mieux faire' :
      'Trimestre insuffisant',
  }));

  await supabase.from('bulletins').insert(bulletins);
  console.log(`✓ ${bulletins.length} bulletins générés`);

  console.log('\n=== RÉSULTAT ===');
  for (const b of bulletins) {
    const el = eleves.find(e => e.id === b.eleve_id);
    console.log(`${el?.prenom} ${el?.nom} : ${b.moyenne_generale}/20 - ${b.rang}e - ${b.appreciation}`);
  }
  console.log(`\nConnecte-toi avec konan.teacher@edugest.ci / Test123!`);
  console.log(`Va sur /bulletins, sélectionne 6ème A et T2 pour voir les vrais bulletins !`);
}

main().catch(console.error);
