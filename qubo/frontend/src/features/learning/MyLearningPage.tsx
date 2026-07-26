import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { FavouriteItem, RecentLearningItem } from '@/types/resource';
import { SharedLearningItem } from '@/types/video';
import { SharedCollection } from '@/types/collection';
import { FiBookOpen, FiBox, FiCalendar, FiClock, FiHeart, FiLayers, FiMoreVertical, FiPlay, FiTrash2, FiX } from 'react-icons/fi';

type LearningItem = FavouriteItem | RecentLearningItem;
type ToastState = { message: string; undo?: () => Promise<void> };

function ItemMenu({ open, onToggle, onRemove }: { open: boolean; onToggle: () => void; onRemove: () => void }) {
  return <div className="relative"><button type="button" onClick={(event) => { event.stopPropagation(); onToggle(); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="More actions"><FiMoreVertical /></button>{open && <div className="absolute right-0 top-11 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><button type="button" onClick={(event) => { event.stopPropagation(); onRemove(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50"><FiTrash2 /> Remove</button></div>}</div>;
}

function LearningCard({ item, label, menuOpen, onOpen, onMenuToggle, onRemove }: { item: LearningItem; label: string; menuOpen: boolean; onOpen: () => void; onMenuToggle: () => void; onRemove: () => void }) {
  const isModel = item.target_type === 'model';
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><button onClick={onOpen} className={`flex h-11 w-11 items-center justify-center rounded-xl ${isModel ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-primary'}`} aria-label={`Open ${item.title}`}>{isModel ? <FiBox className="h-5 w-5" /> : <FiPlay className="h-5 w-5" />}</button><div className="flex items-center gap-1"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{label}</span><ItemMenu open={menuOpen} onToggle={onMenuToggle} onRemove={onRemove} /></div></div><button onClick={onOpen} className="mt-4 w-full text-left"><p className="line-clamp-2 font-extrabold text-slate-950 hover:text-primary">{item.title}</p><p className="mt-1 truncate text-sm font-medium text-slate-500">{item.subject_name || 'SPM learning'}</p></button></article>;
}

const TYPE_ICON: Record<string, { icon: typeof FiBox; color: string }> = {
  model: { icon: FiBox, color: 'text-orange-500' },
  video: { icon: FiPlay, color: 'text-blue-500' },
  quiz: { icon: FiBookOpen, color: 'text-violet-500' },
};

function SharedCollectionCard({
  collection,
  onOpen,
}: {
  collection: SharedCollection;
  onOpen: () => void;
}) {
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'short' }).format(new Date(iso));

  return (
    <article
      className="group cursor-pointer rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
      onClick={onOpen}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
          <FiLayers className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {collection.content_types.map((type) => {
            const config = TYPE_ICON[type] || TYPE_ICON.model;
            const Icon = config.icon;
            return (
              <span key={type} className={`flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 ${config.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
            );
          })}
        </div>
      </div>

      {/* Title & educator */}
      <p className="mt-4 line-clamp-2 font-extrabold text-slate-950 group-hover:text-primary">
        {collection.title}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-primary">
        From {collection.educator_name}
      </p>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
        <span>{collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}</span>
        {collection.due_at && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
            <FiCalendar className="h-3 w-3" />
            Due {formatDate(collection.due_at)}
          </span>
        )}
        {!collection.opened_at && (
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">New</span>
        )}
      </div>

      {/* Optional message */}
      {collection.message && (
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">"{collection.message}"</p>
      )}
    </article>
  );
}

export default function MyLearningPage() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<RecentLearningItem[]>([]);
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [sharedItems, setSharedItems] = useState<SharedLearningItem[]>([]);
  const [sharedCollections, setSharedCollections] = useState<SharedCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeout = useRef<number | undefined>();

  useEffect(() => {
    Promise.all([
      authService.getRecentLearning(),
      authService.getFavourites(),
      authService.getSharedLearningItems(),
      authService.getSharedCollections(),
    ])
      .then(([recentItems, favouriteItems, receivedItems, collections]) => {
        setRecent(recentItems);
        setFavourites(favouriteItems);
        setSharedItems(receivedItems);
        setSharedCollections(collections);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const showToast = (nextToast: ToastState, duration = 8000) => {
    if (toastTimeout.current) window.clearTimeout(toastTimeout.current);
    setToast(nextToast);
    toastTimeout.current = window.setTimeout(() => setToast(null), duration);
  };

  const undo = async () => {
    if (!toast?.undo) return;
    const restore = toast.undo;
    if (toastTimeout.current) window.clearTimeout(toastTimeout.current);
    setToast(null);
    try {
      await restore();
      showToast({ message: 'Action undone' }, 3500);
    } catch {
      showToast({ message: 'Could not restore this item. Please try again.' }, 3500);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && toast?.undo) {
        event.preventDefault();
        void undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps -- undo always reads the same toast captured by this effect

  useEffect(() => () => { if (toastTimeout.current) window.clearTimeout(toastTimeout.current); }, []);

  const openItem = (item: LearningItem) => navigate(item.target_type === 'model' ? `/models/${item.target_id}` : `/tutorials?video=${item.target_id}`);

  const removeRecent = async (item: RecentLearningItem) => {
    setMenuKey(null);
    setRecent((current) => current.filter((entry) => !(entry.target_type === item.target_type && entry.target_id === item.target_id)));
    try {
      await authService.removeRecentLearning(item.target_type, item.target_id);
      showToast({ message: `Removed "${item.title}"`, undo: async () => { await authService.restoreRecentLearning(item.target_type, item.target_id); setRecent((current) => [item, ...current]); } });
    } catch {
      setRecent((current) => [item, ...current]);
      showToast({ message: 'Could not remove this recent item.' }, 3500);
    }
  };

  const removeFavourite = async (item: FavouriteItem) => {
    setMenuKey(null);
    setFavourites((current) => current.filter((entry) => !(entry.target_type === item.target_type && entry.target_id === item.target_id)));
    try {
      await authService.removeFavourite(item.target_type, item.target_id);
      showToast({ message: `Removed "${item.title}" from Saved`, undo: async () => { await authService.saveFavourite(item.target_type, item.target_id); setFavourites((current) => [item, ...current]); } });
    } catch {
      setFavourites((current) => [item, ...current]);
      showToast({ message: 'Could not remove this saved item.' }, 3500);
    }
  };

  const removeShared = async (item: SharedLearningItem) => {
    setMenuKey(null);
    setSharedItems((current) => current.filter((entry) => entry.share_id !== item.share_id));
    try {
      await authService.dismissSharedLearningItem(item.share_id);
      showToast({ message: `Removed "${item.title}"`, undo: async () => { await authService.restoreSharedLearningItem(item.share_id); setSharedItems((current) => [item, ...current]); } });
    } catch {
      setSharedItems((current) => [item, ...current]);
      showToast({ message: 'Could not remove this shared lesson.' }, 3500);
    }
  };

  const openSharedItem = (item: SharedLearningItem) => navigate(item.target_type === 'model' ? `/models/${item.target_id}` : `/tutorials?video=${item.target_id}`);

  const hasSharedContent = sharedItems.length > 0 || sharedCollections.length > 0;

  return <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]"><AppSidebar /><main onClick={() => setMenuKey(null)} className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Your learning space</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">My Learning</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">Continue exploring your recent resources and keep important lessons saved for revision.</p>{isLoading ? <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-200" />)}</div> : <><section className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Continue learning</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Recently viewed</h2></div><FiClock className="h-6 w-6 text-slate-400" /></div>{recent.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{recent.map((item) => <LearningCard key={`recent-${item.target_type}-${item.target_id}`} item={item} label="Recent" menuOpen={menuKey === `recent-${item.target_type}-${item.target_id}`} onOpen={() => openItem(item)} onMenuToggle={() => setMenuKey(menuKey === `recent-${item.target_type}-${item.target_id}` ? null : `recent-${item.target_type}-${item.target_id}`)} onRemove={() => void removeRecent(item)} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Open a video or 3D model to begin your learning history.</div>}</section>

      {/* ---- Shared with me ---- */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">From educators &amp; learners</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Shared with me</h2>
          </div>
          <FiLayers className="h-6 w-6 text-primary" />
        </div>

        {hasSharedContent ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {/* Collection shares from educators */}
            {sharedCollections.map((collection) => (
              <SharedCollectionCard
                key={collection.collection_share_id}
                collection={collection}
                onOpen={() => navigate(`/shared-collection/${collection.collection_id}`)}
              />
            ))}

            {/* Legacy individual content shares */}
            {sharedItems.map((item) => (
              <article key={item.share_id} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => openSharedItem(item)} className="text-left">
                    <p className="text-xs font-bold text-primary">Shared {item.target_type === 'model' ? '3D model' : 'video'} by {item.sender_email}</p>
                    <p className="mt-2 font-extrabold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">{item.subject_name || 'SPM learning'}</p>
                  </button>
                  <ItemMenu open={menuKey === `share-${item.share_id}`} onToggle={() => setMenuKey(menuKey === `share-${item.share_id}` ? null : `share-${item.share_id}`)} onRemove={() => void removeShared(item)} />
                </div>
                {item.message && <p className="mt-2 text-sm leading-5 text-slate-500">"{item.message}"</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Collections, videos, and 3D models shared with you will appear here.
          </div>
        )}
      </section>

<section className="mt-12"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Revision list</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Saved</h2></div><FiHeart className="h-6 w-6 text-rose-500" /></div>{favourites.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{favourites.map((item) => <LearningCard key={`saved-${item.target_type}-${item.target_id}`} item={item} label="Saved" menuOpen={menuKey === `saved-${item.target_type}-${item.target_id}`} onOpen={() => openItem(item)} onMenuToggle={() => setMenuKey(menuKey === `saved-${item.target_type}-${item.target_id}` ? null : `saved-${item.target_type}-${item.target_id}`)} onRemove={() => void removeFavourite(item)} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><FiBookOpen className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm text-slate-500">Save videos and 3D models to build your revision list.</p></div>}</section></>}</main>{toast && <div className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-4 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl"><span>{toast.message}</span>{toast.undo && <button onClick={() => void undo()} className="font-extrabold text-blue-300 hover:text-blue-200">Undo</button>}<button onClick={() => setToast(null)} className="text-slate-400 hover:text-white" aria-label="Close notification"><FiX /></button></div>}</div>;
}
