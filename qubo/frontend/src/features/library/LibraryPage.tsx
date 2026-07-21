import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArchive,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiEye,
  FiFileText,
  FiPlus,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { GeneratedQuiz, LibraryQuiz } from '@/types/quiz';
import { useQuizStore } from '@/contexts/quizStore';
import { useLanguageStore } from '@/contexts/languageStore';

const formatSourceType = (sourceType: string) =>
  sourceType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatCreatedDate = (createdAt: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(createdAt));

export default function LibraryPage() {
  const navigate = useNavigate();
  const language = useLanguageStore((state) => state.language);
  const locale = language === 'ms' ? 'ms-MY' : 'en-MY';
  const setGeneratedQuiz = useQuizStore((state) => state.setGeneratedQuiz);
  const savedQuizId = useQuizStore((state) => state.savedQuizId);
  const setSavedQuizId = useQuizStore((state) => state.setSavedQuizId);
  const [quizzes, setQuizzes] = useState<LibraryQuiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [previewingQuizId, setPreviewingQuizId] = useState<string | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<{ id: string; quiz: GeneratedQuiz } | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      setQuizzes(await authService.getQuizLibrary());
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setLoadError(typeof detail === 'string' ? detail : 'Unable to load your library right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const subjects = useMemo(
    () => Array.from(new Set(quizzes.map((quiz) => quiz.subject).filter((subject): subject is string => Boolean(subject)))).sort(),
    [quizzes]
  );

  const sourceTypes = useMemo(
    () => Array.from(new Set(quizzes.map((quiz) => quiz.source_type))).sort(),
    [quizzes]
  );

  const filteredQuizzes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      const matchesSearch =
        !normalizedQuery ||
        quiz.title.toLowerCase().includes(normalizedQuery) ||
        quiz.subject?.toLowerCase().includes(normalizedQuery);
      const matchesSubject = selectedSubject === 'all' || quiz.subject === selectedSubject;
      const matchesSource = selectedSource === 'all' || quiz.source_type === selectedSource;
      return matchesSearch && matchesSubject && matchesSource;
    });
  }, [quizzes, searchQuery, selectedSource, selectedSubject]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedSubject !== 'all' || selectedSource !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
    setSelectedSource('all');
  };

  const startSavedQuiz = async (quizId: string) => {
    setActionError('');
    setStartingQuizId(quizId);
    try {
      const quiz = previewQuiz?.id === quizId
        ? previewQuiz.quiz
        : await authService.getSavedQuiz(quizId);
      setGeneratedQuiz(quiz);
      setSavedQuizId(quizId);
      navigate('/quiz/session');
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Unable to start this quiz.');
    } finally {
      setStartingQuizId(null);
    }
  };

  const openQuizPreview = async (quizId: string) => {
    setActionError('');
    setPreviewingQuizId(quizId);
    try {
      const quiz = await authService.getSavedQuiz(quizId);
      setPreviewQuiz({ id: quizId, quiz });
      setRevealedAnswers(new Set());
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Unable to preview this quiz.');
    } finally {
      setPreviewingQuizId(null);
    }
  };

  const togglePreviewAnswer = (questionIndex: number) => {
    setRevealedAnswers((current) => {
      const next = new Set(current);
      if (next.has(questionIndex)) next.delete(questionIndex);
      else next.add(questionIndex);
      return next;
    });
  };

  const deleteSavedQuiz = async (quiz: LibraryQuiz) => {
    if (!window.confirm(`Delete “${quiz.title}” from your library? This cannot be undone.`)) return;

    setActionError('');
    setDeletingQuizId(quiz.id);
    try {
      await authService.deleteSavedQuiz(quiz.id);
      setQuizzes((current) => current.filter((item) => item.id !== quiz.id));
      if (savedQuizId === quiz.id) setSavedQuizId(null);
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Unable to delete this quiz.');
    } finally {
      setDeletingQuizId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
          <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Module 3</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Knowledge Vault</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Find your saved quizzes and continue learning from your own study materials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/quiz/create')}
              className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-2xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 md:self-auto"
            >
              <FiUploadCloud className="h-4 w-4" />
              Upload study material
            </button>
          </header>

          <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_200px_auto]">
              <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-400 focus-within:bg-white">
                <FiSearch className="h-4 w-4 flex-none text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search your saved quizzes"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="relative">
                <span className="sr-only">Filter by subject</span>
                <select
                  value={selectedSubject}
                  onChange={(event) => setSelectedSubject(event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-slate-600 outline-none focus:border-blue-400"
                >
                  <option value="all">All subjects</option>
                  {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-slate-400" />
              </label>

              <label className="relative">
                <span className="sr-only">Filter by source</span>
                <select
                  value={selectedSource}
                  onChange={(event) => setSelectedSource(event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-slate-600 outline-none focus:border-blue-400"
                >
                  <option value="all">All resource types</option>
                  {sourceTypes.map((sourceType) => (
                    <option key={sourceType} value={sourceType}>{formatSourceType(sourceType)}</option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-slate-400" />
              </label>

              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="h-12 rounded-2xl px-4 text-sm font-extrabold text-blue-600 hover:bg-blue-50 disabled:opacity-35"
              >
                Clear filters
              </button>
            </div>
          </section>

          <div className="mt-7 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">Your saved quizzes</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isLoading ? 'Loading your library…' : `${filteredQuizzes.length} ${filteredQuizzes.length === 1 ? 'quiz' : 'quizzes'}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadLibrary()}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600"
              aria-label="Refresh library"
              title="Refresh library"
            >
              <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {actionError && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {actionError}
            </div>
          )}

          {isLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading library">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-56 animate-pulse rounded-[26px] border border-slate-200 bg-white p-5">
                  <div className="h-11 w-11 rounded-xl bg-slate-100" />
                  <div className="mt-7 h-4 w-2/3 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <section className="mt-5 flex min-h-[330px] flex-col items-center justify-center rounded-[30px] border border-red-100 bg-white px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <FiAlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">Your library could not be loaded</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadLibrary()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
              >
                <FiRefreshCw className="h-4 w-4" />
                Try again
              </button>
            </section>
          ) : filteredQuizzes.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredQuizzes.map((quiz) => (
                <article key={quiz.id} className="flex min-h-[230px] flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      {quiz.source_type === 'ai_generated' ? <FiArchive className="h-5 w-5" /> : <FiFileText className="h-5 w-5" />}
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                      {formatSourceType(quiz.source_type)}
                    </span>
                  </div>
                  <h3 className="mt-6 line-clamp-2 text-lg font-extrabold leading-6 text-slate-900">{quiz.title}</h3>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs font-semibold text-slate-500">
                    <span className="inline-flex min-w-0 items-center gap-2 truncate">
                      <FiBookOpen className="h-4 w-4 flex-none" />
                      {quiz.subject || 'No subject assigned'}
                    </span>
                    <span className="flex-none">{formatCreatedDate(quiz.created_at, locale)}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => void openQuizPreview(quiz.id)}
                      disabled={Boolean(startingQuizId) || Boolean(deletingQuizId) || Boolean(previewingQuizId)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-extrabold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-45"
                    >
                      <FiEye className="h-4 w-4" />
                      {previewingQuizId === quiz.id ? 'Loading…' : 'Preview'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void startSavedQuiz(quiz.id)}
                      disabled={Boolean(startingQuizId) || Boolean(deletingQuizId)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-45"
                    >
                      <FiPlay className="h-4 w-4" />
                      {startingQuizId === quiz.id ? 'Loading…' : 'Start quiz'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteSavedQuiz(quiz)}
                      disabled={Boolean(startingQuizId) || Boolean(deletingQuizId)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-45"
                      aria-label={`Delete ${quiz.title}`}
                      title="Delete quiz"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}

              <button
                type="button"
                onClick={() => navigate('/quiz/create')}
                className="flex min-h-[230px] flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-200 bg-slate-50 px-5 text-center text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <FiPlus className="h-5 w-5" />
                </span>
                <span className="mt-4 text-sm font-extrabold">Create another quiz</span>
              </button>
            </div>
          ) : (
            <section className="mt-5 flex min-h-[390px] flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-slate-200 bg-white px-6 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] bg-blue-50 text-blue-600">
                <FiArchive className="h-8 w-8" />
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white">
                  <FiPlus className="h-4 w-4" />
                </span>
              </div>
              <h3 className="mt-6 text-xl font-extrabold text-slate-950">
                {hasActiveFilters ? 'No quizzes match these filters' : 'Your library is empty'}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? 'Try a different search or clear the current filters.'
                  : 'Generate a quiz from your own notes or textbook pages. Saved quizzes will appear here.'}
              </p>
              {hasActiveFilters ? (
                <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/quiz/create')}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20"
                >
                  <FiUploadCloud className="h-4 w-4" />
                  Upload study material
                </button>
              )}
            </section>
          )}
        </div>
      </main>

      {previewQuiz && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewQuiz.quiz.title}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewQuiz(null);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] bg-[#f7f9fc] shadow-2xl">
            <header className="flex items-start justify-between gap-5 border-b border-slate-200 bg-white px-5 py-5 md:px-7">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">Saved quiz preview</p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight text-slate-950">{previewQuiz.quiz.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">{previewQuiz.quiz.subject}</span>
                  <span className="rounded-full bg-purple-50 px-3 py-1.5 text-purple-700">{previewQuiz.quiz.difficulty}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">{previewQuiz.quiz.questions.length} questions</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuiz(null)}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="Close quiz preview"
              >
                <FiX className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 md:p-7">
              {previewQuiz.quiz.questions.map((question, index) => (
                <article key={`${index}-${question.question}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                      Question {index + 1} · {question.question_type}
                    </span>
                  </div>
                  <p className="mt-4 text-base font-extrabold leading-7 text-slate-900">{question.question}</p>

                  {question.options.length > 0 && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={`${optionIndex}-${option}`} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600">
                          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-white text-xs font-extrabold text-slate-500 shadow-sm">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {revealedAnswers.has(index) ? (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                      <div className="flex items-start gap-2">
                        <FiCheck className="mt-0.5 flex-none" />
                        <span>{question.correct_answer}</span>
                      </div>
                      <button type="button" onClick={() => togglePreviewAnswer(index)} className="mt-2 text-xs font-extrabold text-emerald-700 hover:underline">
                        Hide answer
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => togglePreviewAnswer(index)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <FiEye className="h-4 w-4" />
                      Reveal answer
                    </button>
                  )}
                </article>
              ))}
            </div>

            <footer className="border-t border-slate-200 bg-white p-4 md:px-7">
              <button
                type="button"
                onClick={() => void startSavedQuiz(previewQuiz.id)}
                disabled={startingQuizId === previewQuiz.id}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-45"
              >
                <FiPlay className="h-4 w-4" />
                {startingQuizId === previewQuiz.id ? 'Starting…' : 'Start this quiz'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
