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

const ECOLE_ID = 'ea31b5e1-67e4-4d24-8f5a-fbb66b5ffffd'; // SAPE
const ANNEE_ID = '40524d0d-7b9e-4f3b-9c5e-2a3b4c5d6e7f'; // will fetch dynamically
const TRIMESTRE = 2;

async function main() {
  // Fetch active year
  const { data: annee } = await supabase
    .from('annees_scolaires')
    .select('id, libelle')
    .eq('ecole_id', ECOLE_ID)
    .eq('active', true)
    .single();
  if (!annee) { console.error('Aucune année active'); return; }
  console.log(`Année: ${annee.libelle} (${annee.id})`);

  // Fetch classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, libelle')
    .eq('ecole_id', ECOLE_ID);
  if (!classes || classes.length === 0) { console.error('Aucune classe'); return; }
  console.log(`Classes: ${classes.map(c => c.libelle).join(', ')}`);

  // Fetch matières
  const { data: matieres } = await supabase
    .from('matieres')
    .select('id, libelle, coefficient')
    .eq('ecole_id', ECOLE_ID);
  if (!matieres || matieres.length === 0) { console.error('Aucune matière'); return; }
  console.log(`Matières: ${matieres.length}`);

  // Fetch enseignants
  const { data: enseignants } = await supabase
    .from('personnel')
    .select('id, nom, prenom')
    .eq('ecole_id', ECOLE_ID)
    .eq('type', 'enseignant')
    .eq('statut', 'actif');
  if (!enseignants || enseignants.length === 0) { console.error('Aucun enseignant'); return; }
  console.log(`Enseignants: ${enseignants.length}`);

  // Fetch all eleves
  const { data: elevesAll } = await supabase
    .from('eleves')
    .select('id, nom, prenom, matricule, classe_id, sexe, date_naissance, lieu_naissance, nationalite')
    .eq('ecole_id', ECOLE_ID)
    .eq('statut', 'actif');
  if (!elevesAll || elevesAll.length === 0) { console.error('Aucun élève'); return; }
  console.log(`Élèves: ${elevesAll.length}`);

  // Assign élèves without classe to classes (round-robin)
  const elevesSansClasse = elevesAll.filter(e => !e.classe_id);
  if (elevesSansClasse.length > 0) {
    console.log(`\n=== Assignation des ${elevesSansClasse.length} élèves sans classe ===`);
    for (let i = 0; i < elevesSansClasse.length; i++) {
      const cls = classes[i % classes.length];
      await supabase.from('eleves').update({ classe_id: cls.id }).eq('id', elevesSansClasse[i].id);
      console.log(`  ✓ ${elevesSansClasse[i].prenom} ${elevesSansClasse[i].nom} → ${cls.libelle}`);
    }
  }

  // Re-fetch eleves with updated classes
  const { data: eleves } = await supabase
    .from('eleves')
    .select('id, nom, prenom, matricule, classe_id, sexe')
    .eq('ecole_id', ECOLE_ID)
    .eq('statut', 'actif');

  function randomNote(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10;
  }

  function getAppreciation(moy) {
    if (moy >= 16) return 'Excellent trimestre';
    if (moy >= 14) return 'Très bon trimestre';
    if (moy >= 12) return 'Bon trimestre';
    if (moy >= 10) return 'Trimestre satisfaisant';
    if (moy >= 8) return 'Peut mieux faire';
    return 'Trimestre insuffisant';
  }

  for (const cls of classes) {
    const elevesClasse = (eleves || []).filter(e => e.classe_id === cls.id);
    if (elevesClasse.length === 0) {
      console.log(`\n✗ ${cls.libelle}: aucun élève, skip`);
      continue;
    }

    console.log(`\n=== ${cls.libelle} (${elevesClasse.length} élèves) ===`);

    // Clean old data
    const { data: oldEvals } = await supabase
      .from('evaluations')
      .select('id')
      .eq('classe_id', cls.id)
      .eq('trimestre', TRIMESTRE)
      .eq('annee_scolaire_id', annee.id);
    if (oldEvals && oldEvals.length > 0) {
      await supabase.from('notes').delete().in('evaluation_id', oldEvals.map(e => e.id));
      await supabase.from('evaluations').delete().in('id', oldEvals.map(e => e.id));
    }
    await supabase.from('bulletins').delete()
      .eq('classe_id', cls.id)
      .eq('trimestre', TRIMESTRE)
      .eq('annee_scolaire_id', annee.id);
    await supabase.from('presences').delete().eq('classe_id', cls.id);

    // Create evaluations: 2 per matiere (devoir + composition)
    const evalMap = [];
    for (const mat of matieres) {
      const ens = enseignants[matieres.indexOf(mat) % enseignants.length];
      for (const et of [{ type: 'devoir', lib: 'Devoir', coeff: 1 }, { type: 'composition', lib: 'Composition', coeff: 2 }]) {
        const { data, error } = await supabase.from('evaluations').insert({
          classe_id: cls.id,
          matiere_id: mat.id,
          enseignant_id: ens.id,
          type: et.type,
          libelle: `${et.lib} ${mat.libelle} T${TRIMESTRE}`,
          coefficient: et.coeff,
          date: new Date(2026, 2 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          trimestre: TRIMESTRE,
          annee_scolaire_id: annee.id,
        }).select().single();
        if (error) { console.error(`  ✗ Eval ${mat.libelle} ${et.lib}: ${error.message}`); continue; }
        evalMap.push({ id: data.id, matiere_id: mat.id, coefficient: et.coeff, matiere_coeff: mat.coefficient });
      }
    }
    console.log(`  ✓ ${evalMap.length} évaluations créées`);

    // Create notes
    const profiles = elevesClasse.map((_, i) => ({
      base: 8 + (i % 4) * 2.8, // 8, 10.8, 13.6, 16.4
      variance: 3,
    }));

    let noteCount = 0;
    for (const ev of evalMap) {
      for (let i = 0; i < elevesClasse.length; i++) {
        const el = elevesClasse[i];
        const prof = profiles[i];
        let valeur = randomNote(Math.max(2, prof.base - prof.variance), Math.min(20, prof.base + prof.variance));
        const appreciations = ['Excellent travail', 'Très bien', 'Bien', 'Assez bien', 'Passable', 'Peut mieux faire', 'Insuffisant', null, null];
        const { error } = await supabase.from('notes').insert({
          eleve_id: el.id,
          evaluation_id: ev.id,
          valeur,
          appreciation: appreciations[Math.floor(Math.random() * appreciations.length)],
        });
        if (!error) noteCount++;
      }
    }
    console.log(`  ✓ ${noteCount} notes créées`);

    // Create presences
    const dates = [];
    const today = new Date();
    for (let d = 0; d < 40; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      if (date.getDay() !== 0) dates.push(date.toISOString().split('T')[0]);
    }

    let presCount = 0;
    for (const el of elevesClasse) {
      for (const dateStr of dates.slice(0, 25)) {
        const rand = Math.random();
        let statut = 'present';
        let motif = null;
        if (rand > 0.93) { statut = 'absent'; motif = Math.random() > 0.5 ? 'Maladie' : null; }
        else if (rand > 0.89) { statut = 'retard'; }
        await supabase.from('presences').insert({
          eleve_id: el.id, classe_id: cls.id, date: dateStr, statut, motif,
          enseignant_id: enseignants[0].id,
        });
        presCount++;
      }
    }
    console.log(`  ✓ ${presCount} présences créées`);

    // Calculate bulletins
    const studentSubjectMoy = {};
    for (const mat of matieres) {
      const matEvals = evalMap.filter(e => e.matiere_id === mat.id);
      for (const el of elevesClasse) {
        let total = 0, coeffSum = 0;
        for (const ev of matEvals) {
          const { data: noteData } = await supabase
            .from('notes').select('valeur')
            .eq('eleve_id', el.id).eq('evaluation_id', ev.id).maybeSingle();
          if (noteData) {
            const tc = ev.coefficient * ev.matiere_coeff;
            total += noteData.valeur * tc;
            coeffSum += tc;
          }
        }
        const moy = coeffSum > 0 ? total / coeffSum : 0;
        if (!studentSubjectMoy[el.id]) studentSubjectMoy[el.id] = {};
        studentSubjectMoy[el.id][mat.id] = moy;
      }
    }

    const averages = elevesClasse.map(el => {
      let total = 0, coeffSum = 0;
      for (const mat of matieres) {
        const moy = studentSubjectMoy[el.id]?.[mat.id] ?? 0;
        total += moy * mat.coefficient;
        coeffSum += mat.coefficient;
      }
      return { eleve_id: el.id, moyenne: coeffSum > 0 ? total / coeffSum : 0 };
    });

    averages.sort((a, b) => b.moyenne - a.moyenne);
    averages.forEach((a, i) => { a.rang = i + 1; });

    const bulletins = averages.map(a => ({
      eleve_id: a.eleve_id,
      classe_id: cls.id,
      trimestre: TRIMESTRE,
      annee_scolaire_id: annee.id,
      moyenne_generale: Math.round(a.moyenne * 10) / 10,
      rang: a.rang,
      appreciation: getAppreciation(a.moyenne),
    }));

    const { error: bulError } = await supabase.from('bulletins').insert(bulletins);
    if (bulError) { console.error(`  ✗ Bulletins: ${bulError.message}`); }
    else {
      console.log(`  ✓ ${bulletins.length} bulletins générés`);
      averages.forEach(a => {
        const el = elevesClasse.find(e => e.id === a.eleve_id);
        console.log(`    ${a.rang}e — ${el.prenom} ${el.nom} — ${a.moyenne.toFixed(2)}/20 — ${getAppreciation(a.moyenne)}`);
      });
    }
  }

  console.log('\n=== TERMINÉ ===');
  console.log('Va sur /bulletins, sélectionne une classe et Trimestre 2, puis Générer ou télécharger !\n');
}

main().catch(console.error);
