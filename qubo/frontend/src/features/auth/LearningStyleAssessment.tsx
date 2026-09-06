import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import { LearningStyle } from '@/types/auth';
import { FiCheck } from 'react-icons/fi';

export default function LearningStyleAssessment() {
  const [questionAnswers, setQuestionAnswers] = useState<Array<LearningStyle | null>>(Array(5).fill(null));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((state) => state.setUser);

  const questions = [
    {
      text: "How do you prefer to learn new information?",
      styles: {
        visual: "I prefer to see diagrams, charts, and visual demonstrations",
        auditory: "I prefer to listen to lectures and verbal explanations",
        kinesthetic: "I prefer to do hands-on practice and learn by doing",
      },
    },
    {
      text: "When studying for exams, you typically:",
      styles: {
        visual: "Create mind maps and colorful notes",
        auditory: "Read notes aloud and discuss with others",
        kinesthetic: "Work through practice problems and experiments",
      },
    },
    {
      text: "In a classroom, you find it easiest to concentrate when:",
      styles: {
        visual: "The teacher uses slides and visual aids",
        auditory: "The teacher explains concepts clearly",
        kinesthetic: "You can move around and interact with materials",
      },
    },
    {
      text: "For remembering important concepts, you:",
      styles: {
        visual: "Draw pictures or use color coding",
        auditory: "Explain it out loud or create mnemonics",
        kinesthetic: "Act it out or use physical objects",
      },
    },
    {
      text: "When giving directions, you would:",
      styles: {
        visual: "Draw a map or show a picture",
        auditory: "Explain verbally step by step",
        kinesthetic: "Show by walking or demonstrating",
      },
    },
  ];

  const chooseAnswer = (style: LearningStyle) => {
    setQuestionAnswers((prev) => {
      const updated = [...prev];
      updated[currentQuestion] = style;
      return updated;
    });
    setError('');
  };

  const handleNext = async () => {
    if (!questionAnswers[currentQuestion]) {
      setError('Choose the answer that fits you best before continuing.');
      return;
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsLoading(true);
      setError('');
      const count = (style: LearningStyle) => questionAnswers.filter((answer) => answer === style).length;
      const finalScores = {
        visual_score: Math.round((count('visual') / questions.length) * 100),
        auditory_score: Math.round((count('auditory') / questions.length) * 100),
        kinesthetic_score: Math.round((count('kinesthetic') / questions.length) * 100),
      };

      try {
        await authService.setLearningStyle(finalScores);
        const updatedProfile = await authService.getProfile();
        setUser(updatedProfile);
        setIsSuccess(true);
        setTimeout(() => {
          const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
          navigate(returnTo || '/dashboard', { replace: true });
        }, 2000);
      } catch (error) {
        console.error('Failed to set learning style:', error);
        setError('Your learning preference could not be saved. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentAnswer = questionAnswers[currentQuestion];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-12 text-center animate-in fade-in zoom-in duration-300">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <FiCheck className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">Account created successfully!</h1>
          <p className="text-lg text-gray-500 font-semibold">We've personalized your learning experience. Taking you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Learning Style Assessment</h1>
          <p className="text-gray-600">Help us understand how you learn best</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{question.text}</h2>

          <div className="space-y-4">
            {(Object.keys(question.styles) as LearningStyle[]).map((style) => (
              <button
                type="button"
                key={style}
                onClick={() => chooseAnswer(style)}
                aria-pressed={currentAnswer === style}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${currentAnswer === style ? 'border-primary bg-blue-50' : 'border-transparent bg-gray-50 hover:border-blue-200'}`}
              >
                <span className="capitalize font-semibold text-gray-900">{style}</span>
                <span className="mt-1 block text-sm text-gray-600">{question.styles[style]}</span>
              </button>
            ))}
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0 || isLoading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {currentQuestion === questions.length - 1
              ? isLoading
                ? 'Completing...'
                : 'Complete'
              : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
