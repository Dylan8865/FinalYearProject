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

