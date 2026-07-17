import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import {
  FiArchive,
  FiBookmark,
  FiBookOpen,
  FiFolder,
  FiGrid,
  FiHelpCircle,
  FiPlayCircle,
  FiUser,
} from 'react-icons/fi';

const navigationItems = [
  { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: FiBookOpen, label: 'Subjects', path: '/subjects' },
  { icon: FiPlayCircle, label: 'Game Room', path: '/game-room' },
  { icon: FiHelpCircle, label: 'Quizzes', path: '/quiz/create' },
  { icon: FiArchive, label: 'Library', path: '/library' },
  { icon: FiFolder, label: 'Resource', path: '/resources' },
  { icon: FiBookmark, label: 'My Learning', path: '/learning' },
  { icon: FiUser, label: 'Profile', path: '/profile' },
];

export default function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [profileImageFailed, setProfileImageFailed] = useState(false);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [user?.profile_picture_url]);

  return (
    <aside className="hidden border-r border-slate-200/80 bg-[#f8fbff] px-5 py-7 lg:flex lg:flex-col">
      <div className="mb-8 px-4">
        <p className="text-xl font-extrabold tracking-tight text-primary">Qubo</p>
        <p className="mt-1 text-xs font-bold text-slate-700">SPM Mastery</p>
      </div>

      <nav className="space-y-1 text-sm font-semibold text-slate-500">
        {navigationItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.path && navigate(item.path)}
            disabled={!item.path}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-blue-50 hover:text-primary disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-slate-500 ${
              item.path && location.pathname === item.path
                ? 'bg-blue-50 text-primary shadow-[inset_-4px_0_0_#1d4ed8]'
                : ''
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
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
  );
}
