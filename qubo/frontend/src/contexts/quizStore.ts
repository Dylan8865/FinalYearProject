import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { GeneratedQuiz } from '@/types/quiz';

interface QuizState {
  generatedQuiz: GeneratedQuiz | null;
  savedQuizId: string | null;
  setGeneratedQuiz: (quiz: GeneratedQuiz | null) => void;
  setSavedQuizId: (quizId: string | null) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      generatedQuiz: null,
      savedQuizId: null,
      setGeneratedQuiz: (generatedQuiz) => set({ generatedQuiz, savedQuizId: null }),
      setSavedQuizId: (savedQuizId) => set({ savedQuizId }),
    }),
    {
      name: 'qubo-generated-quiz',
      version: 2,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

