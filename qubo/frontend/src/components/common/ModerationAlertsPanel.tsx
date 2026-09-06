/**
 * ModerationAlertsPanel
 * Shows admin moderation actions (lock/delete/unlock) targeted at the logged-in educator.
 * Only visible when role === 'educator'.
 */
import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiLock, FiTrash2, FiX } from 'react-icons/fi';
import { authService } from '@/lib/authService';

interface ModerationLog {
  id: string;
  action: 'content_locked' | 'content_unlocked' | 'content_deleted';
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: typeof FiLock }> = {
  content_locked:   { label: 'Locked',   color: 'amber',   icon: FiLock },
  content_unlocked: { label: 'Unlocked', color: 'emerald', icon: FiCheckCircle },
  content_deleted:  { label: 'Removed',  color: 'rose',    icon: FiTrash2 },
};

export default function ModerationAlertsPanel() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authService.getEducatorModerationLogs()
      .then((data) => setLogs(data || []))
      .catch(() => setError('Could not load moderation alerts.'));
  }, []);

  const visible = logs.filter((l) => !dismissed.has(l.id));
  if (visible.length === 0 && !error) return null;

  return (
    <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
      {/* Header */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2 font-extrabold text-amber-800">
          <FiAlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <span>Moderation Alerts ({visible.length})</span>
        </div>
        <span className="text-xs font-bold text-amber-600">{isOpen ? 'Hide ▲' : 'Show ▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {visible.map((log) => {
            const cfg = ACTION_LABELS[log.action] ?? ACTION_LABELS.content_locked;
            const Icon = cfg.icon;
            return (
              <div
                key={log.id}
                className={`relative rounded-2xl border border-${cfg.color}-200 bg-${cfg.color}-50 p-4`}
              >
                <button
                  onClick={() => setDismissed((s) => new Set(s).add(log.id))}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  title="Dismiss"
                >
                  <FiX className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 text-${cfg.color}-600`} />
                  <span className={`text-xs font-extrabold uppercase tracking-wider text-${cfg.color}-700`}>
                    {cfg.label} · {log.target_type === 'video' ? 'Video' : '3D Model'}
                  </span>
                </div>
                {log.reason && (
                  <p className="mt-2 text-sm leading-5 text-slate-700">
                    <span className="font-bold">Admin reason: </span>{log.reason}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
