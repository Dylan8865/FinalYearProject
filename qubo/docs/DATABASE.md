# Database Schema Documentation

## Overview
Qubo uses PostgreSQL (via Supabase) as the primary database. The schema is designed to support three main modules:

1. User Authentication & Profile Management
2. Performance Tracking & Analytics Dashboard
3. AI-Powered Quiz Generation & Practice Management

## Key Tables

### Core Tables
- `profiles` - Public user profile and account metadata. Passwords are handled by Supabase Auth, not stored here.
- `subjects` - SPM subjects
- `topics` - Topics within subjects
- `student_subjects` - Student enrollment in subjects

### Study & Performance
- `study_sessions` - Study session records
- `session_topics` - Topics covered in each session
- `performance_records` - Aggregated performance per student per topic
- `exam_predictions` - Predicted exam scores and risk levels
- `spaced_repetition_schedule` - Spaced repetition scheduling

### Quiz Management
- `quizzes` - Quiz definitions
- `questions` - Questions within quizzes
- `question_options` - Multiple choice options
- `quiz_assignments` - Educator assignments
- `quiz_attempts` - Student quiz attempts
- `attempt_answers` - Per-question responses

## Relationships

```
profiles
├── student_subjects → subjects
├── study_sessions → session_topics → topics
├── performance_records → topics
├── exam_predictions → subjects
├── spaced_repetition_schedule → topics
├── quizzes (as owner)
├── quiz_attempts
└── educator_students ↔ profiles

quizzes
├── questions → question_options
├── quiz_assignments
└── quiz_attempts → attempt_answers
```

## Row-Level Security (RLS)

All tables have RLS policies enforced to ensure:
- Users can only access their own data
- Educators can view linked students' data
- Shared resources are accessible as intended

For detailed schema, see `Qubo Schema` file.

## Authentication Storage

Qubo uses Supabase Auth for credentials. Registration creates the secure auth user in Supabase's protected `auth.users` schema, while `public.profiles` stores application profile fields such as username, full name, role, learning style, school, and target grade.

Do not add a password column to `public.profiles`.
