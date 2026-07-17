import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import {
  FiArchive,
  FiBookOpen,
  FiFolder,
  FiGrid,
  FiHelpCircle,
  FiPieChart,
  FiPlayCircle,
  FiTarget,
  FiUser,
} from 'react-icons/fi';

export default function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [user?.profile_picture_url]);

  const displayName = user?.full_name || user?.username || 'Qubo user';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const navigationItems = user?.role === 'educator'
    ? [
        { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
        { icon: FiPieChart, label: 'Class Analytics', path: '/educator/analytics' },
        { icon: FiUser, label: 'Profile', path: '/profile' },
      ]
    : [
        { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
        { icon: FiBookOpen, label: 'Subjects', path: '/subjects' },
        { icon: FiPieChart, label: 'Study Tracker', path: '/analytics' },
        { icon: FiPlayCircle, label: 'Game Room' },
        { icon: FiHelpCircle, label: 'Quizzes', path: '/quiz/create' },
        { icon: FiArchive, label: 'Library', path: '/library' },
        { icon: FiFolder, label: 'Resource' },
        { icon: FiUser, label: 'Profile', path: '/profile' },
      ];
  return (
    <>
      {user && (
        <header className="absolute left-0 right-0 top-0 z-40 flex h-16 items-center justify-end border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md md:px-8 lg:left-[260px]">
          <div className="flex items-center gap-4 pr-12 text-xs font-bold text-slate-600 md:pr-14">
            <span className="hidden items-center gap-1.5 sm:flex">
              <span aria-hidden="true">🔥</span>
              <span className="text-blue-600">7 Day Streak</span>
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <FiTarget className="text-slate-500" /> Level 12
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="Open user profile"
            title="Open user profile"
            className="absolute right-4 top-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-50 text-xs font-extrabold text-blue-700 shadow-[0_6px_18px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 hover:scale-105 hover:ring-blue-400 md:right-6"
          >
            {user.profile_picture_url && !profileImageFailed ? (
              <img
                src={user.profile_picture_url}
                alt=""
                onError={() => setProfileImageFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              initials || 'QB'
            )}
          </button>
        </header>
      )}

      <aside className="sticky top-0 hidden h-screen self-start overflow-y-auto border-r border-slate-200/80 bg-[#f8fbff] px-5 py-7 lg:flex lg:flex-col">
      <div className="mb-8 px-4">
        <p className="text-xl font-extrabold tracking-tight text-primary">Qubo</p>
        <p className="mt-1 text-xs font-bold text-slate-700">SPM Mastery</p>
      </div>

      <nav className="space-y-1 text-sm font-semibold text-slate-500">
        {navigationItems.map((item) => {
          const isActive = item.path
            ? item.path === '/profile'
              ? location.pathname.startsWith('/profile')
              : location.pathname === item.path
            : false;

          return (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-blue-50 hover:text-primary ${
                isActive ? 'bg-blue-50 text-primary' : ''
              }`}
            >
              {isActive && <span className="absolute -right-5 h-8 w-1 rounded-l-full bg-primary" />}
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {user && (
        <div className="mt-auto rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Signed in as</p>
          <div className="mt-3 flex items-center gap-3">
            {user.profile_picture_url && !profileImageFailed ? (
              <img
                src={user.profile_picture_url}
                alt={`${user.full_name} profile`}
                onError={() => setProfileImageFailed(true)}
                className="h-11 w-11 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {user.full_name?.slice(0, 2).toUpperCase() || 'QB'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{user.full_name}</p>
              <p className="text-sm capitalize text-slate-500">{user.role}</p>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}
