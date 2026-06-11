import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebhiqzribyoytavzmned.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaGlxenJpYnlveXRhdnptbmVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk5MzU0NSwiZXhwIjoyMDk2NTY5NTQ1fQ.6x1KwetPFUNxgEZDBZqHRBJeKgWLtvF6P9_f2I5Uiqc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await supabase.from('paiements').insert({
    eleve_id: '00000000-0000-0000-0000-000000000001',
    montant: 1000,
    methode: 'orange_money',
    reference: 'TEST-NULL-001',
    statut: 'confirme',
    telephone: '+225 01 02 03 04',
    date_paiement: new Date().toISOString(),
  }).select();

  if (error) {
    console.log('Insert error:', error.message);
    if (error.message.includes('violates not-null constraint')) {
      console.log('Column echeancier_id is NOT NULL - need to alter');
      // Try to create the function and alter column via supabase.auth
      const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql_text: 'ALTER TABLE paiements ALTER COLUMN echeancier_id DROP NOT NULL;'
      });
      if (rpcError) {
        console.log('RPC error:', rpcError.message);
        console.log('Creating exec_sql function...');
        // Can't create function without SQL access
      }
    }
  } else {
    console.log('Insert succeeded:', data);
    // Clean up test insert
    if (data && data[0]) {
      await supabase.from('paiements').delete().eq('id', data[0].id);
    }
  }
}

run();
