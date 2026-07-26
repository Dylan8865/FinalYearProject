import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { useAuthStore } from '@/contexts/authStore';
import { FavouriteItem, ThreeDModelSummary } from '@/types/resource';
import ModelThumbnail from './ModelThumbnail';
import { FiAlertCircle, FiArrowLeft, FiArrowRight, FiBox, FiHeart, FiRefreshCw, FiSearch, FiShare2, FiTrash2, FiX } from 'react-icons/fi';

export default function ModelLibraryPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [models, setModels] = useState<ThreeDModelSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [visibilityScope, setVisibilityScope] = useState<'public' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [shareModel, setShareModel] = useState<ThreeDModelSummary | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [isSharing, setIsSharing] = useState(false);

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
      setModels(await authService.getThreeDModels(visibilityScope));
    } catch {
      setError('We could not load the 3D learning resources. Please check the backend connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadModels();
    authService.getFavourites().then((items: FavouriteItem[]) => setFavouriteIds(new Set(items.filter((item) => item.target_type === 'model').map((item) => item.target_id)))).catch(() => undefined);
  }, [visibilityScope]); // eslint-disable-line react-hooks/exhaustive-deps -- reload only when the selected visibility changes

  const toggleFavourite = async (resourceId: string) => {
    const isSaved = favouriteIds.has(resourceId);
    setFavouriteIds((current) => { const next = new Set(current); isSaved ? next.delete(resourceId) : next.add(resourceId); return next; });
    try { if (isSaved) await authService.removeFavourite('model', resourceId); else await authService.saveFavourite('model', resourceId); } catch { setFavouriteIds((current) => { const next = new Set(current); isSaved ? next.add(resourceId) : next.delete(resourceId); return next; }); }
  };
  const deleteModel = async (model: ThreeDModelSummary) => {
    if (!window.confirm(`Delete “${model.title}”? This permanently removes its model file and annotations.`)) return;
    try { await authService.deleteThreeDModel(model.resource_id); setModels((current) => current.filter((item) => item.resource_id !== model.resource_id)); }
    catch (requestError: any) { setError(requestError.response?.data?.detail || 'This 3D model could not be deleted.'); }
  };

  const submitShare = async (event: FormEvent) => {
    event.preventDefault();
    if (!shareModel || !recipientEmail.trim() || isSharing) return;
    setIsSharing(true);
    setShareStatus('');
    try {
      await authService.shareThreeDModel(shareModel.resource_id, recipientEmail.trim(), shareMessage.trim() || undefined);
      setShareStatus('Shared successfully.');
      setRecipientEmail('');
      setShareMessage('');
    } catch (shareError: any) {
      setShareStatus(shareError.response?.data?.detail || 'The 3D model could not be shared.');
    } finally {
      setIsSharing(false);
    }
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
          {user?.role === 'educator' && <div className="mr-2 flex rounded-full bg-slate-200 p-1" aria-label="Filter models by visibility"><button onClick={() => setVisibilityScope('public')} className={`rounded-full px-3 py-1.5 text-sm font-bold ${visibilityScope === 'public' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Public library</button><button onClick={() => setVisibilityScope('private')} className={`rounded-full px-3 py-1.5 text-sm font-bold ${visibilityScope === 'private' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Only mine</button></div>}
          {subjects.map((subject) => <button key={subject} onClick={() => setSelectedSubject(subject)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${selectedSubject === subject ? 'bg-primary text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-600 shadow-sm hover:bg-blue-50 hover:text-primary'}`}>{subject}</button>)}
        </section>

        {isLoading && <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="aspect-video animate-pulse rounded-xl bg-slate-100" /><div className="mt-5 h-5 w-2/3 animate-pulse rounded bg-slate-200" /></div>)}</div>}

        {error && <div className="mt-8 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm"><FiAlertCircle className="mx-auto h-9 w-9 text-red-400" /><p className="mt-4 font-extrabold text-slate-900">Could not load 3D models</p><p className="mt-2 text-sm text-slate-500">{error}</p><button onClick={loadModels} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><FiRefreshCw /> Try again</button></div>}

        {!isLoading && !error && visibleModels.length === 0 && <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><FiBox className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-4 font-extrabold text-slate-800">No 3D models found</p><p className="mt-2 text-sm text-slate-500">Try another subject or clear the search.</p></div>}

        {!isLoading && !error && visibleModels.length > 0 && <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleModels.map((model) => <article key={model.resource_id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="aspect-video overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#dbeafe_0%,#eff6ff_40%,#f8fafc_75%)]"><ModelThumbnail modelUrl={model.preview_model_url} title={model.title} /></div><div className="p-5"><div className="flex items-start justify-between gap-3">{model.subject_name && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">{model.subject_name}</span>}<div className="flex gap-2"><button onClick={() => { setShareModel(model); setShareStatus(''); }} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-primary" aria-label={`Share ${model.title}`} title="Share inside Qubo"><FiShare2 /></button><button onClick={() => toggleFavourite(model.resource_id)} className={`flex h-9 w-9 items-center justify-center rounded-xl ${favouriteIds.has(model.resource_id) ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500 hover:text-rose-500'}`} aria-label={`Save ${model.title}`}><FiHeart className={favouriteIds.has(model.resource_id) ? 'fill-current' : ''} /></button>{user?.role === 'educator' && model.created_by === user.id && <button onClick={() => void deleteModel(model)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100" aria-label={`Delete ${model.title}`} title="Delete your model"><FiTrash2 /></button>}</div></div><h2 className="mt-3 text-lg font-extrabold leading-6 text-slate-950">{model.title}</h2><p className="mt-2 text-sm text-slate-500">{model.topic_name || 'Interactive 3D learning model'}</p><button onClick={() => navigate(`/models/${model.resource_id}`)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">Explore model <FiArrowRight /></button></div></article>)}</section>}
      </main>
      {shareModel && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Share ${shareModel.title}`}><form onSubmit={submitShare} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Share inside Qubo</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">{shareModel.title}</h2></div><button type="button" onClick={() => setShareModel(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close share dialog"><FiX /></button></div><label className="mt-5 block text-sm font-bold text-slate-700">Recipient email<input type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="e.g. student@example.com" autoFocus required /></label><p className="mt-2 text-xs leading-5 text-slate-500">The recipient must already have a Qubo account with this email.</p><label className="mt-4 block text-sm font-bold text-slate-700">Message <span className="font-medium text-slate-400">(optional)</span><textarea value={shareMessage} onChange={(event) => setShareMessage(event.target.value)} maxLength={300} rows={3} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="This may help with revision." /></label>{shareStatus && <p className={`mt-4 rounded-xl p-3 text-sm font-semibold ${shareStatus === 'Shared successfully.' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{shareStatus}</p>}<button type="submit" disabled={!recipientEmail.trim() || isSharing} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/20 disabled:opacity-60"><FiShare2 /> {isSharing ? 'Sharing…' : 'Share 3D model'}</button></form></div>}
    </div>
  );
}
