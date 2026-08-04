-- A monotonically increasing value carried in Qubo's application JWTs.
-- Incrementing it invalidates all previously issued Qubo access and refresh tokens.
alter table public.profiles
  add column if not exists session_version integer not null default 0;
