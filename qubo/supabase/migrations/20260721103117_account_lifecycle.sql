alter table public.profiles
  add column if not exists is_active boolean not null default true,
  add column if not exists deactivated_at timestamptz;

alter table public.quiz_assignments
  drop constraint if exists quiz_assignments_assigned_by_fkey,
  drop constraint if exists quiz_assignments_assigned_to_fkey;

alter table public.quiz_assignments
  add constraint quiz_assignments_assigned_by_fkey
    foreign key (assigned_by) references public.profiles(id) on delete cascade,
  add constraint quiz_assignments_assigned_to_fkey
    foreign key (assigned_to) references public.profiles(id) on delete cascade;
