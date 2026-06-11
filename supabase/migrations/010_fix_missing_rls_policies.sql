-- Fix: Add missing RLS policies for tables with RLS enabled but no policies.
-- Also enable RLS on annees_scolaires which had no RLS at all.
-- Uses PL/pgSQL DO blocks to handle tables that may not exist.

-- ============================================================
-- 1. Enable RLS + policies on annees_scolaires
-- ============================================================
DO $$ BEGIN
  ALTER TABLE annees_scolaires ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "annees_scolaires_select" ON annees_scolaires;
DROP POLICY IF EXISTS "annees_scolaires_insert" ON annees_scolaires;
DROP POLICY IF EXISTS "annees_scolaires_update" ON annees_scolaires;
DROP POLICY IF EXISTS "annees_scolaires_delete" ON annees_scolaires;

CREATE POLICY "annees_scolaires_select" ON annees_scolaires FOR SELECT USING (
  ecole_id = get_user_ecole_id()
);
CREATE POLICY "annees_scolaires_insert" ON annees_scolaires FOR INSERT WITH CHECK (
  ecole_id = get_user_ecole_id()
);
CREATE POLICY "annees_scolaires_update" ON annees_scolaires FOR UPDATE USING (
  ecole_id = get_user_ecole_id()
);
CREATE POLICY "annees_scolaires_delete" ON annees_scolaires FOR DELETE USING (
  ecole_id = get_user_ecole_id()
);

-- ============================================================
-- 2. echeanciers
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "echeanciers_select" ON echeanciers;
  DROP POLICY IF EXISTS "echeanciers_insert" ON echeanciers;
  DROP POLICY IF EXISTS "echeanciers_update" ON echeanciers;
  DROP POLICY IF EXISTS "echeanciers_delete" ON echeanciers;

  CREATE POLICY "echeanciers_select" ON echeanciers FOR SELECT USING (
    eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "echeanciers_insert" ON echeanciers FOR INSERT WITH CHECK (
    eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "echeanciers_update" ON echeanciers FOR UPDATE USING (
    eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "echeanciers_delete" ON echeanciers FOR DELETE USING (
    eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
  );
END $$;

-- ============================================================
-- 3. inscriptions
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "inscriptions_select" ON inscriptions;
  DROP POLICY IF EXISTS "inscriptions_insert" ON inscriptions;
  DROP POLICY IF EXISTS "inscriptions_update" ON inscriptions;
  DROP POLICY IF EXISTS "inscriptions_delete" ON inscriptions;

  CREATE POLICY "inscriptions_select" ON inscriptions FOR SELECT USING (
    classe_id IN (SELECT id FROM classes WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "inscriptions_insert" ON inscriptions FOR INSERT WITH CHECK (
    classe_id IN (SELECT id FROM classes WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "inscriptions_update" ON inscriptions FOR UPDATE USING (
    classe_id IN (SELECT id FROM classes WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "inscriptions_delete" ON inscriptions FOR DELETE USING (
    classe_id IN (SELECT id FROM classes WHERE ecole_id = get_user_ecole_id())
  );
END $$;

-- ============================================================
-- 4. cantine_repas
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "cantine_repas_select" ON cantine_repas;
  DROP POLICY IF EXISTS "cantine_repas_insert" ON cantine_repas;

  CREATE POLICY "cantine_repas_select" ON cantine_repas FOR SELECT USING (
    eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "cantine_repas_insert" ON cantine_repas FOR INSERT WITH CHECK (
    eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
  );
END $$;

-- ============================================================
-- 5. communications_lues
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "communications_lues_select" ON communications_lues;
  DROP POLICY IF EXISTS "communications_lues_insert" ON communications_lues;

  CREATE POLICY "communications_lues_select" ON communications_lues FOR SELECT USING (
    communication_id IN (SELECT id FROM communications WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "communications_lues_insert" ON communications_lues FOR INSERT WITH CHECK (
    communication_id IN (SELECT id FROM communications WHERE ecole_id = get_user_ecole_id())
  );
END $$;

-- ============================================================
-- 6. enseignants_matieres
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enseignants_matieres') THEN
    DROP POLICY IF EXISTS "enseignants_matieres_select" ON enseignants_matieres;
    DROP POLICY IF EXISTS "enseignants_matieres_insert" ON enseignants_matieres;

    CREATE POLICY "enseignants_matieres_select" ON enseignants_matieres FOR SELECT USING (
      enseignant_id IN (SELECT id FROM personnel WHERE ecole_id = get_user_ecole_id())
    );
    CREATE POLICY "enseignants_matieres_insert" ON enseignants_matieres FOR INSERT WITH CHECK (
      enseignant_id IN (SELECT id FROM personnel WHERE ecole_id = get_user_ecole_id())
    );
  END IF;
END $$;

-- ============================================================
-- 7. enseignants_classes
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'enseignants_classes') THEN
    DROP POLICY IF EXISTS "enseignants_classes_select" ON enseignants_classes;
    DROP POLICY IF EXISTS "enseignants_classes_insert" ON enseignants_classes;

    CREATE POLICY "enseignants_classes_select" ON enseignants_classes FOR SELECT USING (
      enseignant_id IN (SELECT id FROM personnel WHERE ecole_id = get_user_ecole_id())
    );
    CREATE POLICY "enseignants_classes_insert" ON enseignants_classes FOR INSERT WITH CHECK (
      enseignant_id IN (SELECT id FROM personnel WHERE ecole_id = get_user_ecole_id())
    );
  END IF;
END $$;

-- ============================================================
-- 8. emplois_du_temps
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "emplois_du_temps_select" ON emplois_du_temps;
  DROP POLICY IF EXISTS "emplois_du_temps_insert" ON emplois_du_temps;
  DROP POLICY IF EXISTS "emplois_du_temps_update" ON emplois_du_temps;
  DROP POLICY IF EXISTS "emplois_du_temps_delete" ON emplois_du_temps;

  CREATE POLICY "emplois_du_temps_select" ON emplois_du_temps FOR SELECT USING (
    classe_id IN (SELECT id FROM classes WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "emplois_du_temps_insert" ON emplois_du_temps FOR INSERT WITH CHECK (
    classe_id IN (SELECT id FROM classes WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "emplois_du_temps_update" ON emplois_du_temps FOR UPDATE USING (
    classe_id IN (SELECT id FROM classes WHERE ecole_id = get_user_ecole_id())
  );
  CREATE POLICY "emplois_du_temps_delete" ON emplois_du_temps FOR DELETE USING (
    classe_id IN (SELECT id FROM classes WHERE ecole_id = get_user_ecole_id())
  );
END $$;

-- ============================================================
-- 9. parametres
-- ============================================================
DO $$ BEGIN
  DROP POLICY IF EXISTS "parametres_select" ON parametres;
  DROP POLICY IF EXISTS "parametres_insert" ON parametres;
  DROP POLICY IF EXISTS "parametres_update" ON parametres;

  CREATE POLICY "parametres_select" ON parametres FOR SELECT USING (
    ecole_id = get_user_ecole_id()
  );
  CREATE POLICY "parametres_insert" ON parametres FOR INSERT WITH CHECK (
    ecole_id = get_user_ecole_id()
  );
  CREATE POLICY "parametres_update" ON parametres FOR UPDATE USING (
    ecole_id = get_user_ecole_id()
  );
END $$;
