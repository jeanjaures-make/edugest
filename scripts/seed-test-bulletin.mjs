import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TRIMESTRE = 2;
const ECOLE_ID = 'cc466919-c754-4003-95c2-916286c8d51d'; // Groupe Scolaire Test
const ANNEE_ID = '3f71c04b-1746-40ec-95bc-4472362a5d21'; // 2025-2026
const CLASSES = [
  { id: '6f35cdba-ebd4-457f-bccb-28d54d10536a', libelle: '6ème A' },
  { id: '375de2b0-77ae-44fd-8331-6eb528e81c60', libelle: '6ème B' },
  { id: '4dff5209-4987-4288-b65d-b51f9f0ce94e', libelle: '5ème A' },
  { id: 'fedace9a-25c5-4948-93b8-e80c06c7a57e', libelle: '5ème B' },
  { id: '2106a59c-f4f5-4a45-a630-f3ccd5bde667', libelle: '4ème A' },
  { id: 'e9849365-bb23-42be-87c8-f01ce8901331', libelle: '4ème B' },
  { id: '641cdd7e-bf9a-46f8-9e12-093640e81406', libelle: '3ème A' },
  { id: 'cc983420-f992-49b3-b1bb-cc0c3d3f678c', libelle: '3ème B' },
  { id: 'cfcbea8b-1712-4daf-a923-ac13052d6305', libelle: '2nde A' },
  { id: '88fa3e67-0853-4e3e-b67e-3e1bd5a2a537', libelle: '2nde B' },
  { id: '78c6a58e-381b-41ae-aa86-9e3b2a7c5b5a', libelle: '1ère A' },
];
const MATIERES = [
  { id: '7c91c77e-4c9a-432e-a0f4-676a67335510', libelle: 'Mathématiques', coeff: 4 },
  { id: 'ce7452c9-8084-4c1a-9f99-9a770f438a04', libelle: 'Français', coeff: 4 },
  { id: '0e31e0df-b4e3-4224-9cf5-4ab28b9feee4', libelle: 'Anglais', coeff: 3 },
  { id: '776ec6fd-094a-4d80-be49-09e3c1340507', libelle: 'Histoire-Géo', coeff: 3 },
  { id: 'cd3727a9-e55f-47bf-8994-fc9b05c67bbe', libelle: 'Sciences Physiques', coeff: 3 },
  { id: '340cf947-1b1d-4eaa-ba90-d00aa0f877ab', libelle: 'SVT', coeff: 2 },
  { id: '65e78c5f-4623-4ee3-a77e-2ae44aa0dd6d', libelle: 'EPS', coeff: 1 },
];

const TEACHER_EMAIL = 'konan.teacher@edugest.ci';
const TEACHER_PASSWORD = 'Test123!';

