import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { FavouriteItem, RecentLearningItem } from '@/types/resource';
import { SharedTutorialVideo } from '@/types/video';
import { FiBookOpen, FiBox, FiClock, FiHeart, FiPlay } from 'react-icons/fi';

type LearningItem = FavouriteItem | RecentLearningItem;

function LearningCard({ item, label, onOpen }: { item: LearningItem; label: string; onOpen: () => void }) {
  const isModel = item.target_type === 'model';
  return <button onClick={onOpen} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${isModel ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-primary'}`}>{isModel ? <FiBox className="h-5 w-5" /> : <FiPlay className="h-5 w-5" />}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{label}</span></div><p className="mt-4 line-clamp-2 font-extrabold text-slate-950 group-hover:text-primary">{item.title}</p><p className="mt-1 truncate text-sm font-medium text-slate-500">{item.subject_name || 'SPM learning'}</p></button>;
}

export default function MyLearningPage() {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<RecentLearningItem[]>([]);
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [sharedVideos, setSharedVideos] = useState<SharedTutorialVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([authService.getRecentLearning(), authService.getFavourites(), authService.getSharedTutorialVideos()])
      .then(([recentItems, favouriteItems, sharedItems]) => { setRecent(recentItems); setFavourites(favouriteItems); setSharedVideos(sharedItems); })
      .finally(() => setIsLoading(false));
  }, []);

  const openItem = (item: LearningItem) => navigate(item.target_type === 'model' ? `/models/${item.target_id}` : `/tutorials?video=${item.target_id}`);

  return <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]"><AppSidebar /><main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Your learning space</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">My Learning</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">Continue exploring your recent resources and keep important lessons saved for revision.</p>{isLoading ? <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-200" />)}</div> : <><section className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Continue learning</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Recently viewed</h2></div><FiClock className="h-6 w-6 text-slate-400" /></div>{recent.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{recent.map((item) => <LearningCard key={`${item.target_type}-${item.target_id}`} item={item} label="Recent" onOpen={() => openItem(item)} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Open a video or 3D model to begin your learning history.</div>}</section><section className="mt-12"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">From other learners</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Shared with me</h2></div><FiPlay className="h-6 w-6 text-primary" /></div>{sharedVideos.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{sharedVideos.map((item) => <button key={item.share_id} onClick={() => navigate(`/tutorials?video=${item.video_id}`)} className="rounded-2xl border border-blue-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><p className="text-xs font-bold text-primary">Shared by @{item.sender_username}</p><p className="mt-2 font-extrabold text-slate-950">{item.title}</p>{item.message && <p className="mt-2 text-sm leading-5 text-slate-500">“{item.message}”</p>}</button>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Videos shared with you will appear here.</div>}</section><section className="mt-12"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Revision list</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">Saved</h2></div><FiHeart className="h-6 w-6 text-rose-500" /></div>{favourites.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{favourites.map((item) => <LearningCard key={`${item.target_type}-${item.target_id}`} item={item} label="Saved" onOpen={() => openItem(item)} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><FiBookOpen className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm text-slate-500">Save videos and 3D models to build your revision list.</p></div>}</section></>}</main></div>;
}
