-- Module 1 schema fix for Qubo authentication/profile management.
-- Run this in the Supabase SQL Editor for your project.
-- Passwords are managed by Supabase Auth in auth.users.
-- Do not add a password column to public.profiles.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('student', 'educator');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'learning_style') then
    create type learning_style as enum ('visual', 'auditory', 'kinesthetic');
  end if;
end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table if exists profiles
  add column if not exists id uuid,
  add column if not exists username text,
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists role user_role not null default 'student',
  add column if not exists profile_picture_url text,
  add column if not exists learning_style learning_style,
  add column if not exists form_level text,
  add column if not exists school text,
  add column if not exists target_grade text,
  add column if not exists target_exam_date date,
  add column if not exists failed_login_attempts int not null default 0,
  add column if not exists locked_until timestamptz,
  add column if not exists created_at timestamptz not null default now();

alter table profiles alter column role drop default;
alter table profiles
  alter column role type user_role
  using (
    case
      when role::text in ('student', 'educator') then role::text::user_role
      else 'student'::user_role
    end
  );
alter table profiles alter column role set default 'student'::user_role;

alter table profiles
  alter column learning_style type learning_style
  using (
    case
      when learning_style::text in ('visual', 'auditory', 'kinesthetic') then learning_style::text::learning_style
      else null
    end
  );

alter table profiles alter column created_at set default now();
alter table profiles alter column failed_login_attempts set default 0;

create unique index if not exists profiles_username_unique on profiles(username);
create unique index if not exists profiles_email_unique on profiles(email);
create unique index if not exists profiles_id_unique on profiles(id);

-- Ensure profiles.id references Supabase Auth users, not an old public.users table.
do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join unnest(con.conkey) with ordinality cols(attnum, ordinality) on true
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = cols.attnum
    where con.contype = 'f'
      and nsp.nspname = 'public'
      and rel.relname = 'profiles'
      and att.attname = 'id'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', constraint_record.conname);
  end loop;
end $$;

delete from public.profiles p
where not exists (
  select 1 from auth.users u where u.id = p.id
);

alter table public.profiles
  add constraint profiles_id_auth_users_fkey
  foreign key (id) references auth.users(id) on delete cascade;

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  subject_name text not null unique,
  category text
);

create table if not exists student_subjects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  unique (student_id, subject_id)
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  if exists (select 1 from public.profiles where id = new.id) then
    update public.profiles
    set
      username = coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      full_name = coalesce(new.raw_user_meta_data->>'full_name', ''),
      email = new.email,
      role = coalesce(new.raw_user_meta_data->>'role', 'student')::user_role
    where id = new.id;
  else
    insert into public.profiles (id, username, full_name, email, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      new.email,
      coalesce(new.raw_user_meta_data->>'role', 'student')::user_role
    );
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table profiles enable row level security;
alter table student_subjects enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for select using (auth.uid() = id);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update using (auth.uid() = id);

drop policy if exists "own student subjects" on student_subjects;
create policy "own student subjects" on student_subjects
  for all using (auth.uid() = student_id);
