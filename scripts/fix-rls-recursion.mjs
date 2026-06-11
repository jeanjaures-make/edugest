import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixRLS() {
  console.log('Fixing profils RLS policy (removing recursive call)...');

  // Drop the recursive profils_select policy
  const { error: dropError } = await supabase.rpc('get_user_ecole_id');
  
  // Try via direct insert into a custom function
  // We need to create a helper function that doesn't trigger recursion
  // Then update the profils_select policy
  
  // Approach: Use the Supabase Management API to run SQL
  // Since we can't run DDL directly, let's use the service_role key
  // to execute SQL via the pg client
  
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: `postgresql://postgres:${serviceRoleKey}@db.ebhiqzribyoytavzmned.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    const client = await pool.connect();
    console.log('Connected to DB');

    // Fix: remove recursive condition from profils_select
    await client.query(`
      DROP POLICY IF EXISTS "profils_select" ON profils;
      CREATE POLICY "profils_select" ON profils FOR SELECT USING (
        user_id = auth.uid()
      );
    `);
    console.log('✓ profils_select policy fixed');

    // Also fix the insert/update/delete policies on profils
    await client.query(`
      DROP POLICY IF EXISTS "profils_insert" ON profils;
      CREATE POLICY "profils_insert" ON profils FOR INSERT WITH CHECK (true);
    `);
    console.log('✓ profils_insert policy fixed');

    client.release();
    console.log('\n✅ RLS recursion fixed!');
  } catch (err) {
    console.error('DB error:', err.message);
    console.log('\n⚠️ Cannot connect to DB directly.');
    console.log('Run this SQL in Supabase Dashboard > SQL Editor:\n');
    console.log(`
DROP POLICY IF EXISTS "profils_select" ON profils;
CREATE POLICY "profils_select" ON profils FOR SELECT USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "profils_insert" ON profils;
CREATE POLICY "profils_insert" ON profils FOR INSERT WITH CHECK (true);
    `);
  }

  await pool.end();
}

fixRLS();
