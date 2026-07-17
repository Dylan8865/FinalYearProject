import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { FavouriteItem, ThreeDModelSummary } from '@/types/resource';
import { TutorialVideo } from '@/types/video';
import ModelThumbnail from './ModelThumbnail';
import { FiArrowLeft, FiArrowRight, FiBox, FiHeart, FiSearch, FiVideo } from 'react-icons/fi';

type ResourceKind = 'all' | 'model' | 'video';
type ResourceCard = ({ kind: 'model' } & ThreeDModelSummary) | ({ kind: 'video' } & TutorialVideo);

const favouriteKey = (kind: 'model' | 'video', id: string) => `${kind}:${id}`;
const getYouTubeId = (url: string) => {
  try { const parsed = new URL(url); return parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || parsed.pathname.split('/embed/')[1] || ''; } catch { return ''; }
};
const getSubject = (resource: ResourceCard) => resource.kind === 'model' ? resource.subject_name || '' : resource.subject_tag || '';

export default function ExploreResourcesPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<ResourceCard[]>([]);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<ResourceKind>('all');
  const [subject, setSubject] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([authService.getThreeDModels(), authService.getTutorialVideos(), authService.getFavourites()])
      .then(([models, videos, saved]) => {
        setResources([...models.map((model) => ({ ...model, kind: 'model' as const })), ...videos.map((video) => ({ ...video, kind: 'video' as const }))]);
        setFavourites(new Set(saved.map((item: FavouriteItem) => favouriteKey(item.target_type, item.target_id))));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const subjects = useMemo(() => ['All', ...Array.from(new Set(resources.map(getSubject).filter(Boolean))).sort()], [resources]);
  const visibleResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => (kind === 'all' || resource.kind === kind) && (subject === 'All' || getSubject(resource) === subject) && (!query || `${resource.title} ${getSubject(resource)} ${resource.kind === 'model' ? resource.topic_name || '' : ''}`.toLowerCase().includes(query)));
  }, [kind, resources, search, subject]);

  const toggleFavourite = async (resource: ResourceCard) => {
    const id = resource.kind === 'model' ? resource.resource_id : resource.video_id;
    const key = favouriteKey(resource.kind, id);
    const saved = favourites.has(key);
    setFavourites((current) => { const next = new Set(current); saved ? next.delete(key) : next.add(key); return next; });
    try { if (saved) await authService.removeFavourite(resource.kind, id); else await authService.saveFavourite(resource.kind, id); } catch { setFavourites((current) => { const next = new Set(current); saved ? next.add(key) : next.delete(key); return next; }); }
  };

  return <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]"><AppSidebar /><main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10"><button onClick={() => navigate('/resources')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"><FiArrowLeft /> Back to resources</button><section className="mt-6 flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Resource library</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Explore all resources</h1><p className="mt-3 text-sm leading-6 text-slate-500">Browse video lessons and interactive 3D models in one place.</p></div><label className="flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm"><FiSearch className="h-5 w-5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search videos, models, topics…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" /></label></section><section className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Resource type</p><div className="mt-2 flex flex-wrap gap-2">{([['all', 'All resources'], ['video', 'Video lessons'], ['model', '3D models']] as const).map(([value, label]) => <button key={value} onClick={() => setKind(value)} className={`rounded-full px-4 py-2 text-sm font-bold ${kind === value ? 'bg-primary text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-primary'}`}>{label}</button>)}</div></div><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">Subject</p><div className="mt-2 flex flex-wrap gap-2">{subjects.map((item) => <button key={item} onClick={() => setSubject(item)} className={`rounded-full px-4 py-2 text-sm font-bold ${subject === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>{item}</button>)}</div></div></section>{isLoading ? <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="overflow-hidden rounded-2xl bg-white"><div className="aspect-video animate-pulse bg-slate-200" /><div className="h-20 animate-pulse bg-slate-50" /></div>)}</div> : <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleResources.map((resource) => { const id = resource.kind === 'model' ? resource.resource_id : resource.video_id; const saved = favourites.has(favouriteKey(resource.kind, id)); return <article key={`${resource.kind}-${id}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><button onClick={() => resource.kind === 'model' ? navigate(`/models/${id}`) : navigate(`/tutorials?video=${id}`)} className="block aspect-video w-full overflow-hidden bg-slate-100">{resource.kind === 'model' ? <ModelThumbnail modelUrl={resource.preview_model_url} title={resource.title} /> : <img src={`https://img.youtube.com/vi/${getYouTubeId(resource.youtube_url)}/hqdefault.jpg`} alt={`${resource.title} video preview`} className="h-full w-full object-cover" />}</button><div className="p-5"><div className="flex items-start justify-between gap-3"><div><span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-primary">{resource.kind === 'model' ? <FiBox /> : <FiVideo />}{resource.kind === 'model' ? '3D model' : 'Video lesson'}</span><h2 className="mt-3 text-lg font-extrabold leading-6">{resource.title}</h2></div><button onClick={() => toggleFavourite(resource)} className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${saved ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500 hover:text-rose-500'}`}><FiHeart className={saved ? 'fill-current' : ''} /></button></div><p className="mt-2 text-sm text-slate-500">{getSubject(resource) || 'SPM learning'}</p><button onClick={() => resource.kind === 'model' ? navigate(`/models/${id}`) : navigate(`/tutorials?video=${id}`)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20">{resource.kind === 'model' ? 'Explore model' : 'Watch lesson'} <FiArrowRight /></button></div></article>; })}</section>}{!isLoading && visibleResources.length === 0 && <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No resources match your filters. Try another subject or search term.</div>}</main></div>;
}
