import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebhiqzribyoytavzmned.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaGlxenJpYnlveXRhdnptbmVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk5MzU0NSwiZXhwIjoyMDk2NTY5NTQ1fQ.6x1KwetPFUNxgEZDBZqHRBJeKgWLtvF6P9_f2I5Uiqc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedSuperadmin() {
  console.log('Creating superadmin user...');
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'superadmin@edugest.ci',
    password: 'SuperAdmin123!',
    email_confirm: true,
  });
  if (authError) { console.error('Auth error:', authError); return; }
  console.log('Superadmin user created:', authUser.user.id);

  console.log('Creating superadmin profile (no ecole_id)...');
  const { error: profilError } = await supabase
    .from('profils')
    .insert({
      user_id: authUser.user.id,
      ecole_id: null, // superadmin has no school
      nom: 'Super',
      prenom: 'Admin',
      telephone: '',
      role: 'superadmin',
    });
  if (profilError) { console.error('Profil error:', profilError); return; }
  console.log('Superadmin profile created');

  console.log('\n✅ Superadmin created!');
  console.log('📧 Email: superadmin@edugest.ci');
  console.log('🔑 Password: SuperAdmin123!');
}

seedSuperadmin();
