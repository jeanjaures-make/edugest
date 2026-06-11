import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
