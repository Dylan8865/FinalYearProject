import type { ExamPrediction, ReviewSchedule } from '@/types/analytics';

export type QuizQuestionType = 'mcq' | 'fill' | 'short';
export type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface GeneratedQuestion {
  id?: string;
  question: string;
  question_type: QuizQuestionType;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface GeneratedQuiz {
  title: string;
  subject: string;
  topic: string;
  question_type: QuizQuestionType;
  difficulty: QuizDifficulty;
  source_files: string[];
  questions: GeneratedQuestion[];
}

export interface LibraryQuiz {
  id: string;
  title: string;
  subject: string | null;
  source_type: string;
  is_public: boolean;
  created_at: string;
}

export interface PublicQuiz {
  id: string;
  title: string;
  subject: string | null;
  owner_name: string | null;
  question_count: number;
  created_at: string;
}

export interface SavedQuizResponse {
  id: string;
  message: string;
}

export interface QuizAttemptRequest {
  score: number;
  total_questions: number;
  time_taken_seconds: number;
  answers: Array<{
    question_index: number;
    selected_answer: string | null;
    time_spent_seconds: number;
  }>;
}

export interface QuizAttemptResponse {
  id: string;
  message: string;
  prediction?: ExamPrediction | null;
  review_schedule?: ReviewSchedule | null;
}
