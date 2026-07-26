-- Store the actual score reported by the ChemBattle WebGL build. Historical
-- matches remain null because their original score was never persisted.
alter table public.matches
  add column if not exists score integer;

alter table public.matches
  drop constraint if exists matches_score_nonnegative;

alter table public.matches
  add constraint matches_score_nonnegative
  check (score is null or score >= 0);

create index if not exists idx_matches_ranked_runs
  on public.matches (score desc, turns_played asc, match_date asc)
  where lower(winner) = 'player' and score is not null;
