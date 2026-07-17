import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useQuizStore } from '@/contexts/quizStore';
import { authService } from '@/lib/authService';
import { GeneratedQuestion } from '@/types/quiz';
import { ExamPrediction } from '@/types/analytics';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiClock,
  FiEdit3,
  FiRefreshCw,
  FiTarget,
} from 'react-icons/fi';

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const normalizeAnswer = (value: string) => value.trim().toLocaleLowerCase();

const shuffleOptions = (options: string[]) => {
  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

const createOptionOrders = (questions: GeneratedQuestion[]) =>
  Object.fromEntries(
    questions.map((question, index) => [
      index,
      question.question_type === 'mcq' ? shuffleOptions(question.options) : question.options,
    ])
  );

export default function QuizExperiencePage() {
  const navigate = useNavigate();
  const quiz = useQuizStore((state) => state.generatedQuiz);
  const savedQuizId = useQuizStore((state) => state.savedQuizId);
  const setSavedQuizId = useQuizStore((state) => state.setSavedQuizId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [isSavingAttempt, setIsSavingAttempt] = useState(false);
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [attemptError, setAttemptError] = useState('');
  const [prediction, setPrediction] = useState<ExamPrediction | null>(null);
  const [optionOrders, setOptionOrders] = useState<Record<number, string[]>>(
    () => createOptionOrders(quiz?.questions ?? [])
  );

  useEffect(() => {
    setOptionOrders(createOptionOrders(quiz?.questions ?? []));
  }, [quiz]);

  useEffect(() => {
    if (isComplete || !quiz) {
      return;
    }
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isComplete, quiz]);

  const questions = quiz?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const hasAnswered = Object.prototype.hasOwnProperty.call(answers, currentIndex);
  const selectedAnswer = answers[currentIndex] ?? '';
  const isCorrect = hasAnswered && currentQuestion
    ? normalizeAnswer(selectedAnswer) === normalizeAnswer(currentQuestion.correct_answer)
    : false;
  const correctCount = useMemo(
    () => Object.entries(answers).filter(([index, answer]) => {
      const question = questions[Number(index)];
      return question && normalizeAnswer(answer) === normalizeAnswer(question.correct_answer);
    }).length,
    [answers, questions]
  );

  useEffect(() => {
    setWrittenAnswer(answers[currentIndex] ?? '');
  }, [answers, currentIndex]);

  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  const saveAttempt = async () => {
    if (!quiz || isSavingAttempt || attemptSaved) return;

    setIsSavingAttempt(true);
    setAttemptError('');
    try {
      let quizId = savedQuizId;
      if (!quizId) {
        const savedQuiz = await authService.saveQuizToLibrary(quiz);
        quizId = savedQuiz.id;
        setSavedQuizId(quizId);
      }
      const attemptResponse = await authService.recordQuizAttempt(quizId, {
        score,
        total_questions: questions.length,
        time_taken_seconds: elapsedSeconds,
      });
      setPrediction(attemptResponse.prediction || null);
      setAttemptSaved(true);
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setAttemptError(typeof detail === 'string' ? detail : 'Your quiz result could not be saved.');
    } finally {
      setIsSavingAttempt(false);
    }
  };

  const finishQuiz = () => {
    setIsComplete(true);
    void saveAttempt();
  };

  const moveNext = () => {
    setWrittenAnswer('');
    if (currentIndex === questions.length - 1) {
      finishQuiz();
    } else {
      setCurrentIndex((value) => value + 1);
    }
  };

  const skipQuestion = () => {
    setWrittenAnswer('');
    if (currentIndex === questions.length - 1) {
      if (Object.keys(answers).length === 0) {
        setShowEndConfirmation(true);
      } else {
        finishQuiz();
      }
    } else {
      setCurrentIndex((value) => value + 1);
    }
  };

  const movePrevious = () => {
    if (currentIndex > 0) setCurrentIndex((value) => value - 1);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setWrittenAnswer('');
    setElapsedSeconds(0);
    setIsComplete(false);
    setAttemptSaved(false);
    setAttemptError('');
    setPrediction(null);
    setOptionOrders(createOptionOrders(questions));
  };

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
        <AppSidebar />
        <main className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="w-full max-w-lg rounded-[34px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <FiEdit3 className="mx-auto h-10 w-10 text-slate-300" />
            <h1 className="mt-5 text-3xl font-extrabold text-slate-950">No generated quiz</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Upload study material and generate questions before starting a quiz.</p>
            <button
              onClick={() => navigate('/quiz/create')}
              className="mt-7 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              Open Quiz Creator
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
        <AppSidebar />
        <main className="flex min-h-screen items-center justify-center px-5 py-10">
          <div className="w-full max-w-xl rounded-[36px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FiTarget className="h-9 w-9" />
            </div>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Quiz completed</p>
            <h1 className="mt-2 text-4xl font-extrabold text-slate-950">{quiz.title}</h1>
            <p className="mt-3 text-slate-500">You answered {correctCount} of {questions.length} questions correctly.</p>

            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${attemptError ? 'border-red-100 bg-red-50 text-red-700' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
              {attemptError ? (
                <div>
                  <p>{attemptError}</p>
                  <button type="button" onClick={() => void saveAttempt()} disabled={isSavingAttempt} className="mt-2 font-extrabold underline">
                    {isSavingAttempt ? 'Saving…' : 'Try saving again'}
                  </button>
                </div>
              ) : attemptSaved ? (
                'Your result was saved to Module 2 analytics.'
              ) : (
                'Saving your quiz result…'
              )}
            </div>

            {prediction && (
              <div className={`mt-5 rounded-2xl border p-5 text-left ${prediction.is_warning ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs font-extrabold uppercase tracking-[0.14em] ${prediction.is_warning ? 'text-red-600' : 'text-emerald-600'}`}>
                      {prediction.is_warning ? 'Early warning' : 'Updated SPM forecast'}
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-950">{Math.round(prediction.predicted_score)}%</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Based on {prediction.basis_attempt_count} saved attempt{prediction.basis_attempt_count === 1 ? '' : 's'} for {prediction.subject_name}. Warning threshold: {prediction.threshold}%.
                    </p>
                  </div>
                  <FiTarget className={`mt-1 h-6 w-6 flex-none ${prediction.is_warning ? 'text-red-600' : 'text-emerald-600'}`} />
                </div>
                <button type="button" onClick={() => navigate('/analytics')} className="mt-4 text-sm font-extrabold text-blue-600 hover:text-blue-700">
                  Open study tracker <FiArrowRight className="ml-1 inline" />
                </button>
              </div>
            )}

            <div className="mt-7 grid grid-cols-3 gap-3">
              {[
                ['Score', `${score}%`],
                ['Time', formatTime(elapsedSeconds)],
                ['Subject', quiz.subject],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                  <p className="mt-2 text-lg font-extrabold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={restartQuiz}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                <FiRefreshCw /> Retake quiz
              </button>
              <button
                onClick={() => navigate('/quiz/create')}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                Create another <FiArrowRight />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="mx-auto w-full max-w-6xl px-5 pb-8 pt-20 md:px-8 lg:pb-10 lg:pt-24">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">{quiz.subject} · {quiz.difficulty}</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-950">Question {currentIndex + 1} of {questions.length}</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
            <FiClock className="text-slate-400" />
            Time taken: {formatTime(elapsedSeconds)}
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Quiz question navigation">
          {questions.map((_, index) => {
            const answered = Object.prototype.hasOwnProperty.call(answers, index);
            return (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-extrabold ${
                  currentIndex === index
                    ? 'bg-blue-600 text-white'
                    : answered
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                }`}
                aria-label={`Go to question ${index + 1}${answered ? ', answered' : ', unanswered'}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-5">
            <section className="rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-8">
              <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-extrabold uppercase text-blue-700">
                {currentQuestion.question_type}
              </span>
              <p className="mt-5 text-xl font-bold leading-8 text-slate-900 md:text-2xl">{currentQuestion.question}</p>
              {quiz.source_files.length > 0 && (
                <p className="mt-8 text-xs font-semibold text-slate-400">Source: {quiz.source_files.join(', ')}</p>
              )}
            </section>

            {hasAnswered && (
              <section className={`rounded-[26px] border p-5 ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-white ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {isCorrect ? <FiCheck /> : <span className="font-extrabold">!</span>}
                  </div>
                  <div>
                    <p className={`font-extrabold ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                      {isCorrect ? 'Correct!' : 'Not quite.'}
                    </p>
                    {!isCorrect && <p className="mt-1 text-sm font-semibold text-slate-700">Expected answer: {currentQuestion.correct_answer}</p>}
                    {currentQuestion.explanation && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{currentQuestion.explanation}</p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
              {currentQuestion.question_type === 'mcq' ? 'Select an option' : 'Write your answer'}
            </p>

            {currentQuestion.question_type === 'mcq' ? (
              <div className="space-y-3">
                {(optionOrders[currentIndex] ?? currentQuestion.options).map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectOption = hasAnswered && normalizeAnswer(option) === normalizeAnswer(currentQuestion.correct_answer);
                  return (
                    <button
                      key={`${index}-${option}`}
                      disabled={hasAnswered}
                      onClick={() => setAnswers((current) => ({ ...current, [currentIndex]: option }))}
                      className={`flex min-h-[62px] w-full items-center gap-4 rounded-2xl border-2 px-4 text-left font-bold shadow-sm ${
                        isCorrectOption
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-transparent bg-white text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isCorrectOption && <FiCheck className="text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <textarea
                  value={writtenAnswer}
                  onChange={(event) => setWrittenAnswer(event.target.value)}
                  disabled={hasAnswered}
                  rows={currentQuestion.question_type === 'short' ? 5 : 2}
                  placeholder={currentQuestion.question_type === 'fill' ? 'Enter the missing word or phrase' : 'Write a concise answer'}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 outline-none focus:border-primary focus:bg-white"
                />
                <button
                  disabled={!writtenAnswer.trim() || hasAnswered}
                  onClick={() => setAnswers((current) => ({ ...current, [currentIndex]: writtenAnswer.trim() }))}
                  className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  Submit answer
                </button>
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                onClick={movePrevious}
                disabled={currentIndex === 0}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-35"
              >
                <FiArrowLeft /> Previous
              </button>
              <button
                onClick={skipQuestion}
                className="rounded-2xl bg-slate-200 px-4 py-4 text-sm font-bold text-slate-700 hover:bg-slate-300"
              >
                Skip question
              </button>
              <button
                onClick={moveNext}
                disabled={!hasAnswered}
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-40"
              >
                {currentIndex === questions.length - 1 ? 'Finish quiz' : 'Next question'}
                <FiArrowRight />
              </button>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Current score</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{score}%</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Average speed</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {Object.keys(answers).length ? Math.round(elapsedSeconds / Object.keys(answers).length) : 0}s
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showEndConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Confirm ending quiz">
          <div className="w-full max-w-md rounded-[30px] bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <FiAlertCircle className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-slate-950">End without answering?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">You have skipped every question. Are you sure you want to end this quiz with no answers?</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setShowEndConfirmation(false);
                  setCurrentIndex(0);
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Continue quiz
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndConfirmation(false);
                  finishQuiz();
                }}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-red-700"
              >
                End quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
