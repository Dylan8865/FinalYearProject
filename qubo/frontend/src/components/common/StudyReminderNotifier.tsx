import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiX } from 'react-icons/fi';
import { useAuthStore } from '@/contexts/authStore';
import { useLanguageStore } from '@/contexts/languageStore';
import { authService } from '@/lib/authService';
import { StudyReminderPreferences } from '@/types/auth';

type DueReminder = { key: string; title: string; message: string; path: string };

const timeInZone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  return {
    dateKey: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`,
  };
};

export default function StudyReminderNotifier() {
  const user = useAuthStore((state) => state.user);
  const language = useLanguageStore((state) => state.language);
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<StudyReminderPreferences | null>(null);
  const [dueReminder, setDueReminder] = useState<DueReminder | null>(null);

  const loadPreferences = useCallback(async () => {
    if (user?.role !== 'student') {
      setPreferences(null);
      return;
    }
    try {
      setPreferences(await authService.getStudyReminders());
    } catch {
      // Reminders should never prevent the rest of the application from loading.
    }
  }, [user?.role]);

  useEffect(() => {
    void loadPreferences();
    const handleUpdate = () => void loadPreferences();
    window.addEventListener('qubo:reminders-updated', handleUpdate);
    return () => window.removeEventListener('qubo:reminders-updated', handleUpdate);
  }, [loadPreferences]);

  useEffect(() => {
    if (!user || !preferences) return;

    const checkReminders = () => {
      const current = timeInZone(new Date(), preferences.reminder_timezone);
      const reminders: DueReminder[] = [
        {
          key: 'daily-quiz',
          title: language === 'ms' ? 'Latihan kuiz harian' : 'Daily quiz practice',
          message: language === 'ms' ? 'Kuiz latihan ringkas sekarang membantu mengekalkan ulang kaji anda.' : 'A short practice quiz now will help keep your revision active.',
          path: '/library',
        },
        {
          key: 'nightly-review',
          title: language === 'ms' ? 'Semakan kemajuan setiap malam' : 'Nightly progress review',
          message: language === 'ms' ? 'Semak kemajuan hari ini dan lihat perkara yang memerlukan perhatian esok.' : 'Review today’s progress and check what needs attention tomorrow.',
          path: '/analytics',
        },
      ];
      const enabled = [preferences.daily_flashcards_enabled, preferences.nightly_review_enabled];
      const times = [preferences.daily_flashcards_time.slice(0, 5), preferences.nightly_review_time.slice(0, 5)];

      reminders.forEach((reminder, index) => {
        if (!enabled[index] || times[index] !== current.time) return;
        const storageKey = `qubo-reminder:${user.id}:${reminder.key}:${current.dateKey}`;
        if (localStorage.getItem(storageKey)) return;
        localStorage.setItem(storageKey, 'shown');
        setDueReminder(reminder);

        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(`Qubo · ${reminder.title}`, { body: reminder.message });
          notification.onclick = () => {
            window.focus();
            navigate(reminder.path);
            notification.close();
          };
        }
      });
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 20_000);
    return () => window.clearInterval(interval);
  }, [language, navigate, preferences, user]);

  if (!dueReminder) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex w-[min(390px,calc(100vw-2.5rem))] items-start gap-3 rounded-2xl bg-slate-950 p-4 text-white shadow-2xl">
      <span className="mt-0.5 rounded-xl bg-blue-600 p-2"><FiBell /></span>
      <button type="button" onClick={() => navigate(dueReminder.path)} className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-extrabold">{dueReminder.title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-300">{dueReminder.message}</span>
      </button>
      <button type="button" onClick={() => setDueReminder(null)} aria-label="Dismiss reminder" className="p-1 text-slate-400 hover:text-white">
        <FiX />
      </button>
    </div>
  );
}
