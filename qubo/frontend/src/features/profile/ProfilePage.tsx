import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiClock,
  FiChevronRight,
  FiDatabase,
  FiDownload,
  FiEdit3,
  FiEye,
  FiHeadphones,
  FiKey,
  FiLock,
  FiLogOut,
  FiMail,
  FiMoon,
  FiPlus,
  FiSettings,
  FiShield,
  FiTarget,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuthStore } from '@/contexts/authStore';
import { useLanguageStore } from '@/contexts/languageStore';
import { useThemeStore } from '@/contexts/themeStore';
import { authService } from '@/lib/authService';
import { normalizeSpmTargetGrade } from '@/lib/spmGrades';
import { AccountDataSummary, LearningStyle, StudyReminderPreferences, Subject } from '@/types/auth';

const styleCards = [
  {
    key: 'visual' as LearningStyle,
    label: 'Visual',
    icon: FiEye,
    description: 'Prefer diagrams & mind maps',
    color: 'blue',
  },
  {
    key: 'auditory' as LearningStyle,
    label: 'Auditory',
    icon: FiHeadphones,
    description: 'Audio notes & lectures',
    color: 'emerald',
  },
  {
    key: 'kinesthetic' as LearningStyle,
    label: 'Kinesthetic',
    icon: FiEdit3,
    description: 'Learn by doing & practice',
    color: 'purple',
  },
];

const stylePalette = {
  blue: {
    border: 'border-blue-500',
    icon: 'bg-blue-50 text-blue-600',
    score: 'text-blue-600',
  },
  emerald: {
    border: 'border-emerald-500',
    icon: 'bg-emerald-50 text-emerald-600',
    score: 'text-emerald-600',
  },
  purple: {
    border: 'border-purple-500',
    icon: 'bg-purple-50 text-purple-600',
    score: 'text-purple-600',
  },
};

const initialsFor = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const defaultReminders: StudyReminderPreferences = {
  daily_flashcards_enabled: true,
  daily_flashcards_time: '20:00',
  nightly_review_enabled: true,
  nightly_review_time: '22:30',
  reminder_timezone: 'Asia/Kuala_Lumpur',
};

