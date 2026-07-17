import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { FavouriteItem, ThreeDModelSummary } from '@/types/resource';
import ModelThumbnail from './ModelThumbnail';
import { FiAlertCircle, FiArrowLeft, FiArrowRight, FiBox, FiHeart, FiRefreshCw, FiSearch } from 'react-icons/fi';

export default function ModelLibraryPage() {
  const navigate = useNavigate();
  const [models, setModels] = useState<ThreeDModelSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  const subjects = useMemo(
    () => ['All', ...Array.from(new Set(models.map((model) => model.subject_name).filter(Boolean) as string[])).sort()],
    [models]
  );
  const visibleModels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return models.filter((model) => {
      const matchingSubject = selectedSubject === 'All' || model.subject_name === selectedSubject;
      const matchingSearch = !normalizedSearch || `${model.title} ${model.topic_name || ''}`.toLowerCase().includes(normalizedSearch);
      return matchingSubject && matchingSearch;
    });
  }, [models, search, selectedSubject]);

  const loadModels = async () => {
    setIsLoading(true);
    setError('');
    try {
      setModels(await authService.getThreeDModels());
    } catch {
      setError('We could not load the 3D learning resources. Please check the backend connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
    authService.getFavourites().then((items: FavouriteItem[]) => setFavouriteIds(new Set(items.filter((item) => item.target_type === 'model').map((item) => item.target_id)))).catch(() => undefined);
  }, []);

  const toggleFavourite = async (resourceId: string) => {
    const isSaved = favouriteIds.has(resourceId);
    setFavouriteIds((current) => { const next = new Set(current); isSaved ? next.delete(resourceId) : next.add(resourceId); return next; });
    try { if (isSaved) await authService.removeFavourite('model', resourceId); else await authService.saveFavourite('model', resourceId); } catch { setFavouriteIds((current) => { const next = new Set(current); isSaved ? next.add(resourceId) : next.delete(resourceId); return next; }); }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
        <button onClick={() => navigate('/resources')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"><FiArrowLeft /> Back to resources</button>
        <section className="flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Interactive learning</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">3D Model Explorer</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">Inspect learning models from every angle to make science concepts easier to understand.</p>
          </div>
          <label className="flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
            <FiSearch className="h-5 w-5 flex-none text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search 3D models" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
          </label>
        </section>

        <section className="mt-6 flex flex-wrap gap-2" aria-label="Filter models by subject">
          {subjects.map((subject) => <button key={subject} onClick={() => setSelectedSubject(subject)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${selectedSubject === subject ? 'bg-primary text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-600 shadow-sm hover:bg-blue-50 hover:text-primary'}`}>{subject}</button>)}
        </section>

        {isLoading && <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="aspect-video animate-pulse rounded-xl bg-slate-100" /><div className="mt-5 h-5 w-2/3 animate-pulse rounded bg-slate-200" /></div>)}</div>}

        {error && <div className="mt-8 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm"><FiAlertCircle className="mx-auto h-9 w-9 text-red-400" /><p className="mt-4 font-extrabold text-slate-900">Could not load 3D models</p><p className="mt-2 text-sm text-slate-500">{error}</p><button onClick={loadModels} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><FiRefreshCw /> Try again</button></div>}

        {!isLoading && !error && visibleModels.length === 0 && <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><FiBox className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-4 font-extrabold text-slate-800">No 3D models found</p><p className="mt-2 text-sm text-slate-500">Try another subject or clear the search.</p></div>}

        {!isLoading && !error && visibleModels.length > 0 && <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleModels.map((model) => <article key={model.resource_id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="aspect-video overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#dbeafe_0%,#eff6ff_40%,#f8fafc_75%)]"><ModelThumbnail modelUrl={model.preview_model_url} title={model.title} /></div><div className="p-5"><div className="flex items-start justify-between gap-3">{model.subject_name && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">{model.subject_name}</span>}<button onClick={() => toggleFavourite(model.resource_id)} className={`flex h-9 w-9 items-center justify-center rounded-xl ${favouriteIds.has(model.resource_id) ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500 hover:text-rose-500'}`} aria-label={`Save ${model.title}`}><FiHeart className={favouriteIds.has(model.resource_id) ? 'fill-current' : ''} /></button></div><h2 className="mt-3 text-lg font-extrabold leading-6 text-slate-950">{model.title}</h2><p className="mt-2 text-sm text-slate-500">{model.topic_name || 'Interactive 3D learning model'}</p><button onClick={() => navigate(`/models/${model.resource_id}`)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Explore model <FiArrowRight /></button></div></article>)}</section>}
      </main>
    </div>
  );
}
