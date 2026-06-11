import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  // First try to connect via pg (direct DB connection)
  const pool = new pg.Pool({
    connectionString: `postgresql://postgres:${serviceRoleKey}@db.ebhiqzribyoytavzmned.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');

    await client.query(`
      ALTER TABLE paiements ALTER COLUMN echeancier_id DROP NOT NULL;
    `);
    console.log('✓ echeancier_id is now nullable in paiements');

    // Also add RLS policies for paiements if missing
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paiements' AND policyname = 'paiements_select') THEN
          CREATE POLICY "paiements_select" ON paiements FOR SELECT USING (
            eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
          );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paiements' AND policyname = 'paiements_insert') THEN
          CREATE POLICY "paiements_insert" ON paiements FOR INSERT WITH CHECK (
            eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
          );
        END IF;
      END $$;
    `);
    console.log('✓ RLS policies added for paiements');

    // Enable RLS on paiements if not already
    await client.query(`
      ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
    `);
    console.log('✓ RLS enabled on paiements');

    client.release();
  } catch (err) {
    console.error('pg connection failed:', err.message);
    console.log('Trying via Supabase JS client...');

    // Fallback: try via supabase rpc
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Try to create a helper function that runs SQL
    const { error: createFuncErr } = await supabase.rpc('get_user_ecole_id');
    if (createFuncErr) {
      console.log('Cannot run DDL via RPC. Please run the migration manually.');
      console.log('\nRun this SQL in Supabase Dashboard > SQL Editor:');
      console.log(`
ALTER TABLE paiements ALTER COLUMN echeancier_id DROP NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paiements' AND policyname = 'paiements_select') THEN
    CREATE POLICY "paiements_select" ON paiements FOR SELECT USING (
      eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paiements' AND policyname = 'paiements_insert') THEN
    CREATE POLICY "paiements_insert" ON paiements FOR INSERT WITH CHECK (
      eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
    );
  END IF;
END $$;

ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
      `);
    }
  } finally {
    await pool.end();
  }
}

run();
