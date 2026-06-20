<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — EduGest CI (SaaS)

## SaaS Architecture
- **Multi-tenant** : une instance sert toutes les écoles, isolées par `ecole_id` + RLS
- **Onboarding** : `/onboarding` → création école + admin + année scolaire
- **SuperAdmin** : `/superadmin/dashboard` pour superviser toutes les écoles

## Onboarding Flow
- Page publique : `/onboarding` (3 étapes : école → admin → confirmation)
- Champs école : nom, email, téléphone, adresse, code établissement, site web, logo
- API : `POST /api/auth/onboard` (service role key) — **multipart/form-data** (logo inclus en tant que fichier)
- L'API crée l'école → upload logo dans `logos/{schoolId}/logo.{ext}` → crée admin, profil, année, niveaux, matières
- Redirige automatiquement vers `/connexion` après 5s
- Validation : email regex, password (6+ car, 1 maj, 1 chiffre)

## SuperAdmin
- Rôle spécial `superadmin` avec `ecole_id = NULL` dans `profils`
- Layout sombre (gray-950) distinct du dashboard école
- Utilise **service role key** (`createClient` côté client) pour tout requêtage → bypass RLS
- Dashboard : stats globales (écoles, élèves, enseignants, utilisateurs)
- Écoles : liste avec recherche, stats par école
- Seed : `node scripts/seed-superadmin.mjs` crée `superadmin@edugest.ci` / `SuperAdmin123!`

## Routes
- `/superadmin/dashboard` — tableau de bord superadmin
- `/superadmin/ecoles` — liste des écoles
- `/onboarding` — inscription nouvel établissement
- Dashboard école redirige les superadmins vers `/superadmin/dashboard`

## Logo Upload
- Endpoint : `POST /api/upload-logo` (service role key, multipart)
- Accepte `file` + optionnel `school_id`
- Si `school_id` fourni : sauvegarde dans `logos/{schoolId}/logo.{ext}` avec **upsert** (remplacement propre)
- Si pas de `school_id` : sauvegarde dans `logos/temp/` (fallback)
- Utilisé par la page **Paramètres > Mon école** pour uploader le logo via l'école existante

## Files nettoyés
- `src/lib/supabase-browser.ts` supprimé (duplicata de `supabase.ts`)
- `src/lib/insforge.ts` supprimé (vestige déprécié)
- `src/app/test/` supprimé (dossier vide)

## RLS Notes
- Superadmin n'utilise pas l'anon key pour les données → pas besoin de modifier RLS
- `get_user_ecole_id()` retourne NULL pour superadmin (ecole_id = NULL)
- Migration `008_superadmin_rls.sql` documente comment étendre RLS pour superadmin si besoin

## RLS — Correction appliquée (migration 011)
- `profils_select` utilise maintenant `user_id = auth.uid() OR ecole_id = get_user_ecole_id()`
- `get_user_ecole_id()` est SECURITY DEFINER → contourne RLS → pas de récursion
- Résultat : tous les utilisateurs d'une même école peuvent se voir mutuellement
- API `/api/profils/utilisateurs` utilise la service role key (bypass RLS) pour les opérations d'administration
