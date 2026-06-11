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
- API : `POST /api/auth/onboard` (service role key)
- Crée : `ecoles` → auth user → `profils` (role: directeur) → `annees_scolaires`
- Redirige vers connexion après succès

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

## RLS Notes
- Superadmin n'utilise pas l'anon key pour les données → pas besoin de modifier RLS
- `get_user_ecole_id()` retourne NULL pour superadmin (ecole_id = NULL)
- Migration `008_superadmin_rls.sql` documente comment étendre RLS pour superadmin si besoin
