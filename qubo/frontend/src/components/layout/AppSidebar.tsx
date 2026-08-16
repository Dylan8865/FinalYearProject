import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import {
  FiArchive,
  FiBarChart2,
  FiBookmark,
  FiBookOpen,
  FiBox,
  FiChevronDown,
  FiChevronRight,
  FiClipboard,
  FiFolderPlus,
  FiFolder,
  FiGrid,
  FiGlobe,
  FiHelpCircle,
  FiMoon,
  FiPlayCircle,
  FiSun,
  FiUser,
  FiVideo,
} from 'react-icons/fi';
import { useLanguageStore } from '@/contexts/languageStore';
import { useThemeStore } from '@/contexts/themeStore';

const studentNavigationItems = [
  { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: FiBookOpen, label: 'Subjects', path: '/subjects' },
  { icon: FiBarChart2, label: 'Analytics', path: '/analytics' },
  { icon: FiPlayCircle, label: 'Game Room', path: '/game-room' },
  { icon: FiHelpCircle, label: 'Quizzes', path: '/quiz/create' },
  { icon: FiArchive, label: 'Library', path: '/library' },
  { icon: FiFolder, label: 'Resource', path: '/resources' },
  { icon: FiBookmark, label: 'My Learning', path: '/learning' },
  { icon: FiUser, label: 'Profile', path: '/profile' },
];

const educatorNavigationItems = [
  { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: FiBarChart2, label: 'Student Analytics', path: '/educator/analytics' },
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
  const language = useLanguageStore((state) => state.language);
  const toggleLanguage = useLanguageStore((state) => state.toggleLanguage);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [user?.profile_picture_url]);

  useEffect(() => {
    if (educatorExplorerItems.some((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))) {
      setIsExplorerOpen(true);
    }
  }, [location.pathname]);
  const displayName = user?.username || user?.full_name || 'Qubo user';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <>
      {user && (
        <>
        <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-end border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md md:px-8 lg:left-[260px]">
          <div className="flex items-center gap-3 pr-12 text-xs font-bold text-slate-600 md:pr-14">
            <button
              type="button"
              onClick={toggleLanguage}
              data-no-translate
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-extrabold text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
              aria-label={language === 'en' ? 'Tukar ke Bahasa Melayu' : 'Switch to English'}
              title={language === 'en' ? 'Bahasa Melayu' : 'English'}
            >
              <FiGlobe /> {language === 'en' ? 'BM' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-600"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
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
        <div className="h-16 lg:col-start-2 lg:row-start-1" aria-hidden="true" />
        </>
      )}

      <aside className="sticky top-0 hidden h-screen self-start overflow-y-auto border-r border-slate-200/80 bg-[#f8fbff] px-5 py-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:flex lg:flex-col">
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
                alt={`${displayName} profile`}
                onError={() => setProfileImageFailed(true)}
                className="h-11 w-11 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{displayName}</p>
              <p className="text-sm capitalize text-slate-500">{user.role}</p>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
}
