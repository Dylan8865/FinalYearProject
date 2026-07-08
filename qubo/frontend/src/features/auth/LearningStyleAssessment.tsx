import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';

export default function LearningStyleAssessment() {
  const [scores, setScores] = useState({
    visual: 0,
    auditory: 0,
    kinesthetic: 0,
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

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

  const handleScoreChange = (style: keyof typeof scores, value: number) => {
    setScores((prev) => ({
      ...prev,
      [style]: Math.min(100, Math.max(0, prev[style] + value)),
    }));
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Submit assessment
      setIsLoading(true);
      try {
        const result = await authService.setLearningStyle({
          visual_score: scores.visual,
          auditory_score: scores.auditory,
          kinesthetic_score: scores.kinesthetic,
        });
        console.log('Learning style set:', result);
        navigate('/dashboard');
      } catch (error) {
        console.error('Failed to set learning style:', error);
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

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
            {(Object.keys(question.styles) as Array<keyof typeof question.styles>).map((style) => (
              <div key={style} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="capitalize font-medium text-gray-900">{style}</label>
                  <span className="text-sm font-semibold text-primary">{scores[style]}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{question.styles[style]}</p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scores[style]}
                  onChange={(e) => handleScoreChange(style, parseInt(e.target.value) - scores[style])}
                  className="w-full"
                />
              </div>
            ))}
          </div>
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
