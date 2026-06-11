-- Fix: Add missing RLS policies for tables with RLS enabled but no policies.
-- Also enable RLS on annees_scolaires which had no RLS at all.

-- ============================================================
-- 1. Enable RLS on annees_scolaires
-- ============================================================
ALTER TABLE annees_scolaires ENABLE ROW LEVEL SECURITY;

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
-- 2. Add policies for echeanciers (RLS was enabled in 003 but no policies existed)
-- ============================================================
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

-- ============================================================
-- 3. Add policies for inscriptions (RLS was enabled but no policies existed)
-- ============================================================
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

-- ============================================================
-- 4. Add policies for cantine_repas
-- ============================================================
CREATE POLICY "cantine_repas_select" ON cantine_repas FOR SELECT USING (
  eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
);

CREATE POLICY "cantine_repas_insert" ON cantine_repas FOR INSERT WITH CHECK (
  eleve_id IN (SELECT id FROM eleves WHERE ecole_id = get_user_ecole_id())
);

-- ============================================================
-- 5. Add policies for communications_lues
-- ============================================================
CREATE POLICY "communications_lues_select" ON communications_lues FOR SELECT USING (
  communication_id IN (SELECT id FROM communications WHERE ecole_id = get_user_ecole_id())
);

CREATE POLICY "communications_lues_insert" ON communications_lues FOR INSERT WITH CHECK (
  communication_id IN (SELECT id FROM communications WHERE ecole_id = get_user_ecole_id())
);

-- ============================================================
-- 6. Add policies for enseignants_matieres
-- ============================================================
CREATE POLICY "enseignants_matieres_select" ON enseignants_matieres FOR SELECT USING (
  personnel_id IN (SELECT id FROM personnel WHERE ecole_id = get_user_ecole_id())
);

CREATE POLICY "enseignants_matieres_insert" ON enseignants_matieres FOR INSERT WITH CHECK (
  personnel_id IN (SELECT id FROM personnel WHERE ecole_id = get_user_ecole_id())
);

-- ============================================================
-- 7. Add policies for enseignants_classes
-- ============================================================
CREATE POLICY "enseignants_classes_select" ON enseignants_classes FOR SELECT USING (
  personnel_id IN (SELECT id FROM personnel WHERE ecole_id = get_user_ecole_id())
);

CREATE POLICY "enseignants_classes_insert" ON enseignants_classes FOR INSERT WITH CHECK (
  personnel_id IN (SELECT id FROM personnel WHERE ecole_id = get_user_ecole_id())
);

-- ============================================================
-- 8. Add policies for emplois_du_temps
-- ============================================================
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

-- ============================================================
-- 9. Add policies for parametres
-- ============================================================
CREATE POLICY "parametres_select" ON parametres FOR SELECT USING (
  ecole_id = get_user_ecole_id()
);

CREATE POLICY "parametres_insert" ON parametres FOR INSERT WITH CHECK (
  ecole_id = get_user_ecole_id()
);

CREATE POLICY "parametres_update" ON parametres FOR UPDATE USING (
  ecole_id = get_user_ecole_id()
);
