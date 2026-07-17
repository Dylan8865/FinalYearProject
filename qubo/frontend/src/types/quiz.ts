export type QuizQuestionType = 'mcq' | 'fill' | 'short';
export type QuizDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface GeneratedQuestion {
  question: string;
  question_type: QuizQuestionType;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface GeneratedQuiz {
  title: string;
  subject: string;
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
}

export interface QuizAttemptResponse {
  id: string;
  message: string;
  prediction?: ExamPrediction | null;
}

import type { ExamPrediction } from '@/types/analytics';
