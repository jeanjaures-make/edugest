import pg from 'pg';

async function fix() {
  const pool = new pg.Pool({
    host: '2a05:d016:c4a:9701:3801:3d98:bed5:e625',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL!');

    await client.query(`DROP POLICY IF EXISTS "profils_select" ON profils;`);
    await client.query(`CREATE POLICY "profils_select" ON profils FOR SELECT USING (user_id = auth.uid());`);
    console.log('✓ profils_select policy fixed');

    await client.query(`DROP POLICY IF EXISTS "profils_insert" ON profils;`);
    await client.query(`CREATE POLICY "profils_insert" ON profils FOR INSERT WITH CHECK (true);`);
    console.log('✓ profils_insert policy fixed');

    // Also make sure get_user_ecole_id function is accessible
    await client.query(`
      CREATE OR REPLACE FUNCTION get_user_ecole_id()
      RETURNS uuid
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      AS $$
        SELECT ecole_id FROM public.profils WHERE user_id = auth.uid() LIMIT 1;
      $$;
    `);
    console.log('✓ get_user_ecole_id recreated');

    client.release();
    console.log('\n✅ All fixes applied successfully!');
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code) console.error('Code:', err.code);
  }
  await pool.end();
}

fix();