const learningAdvice: Record<LearningStyle, { en: string; ms: string }> = {
  visual: { en: 'Use diagrams, timelines, maps and colour-coded summaries', ms: 'Gunakan rajah, garis masa, peta dan ringkasan berkod warna' },
  auditory: { en: 'Explain key ideas aloud, discuss answers and make short audio notes', ms: 'Terangkan idea utama dengan kuat, bincangkan jawapan dan buat nota audio ringkas' },
  kinesthetic: { en: 'Use practice questions, active recall and hands-on examples', ms: 'Gunakan soalan latihan, ingatan aktif dan contoh praktikal' },
};

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [reminders, setReminders] = useState<StudyReminderPreferences | null>(null);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const [imageFailed, setImageFailed] = useState(false);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<'privacy' | 'security' | null>(null);
  const [privacySummary, setPrivacySummary] = useState<AccountDataSummary | null>(null);
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false);
  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState('');
  const [accountAction, setAccountAction] = useState<'clear-history' | 'deactivate' | 'delete' | null>(null);
  const [accountPassword, setAccountPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const language = useLanguageStore((state) => state.language);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const darkMode = theme === 'dark';

  const closeAccountDialog = () => {
    if (isUpdatingAccount) return;
    setAccountAction(null);
    setAccountPassword('');
    setAccountError('');
  };

  const submitAccountAction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accountAction || !accountPassword) return;
    setIsUpdatingAccount(true);
    setAccountError('');
    try {
      if (accountAction === 'clear-history') {
        await authService.clearLearningHistory(accountPassword);
        setAccountAction(null);
        setAccountPassword('');
        setIsUpdatingAccount(false);
        setPrivacyMessage('Learning history cleared. Your profile, subjects and saved quizzes were preserved.');
        void loadPrivacySummary();
        return;
      } else if (accountAction === 'deactivate') {
        await authService.deactivateAccount(accountPassword);
      } else {
        await authService.deleteAccount(accountPassword);
      }
      window.location.assign('/login');
    } catch (requestError: any) {
      setAccountError(requestError.response?.data?.detail || 'The account request could not be completed.');
      setIsUpdatingAccount(false);
    }
  };

  const loadPrivacySummary = async () => {
    setIsLoadingPrivacy(true);
    setAccountError('');
    try {
      setPrivacySummary(await authService.getAccountDataSummary());
    } catch {
      setAccountError('Your data summary could not be loaded.');
    } finally {
      setIsLoadingPrivacy(false);
    }
  };

  const toggleSettingsPanel = (panel: 'privacy' | 'security') => {
    const nextPanel = activeSettingsPanel === panel ? null : panel;
    setActiveSettingsPanel(nextPanel);
    setPrivacyMessage('');
    setAccountError('');
    if (nextPanel === 'privacy' && !privacySummary) void loadPrivacySummary();
  };

  const downloadAccountData = async () => {
    setIsDownloadingData(true);
    setAccountError('');
    try {
      await authService.downloadAccountData();
      setPrivacyMessage('Your Qubo account data was downloaded as JSON.');
    } catch {
      setAccountError('Your account data could not be downloaded.');
    } finally {
      setIsDownloadingData(false);
    }
  };

  const downloadProgressReport = async () => {
    setIsDownloadingData(true);
    setAccountError('');
    try {
      await authService.exportProgressReport(language);
      setPrivacyMessage('Your learning progress report was downloaded as PDF.');
    } catch {
      setAccountError('Your progress report could not be downloaded.');
    } finally {
      setIsDownloadingData(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'student') {
      setIsLoadingReminders(false);
      return;
    }

    const loadSubjects = async () => {
      const [subjectResult, reminderResult] = await Promise.allSettled([
        authService.getStudentSubjects(),
        authService.getStudyReminders(),
      ]);
      if (subjectResult.status === 'fulfilled') setSubjects(subjectResult.value);
      else console.error('Failed to load profile subjects:', subjectResult.reason);
      if (reminderResult.status === 'fulfilled') setReminders(reminderResult.value);
      else setReminderMessage('Study reminders could not be loaded.');
      setIsLoadingReminders(false);
    };

    void loadSubjects();
  }, [user]);

  useEffect(() => {
    setImageFailed(false);
  }, [user?.profile_picture_url]);

  const daysUntilExam = useMemo(() => {
    if (!user?.target_exam_date) return '—';
    const examDate = new Date(`${user.target_exam_date.slice(0, 10)}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const difference = Math.ceil((examDate.getTime() - today.getTime()) / 86_400_000);
    return difference >= 0 ? String(difference) : '0';
  }, [user?.target_exam_date]);

  if (!user) return <div className="min-h-screen bg-[#f6f8fb]" />;

  const selectedStyle = user.learning_style || 'visual';
  const styleScores: Record<LearningStyle, number | null> = {
    visual: user.visual_score ?? null,
    auditory: user.auditory_score ?? null,
    kinesthetic: user.kinesthetic_score ?? null,
  };
  const hasSavedScores = Object.values(styleScores).every((score) => score !== null);
  const displayName = user.full_name || user.username;
  const targetGrade = normalizeSpmTargetGrade(user.target_grade);
  const coreTargets = [
    targetGrade ? `SPM: ${targetGrade}` : 'SPM: Set target',
    user.form_level || 'Form level not set',
    user.school || 'School not set',
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const updateReminder = <Key extends keyof StudyReminderPreferences>(
    key: Key,
    value: StudyReminderPreferences[Key],
  ) => {
    setReminderMessage('');
    setReminders((current) => ({ ...(current || defaultReminders), [key]: value }));
  };

  const saveReminders = async () => {
    if (!reminders) return;
    setIsSavingReminders(true);
    setReminderMessage('');
    try {
      const saved = await authService.updateStudyReminders({
        daily_flashcards_enabled: reminders.daily_flashcards_enabled,
        daily_flashcards_time: reminders.daily_flashcards_time.slice(0, 5),
        nightly_review_enabled: reminders.nightly_review_enabled,
        nightly_review_time: reminders.nightly_review_time.slice(0, 5),
      });
      setReminders(saved);
      setReminderMessage('Reminder settings saved.');
      window.dispatchEvent(new Event('qubo:reminders-updated'));
    } catch {
      setReminderMessage('Reminder settings could not be saved.');
    } finally {
      setIsSavingReminders(false);
    }
  };

  const enableBrowserAlerts = async () => {
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      setReminderMessage('This browser does not support desktop notifications. In-app reminders will still appear.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    setReminderMessage(
      permission === 'granted'
        ? 'Browser alerts enabled. Reminders also appear inside Qubo.'
        : 'Browser alerts were not enabled. In-app reminders will still appear while Qubo is open.',
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />

      <div className="min-w-0">
        <main className="mx-auto w-full max-w-[1120px] px-5 py-8 md:px-8 lg:py-10">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-[38px]">Student Identity</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Manage your academic profile, learning preferences, and platform security in your scholastic sanctuary.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => navigate('/profile/settings')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                <FiSettings className="h-4 w-4" />
                Profile Settings
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800"
              >
                <FiLogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </section>

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative h-24 w-24 flex-none">
                    {user.profile_picture_url && !imageFailed ? (
                      <img
                        src={user.profile_picture_url}
                        alt={`${displayName} profile`}
                        onError={() => setImageFailed(true)}
                        className="h-full w-full rounded-full border-4 border-white object-cover shadow-md ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl font-black text-blue-700 ring-1 ring-blue-200">
                        {initialsFor(displayName) || <FiUser />}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/profile/settings')}
                      aria-label="Edit profile picture"
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md hover:bg-blue-700"
                    >
                      <FiEdit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black tracking-tight text-slate-950">{displayName}</h2>
                      <FiCheck className="h-5 w-5 rounded-full bg-blue-600 p-1 text-white" />
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {user.school || 'SPM Student'} • {user.form_level || 'Form level not set'}
                    </p>
                    <div className="mt-4 grid max-w-sm grid-cols-2 gap-3">
                      <div className="rounded-xl bg-emerald-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">SPM Target</p>
                        <p className="mt-1 text-xl font-black text-emerald-700">{targetGrade || '—'}</p>
                      </div>
                      <div className="rounded-xl bg-blue-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-500">Days to SPM</p>
                        <p className="mt-1 text-xl font-black text-blue-700">{daysUntilExam} <span className="text-xs">Days</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Core academic targets</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {coreTargets.map((target, index) => (
                      <span key={target} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                        <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-purple-500' : 'bg-blue-500'}`} />
                        {target}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)] md:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Learning Style</h2>
                    <p className="mt-1 text-xs font-medium text-slate-400">Questionnaire-based learning preference</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => navigate('/resources')} className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-100">
                      Find resources
                    </button>
                    <button type="button" onClick={() => navigate('/learning-style-assessment', { state: { returnTo: '/profile' } })} className="rounded-lg bg-purple-50 px-3 py-2 text-[11px] font-extrabold text-purple-700 hover:bg-purple-100">
                      {hasSavedScores ? 'Retake' : 'Complete assessment'}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {styleCards.map((style) => {
                    const isSelected = style.key === selectedStyle;
                    const palette = stylePalette[style.color as keyof typeof stylePalette];
                    const score = styleScores[style.key];
                    return (
                      <article
                        key={style.key}
                        className={`rounded-2xl border-2 bg-white p-4 text-center ${isSelected ? palette.border : 'border-slate-100'}`}
                      >
                        <span className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${palette.icon}`}>
                          <style.icon className="h-4 w-4" />
                        </span>
                        <h3 className="mt-3 text-sm font-black text-slate-800">{style.label}</h3>
                        <p className={`mt-1 ${score === null ? 'text-xs' : 'text-2xl'} font-black ${palette.score}`}>
                          {score === null ? (isSelected ? 'Saved preference' : 'Not assessed') : `${score}%`}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-400">{style.description}</p>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-blue-600 text-white">
                      <FiKey className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-blue-700">Your next study step</p>
                      <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">
                        {hasSavedScores
                          ? language === 'ms'
                            ? `${learningAdvice[selectedStyle].ms} semasa mengulang kaji ${subjects.length ? subjects.slice(0, 2).map((subject) => subject.subject_name).join(' dan ') : 'subjek pilihan anda'}. Qubo akan mengutamakan sumber yang sepadan, dan topik kuiz di bawah 60%.`
                            : `${learningAdvice[selectedStyle].en} when revising ${subjects.length ? subjects.slice(0, 2).map((subject) => subject.subject_name).join(' and ') : 'your selected subjects'}. Qubo will prioritise matching resources, especially for quiz topics below 60%.`
                          : language === 'ms'
                            ? `Keutamaan semasa anda ialah ${selectedStyle}. Lengkapkan lima soalan penilaian untuk melihat pecahan skor anda; sementara itu, Qubo akan menggunakan keutamaan yang disimpan ini untuk memilih sumber.`
                            : `Your current saved preference is ${selectedStyle}. Complete the five-question assessment to see your score breakdown; until then, Qubo will use this preference when selecting resources.`}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!hasSavedScores && <button type="button" onClick={() => navigate('/learning-style-assessment', { state: { returnTo: '/profile' } })} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-blue-700">
                          Start assessment <FiArrowRight className="h-3.5 w-3.5" />
                        </button>}
                        <button type="button" onClick={() => navigate('/resources')} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-extrabold text-blue-700 hover:bg-blue-50">
                          View tailored resources <FiArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <FiSettings className="text-blue-600" /> Settings
                </h2>
                <div className="mt-4 space-y-2">
                  <div className="flex h-12 items-center justify-between rounded-xl bg-slate-50 px-3.5 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2"><FiMoon /> Dark Mode</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={darkMode}
                      aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
                      onClick={toggleTheme}
                      className={`relative h-6 w-11 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${darkMode ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSettingsPanel('privacy')}
                    aria-expanded={activeSettingsPanel === 'privacy'}
                    className="flex h-12 w-full items-center justify-between rounded-xl bg-slate-50 px-3.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="flex items-center gap-2"><FiShield /> Privacy &amp; Data</span><FiChevronRight className={`transition-transform ${activeSettingsPanel === 'privacy' ? 'rotate-90' : ''}`} />
                  </button>
                  {activeSettingsPanel === 'privacy' && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex items-start gap-3">
                        <span className="rounded-xl bg-white p-2 text-blue-600 shadow-sm"><FiDatabase /></span>
                        <div>
                          <p className="text-xs font-black text-slate-900">Data stored by Qubo</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">Profile details, selected subjects, saved content, quiz activity and learning analytics.</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {[
                          ['Quiz attempts', privacySummary?.quiz_attempts],
                          ['Study sessions', privacySummary?.study_sessions],
                          ['Saved quizzes', privacySummary?.saved_quizzes],
                          ['Learning events', privacySummary?.learning_events],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl bg-white px-3 py-2.5 shadow-sm">
                            <p className="text-lg font-black text-slate-900">{isLoadingPrivacy ? '…' : value ?? '—'}</p>
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                          </div>
                        ))}
                      </div>

                      {(privacyMessage || accountError) && (
                        <p className={`mt-3 rounded-xl px-3 py-2 text-[11px] font-semibold ${accountError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {accountError || privacyMessage}
                        </p>
                      )}

                      <div className="mt-4 space-y-2">
                        <button type="button" onClick={() => void downloadAccountData()} disabled={isDownloadingData} className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm hover:text-blue-700 disabled:opacity-50">
                          <span className="flex items-center gap-2"><FiDownload /> Download account data</span><span>JSON</span>
                        </button>
                        {user.role === 'student' && (
                          <button type="button" onClick={() => void downloadProgressReport()} disabled={isDownloadingData} className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm hover:text-blue-700 disabled:opacity-50">
                            <span className="flex items-center gap-2"><FiDownload /> Export progress report</span><span>PDF</span>
                          </button>
                        )}
                        <button type="button" onClick={() => setAccountAction('clear-history')} className="flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left text-[11px] font-bold text-amber-800 hover:bg-amber-100">
                          <FiTrash2 /> Clear learning history
                        </button>
                        <button type="button" onClick={() => setAccountAction('delete')} className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-left text-[11px] font-bold text-red-700 hover:bg-red-100">
                          <FiAlertTriangle /> Permanently delete account
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSettingsPanel('security')}
                    aria-expanded={activeSettingsPanel === 'security'}
                    className="flex h-12 w-full items-center justify-between rounded-xl bg-slate-50 px-3.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="flex items-center gap-2"><FiLock /> Account Security</span><FiChevronRight className={`transition-transform ${activeSettingsPanel === 'security' ? 'rotate-90' : ''}`} />
                  </button>
                  {activeSettingsPanel === 'security' && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="space-y-3">
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><FiMail className="text-blue-600" /> Email</span>
                            <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${user.email_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {user.email_verified ? 'Verified' : 'Status unavailable'}
                            </span>
                          </div>
                          <p className="mt-2 break-all text-[11px] font-semibold text-slate-900">{user.email}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                          <p className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><FiClock className="text-blue-600" /> Last successful sign-in</p>
                          <p className="mt-2 text-[11px] font-semibold text-slate-900">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Not available'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <button type="button" onClick={() => navigate('/profile/settings#change-password')} className="flex w-full items-center justify-between rounded-xl bg-blue-600 px-3 py-2.5 text-[11px] font-bold text-white hover:bg-blue-700">
                          <span className="flex items-center gap-2"><FiKey /> Change password</span><FiChevronRight />
                        </button>
                        <button type="button" onClick={() => setAccountAction('deactivate')} className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-left text-[11px] font-bold text-red-600 hover:bg-red-50">
                          Temporarily deactivate account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
                <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <FiTarget className="text-purple-600" /> Academic Preferences
                </h2>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Active subjects</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {subjects.map((subject) => (
                    <span key={subject.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700">
                      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />{subject.subject_name}
                    </span>
                  ))}
                  {subjects.length === 0 && (
                    <span className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-400">No subjects selected</span>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('/profile/settings')}
                    className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600"
                  >
                    <FiPlus /> Add More
                  </button>
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Study reminders</p>
                {reminders ? (
                  <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3">
                    {[
                      { label: 'Daily quiz practice', enabled: 'daily_flashcards_enabled' as const, time: 'daily_flashcards_time' as const },
                      { label: 'Nightly progress review', enabled: 'nightly_review_enabled' as const, time: 'nightly_review_time' as const },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                        <input
                          type="checkbox"
                          checked={reminders[item.enabled]}
                          onChange={(event) => updateReminder(item.enabled, event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <span className="min-w-0 flex-1">{item.label}</span>
                        <input
                          type="time"
                          value={reminders[item.time].slice(0, 5)}
                          disabled={!reminders[item.enabled]}
                          onChange={(event) => updateReminder(item.time, event.target.value)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-black text-blue-600 disabled:opacity-40"
                        />
                      </div>
                    ))}
                    <p className="text-[9px] font-semibold text-slate-400">Times use Malaysia time. In-app reminders appear while Qubo is open.</p>
                    {reminderMessage && <p className="text-[10px] font-bold text-slate-600">{reminderMessage}</p>}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void saveReminders()} disabled={isSavingReminders} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-extrabold text-white disabled:opacity-50">
                        {isSavingReminders ? 'Saving…' : 'Save reminders'}
                      </button>
                      {notificationPermission !== 'granted' && (
                        <button type="button" onClick={() => void enableBrowserAlerts()} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-[10px] font-extrabold text-blue-700">
                          Browser alerts
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-[11px] font-semibold text-slate-400">
                    {isLoadingReminders ? 'Loading reminder settings…' : reminderMessage || 'Study reminders are unavailable.'}
                  </div>
                )}
              </section>

            </aside>
          </div>

          <footer className="mt-16 border-t border-slate-200 pb-2 pt-8 text-center text-[10px] font-medium text-slate-400">
            © {new Date().getFullYear()} Qubo AI Learning Systems. Proudly serving SPM students in Malaysia.
          </footer>
        </main>
      </div>
      {accountAction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="account-action-title">
          <form onSubmit={submitAccountAction} className="w-full max-w-md rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-red-50 text-red-600"><FiAlertTriangle /></span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-red-500">Account confirmation</p>
                  <h2 id="account-action-title" className="mt-1 text-xl font-extrabold">
                    {accountAction === 'clear-history'
                      ? 'Clear your learning history?'
                      : accountAction === 'deactivate'
                        ? 'Deactivate your account?'
                        : 'Permanently delete your data?'}
                  </h2>
                </div>
              </div>
              <button type="button" onClick={closeAccountDialog} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close account dialog"><FiX /></button>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              {accountAction === 'clear-history'
                ? 'Quiz attempts, study sessions, forecasts, review schedules, content activity and game history will be removed. Your profile, selected subjects, saved quizzes and favourites will remain.'
                : accountAction === 'deactivate'
                  ? 'You will be signed out and unable to log in until an administrator reactivates your account. Your learning data will be preserved.'
                  : 'Your Qubo account, progress, quiz attempts and saved learning data will be permanently removed. This cannot be undone.'}
            </p>
            <label className="mt-5 block text-sm font-bold text-slate-700">Confirm your password
              <input type="password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} autoComplete="current-password" required autoFocus className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
            </label>
            {accountError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{accountError}</p>}
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={closeAccountDialog} disabled={isUpdatingAccount} className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-60">Cancel</button>
              <button type="submit" disabled={isUpdatingAccount || !accountPassword} className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
                {isUpdatingAccount
                  ? 'Processing…'
                  : accountAction === 'clear-history'
                    ? 'Clear history'
                    : accountAction === 'deactivate'
                      ? 'Deactivate'
                      : 'Delete permanently'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
