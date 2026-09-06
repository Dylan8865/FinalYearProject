import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import { EducatorRecommendation, FavouriteItem, ModelAnnotation, ModelAnnotationDraft, ThreeDModelDetail } from '@/types/resource';
import ModelViewer from './ModelViewer';
import { FiAlertCircle, FiArrowLeft, FiBookOpen, FiEdit2, FiHeart, FiMapPin, FiPlus, FiRefreshCw, FiSave, FiShare2, FiStar, FiTrash2, FiX } from 'react-icons/fi';

const periodicTableAttribution = '3D Periodic Table by ApolloIndustries, CC Attribution';

export default function ModelDetailPage() {
  const navigate = useNavigate();
  const { resourceId } = useParams();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const [model, setModel] = useState<ThreeDModelDetail | null>(null);
  const [annotations, setAnnotations] = useState<ModelAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [annotationError, setAnnotationError] = useState('');
  const [selectedAnnotation, setSelectedAnnotation] = useState<ModelAnnotation | null>(null);
  const [draft, setDraft] = useState<ModelAnnotationDraft | null>(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [isPlacingAnnotation, setIsPlacingAnnotation] = useState(() => searchParams.get('annotate') === '1');
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isSavingFavourite, setIsSavingFavourite] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [educatorPick, setEducatorPick] = useState<EducatorRecommendation | null>(null);
  const [isPickDialogOpen, setIsPickDialogOpen] = useState(false);
  const [pickNote, setPickNote] = useState('');
  const [isSavingPick, setIsSavingPick] = useState(false);
  const sessionIdRef = useRef('');
  const sessionStartedAtRef = useRef(0);
  const interactionCountRef = useRef(0);
  const exploredRef = useRef(false);

  const isEducator = user?.role === 'educator';
  const canManageAnnotations = isEducator && Boolean(model?.can_manage_annotations);

  const loadModel = async () => {
    if (!resourceId) return;
    setIsLoading(true);
    setError('');
    try {
      setModel(await authService.getThreeDModel(resourceId));
    } catch {
      setError('We could not prepare this private 3D model for viewing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModel();
  }, [resourceId]); // eslint-disable-line react-hooks/exhaustive-deps -- loadModel is scoped to the current resource

  useEffect(() => {
    if (!resourceId || !isEducator) return;
    authService.getMyEducatorPicks()
      .then((picks) => setEducatorPick(picks.find((pick) => pick.target_type === 'model' && pick.target_id === resourceId) || null))
      .catch(() => setEducatorPick(null));
  }, [isEducator, resourceId]);

  useEffect(() => {
    if (!resourceId) return;
    sessionIdRef.current = crypto.randomUUID();
    sessionStartedAtRef.current = Date.now();
    interactionCountRef.current = 0;
    exploredRef.current = false;
    void authService.recordLearningEvent({ target_type: 'model', target_id: resourceId, event_type: 'opened', session_id: sessionIdRef.current, metadata: { source: 'model_detail' } }).catch(() => undefined);
    return () => {
      const durationSeconds = Math.round((Date.now() - sessionStartedAtRef.current) / 1000);
      if (durationSeconds >= 5) {
        void authService.recordLearningEvent({ target_type: 'model', target_id: resourceId, event_type: 'model_viewed', session_id: sessionIdRef.current, metadata: { duration_seconds: durationSeconds } }).catch(() => undefined);
      }
    };
  }, [resourceId]);

  useEffect(() => {
    if (!resourceId) return;
    authService.getFavourites()
      .then((items: FavouriteItem[]) => setIsFavourite(items.some((item) => item.target_type === 'model' && item.target_id === resourceId)))
      .catch(() => setIsFavourite(false));
  }, [resourceId]);

  const toggleFavourite = async () => {
    if (!resourceId || isSavingFavourite) return;
    const savedBefore = isFavourite;
    setIsFavourite(!savedBefore);
    setIsSavingFavourite(true);
    try {
      if (savedBefore) await authService.removeFavourite('model', resourceId);
      else await authService.saveFavourite('model', resourceId);
    } catch {
      setIsFavourite(savedBefore);
    } finally {
      setIsSavingFavourite(false);
    }
  };

  const submitShare = async (event: FormEvent) => {
    event.preventDefault();
    if (!resourceId || !recipientEmail.trim() || isSharing) return;
    setIsSharing(true);
    setShareStatus('');
    try {
      await authService.shareThreeDModel(resourceId, recipientEmail.trim(), shareMessage.trim() || undefined);
      setShareStatus('Shared successfully.');
      setRecipientEmail('');
      setShareMessage('');
    } catch (shareError: any) {
      const detail = shareError.response?.data?.detail;
      setShareStatus(typeof detail === 'string' ? detail : 'User not found or sharing not permitted.');
    } finally {
      setIsSharing(false);
    }
  };

  const recordMeaningfulInteraction = () => {
    if (!resourceId || exploredRef.current) return;
    interactionCountRef.current += 1;
    if (interactionCountRef.current < 2) return;
    exploredRef.current = true;
    void authService.recordLearningEvent({ target_type: 'model', target_id: resourceId, event_type: 'model_explored', session_id: sessionIdRef.current, metadata: { source: 'rotate_or_hotspot' } }).catch(() => undefined);
  };

  const saveEducatorPick = async (event: FormEvent) => {
    event.preventDefault();
    if (!resourceId || !pickNote.trim() || isSavingPick) return;
    setIsSavingPick(true);
    try {
      const saved = await authService.createEducatorPick('model', resourceId, pickNote.trim());
      setEducatorPick(saved);
      setIsPickDialogOpen(false);
      setPickNote('');
    } finally {
      setIsSavingPick(false);
    }
  };

  const removeEducatorPick = async () => {
    if (!educatorPick) return;
    await authService.deleteEducatorPick(educatorPick.recommendation_id);
    setEducatorPick(null);
  };

  useEffect(() => {
    if (!resourceId) return;
    setAnnotationError('');
    authService.getModelAnnotations(resourceId)
      .then(setAnnotations)
      .catch(() => setAnnotationError('Annotations are not available yet. The educator database migration may still need to be applied.'));
  }, [resourceId]);

  const beginNewAnnotation = () => {
    if (!canManageAnnotations) return;
    setSelectedAnnotation(null);
    setEditingAnnotationId(null);
    setDraft(null);
    setIsPlacingAnnotation(true);
  };

  const placeAnnotation = (position: [number, number, number]) => {
    if (!canManageAnnotations) return;
    setDraft((current) => ({
      title: current?.title || '',
      description: current?.description || '',
      position,
    }));
    setIsPlacingAnnotation(false);
  };

  const beginEditAnnotation = (annotation: ModelAnnotation) => {
    setSelectedAnnotation(annotation);
    setEditingAnnotationId(annotation.annotation_id);
    setDraft({ title: annotation.title, description: annotation.description, position: annotation.position });
    setIsPlacingAnnotation(false);
  };

  const cancelDraft = () => {
    setDraft(null);
    setEditingAnnotationId(null);
    setIsPlacingAnnotation(false);
  };

  const saveAnnotation = async (event: FormEvent) => {
    event.preventDefault();
    if (!resourceId || !draft) return;
    setIsSavingAnnotation(true);
    setAnnotationError('');
    try {
      const saved = editingAnnotationId
        ? await authService.updateModelAnnotation(editingAnnotationId, draft)
        : await authService.createModelAnnotation(resourceId, draft);
      setAnnotations((current) => editingAnnotationId
        ? current.map((annotation) => annotation.annotation_id === saved.annotation_id ? saved : annotation)
        : [...current, saved]);
      setSelectedAnnotation(saved);
      cancelDraft();
    } catch {
      setAnnotationError('The annotation could not be saved. Please check the title and description, then try again.');
    } finally {
      setIsSavingAnnotation(false);
    }
  };

  const deleteAnnotation = async (annotation: ModelAnnotation) => {
    if (!window.confirm(`Delete the annotation “${annotation.title}”?`)) return;
    setAnnotationError('');
    try {
      await authService.deleteModelAnnotation(annotation.annotation_id);
      setAnnotations((current) => current.filter((item) => item.annotation_id !== annotation.annotation_id));
      if (selectedAnnotation?.annotation_id === annotation.annotation_id) setSelectedAnnotation(null);
    } catch {
      setAnnotationError('The annotation could not be deleted. Only its creator can delete it.');
    }
  };

  const updateDraft = (field: 'title' | 'description', value: string) => {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
        <button onClick={() => navigate('/models')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"><FiArrowLeft /> Back to 3D models</button>

        {isLoading && <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="aspect-video animate-pulse rounded-3xl bg-slate-200" /><div className="space-y-4 rounded-3xl bg-white p-6"><div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" /><div className="h-9 w-full animate-pulse rounded bg-slate-100" /></div></div>}

        {error && <div className="mt-8 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm"><FiAlertCircle className="mx-auto h-9 w-9 text-red-400" /><p className="mt-4 font-extrabold text-slate-900">Model unavailable</p><p className="mt-2 text-sm text-slate-500">{error}</p><button onClick={loadModel} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><FiRefreshCw /> Try again</button></div>}

        {model && !isLoading && !error && <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section>
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Interactive model</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">{model.title}</h1></div><div className="flex gap-2">{isEducator && <button onClick={() => educatorPick ? void removeEducatorPick() : setIsPickDialogOpen(true)} className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition ${educatorPick ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700'}`} title={educatorPick ? 'Remove educator recommendation' : 'Recommend to students'}><FiStar className={educatorPick ? 'fill-current' : ''} /><span className="hidden sm:inline">{educatorPick ? 'Recommended' : 'Recommend'}</span></button>}<button onClick={() => { setShareStatus(''); setIsShareDialogOpen(true); }} className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-100 hover:bg-blue-50 hover:text-primary" aria-label={`Share ${model.title}`} title="Share inside Qubo"><FiShare2 className="h-5 w-5" /></button><button onClick={toggleFavourite} disabled={isSavingFavourite} className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl border transition disabled:opacity-60 ${isFavourite ? 'border-rose-100 bg-rose-50 text-rose-500' : 'border-slate-200 bg-white text-slate-500 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-500'}`} aria-label={isFavourite ? `Remove ${model.title} from saved items` : `Save ${model.title}`} title={isFavourite ? 'Remove from Saved' : 'Save for revision'}><FiHeart className={`h-5 w-5 ${isFavourite ? 'fill-current' : ''}`} /></button></div></div>
            <div className="mt-6"><ModelViewer modelUrl={model.signed_model_url} title={model.title} annotations={annotations} isPlacingAnnotation={isPlacingAnnotation && canManageAnnotations} selectedAnnotationId={selectedAnnotation?.annotation_id} onPlaceAnnotation={placeAnnotation} onSelectAnnotation={setSelectedAnnotation} onMeaningfulInteraction={recordMeaningfulInteraction} /></div>
            <p className="mt-3 text-xs font-medium text-slate-500">{periodicTableAttribution}</p>
            {selectedAnnotation && !draft && <article className="mt-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary"><FiMapPin /> Model annotation</p><h2 className="mt-2 text-lg font-extrabold text-slate-950">{selectedAnnotation.title}</h2></div><button type="button" onClick={() => setSelectedAnnotation(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close annotation"><FiX /></button></div><p className="mt-3 text-sm leading-6 text-slate-600">{selectedAnnotation.description}</p>{isEducator && selectedAnnotation.created_by === user?.id && <div className="mt-4 flex gap-2"><button onClick={() => beginEditAnnotation(selectedAnnotation)} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"><FiEdit2 /> Edit</button><button onClick={() => deleteAnnotation(selectedAnnotation)} className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100"><FiTrash2 /> Delete</button></div>}</article>}
          </section>
          <aside className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Resource details</p>
            <div className="mt-5 space-y-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">Subject</p><p className="mt-1 font-extrabold text-slate-900">{model.subject_name || 'SPM learning'}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">Topic</p><p className="mt-1 font-extrabold text-slate-900">{model.topic_name || 'Interactive model'}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">Learning style</p><p className="mt-1 font-extrabold capitalize text-slate-900">{model.learning_style_tag || 'Visual'}</p></div></div>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800"><FiBookOpen className="mt-1 flex-none" />Rotate the model and select a numbered marker to read the educator's explanation.</div>
            <section className="mt-6 border-t border-slate-100 pt-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Learning hotspots</p><p className="mt-1 text-sm font-bold text-slate-900">{annotations.length} annotation{annotations.length === 1 ? '' : 's'}</p></div>{canManageAnnotations && !draft && !isPlacingAnnotation && <button onClick={beginNewAnnotation} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><FiPlus /> Add</button>}</div>
              {annotationError && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">{annotationError}</p>}
              {canManageAnnotations && isPlacingAnnotation && <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-bold text-blue-900">Choose a location</p><p className="mt-1 text-xs leading-5 text-blue-800">Click the exact part of the 3D model to place this hotspot.</p><button onClick={cancelDraft} className="mt-3 text-xs font-bold text-blue-700 underline">Cancel</button></div>}
              {canManageAnnotations && draft && <form onSubmit={saveAnnotation} className="mt-4 space-y-3"><div><label htmlFor="annotation-title" className="text-xs font-bold text-slate-600">Title</label><input id="annotation-title" value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} maxLength={100} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="e.g. Cell wall" /></div><div><label htmlFor="annotation-description" className="text-xs font-bold text-slate-600">Explanation</label><textarea id="annotation-description" value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} maxLength={1200} required rows={5} className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm leading-5 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="Explain the purpose of this part…" /></div>{editingAnnotationId && <button type="button" onClick={() => setIsPlacingAnnotation(true)} className="text-xs font-bold text-primary underline">Choose a new location</button>}<div className="flex gap-2"><button type="submit" disabled={isSavingAnnotation} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white disabled:opacity-60"><FiSave /> {isSavingAnnotation ? 'Saving…' : 'Save hotspot'}</button><button type="button" onClick={cancelDraft} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">Cancel</button></div></form>}
              {!isEducator && annotations.length === 0 && !annotationError && <p className="mt-4 text-sm leading-6 text-slate-500">No educator annotations have been added to this model yet.</p>}
              {annotations.length > 0 && <div className="mt-4 space-y-2">{annotations.map((annotation, index) => <button key={annotation.annotation_id} onClick={() => setSelectedAnnotation(annotation)} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${selectedAnnotation?.annotation_id === annotation.annotation_id ? 'bg-blue-50 text-blue-900' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}><span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">{index + 1}</span><span className="truncate text-sm font-bold">{annotation.title}</span></button>)}</div>}
            </section>
          </aside>
        </div>}
      </main>
      {isPickDialogOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"><form onSubmit={saveEducatorPick} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-600">Educator's pick</p><h2 className="mt-1 text-xl font-extrabold">Recommend this model</h2></div><button type="button" onClick={() => setIsPickDialogOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><FiX /></button></div><label className="mt-5 block text-sm font-bold text-slate-700">Why should students study this?<textarea value={pickNote} onChange={(event) => setPickNote(event.target.value)} maxLength={300} required rows={4} className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 font-medium outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" placeholder="e.g. Helps students visualise the cell structure before a Biology quiz." autoFocus /></label><button disabled={isSavingPick || !pickNote.trim()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-bold text-white shadow-lg shadow-amber-500/20 disabled:opacity-60"><FiStar /> {isSavingPick ? 'Saving…' : 'Recommend to students'}</button></form></div>}
      {isShareDialogOpen && model && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Share ${model.title}`}><form onSubmit={submitShare} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Share inside Qubo</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">{model.title}</h2></div><button type="button" onClick={() => setIsShareDialogOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close share dialog"><FiX /></button></div><label className="mt-5 block text-sm font-bold text-slate-700">Recipient email<input type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="e.g. student@example.com" autoFocus required /></label><p className="mt-2 text-xs leading-5 text-slate-500">The recipient must already have a Qubo account with this email.</p><label className="mt-4 block text-sm font-bold text-slate-700">Message <span className="font-medium text-slate-400">(optional)</span><textarea value={shareMessage} onChange={(event) => setShareMessage(event.target.value)} maxLength={300} rows={3} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="This may help with revision." /></label>{shareStatus && <p className={`mt-4 rounded-xl p-3 text-sm font-semibold ${shareStatus === 'Shared successfully.' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{shareStatus}</p>}<button type="submit" disabled={!recipientEmail.trim() || isSharing} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/20 disabled:opacity-60"><FiShare2 /> {isSharing ? 'Sharing…' : 'Share 3D model'}</button></form></div>}
    </div>
  );
}
