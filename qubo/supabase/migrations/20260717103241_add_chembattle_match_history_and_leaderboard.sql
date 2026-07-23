-- ChemBattle match history and Level 1 leaderboard.
-- A leaderboard entry is a completed Level 1 victory after all six waves.

alter table public.matches
  add column if not exists game_level integer not null default 1,
  add column if not exists waves_cleared integer not null default 0,
  add column if not exists is_victory boolean not null default false,
  add column if not exists completed_at timestamptz;

alter table public.matches
  drop constraint if exists matches_game_level_check,
  add constraint matches_game_level_check check (game_level >= 1),
  drop constraint if exists matches_waves_cleared_check,
  add constraint matches_waves_cleared_check check (waves_cleared >= 0),
  drop constraint if exists matches_turns_played_check,
  add constraint matches_turns_played_check check (turns_played >= 0);

create index if not exists matches_user_match_date_idx
  on public.matches (user_id, match_date desc);

create index if not exists matches_level_one_leaderboard_idx
  on public.matches (turns_played asc, completed_at asc, match_id asc)
  where game_level = 1 and waves_cleared = 6 and is_victory = true;

-- The browser does not query these tables directly today, but these policies
-- prevent accidental exposure if a client is added later. The backend uses its
-- service-role client and therefore can generate the public leaderboard.
alter table public.matches enable row level security;
alter table public.match_history enable row level security;

drop policy if exists "users read own matches" on public.matches;
create policy "users read own matches"
  on public.matches for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users create own matches" on public.matches;
create policy "users create own matches"
  on public.matches for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users update own matches" on public.matches;
create policy "users update own matches"
  on public.matches for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users read own match events" on public.match_history;
create policy "users read own match events"
  on public.match_history for select to authenticated
  using (
    exists (
      select 1 from public.matches
      where matches.match_id = match_history.match_id
        and matches.user_id = (select auth.uid())
    )
  );

drop policy if exists "users create own match events" on public.match_history;
create policy "users create own match events"
  on public.match_history for insert to authenticated
  with check (
    exists (
      select 1 from public.matches
      where matches.match_id = match_history.match_id
        and matches.user_id = (select auth.uid())
    )
  );
