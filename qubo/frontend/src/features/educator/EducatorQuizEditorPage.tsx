import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiEye,
  FiFileText,
  FiPlus,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import AppSidebar from "@/components/layout/AppSidebar";
import { useAuthStore } from "@/contexts/authStore";
import { useQuizStore } from "@/contexts/quizStore";
import { authService } from "@/lib/authService";
import { Subject } from "@/types/auth";
import { GeneratedQuestion, QuizQuestionType } from "@/types/quiz";

export default function EducatorQuizEditorPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const quiz = useQuizStore((state) => state.generatedQuiz);
  const setQuiz = useQuizStore((state) => state.setGeneratedQuiz);
  const savedQuizId = useQuizStore((state) => state.savedQuizId);
  const setSavedQuizId = useQuizStore((state) => state.setSavedQuizId);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(
    new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    void authService
      .getSubjects()
      .then(setSubjects)
      .catch(() => setSubjects([]));
  }, []);

  if (user?.role !== "educator") return <Navigate to="/dashboard" replace />;
  if (!quiz) return <Navigate to="/quiz/create" replace />;

  const updateQuiz = (patch: Partial<typeof quiz>) =>
    setQuiz({ ...quiz, ...patch });
  const updateQuestion = (index: number, patch: Partial<GeneratedQuestion>) =>
    updateQuiz({
      questions: quiz.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    });
  const removeQuestion = (index: number) =>
    updateQuiz({
      questions: quiz.questions.filter(
        (_, questionIndex) => questionIndex !== index,
      ),
    });
  const addQuestion = () =>
    updateQuiz({
      questions: [
        ...quiz.questions,
        {
          question: "Write your question here",
          question_type: quiz.question_type,
          options:
            quiz.question_type === "mcq"
              ? ["Option A", "Option B", "Option C", "Option D"]
              : [],
          correct_answer:
            quiz.question_type === "mcq"
              ? "Option A"
              : "Write the expected answer",
          explanation: "",
        },
      ],
    });
  const changeQuestionType = (index: number, questionType: QuizQuestionType) =>
    updateQuestion(index, {
      question_type: questionType,
      options:
        questionType === "mcq"
          ? ["Option A", "Option B", "Option C", "Option D"]
          : [],
      correct_answer: questionType === "mcq" ? "Option A" : "",
    });
  const toggleAnswer = (index: number) =>
    setRevealedAnswers((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  const save = async () => {
    if (!quiz.title.trim() || !quiz.subject.trim() || !quiz.questions.length) {
      setError(
        "Add a title, subject, and at least one question before saving.",
      );
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const result = await authService.saveQuizToLibrary(quiz);
      setSavedQuizId(result.id);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.detail || "The quiz could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr] lg:grid-rows-[auto_1fr]">
      <AppSidebar />
      <main className="min-w-0">
        <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-8">
          <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => navigate("/quiz/create")}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary"
              >
                <FiArrowLeft />
                Back to quiz setup
              </button>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                Educator quiz editor
              </p>
              <h1 className="mt-1 text-3xl font-extrabold">
                Review and edit your quiz
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Check every question and answer before publishing it to your
                library.
              </p>
            </div>
            <span className="hidden rounded-xl bg-purple-100 px-3 py-2 text-xs font-bold text-purple-700 md:block">
              {quiz.source_files.length > 0 ? "AI draft" : "Manual draft"}
            </span>
          </div>
        </header>
        <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold">
                Quiz title
                <input
                  value={quiz.title}
                  onChange={(event) =>
                    updateQuiz({ title: event.target.value })
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
                />
              </label>
              <label className="text-sm font-bold">
                Subject
                <select
                  value={quiz.subject}
                  onChange={(event) =>
                    updateQuiz({ subject: event.target.value })
                  }
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-primary"
                >
                  <option value="">Choose a subject</option>
                  {quiz.subject && !subjects.some((subject) => subject.subject_name === quiz.subject) && (
                    <option value={quiz.subject}>{quiz.subject}</option>
                  )}
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.subject_name}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-primary">
                {quiz.difficulty}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                {quiz.questions.length} questions
              </span>
            </div>
          </section>
          <section className="mt-6 rounded-[28px] bg-slate-100 p-4 shadow-sm md:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600 text-white">
                <FiFileText />
              </span>
              <div>
                <h2 className="font-extrabold">Quiz questions</h2>
                <p className="text-xs text-slate-500">
                  Edit the wording, choices, answer and teaching explanation.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-5">
              {quiz.questions.map((question, index) => (
                <article
                  key={index}
                  className="rounded-2xl bg-white p-4 shadow-sm md:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-700">
                      Question {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      disabled={quiz.questions.length === 1}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"
                      title="Remove question"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
                    <textarea
                      value={question.question}
                      onChange={(event) =>
                        updateQuestion(index, { question: event.target.value })
                      }
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold outline-none focus:border-primary"
                    />
                    <select
                      value={question.question_type}
                      onChange={(event) =>
                        changeQuestionType(
                          index,
                          event.target.value as QuizQuestionType,
                        )
                      }
                      className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-bold outline-none focus:border-primary"
                    >
                      <option value="mcq">MCQ</option>
                      <option value="fill">Fill blank</option>
                      <option value="short">Short answer</option>
                    </select>
                  </div>
                  {question.question_type === "mcq" && (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <input
                          key={optionIndex}
                          value={option}
                          onChange={(event) =>
                            updateQuestion(index, {
                              options: question.options.map(
                                (value, currentIndex) =>
                                  currentIndex === optionIndex
                                    ? event.target.value
                                    : value,
                              ),
                              ...(question.correct_answer === option
                                ? { correct_answer: event.target.value }
                                : {}),
                            })
                          }
                          className="h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-primary"
                        />
                      ))}
                    </div>
                  )}
                  <label className="mt-3 block text-xs font-bold text-emerald-800">
                    Correct answer
                    {question.question_type === "mcq" ? (
                      <select
                        value={question.correct_answer}
                        onChange={(event) =>
                          updateQuestion(index, {
                            correct_answer: event.target.value,
                          })
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm outline-none focus:border-primary"
                      >
                        {question.options.map((option, optionIndex) => (
                          <option key={optionIndex} value={option}>
                            {option || `Option ${String.fromCharCode(65 + optionIndex)}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={question.correct_answer}
                        onChange={(event) =>
                          updateQuestion(index, {
                            correct_answer: event.target.value,
                          })
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm outline-none focus:border-primary"
                      />
                    )}
                  </label>
                  <label className="mt-3 block text-xs font-bold text-slate-600">
                    Teaching explanation
                    <textarea
                      value={question.explanation}
                      onChange={(event) =>
                        updateQuestion(index, {
                          explanation: event.target.value,
                        })
                      }
                      placeholder="Explain why this is correct (optional)"
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-primary"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleAnswer(index)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"
                  >
                    <FiEye />
                    {revealedAnswers.has(index)
                      ? `Answer: ${question.correct_answer}`
                      : "Reveal answer"}
                  </button>
                </article>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-bold text-primary hover:bg-blue-100"
              >
                <FiPlus className="mr-1 inline" />
                Add question
              </button>
            </div>
          </section>
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
              {error}
            </div>
          )}
          <footer className="sticky bottom-4 mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/quiz/session")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
            >
              <FiEye />
              Preview as student
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={isSaving || Boolean(savedQuizId)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {savedQuizId ? <FiCheck /> : <FiSave />}
              {isSaving
                ? "Saving…"
                : savedQuizId
                  ? "Saved to library"
                  : "Save to library"}
            </button>
            {savedQuizId && (
              <button
                type="button"
                onClick={() => navigate("/library")}
                className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-800"
              >
                Open library
              </button>
            )}
          </footer>
        </div>
      </main>
    </div>
  );
}
