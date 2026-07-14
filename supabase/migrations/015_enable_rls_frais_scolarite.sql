-- Fix Supabase security advisor ERROR: "RLS Disabled in Public"
-- La table frais_scolarite a des policies (004/005) mais RLS n'a jamais été activé,
-- ce qui la laisse exposée sans protection via PostgREST.

ALTER TABLE frais_scolarite ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "frais_scolarite_select" ON frais_scolarite;
  DROP POLICY IF EXISTS "frais_scolarite_insert" ON frais_scolarite;
  DROP POLICY IF EXISTS "frais_scolarite_update" ON frais_scolarite;
  DROP POLICY IF EXISTS "frais_scolarite_delete" ON frais_scolarite;

  CREATE POLICY "frais_scolarite_select" ON frais_scolarite FOR SELECT USING (
    ecole_id = get_user_ecole_id()
  );
  CREATE POLICY "frais_scolarite_insert" ON frais_scolarite FOR INSERT WITH CHECK (
    ecole_id = get_user_ecole_id()
  );
  CREATE POLICY "frais_scolarite_update" ON frais_scolarite FOR UPDATE USING (
    ecole_id = get_user_ecole_id()
  );
  CREATE POLICY "frais_scolarite_delete" ON frais_scolarite FOR DELETE USING (
    ecole_id = get_user_ecole_id()
  );
END $$;
