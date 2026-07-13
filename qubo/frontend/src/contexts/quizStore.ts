import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { GeneratedQuiz } from '@/types/quiz';

interface QuizState {
  generatedQuiz: GeneratedQuiz | null;
  setGeneratedQuiz: (quiz: GeneratedQuiz | null) => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      generatedQuiz: null,
      setGeneratedQuiz: (generatedQuiz) => set({ generatedQuiz }),
    }),
    {
      name: 'qubo-generated-quiz',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

