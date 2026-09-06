import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { PublicQuiz, GeneratedQuiz } from '@/types/quiz';
import { useQuizStore } from '@/contexts/quizStore';
import {
  FiAlertCircle,
  FiArchive,
  FiBookOpen,
  FiChevronDown,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiX,
} from 'react-icons/fi';

const formatCreatedDate = (createdAt: string) =>
  new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(createdAt));

export default function QuizExplorerPage() {
  const navigate = useNavigate();
  const setGeneratedQuiz = useQuizStore((state) => state.setGeneratedQuiz);
  const setSavedQuizId = useQuizStore((state) => state.setSavedQuizId);
  const [quizzes, setQuizzes] = useState<PublicQuiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      setQuizzes(await authService.getPublicQuizzes());
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setLoadError(typeof detail === 'string' ? detail : 'Unable to load public quizzes right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  const subjects = useMemo(
    () => Array.from(new Set(quizzes.map((quiz) => quiz.subject).filter((subject): subject is string => Boolean(subject)))).sort(),
    [quizzes]
  );

  const filteredQuizzes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      const matchesSearch =
        !normalizedQuery ||
        quiz.title.toLowerCase().includes(normalizedQuery) ||
        quiz.subject?.toLowerCase().includes(normalizedQuery) ||
        quiz.owner_name?.toLowerCase().includes(normalizedQuery);
      const matchesSubject = selectedSubject === 'all' || quiz.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [quizzes, searchQuery, selectedSubject]);

  const startPublicQuiz = async (quizId: string) => {
    setStartingQuizId(quizId);
    try {
      const quiz: GeneratedQuiz = await authService.getSavedQuiz(quizId);
      setGeneratedQuiz(quiz);
      setSavedQuizId(quizId);
      navigate('/quiz/session');
    } catch {
      setLoadError('Unable to start this quiz. Please try again.');
    } finally {
      setStartingQuizId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
  };

  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedSubject !== 'all';

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
          <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Quiz explorer</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Public Quizzes</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Browse quizzes shared by educators. Practice with real questions to prepare for your SPM exams.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/quiz/create')}
              className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-2xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 md:self-auto"
            >
              Create your own quiz
            </button>
          </header>

          <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
              <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-400 focus-within:bg-white">
                <FiSearch className="h-4 w-4 flex-none text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search quizzes by title, subject or educator"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                />
                {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="text-slate-400 hover:text-slate-700"><FiX /></button>}
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
              <h2 className="text-xl font-extrabold text-slate-950">Available quizzes</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isLoading ? 'Loading quizzes…' : `${filteredQuizzes.length} ${filteredQuizzes.length === 1 ? 'quiz' : 'quizzes'} available`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadQuizzes()}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600"
              aria-label="Refresh quizzes"
              title="Refresh quizzes"
            >
              <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading quizzes">
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
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">Could not load quizzes</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadQuizzes()}
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
                      <FiArchive className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                      {quiz.question_count} questions
                    </span>
                  </div>
                  <h3 className="mt-6 line-clamp-2 text-lg font-extrabold leading-6 text-slate-900">{quiz.title}</h3>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs font-semibold text-slate-500">
                    <span className="inline-flex min-w-0 items-center gap-2 truncate">
                      <FiBookOpen className="h-4 w-4 flex-none" />
                      {quiz.subject || 'General'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 flex-none">
                      <FiUser className="h-3.5 w-3.5" />
                      {quiz.owner_name || 'Educator'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{formatCreatedDate(quiz.created_at)}</div>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => void startPublicQuiz(quiz.id)}
                      disabled={Boolean(startingQuizId)}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-45"
                    >
                      <FiPlay className="h-4 w-4" />
                      {startingQuizId === quiz.id ? 'Loading…' : 'Start quiz'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <section className="mt-5 flex min-h-[390px] flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-slate-200 bg-white px-6 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] bg-blue-50 text-blue-600">
                <FiArchive className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-xl font-extrabold text-slate-950">
                {hasActiveFilters ? 'No quizzes match these filters' : 'No public quizzes available yet'}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? 'Try a different search or clear the current filters.'
                  : 'When educators share their quizzes publicly, they will appear here for you to practice.'}
              </p>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
                  Clear filters
                </button>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
