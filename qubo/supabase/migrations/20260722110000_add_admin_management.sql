-- Qubo Admin: a separate elevated role, account moderation state, and an
-- append-only audit trail. Admin operations are performed by the backend's
-- service-role client; this table is deliberately not exposed to browsers.

alter type public.user_role add value if not exists 'admin';

alter table public.profiles
  add column if not exists is_blacklisted boolean not null default false,
  add column if not exists blacklisted_at timestamptz,
  add column if not exists blacklisted_by uuid references public.profiles(id) on delete set null,
  add column if not exists blacklist_reason text;

create index if not exists idx_profiles_blacklisted
  on public.profiles (is_blacklisted)
  where is_blacklisted = true;

create table if not exists public.admin_audit_logs (
  audit_id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text,
  target_user_id uuid references public.profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_created_at
  on public.admin_audit_logs (created_at desc);
create index if not exists idx_admin_audit_logs_target_user
  on public.admin_audit_logs (target_user_id, created_at desc);

alter table public.admin_audit_logs enable row level security;
create policy "service role manages admin audit logs"
  on public.admin_audit_logs for all to service_role
  using (true) with check (true);

-- New Supabase projects may not expose new public tables automatically. The
-- browser has no direct rights to audit logs; the backend service role alone
-- performs reads and writes after verifying an application-level admin role.
revoke all on table public.admin_audit_logs from anon, authenticated;
grant select, insert, update, delete on table public.admin_audit_logs to service_role;
