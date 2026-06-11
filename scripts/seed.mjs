import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebhiqzribyoytavzmned.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaGlxenJpYnlveXRhdnptbmVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk5MzU0NSwiZXhwIjoyMDk2NTY5NTQ1fQ.6x1KwetPFUNxgEZDBZqHRBJeKgWLtvF6P9_f2I5Uiqc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
  console.log('Creating admin user...');
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@edugest.ci',
    password: 'Admin123!',
    email_confirm: true,
  });
  if (authError) { console.error('Auth error:', authError); return; }
  console.log('Admin user created:', authUser.user.id);

  console.log('Creating school...');
  const { data: ecole, error: ecoleError } = await supabase
    .from('ecoles')
    .insert({
      nom: 'Groupe Scolaire Test',
      adresse: 'Abidjan, Cocody',
      telephone: '+225 01 02 03 04',
      email: 'contact@gs-test.ci',
      code_etablissement: 'GST001',
    })
    .select()
    .single();
  if (ecoleError) { console.error('Ecole error:', ecoleError); return; }
  console.log('School created:', ecole.id);

  console.log('Creating admin profile...');
  const { data: profil, error: profilError } = await supabase
    .from('profils')
    .insert({
      user_id: authUser.user.id,
      ecole_id: ecole.id,
      nom: 'Admin',
      prenom: 'Super',
      telephone: '+225 01 02 03 04',
      role: 'directeur',
    })
    .select()
    .single();
  if (profilError) { console.error('Profil error:', profilError); return; }
  console.log('Admin profile created:', profil.id);

  console.log('Creating academic year...');
  const { error: anneeError } = await supabase
    .from('annees_scolaires')
    .insert({
      ecole_id: ecole.id,
      libelle: '2025-2026',
      date_debut: '2025-09-01',
      date_fin: '2026-08-31',
      active: true,
    });
  if (anneeError) { console.error('Annee error:', anneeError); return; }
  console.log('Academic year created');

  console.log('\n✅ Seed complete!');
  console.log('📧 Email: admin@edugest.ci');
  console.log('🔑 Password: Admin123!');
}

seed();
