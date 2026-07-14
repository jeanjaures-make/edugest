-- Push notification subscriptions
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  profil_id uuid references profils(id) on delete cascade,
  ecole_id uuid references ecoles(id) on delete cascade,
  endpoint text unique not null,
  subscription jsonb not null,
  created_at timestamptz default now()
);

create index if not exists idx_push_user on push_subscriptions(user_id);
create index if not exists idx_push_ecole on push_subscriptions(ecole_id);

alter table push_subscriptions enable row level security;

DO $$ BEGIN
  DROP POLICY IF EXISTS "push_subscriptions_select" ON push_subscriptions;
  DROP POLICY IF EXISTS "push_subscriptions_insert" ON push_subscriptions;
  DROP POLICY IF EXISTS "push_subscriptions_delete" ON push_subscriptions;

  CREATE POLICY "push_subscriptions_select" ON push_subscriptions FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "push_subscriptions_insert" ON push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "push_subscriptions_delete" ON push_subscriptions FOR DELETE USING (auth.uid() = user_id);
END $$;
