-- Migration: Add is_public column to quizzes table and update RLS policies
-- This allows educators to share quizzes publicly for all students to browse.

-- 1. Add the is_public column
alter table quizzes add column if not exists is_public boolean not null default false;

-- 2. Update RLS: allow any authenticated user to SELECT public quizzes
drop policy if exists "read public quizzes" on quizzes;
create policy "read public quizzes" on quizzes
  for select using (is_public = true);
