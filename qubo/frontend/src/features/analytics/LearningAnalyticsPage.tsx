import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiBarChart2,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiPlay,
  FiRefreshCw,
  FiSave,
  FiTrendingUp,
} from 'react-icons/fi';

import AppSidebar from '@/components/layout/AppSidebar';
import { useAuthStore } from '@/contexts/authStore';
import { useLanguageStore } from '@/contexts/languageStore';
import { useQuizStore } from '@/contexts/quizStore';
import StudyPlanCard from '@/features/analytics/components/StudyPlanCard';
import { authService } from '@/lib/authService';
import { ReviewSchedule, StudySession, SubjectAnalytics, StudyPlanRecommendation } from '@/types/analytics';

const localDateTimeValue = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${minutes} min`;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

export default function LearningAnalyticsPage() {
  const user = useAuthStore((state) => state.user);
  const language = useLanguageStore((state) => state.language);
  const locale = language === 'ms' ? 'ms-MY' : 'en-MY';
  const navigate = useNavigate();
  const setGeneratedQuiz = useQuizStore((state) => state.setGeneratedQuiz);
  const setSavedQuizId = useQuizStore((state) => state.setSavedQuizId);
  const [subjects, setSubjects] = useState<SubjectAnalytics[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [reviewSchedule, setReviewSchedule] = useState<ReviewSchedule[]>([]);
  const [recommendations, setRecommendations] = useState<StudyPlanRecommendation[]>([]);
  const [threshold, setThreshold] = useState(50);
  const [savedThreshold, setSavedThreshold] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const [startingReviewId, setStartingReviewId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    subject_id: '',
    topic_name: '',
    duration_minutes: 25,
    pomodoro_cycles: 1,
    session_date: localDateTimeValue(),
    notes: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [subjectResult, sessionResult, thresholdResult, reviewResult, recommendationResult] = await Promise.allSettled([
        authService.getSubjectAnalytics(),
        authService.getStudySessions(),
        authService.getPredictionThreshold(),
        authService.getReviewSchedule(),
        authService.getStudyPlanRecommendations(),
      ]);

      const failedSections: string[] = [];
      if (subjectResult.status === 'fulfilled') {
        const subjectData = subjectResult.value;
        setSubjects(subjectData);
        setForm((current) => ({
          ...current,
          subject_id: subjectData.some((subject) => subject.id === current.subject_id)
            ? current.subject_id
            : subjectData[0]?.id || '',
        }));
      } else {
        failedSections.push('subject progress');
      }

      if (sessionResult.status === 'fulfilled') setSessions(sessionResult.value);
      else failedSections.push('study sessions');

      if (thresholdResult.status === 'fulfilled') {
        setThreshold(thresholdResult.value);
        setSavedThreshold(thresholdResult.value);
      } else {
        failedSections.push('warning setting');
      }

      if (reviewResult.status === 'fulfilled') setReviewSchedule(reviewResult.value);
      else failedSections.push('review schedule');

      if (recommendationResult.status === 'fulfilled') setRecommendations(recommendationResult.value);
      else failedSections.push('study plan');

      if (failedSections.length) {
        setError(`Could not load ${failedSections.join(', ')}. Other analytics remain available.`);
      }
    } catch {
      setError('Learning analytics could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'educator') {
      navigate('/educator/analytics', { replace: true });
      return;
    }
    void loadData();
  }, [navigate, user?.role]);

  const selectedSubject = subjects.find((subject) => subject.id === form.subject_id) || null;
  const predictions = subjects
    .map((subject) => subject.latest_prediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction));
  const activeWarnings = predictions.filter((prediction) => prediction.is_warning);
  const totalMinutes = useMemo(() => subjects.reduce((total, subject) => total + subject.study_minutes, 0), [subjects]);

  const submitSession = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!form.subject_id || form.topic_name.trim().length < 2) {
      setError('Choose a subject and enter the topic you studied.');
      return;
    }
    setIsSaving(true);
    try {
      await authService.createStudySession({
        subject_id: form.subject_id,
        topic_name: form.topic_name.trim(),
        duration_minutes: form.duration_minutes,
        pomodoro_cycles: form.pomodoro_cycles,
        session_date: new Date(form.session_date).toISOString(),
        notes: form.notes.trim() || undefined,
      });
      setMessage('Study session recorded successfully.');
      setForm((current) => ({ ...current, topic_name: '', notes: '', session_date: localDateTimeValue() }));
      await loadData();
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Study session could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveThreshold = async () => {
    setIsSavingThreshold(true);
    setMessage('');
    setError('');
    try {
      const updated = await authService.updatePredictionThreshold(threshold);
      setThreshold(updated);
      setSavedThreshold(updated);
      setMessage(`Early-warning threshold updated to ${updated}%.`);
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Warning threshold could not be updated.');
    } finally {
      setIsSavingThreshold(false);
    }
  };

  const startReview = async (item: ReviewSchedule) => {
    if (!item.quiz_id) return;
    setMessage('');
    setError('');
    setStartingReviewId(item.id);
    try {
      const quiz = await authService.getSavedQuiz(item.quiz_id);
      setGeneratedQuiz(quiz);
      setSavedQuizId(item.quiz_id);
      navigate('/quiz/session');
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'The review quiz could not be opened.');
    } finally {
      setStartingReviewId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="min-w-0 px-5 py-8 md:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Learning analytics</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Study tracker & forecast</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Record focused study, follow your learning velocity, and receive an updated SPM forecast after every quiz.
              </p>
            </div>
            <button onClick={() => void loadData()} disabled={isLoading} className="inline-flex h-11 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:text-blue-600 disabled:opacity-50">
              <FiRefreshCw className={isLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </header>

          {(message || error) && (
            <div className={`mt-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error ? <FiAlertTriangle /> : <FiCheckCircle />}
              {error || message}
            </div>
          )}

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: FiClock, label: 'Total study time', value: formatMinutes(totalMinutes) },
              { icon: FiBookOpen, label: 'Recorded sessions', value: String(subjects.reduce((total, subject) => total + subject.study_sessions, 0)) },
              { icon: FiBarChart2, label: 'Active forecasts', value: String(predictions.length) },
              { icon: FiAlertTriangle, label: 'Early warnings', value: String(activeWarnings.length) },
            ].map((item) => (
              <div key={item.label} className="rounded-[26px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <item.icon className="h-5 w-5 text-blue-600" />
                <p className="mt-5 text-2xl font-extrabold">{isLoading ? '—' : item.value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <form onSubmit={submitSession} className="rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><FiClock /></div>
                <div>
                  <h2 className="text-xl font-extrabold">Record study session</h2>
                  <p className="mt-1 text-sm text-slate-500">Save the subject, topic, duration and Pomodoro cycles.</p>
                </div>
              </div>

              {subjects.length === 0 && !isLoading ? (
                <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 p-7 text-center">
                  <p className="text-sm font-semibold text-slate-500">Select your SPM subjects before recording a session.</p>
                  <button type="button" onClick={() => navigate('/profile/settings')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Open Profile Settings</button>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-bold text-slate-700">
                    Subject
                    <select value={form.subject_id} onChange={(event) => setForm((current) => ({ ...current, subject_id: event.target.value, topic_name: '' }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500" required>
                      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.subject_name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-bold text-slate-700">
                    Topic
                    <input list="subject-topics" value={form.topic_name} onChange={(event) => setForm((current) => ({ ...current, topic_name: event.target.value }))} placeholder="e.g. Quadratic equations" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500" required />
                    <datalist id="subject-topics">{selectedSubject?.topic_performance.map((topic) => <option key={topic.topic_id} value={topic.topic_name} />)}</datalist>
                  </label>
                  <label className="text-sm font-bold text-slate-700">
                    Duration (minutes)
                    <input type="number" min={1} max={720} value={form.duration_minutes} onChange={(event) => setForm((current) => ({ ...current, duration_minutes: Number(event.target.value) }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500" required />
                  </label>
                  <label className="text-sm font-bold text-slate-700">
                    Pomodoro cycles
                    <input type="number" min={0} max={30} value={form.pomodoro_cycles} onChange={(event) => setForm((current) => ({ ...current, pomodoro_cycles: Number(event.target.value) }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500" required />
                  </label>
                  <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                    Session date and time
                    <input type="datetime-local" value={form.session_date} onChange={(event) => setForm((current) => ({ ...current, session_date: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-blue-500" required />
                  </label>
                  <label className="text-sm font-bold text-slate-700 sm:col-span-2">
                    Notes <span className="font-medium text-slate-400">(optional)</span>
                    <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500" placeholder="What did you cover?" />
                  </label>
                  <button disabled={isSaving || !form.subject_id} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-50 sm:col-span-2">
                    <FiSave /> {isSaving ? 'Saving session…' : 'Save study session'}
                  </button>
                </div>
              )}
            </form>

            <div className="space-y-6">
              <section className="rounded-[30px] bg-slate-950 p-6 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-300">Early-warning setting</p>
                <h2 className="mt-2 text-xl font-extrabold">Alert below {threshold}%</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">A warning appears when a subject forecast falls below this score.</p>
                <input type="range" min={0} max={100} step={1} value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} className="mt-6 w-full accent-blue-500" aria-label="Prediction warning threshold" />
                <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400"><span>0%</span><span>100%</span></div>
                <button type="button" onClick={() => void saveThreshold()} disabled={isSavingThreshold || threshold === savedThreshold} className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40">
                  {isSavingThreshold ? 'Saving…' : threshold === savedThreshold ? 'Threshold saved' : 'Save threshold'}
                </button>
              </section>

              <section className="rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <h2 className="text-xl font-extrabold">Recent study sessions</h2>
                <div className="mt-4 space-y-3">
                  {sessions.length ? sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="text-sm font-extrabold">{session.subject_name}</p><p className="mt-1 text-xs text-slate-500">{session.topic_name}</p></div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{session.duration_minutes} min</span>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">{new Date(session.session_date).toLocaleString(locale)} · {session.pomodoro_cycles} Pomodoro</p>
                    </div>
                  )) : <p className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">No study sessions recorded yet.</p>}
                </div>
              </section>

              <section className="rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold">Review schedule</h2>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">{reviewSchedule.filter((item) => item.is_due).length} due</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">Review dates adapt automatically after each quiz attempt.</p>
                <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {reviewSchedule.length ? reviewSchedule.slice(0, 6).map((item) => (
                    <div key={item.id} className={`rounded-2xl border p-4 ${item.is_due ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="text-sm font-extrabold">{item.topic_name}</p><p className="mt-1 text-xs text-slate-500">{item.subject_name}</p></div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${item.is_due ? 'bg-amber-200 text-amber-800' : 'bg-white text-slate-500'}`}>{item.is_due ? 'Due now' : `${item.interval_days} day interval`}</span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-slate-500">Next review: {new Date(`${item.next_review_date}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      {item.quiz_id ? (
                        <button
                          type="button"
                          onClick={() => void startReview(item)}
                          disabled={startingReviewId === item.id}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <FiPlay /> {startingReviewId === item.id ? 'Opening review…' : item.is_due ? 'Start review quiz' : 'Practice early'}
                        </button>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-slate-400">No saved quiz is available for this topic.</p>
                      )}
                    </div>
                  )) : <p className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Complete a quiz to create your first review date.</p>}
                </div>
              </section>
            </div>
          </section>

          <section className="mt-6">
            <StudyPlanCard recommendations={recommendations} onRefresh={() => void loadData()} />
          </section>

          <section className="mt-6 rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-7">
            <div className="flex items-center gap-3"><FiTrendingUp className="text-blue-600" /><h2 className="text-xl font-extrabold">Exam score forecasts</h2></div>
            <p className="mt-2 text-sm text-slate-500">Forecasts are updated automatically after a saved quiz attempt.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {subjects.map((subject) => {
                const prediction = subject.latest_prediction;
                return (
                  <article key={subject.id} className={`rounded-2xl border p-5 ${prediction?.is_warning ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-extrabold">{subject.subject_name}</p><p className="mt-1 text-xs font-semibold text-slate-400">{prediction ? `Based on ${prediction.basis_attempt_count} attempt${prediction.basis_attempt_count === 1 ? '' : 's'}` : 'Complete a quiz to start forecasting'}</p></div>
                      {prediction?.is_warning && <FiAlertTriangle className="text-red-600" />}
                    </div>
                    <p className={`mt-5 text-3xl font-extrabold ${prediction?.is_warning ? 'text-red-600' : 'text-blue-600'}`}>{prediction ? `${Math.round(prediction.predicted_score)}%` : '—'}</p>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Velocity</span>
                      <span>{subject.learning_velocity === null ? 'Not enough data' : `${subject.learning_velocity > 0 ? '+' : ''}${subject.learning_velocity} pts/week`}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
