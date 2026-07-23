import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { AnalyticsFilters, SubjectAnalytics } from '@/types/analytics';
import { useLanguageStore } from '@/contexts/languageStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const formatStudyTime = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const masteryColor = (score: number | null) => {
  if (score === null) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
};

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<SubjectAnalytics[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectAnalytics[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const language = useLanguageStore((state) => state.language);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const loadSubjects = async (activeFilters: AnalyticsFilters = filters) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await authService.getSubjectAnalytics(activeFilters);
      setSubjects(response);
      if (subjectOptions.length === 0 && Object.keys(activeFilters).length === 0) setSubjectOptions(response);
      setSelectedSubjectId((current) => {
        if (activeFilters.subject_id && response.some((item) => item.id === activeFilters.subject_id)) {
          return activeFilters.subject_id;
        }
        return current && response.some((item) => item.id === current) ? current : null;
      });
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setLoadError(typeof detail === 'string' ? detail : 'Unable to load subject analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSubjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial unfiltered load only

  const selectedFilterSubject = subjectOptions.find((subject) => subject.id === filters.subject_id) || null;

  const clearFilters = async () => {
    const emptyFilters: AnalyticsFilters = {};
    setFilters(emptyFilters);
    setSelectedSubjectId(null);
    await loadSubjects(emptyFilters);
  };

  const applyFilters = async () => {
    setSelectedSubjectId(filters.subject_id || null);
    await loadSubjects(filters);
  };

  const exportPdf = async () => {
    setIsExporting(true);
    setLoadError('');
    try {
      await authService.exportProgressReport(language, filters);
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setLoadError(typeof detail === 'string' ? detail : 'Progress report could not be exported.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) || null;
  const measuredTopics = useMemo(
    () => selectedSubject?.topic_performance.filter((topic) => topic.score_percentage !== null) || [],
    [selectedSubject]
  );
  const weakestTopic = useMemo(
    () => [...measuredTopics].sort((a, b) => (a.score_percentage ?? 0) - (b.score_percentage ?? 0))[0] || null,
    [measuredTopics]
  );
  const overallStats = useMemo(() => {
    const measuredSubjects = subjects.filter((subject) => subject.overall_mastery !== null);
    const measuredTopicScores = subjects.flatMap((subject) =>
      subject.topic_performance
        .map((topic) => topic.score_percentage)
        .filter((score): score is number => score !== null)
    );
    const orderedSubjects = [...measuredSubjects].sort(
      (a, b) => (b.overall_mastery ?? 0) - (a.overall_mastery ?? 0)
    );

    return {
      averageMastery: measuredTopicScores.length
        ? measuredTopicScores.reduce((total, score) => total + score, 0) / measuredTopicScores.length
        : null,
      measuredSubjectCount: measuredSubjects.length,
      totalQuizzes: subjects.reduce((total, subject) => total + subject.quizzes_completed, 0),
      totalStudyMinutes: subjects.reduce((total, subject) => total + subject.study_minutes, 0),
      strongestSubject: orderedSubjects[0] || null,
      attentionSubject: orderedSubjects[orderedSubjects.length - 1] || null,
    };
  }, [subjects]);

  const chartData = useMemo(() => ({
    labels: selectedSubject?.recent_quiz_scores.map((point) => new Date(point.attempted_at).toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-MY', { day: 'numeric', month: 'short' })) || [],
    datasets: [{
      label: 'Quiz score',
      data: selectedSubject?.recent_quiz_scores.map((point) => point.score) || [],
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      fill: true,
      tension: 0.35,
      pointBackgroundColor: '#2563eb',
      pointRadius: 4,
    }],
  }), [language, selectedSubject]);

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="min-w-0">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
          <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Module 2</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950">Subject Performance</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Review mastery, learning activity, and knowledge gaps calculated from your saved study records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void exportPdf()} disabled={isExporting || isLoading} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/15 disabled:opacity-45">
                <FiDownload /> {isExporting ? 'Exporting…' : 'Export PDF'}
              </button>
              <button type="button" onClick={() => void loadSubjects()} disabled={isLoading} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 hover:border-blue-200 hover:text-blue-600 disabled:opacity-45">
                <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh data
              </button>
            </div>
          </header>

          <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><FiFilter className="text-blue-600" /> Analytics filters</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="text-xs font-bold text-slate-500">Subject
                <select value={filters.subject_id || ''} onChange={(event) => setFilters((current) => ({ ...current, subject_id: event.target.value || undefined, topic_id: undefined }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500">
                  <option value="">All subjects</option>
                  {subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.subject_name}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Topic
                <select value={filters.topic_id || ''} disabled={!selectedFilterSubject} onChange={(event) => setFilters((current) => ({ ...current, topic_id: event.target.value || undefined }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500 disabled:opacity-50">
                  <option value="">All topics</option>
                  {selectedFilterSubject?.topic_performance.map((topic) => <option key={topic.topic_id} value={topic.topic_id}>{topic.topic_name}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">From date
                <input type="date" value={filters.date_from || ''} onChange={(event) => setFilters((current) => ({ ...current, date_from: event.target.value || undefined }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500" />
              </label>
              <label className="text-xs font-bold text-slate-500">To date
                <input type="date" min={filters.date_from} value={filters.date_to || ''} onChange={(event) => setFilters((current) => ({ ...current, date_to: event.target.value || undefined }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-500" />
              </label>
              <div className="flex items-end gap-2">
                <button type="button" onClick={() => void applyFilters()} className="h-11 flex-1 rounded-xl bg-slate-950 px-4 text-sm font-extrabold text-white">Apply</button>
                <button type="button" onClick={() => void clearFilters()} className="h-11 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-500">Clear filters</button>
              </div>
            </div>
          </section>

          {isLoading ? (
            <div className="mt-8 grid animate-pulse gap-5 lg:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="h-44 rounded-[28px] bg-white" />)}
            </div>
          ) : loadError ? (
            <section className="mt-8 rounded-[30px] border border-red-100 bg-white p-8 text-center">
              <FiAlertCircle className="mx-auto h-8 w-8 text-red-500" />
              <h2 className="mt-4 text-xl font-extrabold">Subject analytics could not be loaded</h2>
              <p className="mt-2 text-sm text-slate-500">{loadError}</p>
            </section>
          ) : subjects.length === 0 ? (
            <section className="mt-8 flex min-h-[420px] flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-slate-200 bg-white px-6 text-center">
              <FiBookOpen className="h-10 w-10 text-slate-300" />
              <h2 className="mt-5 text-2xl font-extrabold">No subjects selected</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Choose your SPM subjects in Profile Settings before viewing subject analytics.</p>
              <button onClick={() => navigate('/profile')} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white">Manage subjects</button>
            </section>
          ) : (
            <>
              <section className="mt-8">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800">Subject view</h2>
                    <p className="mt-1 text-xs text-slate-400">Scroll sideways to switch subjects.</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{subjects.length} subjects</span>
                </div>
                <div className="overflow-x-auto pb-2 [scrollbar-width:thin]">
                  <div className="flex min-w-max gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectId(null)}
                      className={`min-w-[150px] rounded-2xl border px-4 py-3 text-left transition ${selectedSubjectId === null ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200'}`}
                    >
                      <p className="text-sm font-extrabold text-slate-900">All subjects</p>
                      <p className="mt-1 text-xs font-bold text-blue-600">Overall summary</p>
                    </button>
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => setSelectedSubjectId(subject.id)}
                        className={`min-w-[180px] rounded-2xl border px-4 py-3 text-left transition ${selectedSubject?.id === subject.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200'}`}
                      >
                        <p className="text-sm font-extrabold text-slate-900">{subject.subject_name}</p>
                        <p className={`mt-1 text-xs font-bold ${masteryColor(subject.overall_mastery)}`}>
                          {subject.overall_mastery === null ? 'No mastery data' : `${Math.round(subject.overall_mastery)}% mastery`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {selectedSubject ? (
                <>
              <section className="mt-6 grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-7">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">{selectedSubject.category || 'SPM subject'}</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-slate-950">{selectedSubject.subject_name} SPM</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">Analytics below use your recorded quiz attempts, study sessions, and topic performance.</p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">
                    {[
                      { icon: FiActivity, label: 'Completed quizzes', value: String(selectedSubject.quizzes_completed) },
                      { icon: FiClock, label: 'Study time', value: formatStudyTime(selectedSubject.study_minutes) },
                      { icon: FiTarget, label: 'Measured topics', value: `${selectedSubject.topics_measured}/${selectedSubject.topics_total}` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                        <item.icon className="h-5 w-5 text-blue-600" />
                        <p className="mt-4 text-xl font-extrabold text-slate-900">{item.value}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-[30px] bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <div
                    className="flex h-32 w-32 items-center justify-center rounded-full"
                    style={{ background: `conic-gradient(#2563eb ${(selectedSubject.overall_mastery ?? 0) * 3.6}deg, #e2e8f0 0deg)` }}
                  >
                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                      <span className={`text-3xl font-extrabold ${masteryColor(selectedSubject.overall_mastery)}`}>
                        {selectedSubject.overall_mastery === null ? '—' : `${Math.round(selectedSubject.overall_mastery)}%`}
                      </span>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Mastery</span>
                    </div>
                  </div>
                  <p className="mt-5 text-sm font-bold text-slate-700">
                    {selectedSubject.overall_mastery === null ? 'Complete topic activities to calculate mastery.' : 'Average across measured topics'}
                  </p>
                </div>
              </section>

              <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
                <div className="rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-7">
                  <div className="flex items-center gap-3">
                    <FiTrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-extrabold">Historical quiz performance</h3>
                  </div>
                  {selectedSubject.recent_quiz_scores.length > 0 ? (
                    <div className="mt-6 h-72">
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: { y: { min: 0, max: 100, ticks: { callback: (value) => `${value}%` } } },
                          plugins: { tooltip: { callbacks: { label: (context) => `${context.parsed.y}%` } } },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mt-6 flex h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
                      <FiActivity className="h-8 w-8 text-slate-300" />
                      <p className="mt-3 font-bold text-slate-600">No completed quiz attempts yet</p>
                      <p className="mt-1 text-sm text-slate-400">Scores will appear here after attempts are recorded.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-[30px] bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                  <FiZap className="h-6 w-6 text-blue-400" />
                  <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-300">Knowledge gap analysis</p>
                  {weakestTopic ? (
                    <>
                      <h3 className="mt-3 text-2xl font-extrabold">{weakestTopic.topic_name}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">This is currently your lowest measured topic at {Math.round(weakestTopic.score_percentage ?? 0)}%.</p>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-3 text-2xl font-extrabold">Not enough data yet</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">Complete subject activities to identify the topic that needs the most attention.</p>
                    </>
                  )}
                  <button onClick={() => navigate('/quiz/create')} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold hover:bg-blue-500">
                    Create a practice quiz <FiArrowRight />
                  </button>
                </div>
              </section>

              <section className="mt-5 rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-7">
                <h3 className="text-xl font-extrabold">Topic mastery breakdown</h3>
                {selectedSubject.topic_performance.length > 0 ? (
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {selectedSubject.topic_performance.map((topic) => (
                      <div key={topic.topic_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-slate-900">{topic.topic_name}</p>
                            <p className="mt-1 text-xs text-slate-500">{topic.sessions_count} recorded sessions</p>
                          </div>
                          <span className={`flex-none text-sm font-extrabold ${masteryColor(topic.score_percentage)}`}>
                            {topic.score_percentage === null ? 'Not measured' : `${Math.round(topic.score_percentage)}%`}
                          </span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${topic.score_percentage ?? 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No topics are stored for this subject yet.</div>
                )}
              </section>
                </>
              ) : (
                <section className="mt-6 rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">All-subject overview</p>
                      <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Your overall learning picture</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Mastery averages only measured topics. Subjects without activity are shown as coverage gaps, not counted as zero.
                      </p>
                    </div>
                    <button type="button" onClick={() => navigate('/quiz/create')} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white hover:bg-blue-700">
                      Practice a subject <FiArrowRight />
                    </button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        icon: FiTarget,
                        label: 'Average mastery',
                        value: overallStats.averageMastery === null ? '—' : `${Math.round(overallStats.averageMastery)}%`,
                      },
                      {
                        icon: FiBookOpen,
                        label: 'Subjects measured',
                        value: `${overallStats.measuredSubjectCount}/${subjects.length}`,
                      },
                      {
                        icon: FiActivity,
                        label: 'Completed quizzes',
                        value: String(overallStats.totalQuizzes),
                      },
                      {
                        icon: FiClock,
                        label: 'Total study time',
                        value: formatStudyTime(overallStats.totalStudyMinutes),
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                        <item.icon className="h-5 w-5 text-blue-600" />
                        <p className="mt-4 text-2xl font-extrabold text-slate-950">{item.value}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-800"><FiTrendingUp /> Strongest measured subject</div>
                      <p className="mt-3 text-xl font-extrabold text-slate-950">{overallStats.strongestSubject?.subject_name || 'Not enough data yet'}</p>
                      <p className="mt-1 text-sm font-bold text-emerald-700">
                        {overallStats.strongestSubject?.overall_mastery === null || !overallStats.strongestSubject
                          ? 'Complete a quiz to begin measuring mastery.'
                          : `${Math.round(overallStats.strongestSubject.overall_mastery)}% mastery`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-amber-800"><FiAlertCircle /> Needs the most attention</div>
                      <p className="mt-3 text-xl font-extrabold text-slate-950">{overallStats.attentionSubject?.subject_name || 'Not enough data yet'}</p>
                      <p className="mt-1 text-sm font-bold text-amber-700">
                        {overallStats.attentionSubject?.overall_mastery === null || !overallStats.attentionSubject
                          ? 'More measured activity is needed for comparison.'
                          : `${Math.round(overallStats.attentionSubject.overall_mastery)}% mastery`}
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
