-- Fix Supabase security advisor: "Function Search Path Mutable"
-- Les fonctions sans search_path fixe sont vulnérables au search_path hijacking.
-- On fixe explicitement search_path pour toutes les fonctions.

-- 1. get_user_ecole_id() — SECURITY DEFINER : critique de fixer search_path
create or replace function get_user_ecole_id()
returns uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select ecole_id from public.profils where user_id = auth.uid() limit 1;
$$;

-- 2. generate_matricule() — fonction utilitaire
create or replace function generate_matricule(ecole_code text)
returns text
language sql
set search_path = public, pg_temp
as $$
  select upper(ecole_code || '-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('seq_matricule')::text, 4, '0'));
$$;