async function main() {
  console.log('=== 1. Création du compte enseignant ===\n');

  // Delete teacher if exists
  const { data: existing } = await supabase.from('personnel').select('id, profil_id').eq('email', TEACHER_EMAIL).maybeSingle();
  if (existing) {
    if (existing.profil_id) {
      try {
        const { data: p } = await supabase.from('profils').select('user_id').eq('id', existing.profil_id).single();
        if (p?.user_id) await supabase.auth.admin.deleteUser(p.user_id);
      } catch {}
      await supabase.from('profils').delete().eq('id', existing.profil_id);
    }
    await supabase.from('personnel').delete().eq('id', existing.id);
  }
  const { data: users } = await supabase.auth.admin.listUsers();
  const oldUser = users?.users?.find(u => u.email === TEACHER_EMAIL);
  if (oldUser) await supabase.auth.admin.deleteUser(oldUser.id);

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: TEACHER_EMAIL,
    password: TEACHER_PASSWORD,
    email_confirm: true,
  });
  if (authError) { console.error('Erreur création auth:', authError); return; }
  console.log(`✓ Compte créé : ${TEACHER_EMAIL} / ${TEACHER_PASSWORD}`);

  const { data: profil, error: profilError } = await supabase.from('profils').insert({
    user_id: authUser.user.id,
    ecole_id: ECOLE_ID,
    nom: 'Konan',
    prenom: 'Koffi',
    telephone: '+225 07 08 09 10',
    role: 'enseignant',
  }).select().single();
  if (profilError) { console.error('Erreur profil:', profilError); return; }

  const { data: enseignant, error: ensError } = await supabase.from('personnel').insert({
    ecole_id: ECOLE_ID,
    profil_id: profil.id,
    matricule: 'ENS001',
    nom: 'Konan',
    prenom: 'Koffi',
    sexe: 'M',
    type: 'enseignant',
    telephone: '+225 07 08 09 10',
    email: TEACHER_EMAIL,
    statut: 'actif',
  }).select().single();
  if (ensError) { console.error('Erreur personnel:', ensError); return; }
  console.log(`✓ Enseignant créé : ${enseignant.prenom} ${enseignant.nom} (${enseignant.id})`);

  console.log('\n=== 2. Affectation aux classes ===\n');
  // Teacher teaches Math + Sciences Phys to 6ème A, 5ème A, 4ème A, 3ème A
  const matieresTeacher = MATIERES.filter(m => ['Mathématiques', 'Sciences Physiques'].includes(m.libelle));
  const classesTeacher = CLASSES.filter(c => ['6ème A', '5ème A', '4ème A', '3ème A'].includes(c.libelle));
  let assignCount = 0;
  for (const cls of classesTeacher) {
    for (const mat of matieresTeacher) {
      const { error } = await supabase.from('enseignants_classes').insert({
        enseignant_id: enseignant.id,
        classe_id: cls.id,
        matiere_id: mat.id,
        annee_scolaire_id: ANNEE_ID,
      });
      if (!error) assignCount++;
    }
  }
  console.log(`✓ ${assignCount} affectations classe-matière créées`);

  console.log('\n=== 3. Création des évaluations ===\n');
  // Delete existing evaluations for these classes
  const classIds = classesTeacher.map(c => c.id);
  const { data: oldEvals } = await supabase.from('evaluations').select('id').in('classe_id', classIds).eq('trimestre', TRIMESTRE);
  if (oldEvals?.length) {
    await supabase.from('notes').delete().in('evaluation_id', oldEvals.map(e => e.id));
    await supabase.from('evaluations').delete().in('classe_id', classIds).eq('trimestre', TRIMESTRE);
  }

  const typesEval = ['devoir', 'composition', 'examen'];
  let evalCount = 0;
  for (const cls of classesTeacher) {
    for (const mat of matieresTeacher) {
      for (const type of typesEval) {
        const { error } = await supabase.from('evaluations').insert({
          classe_id: cls.id,
          matiere_id: mat.id,
          enseignant_id: enseignant.id,
          type,
          libelle: `${type === 'devoir' ? 'Devoir' : type === 'composition' ? 'Composition' : 'Examen'} ${mat.libelle} - T${TRIMESTRE}`,
          coefficient: type === 'devoir' ? 1 : type === 'composition' ? 2 : 3,
          date: new Date(2026, 2 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          trimestre: TRIMESTRE,
          annee_scolaire_id: ANNEE_ID,
        });
        if (!error) evalCount++;
      }
    }
  }
  console.log(`✓ ${evalCount} évaluations créées`);

  console.log('\n=== 4. Création des notes ===\n');
  const { data: evaluations } = await supabase.from('evaluations').select('id, classe_id, matiere_id').in('classe_id', classIds).eq('trimestre', TRIMESTRE);
  const { data: eleves } = await supabase.from('eleves').select('id, nom, prenom, classe_id').eq('ecole_id', ECOLE_ID).eq('statut', 'actif');
  if (!evaluations || !eleves) { console.error('Données manquantes'); return; }

  let noteCount = 0;
  for (const evalItem of evaluations) {
    const elevesClasse = eleves.filter(e => e.classe_id === evalItem.classe_id);
    for (const el of elevesClasse) {
      if (Math.random() > 0.1) {
        const moyenne = 10;
        const ecart = 4;
        let valeur = Math.round((moyenne + (Math.random() - 0.5) * 2 * ecart) * 10) / 10;
        valeur = Math.max(2, Math.min(20, valeur));
        const appreciations = ['Excellent', 'Très bien', 'Bien', 'Assez bien', 'Passable', 'Insuffisant', 'Peut mieux faire', 'Travail encourageant', null, null, null];
        const { error } = await supabase.from('notes').insert({
          eleve_id: el.id,
          evaluation_id: evalItem.id,
          valeur,
          appreciation: appreciations[Math.floor(Math.random() * appreciations.length)],
        });
        if (!error) noteCount++;
      }
    }
  }
  console.log(`✓ ${noteCount} notes créées pour ${eleves.length} élèves`);

  console.log('\n=== 5. Génération des bulletins (directe) ===\n');
  for (const cls of classesTeacher) {
    await supabase.from('bulletins').delete().eq('classe_id', cls.id).eq('trimestre', TRIMESTRE).eq('annee_scolaire_id', ANNEE_ID);

    const { data: evals } = await supabase
      .from('evaluations')
      .select('id, matiere_id, coefficient, matiere:matieres(coefficient)')
      .eq('classe_id', cls.id)
      .eq('trimestre', TRIMESTRE)
      .eq('annee_scolaire_id', ANNEE_ID);
    if (!evals || evals.length === 0) { console.log(`  ✗ ${cls.libelle} : pas d\\'évaluations`); continue; }

    const evalIds = evals.map(e => e.id);
    const evalCoeffMap = {};
    for (const e of evals) {
      const matCoeff = e.matiere?.coefficient ?? 1;
      evalCoeffMap[e.id] = (e.coefficient ?? 1) * matCoeff;
    }

    const { data: noteData } = await supabase
      .from('notes').select('eleve_id, valeur, evaluation_id')
      .in('evaluation_id', evalIds);
    if (!noteData || noteData.length === 0) { console.log(`  ✗ ${cls.libelle} : pas de notes`); continue; }

    const studentNotes = {};
    for (const n of noteData) {
      if (!studentNotes[n.eleve_id]) studentNotes[n.eleve_id] = { total: 0, coeff: 0 };
      const coeff = evalCoeffMap[n.evaluation_id] ?? 1;
      studentNotes[n.eleve_id].total += (n.valeur ?? 0) * coeff;
      studentNotes[n.eleve_id].coeff += coeff;
    }

    const averages = Object.entries(studentNotes).map(([eleve_id, data]) => ({
      eleve_id,
      moyenne: data.coeff > 0 ? data.total / data.coeff : 0,
    }));
    averages.sort((a, b) => b.moyenne - a.moyenne);
    averages.forEach((a, i) => a.rank = i + 1);

    const bulletins = averages.map(a => ({
      eleve_id: a.eleve_id,
      classe_id: cls.id,
      trimestre: TRIMESTRE,
      annee_scolaire_id: ANNEE_ID,
      moyenne_generale: Math.round(a.moyenne * 10) / 10,
      rang: a.rank,
      appreciation: a.moyenne >= 16 ? 'Excellent trimestre !' :
                    a.moyenne >= 14 ? 'Très bon trimestre.' :
                    a.moyenne >= 12 ? 'Bon trimestre.' :
                    a.moyenne >= 10 ? 'Trimestre satisfaisant.' :
                    a.moyenne >= 8 ? 'Peut mieux faire.' :
                    'Trimestre insuffisant.',
    }));

    const { error } = await supabase.from('bulletins').insert(bulletins);
    if (error) { console.log(`  ✗ ${cls.libelle} : erreur - ${error.message}`); continue; }
    console.log(`  ✓ ${cls.libelle} : ${bulletins.length} bulletins générés`);
  }

  console.log('\n=== 6. Résumé ===');
  console.log(`Enseignant : ${TEACHER_EMAIL} / ${TEACHER_PASSWORD}`);
  console.log(`Classes : ${classesTeacher.map(c => c.libelle).join(', ')}`);
  console.log(`Matières : ${matieresTeacher.map(m => m.libelle).join(', ')}`);
  console.log(`\nConnecte-toi avec ${TEACHER_EMAIL} / ${TEACHER_PASSWORD}`);
  console.log('Puis va sur /bulletins pour télécharger les PDF !\n');
}

main().catch(console.error);
