-- Module 1 registration debug queries.
-- Run this in Supabase SQL Editor if signup still says:
-- "Database error saving new user"

-- 1. Check profiles columns, types, defaults, and NOT NULL rules.
select
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

-- 2. Find columns that can break the auth trigger:
-- NOT NULL columns with no default, other than columns inserted by handle_new_user().
select
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and is_nullable = 'NO'
  and column_default is null
  and column_name not in ('id', 'username', 'email', 'role');

-- 3. Check the auth.users trigger is installed.
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
order by trigger_name;

-- 4. Show the trigger function currently installed.
select pg_get_functiondef('public.handle_new_user()'::regprocedure);

-- 5. Check what table profiles.id references.
select
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name = 'profiles'
  and kcu.column_name = 'id';

-- 6. Check whether profiles has rows whose id is not in auth.users.
select p.id, p.email, p.username
from public.profiles p
left join auth.users u on u.id = p.id
where u.id is null;
