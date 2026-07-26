// User types
export type UserRole = 'student' | 'educator' | 'admin';

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  profile_picture_url?: string;
  learning_style?: LearningStyle;
  visual_score?: number | null;
  auditory_score?: number | null;
  kinesthetic_score?: number | null;
  learning_style_assessed_at?: string | null;
  form_level?: string;
  school?: string;
  target_grade?: string;
  target_exam_date?: string;
  created_at: string;
  email_verified?: boolean | null;
  last_sign_in_at?: string | null;
}

export interface AccountDataSummary {
  selected_subjects: number;
  saved_quizzes: number;
  quiz_attempts: number;
  study_sessions: number;
  review_schedules: number;
  learning_events: number;
  game_matches: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Request/Response types
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  full_name: string;
  role: Exclude<UserRole, 'admin'>;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface ProfileUpdateRequest {
  username?: string;
  full_name?: string;
  profile_picture_url?: string;
  learning_style?: LearningStyle;
  form_level?: string;
  school?: string;
  target_grade?: string;
  target_exam_date?: string;
}

export interface LearningStyleAssessment {
  visual_score: number;
  auditory_score: number;
  kinesthetic_score: number;
}

export interface LearningStyleAssessmentResult {
  learning_style: LearningStyle;
  scores: Record<LearningStyle, number>;
}

export interface StudyReminderPreferences {
  daily_flashcards_enabled: boolean;
  daily_flashcards_time: string;
  nightly_review_enabled: boolean;
  nightly_review_time: string;
  reminder_timezone: string;
}

export type StudyReminderPreferencesUpdate = Omit<StudyReminderPreferences, 'reminder_timezone'>;

export interface Subject {
  id: string;
  subject_name: string;
  category?: string;
}

export interface StudentSubjectsUpdateRequest {
  subject_ids: string[];
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}
