import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TRIMESTRE = 2;
const ANNEE_ID = 'ba48a51a-12b5-41c7-8698-14a1a8697215'; // à ajuster

async function seedNotesEtPresences() {
  console.log('Chargement des données existantes...');

  const { data: ecoles } = await supabase.from('ecoles').select('id').limit(1);
  if (!ecoles || ecoles.length === 0) { console.log('Aucune école'); return; }
  const ecoleId = ecoles[0].id;

  const { data: annees } = await supabase.from('annees_scolaires').select('id').eq('ecole_id', ecoleId).limit(1);
  if (!annees || annees.length === 0) { console.log('Aucune année'); return; }
  const anneeId = annees[0].id;

  const { data: classes } = await supabase.from('classes').select('id, libelle').eq('ecole_id', ecoleId);
  if (!classes || classes.length === 0) { console.log('Aucune classe'); return; }

  const { data: matieres } = await supabase.from('matieres').select('id, libelle, coefficient').eq('ecole_id', ecoleId);
  if (!matieres || matieres.length === 0) { console.log('Aucune matière'); return; }

  // Create evaluations
  const typesEval = ['devoir', 'composition', 'examen'];
  let evalCount = 0;
  for (const cls of classes) {
    for (const mat of matieres) {
      const type = typesEval[Math.floor(Math.random() * typesEval.length)];
      const { error } = await supabase.from('evaluations').insert({
        classe_id: cls.id,
        matiere_id: mat.id,
        type,
        libelle: `${type === 'devoir' ? 'Devoir' : type === 'composition' ? 'Composition' : 'Examen'} ${mat.libelle} - T${TRIMESTRE}`,
        coefficient: mat.coefficient,
        date: new Date(2026, 2 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
        trimestre: TRIMESTRE,
        annee_scolaire_id: anneeId,
      });
      if (!error) evalCount++;
    }
  }
  console.log(`✓ ${evalCount} évaluations créées`);

  // Fetch evaluations and students
  const { data: evaluations } = await supabase.from('evaluations').select('id, classe_id').eq('annee_scolaire_id', anneeId);
  const { data: eleves } = await supabase.from('eleves').select('id, nom, prenom, classe_id').eq('ecole_id', ecoleId).eq('statut', 'actif');

  if (!evaluations || !eleves) { console.log('Données manquantes'); return; }

  // Create notes
  let noteCount = 0;
  for (const evalItem of evaluations) {
    const elevesDeLaClasse = eleves.filter(e => e.classe_id === evalItem.classe_id);
    for (const el of elevesDeLaClasse) {
      if (Math.random() > 0.15) { // 85% des élèves ont une note
        const valeur = Math.round((Math.random() * 16 + 4) * 10) / 10; // note entre 4 et 20
        const appreciations = [
          'Très bien', 'Bien', 'Assez bien', 'Passable', 'Insuffisant',
          'Peut mieux faire', 'Encourageant', 'Bon travail', 'À améliorer', null
        ];
        const { error } = await supabase.from('notes').insert({
          eleve_id: el.id,
          evaluation_id: evalItem.id,
          valeur: Math.min(valeur, 20),
          appreciation: appreciations[Math.floor(Math.random() * appreciations.length)],
        });
        if (!error) noteCount++;
      }
    }
  }
  console.log(`✓ ${noteCount} notes créées`);

  // Create presences
  const statuts = ['present', 'present', 'present', 'present', 'absent', 'retard', 'exclu'];
  let presCount = 0;
  for (const el of eleves) {
    for (let d = 0; d < 20; d++) {
      const date = new Date(2026, 4, 5 + d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const statut = statuts[Math.floor(Math.random() * statuts.length)];
      const motifs = statut !== 'present' ? ['Maladie', 'Retard de transport', 'Raison familiale', 'Autorisation', null] : [null];
      const { error } = await supabase.from('presences').insert({
        eleve_id: el.id,
        classe_id: el.classe_id,
        date: date.toISOString().split('T')[0],
        statut,
        motif: statut !== 'present' ? motifs[Math.floor(Math.random() * motifs.length)] : null,
      });
      if (!error) presCount++;
    }
  }
  console.log(`✓ ${presCount} présences créées`);

  console.log(`\n✅ Seed terminé ! ${noteCount} notes · ${presCount} présences`);
}

seedNotesEtPresences();
