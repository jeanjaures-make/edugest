import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data: ecoles } = await supabase.from('ecoles').select('id, nom, code_etablissement');
  console.log('=== ÉCOLES ===');
  console.table(ecoles || []);

  const { data: annees } = await supabase.from('annees_scolaires').select('id, ecole_id, libelle, active');
  console.log('\n=== ANNÉES SCOLAIRES ===');
  console.table(annees || []);

  const { data: classes } = await supabase.from('classes').select('id, ecole_id, libelle, niveau_id');
  console.log('\n=== CLASSES ===');
  console.table(classes || []);

  const { data: matieres } = await supabase.from('matieres').select('id, ecole_id, libelle, coefficient');
  console.log('\n=== MATIÈRES ===');
  console.table(matieres || []);

  const { count: elevesCount } = await supabase.from('eleves').select('id', { count: 'exact', head: true });
  console.log(`\n=== ÉLÈVES : ${elevesCount} ===`);

  const { data: eleves } = await supabase.from('eleves').select('id, nom, prenom, classe_id, statut, ecole_id').limit(20);
  console.table(eleves || []);

  const { count: evalsCount } = await supabase.from('evaluations').select('id', { count: 'exact', head: true });
  console.log(`\n=== ÉVALUATIONS : ${evalsCount} ===`);

  const { count: notesCount } = await supabase.from('notes').select('id', { count: 'exact', head: true });
  console.log(`\n=== NOTES : ${notesCount} ===`);

  const { count: bulletinsCount } = await supabase.from('bulletins').select('id', { count: 'exact', head: true });
  console.log(`\n=== BULLETINS : ${bulletinsCount} ===`);

  const { count: presencesCount } = await supabase.from('presences').select('id', { count: 'exact', head: true });
  console.log(`\n=== PRÉSENCES : ${presencesCount} ===`);

  const { data: personnel } = await supabase.from('personnel').select('id, nom, prenom, email, type, ecole_id');
  console.log('\n=== PERSONNEL ===');
  console.table(personnel || []);
}

main().catch(console.error);
