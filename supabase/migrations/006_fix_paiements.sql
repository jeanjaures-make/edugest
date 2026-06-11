-- Fix: make echeancier_id nullable in paiements for direct payments
ALTER TABLE paiements ALTER COLUMN echeancier_id DROP NOT NULL;

-- Add RLS policies for paiements if missing
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
