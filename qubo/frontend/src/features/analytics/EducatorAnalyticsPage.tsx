import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiBookOpen,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTrendingUp,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';

import AppSidebar from '@/components/layout/AppSidebar';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import { EducatorDashboard, EducatorStudentSummary } from '@/types/analytics';

const emptyDashboard: EducatorDashboard = {
  summary: { linked_students: 0, students_at_risk: 0, average_prediction: null, total_study_minutes: 0, completed_quizzes: 0 },
  students: [],
};

const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

export default function EducatorAnalyticsPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<EducatorDashboard>(emptyDashboard);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await authService.getEducatorDashboard();
      setDashboard(response);
      setSelectedStudentId((current) => response.students.some((student) => student.id === current) ? current : response.students[0]?.id || null);
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Class analytics could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'student') {
      navigate('/analytics', { replace: true });
      return;
    }
    void loadDashboard();
  }, [user?.role]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return dashboard.students;
    return dashboard.students.filter((student) => `${student.full_name} ${student.username} ${student.school || ''}`.toLowerCase().includes(query));
  }, [dashboard.students, search]);
  const selectedStudent = dashboard.students.find((student) => student.id === selectedStudentId) || null;

  const addStudent = async (event: FormEvent) => {
    event.preventDefault();
    if (username.trim().length < 3) return;
    setIsLinking(true);
    setMessage('');
    setError('');
    try {
      const response = await authService.linkStudent(username.trim());
      setMessage(response.message);
      setUsername('');
      await loadDashboard();
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Student could not be added.');
    } finally {
      setIsLinking(false);
    }
  };

  const removeStudent = async (student: EducatorStudentSummary) => {
    if (!window.confirm(`Remove ${student.full_name} from your class analytics?`)) return;
    setMessage('');
    setError('');
    try {
      const response = await authService.unlinkStudent(student.id);
      setMessage(response.message);
      await loadDashboard();
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Student could not be removed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="min-w-0 px-5 py-8 md:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Educator analytics</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight">Class performance</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Review class-wide progress, early warnings, and individual subject summaries for linked students.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form onSubmit={addStudent} className="flex gap-2">
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Student username" className="h-11 w-48 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500" />
                <button disabled={isLinking || username.trim().length < 3} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white disabled:opacity-50"><FiUserPlus />{isLinking ? 'Adding…' : 'Add'}</button>
              </form>
              <button onClick={() => void loadDashboard()} disabled={isLoading} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 disabled:opacity-50"><FiRefreshCw className={isLoading ? 'animate-spin' : ''} />Refresh</button>
            </div>
          </header>

          {(message || error) && <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: FiUsers, label: 'Linked students', value: dashboard.summary.linked_students },
              { icon: FiAlertTriangle, label: 'Students at risk', value: dashboard.summary.students_at_risk },
              { icon: FiTrendingUp, label: 'Average forecast', value: dashboard.summary.average_prediction === null ? '—' : `${Math.round(dashboard.summary.average_prediction)}%` },
              { icon: FiClock, label: 'Class study time', value: formatMinutes(dashboard.summary.total_study_minutes) },
            ].map((item) => (
              <div key={item.label} className="rounded-[26px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <item.icon className="h-5 w-5 text-blue-600" /><p className="mt-5 text-2xl font-extrabold">{isLoading ? '—' : item.value}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid min-h-[560px] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="rounded-[30px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-extrabold">Students</h2>
              <label className="mt-4 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400">
                <FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none" />
              </label>
              <div className="mt-4 space-y-2">
                {filteredStudents.map((student) => (
                  <button key={student.id} type="button" onClick={() => setSelectedStudentId(student.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${selectedStudentId === student.id ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-slate-50 hover:border-blue-200'}`}>
                    {student.profile_picture_url ? <img src={student.profile_picture_url} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-blue-700">{student.full_name.slice(0, 2).toUpperCase()}</div>}
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{student.full_name}</p><p className="mt-1 truncate text-xs text-slate-500">@{student.username}</p></div>
                    {student.at_risk && <span className="h-2.5 w-2.5 rounded-full bg-red-500" title="Early warning" />}
                  </button>
                ))}
                {!isLoading && filteredStudents.length === 0 && <div className="rounded-2xl border-2 border-dashed border-slate-200 p-7 text-center text-sm text-slate-400">{dashboard.students.length ? 'No student matches your search.' : 'Add a student by username to begin class analytics.'}</div>}
              </div>
            </aside>

            <div className="rounded-[30px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:p-7">
              {selectedStudent ? (
                <>
                  <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">Individual summary</p><h2 className="mt-2 text-3xl font-extrabold">{selectedStudent.full_name}</h2><p className="mt-2 text-sm text-slate-500">{selectedStudent.school || 'School not set'} · {selectedStudent.form_level || 'Form level not set'} · Target {selectedStudent.target_grade || 'not set'}</p></div>
                    <button type="button" onClick={() => void removeStudent(selectedStudent)} className="inline-flex items-center gap-2 self-start rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"><FiTrash2 />Remove</button>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ['Average mastery', selectedStudent.average_mastery === null ? '—' : `${Math.round(selectedStudent.average_mastery)}%`],
                      ['Latest forecast', selectedStudent.latest_prediction === null ? '—' : `${Math.round(selectedStudent.latest_prediction)}%`],
                      ['Study time', formatMinutes(selectedStudent.study_minutes)],
                      ['Quizzes', String(selectedStudent.quizzes_completed)],
                    ].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-xl font-extrabold">{value}</p><p className="mt-1 text-xs font-bold text-slate-400">{label}</p></div>)}
                  </div>

                  {selectedStudent.at_risk && <div className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"><FiAlertTriangle className="mt-0.5 flex-none" /><div><p className="text-sm font-extrabold">Early warning active</p><p className="mt-1 text-xs leading-5">At least one subject forecast is below this student's configured threshold.</p></div></div>}

                  <h3 className="mt-7 text-lg font-extrabold">Subject summaries</h3>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {selectedStudent.subjects.map((subject) => (
                      <article key={subject.id} className="rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-start justify-between gap-3"><div><p className="font-extrabold">{subject.subject_name}</p><p className="mt-1 text-xs text-slate-400">{subject.study_sessions} sessions · {subject.quizzes_completed} quizzes</p></div>{subject.latest_prediction?.is_warning && <FiAlertTriangle className="text-red-500" />}</div>
                        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-slate-50 p-3"><p className="font-extrabold">{subject.overall_mastery === null ? '—' : `${Math.round(subject.overall_mastery)}%`}</p><p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Mastery</p></div>
                          <div className="rounded-xl bg-slate-50 p-3"><p className="font-extrabold">{subject.latest_prediction ? `${Math.round(subject.latest_prediction.predicted_score)}%` : '—'}</p><p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Forecast</p></div>
                          <div className="rounded-xl bg-slate-50 p-3"><p className="font-extrabold">{subject.learning_velocity === null ? '—' : `${subject.learning_velocity > 0 ? '+' : ''}${subject.learning_velocity}`}</p><p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Pts/week</p></div>
                        </div>
                      </article>
                    ))}
                    {selectedStudent.subjects.length === 0 && <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 lg:col-span-2"><FiBookOpen className="mx-auto mb-3 h-6 w-6" />This student has not selected any subjects.</div>}
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-center"><FiUsers className="h-10 w-10 text-slate-300" /><h2 className="mt-5 text-xl font-extrabold">Select a student</h2><p className="mt-2 max-w-sm text-sm text-slate-400">Choose a linked student to view their subject progress and forecasts.</p></div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
