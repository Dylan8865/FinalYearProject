import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import {
  FiArchive,
  FiBookmark,
  FiBookOpen,
  FiBox,
  FiChevronDown,
  FiChevronRight,
  FiClipboard,
  FiFolderPlus,
  FiFolder,
  FiGrid,
  FiHelpCircle,
  FiPlayCircle,
  FiUser,
  FiVideo,
} from 'react-icons/fi';

const studentNavigationItems = [
  { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: FiBookOpen, label: 'Subjects', path: '/subjects' },
  { icon: FiPlayCircle, label: 'Game Room', path: '/game-room' },
  { icon: FiHelpCircle, label: 'Quizzes', path: '/quiz/create' },
  { icon: FiArchive, label: 'Library', path: '/library' },
  { icon: FiFolder, label: 'Resource', path: '/resources' },
  { icon: FiBookmark, label: 'My Learning', path: '/learning' },
  { icon: FiUser, label: 'Profile', path: '/profile' },
];

const educatorNavigationItems = [
  { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: FiFolderPlus, label: 'Upload Content', path: '/educator/upload' },
  { icon: FiBookOpen, label: 'My Collections', path: '/educator/collections' },
  { icon: FiUser, label: 'Profile', path: '/profile' },
];

const educatorExplorerItems = [
  { icon: FiBox, label: '3D Model Explorer', path: '/models' },
  { icon: FiVideo, label: 'Video Explorer', path: '/tutorials' },
  { icon: FiClipboard, label: 'Quiz Library', path: '/library' },
];

export default function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const navigationItems = user?.role === 'educator' ? educatorNavigationItems : studentNavigationItems;

  useEffect(() => {
    setProfileImageFailed(false);
  }, [user?.profile_picture_url]);

  useEffect(() => {
    if (educatorExplorerItems.some((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))) {
      setIsExplorerOpen(true);
    }
  }, [location.pathname]);

  return (
    <aside className="hidden border-r border-slate-200/80 bg-[#f8fbff] px-5 py-7 lg:flex lg:flex-col">
      <div className="mb-8 px-4">
        <p className="text-xl font-extrabold tracking-tight text-primary">Qubo</p>
        <p className="mt-1 text-xs font-bold text-slate-700">SPM Mastery</p>
      </div>

      <nav className="space-y-1 text-sm font-semibold text-slate-500">
        {navigationItems.map((item) => {
          const isCollections = user?.role === 'educator' && item.label === 'My Collections';
          const isActive = item.path && (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
          return <div key={item.label}>
            <div className="flex items-center">
              <button
                onClick={() => item.path && navigate(item.path)}
                disabled={!item.path}
                className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-blue-50 hover:text-primary disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-slate-500 ${isActive ? 'bg-blue-50 text-primary shadow-[inset_-4px_0_0_#1d4ed8]' : ''}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
              {isCollections && <button type="button" onClick={() => setIsExplorerOpen((open) => !open)} className="mr-2 rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-primary" aria-label={isExplorerOpen ? 'Collapse content explorers' : 'Expand content explorers'}>{isExplorerOpen ? <FiChevronDown className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}</button>}
            </div>
            {isCollections && isExplorerOpen && <div className="mt-1 space-y-1">{educatorExplorerItems.map((explorer) => {
              const explorerActive = location.pathname === explorer.path || location.pathname.startsWith(`${explorer.path}/`);
              return <button key={explorer.label} onClick={() => navigate(explorer.path)} className={`ml-4 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-semibold transition hover:bg-blue-50 hover:text-primary ${explorerActive ? 'bg-blue-50 text-primary' : ''}`}><explorer.icon className="h-4 w-4" />{explorer.label}</button>;
            })}</div>}
          </div>;
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
  );
}
