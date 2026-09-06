import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import { FavouriteItem } from '@/types/resource';
import { TutorialVideo } from '@/types/video';
import YouTubeLearningPlayer from './YouTubeLearningPlayer';
import ModerationAlertsPanel from '@/components/common/ModerationAlertsPanel';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiExternalLink,
  FiHeart,
  FiPlay,
  FiRefreshCw,
  FiSearch,
  FiShare2,
  FiStar,
  FiTrash2,
  FiVideo,
  FiX,
} from 'react-icons/fi';

const getYouTubeVideoId = (youtubeUrl: string) => {
  try {
    const url = new URL(youtubeUrl);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1);
    if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] || '';
    return url.searchParams.get('v') || '';
  } catch {
    return '';
  }
};

const getThumbnailUrl = (video: TutorialVideo) => {
  const videoId = getYouTubeVideoId(video.youtube_url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '/images/resource-video-preview.png';
};

export default function TutorialVideoPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [visibilityScope, setVisibilityScope] = useState<'public' | 'private'>('public');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<TutorialVideo | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [shareVideo, setShareVideo] = useState<TutorialVideo | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [videoSessionId, setVideoSessionId] = useState('');
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());
  const [myEducatorPicks, setMyEducatorPicks] = useState<Record<string, string>>({});
  const [pickVideo, setPickVideo] = useState<TutorialVideo | null>(null);
  const [pickNote, setPickNote] = useState('');
  const [isSavingPick, setIsSavingPick] = useState(false);

  const subjects = useMemo(
    () => ['All', ...Array.from(new Set(videos.map((video) => video.subject_tag).filter(Boolean) as string[])).sort()],
    [videos]
  );

  const visibleVideos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesSubject = selectedSubject === 'All' || video.subject_tag === selectedSubject;
      const matchesSearch = !query || video.title.toLowerCase().includes(query);
      return matchesSubject && matchesSearch;
    });
  }, [search, selectedSubject, videos]);

  const loadVideos = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setVideos(await authService.getTutorialVideos(undefined, undefined, visibilityScope));
    } catch {
      setError('We could not load learning videos right now. Please check the backend connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [visibilityScope]);

  useEffect(() => {
    void loadVideos();
    authService.getFavourites().then((items: FavouriteItem[]) => setFavouriteIds(new Set(items.filter((item) => item.target_type === 'video').map((item) => item.target_id)))).catch(() => undefined);
  }, [loadVideos]);

  useEffect(() => {
    if (user?.role !== 'educator') return;
    authService.getMyEducatorPicks().then((picks) => {
      setMyEducatorPicks(Object.fromEntries(picks.filter((pick) => pick.target_type === 'video').map((pick) => [pick.target_id, pick.recommendation_id])));
    }).catch(() => undefined);
  }, [user?.role]);

  const openVideo = (video: TutorialVideo) => {
    setSelectedVideo(video);
    const sessionId = crypto.randomUUID();
    setVideoSessionId(sessionId);
    void authService.recordTutorialVideoView(video.video_id).catch((recordError) => {
      console.warn('Video activity could not be recorded:', recordError);
    });
    void authService.recordLearningEvent({ target_type: 'video', target_id: video.video_id, event_type: 'opened', session_id: sessionId, metadata: { source: 'tutorial_player' } }).catch(() => undefined);
  };

  const markVideoCompleted = useCallback(async (video: TutorialVideo, sessionId: string) => {
    if (completedVideoIds.has(video.video_id)) return;
    try {
      await authService.markLearningCompleted('video', video.video_id, sessionId);
      setCompletedVideoIds((current) => new Set(current).add(video.video_id));
    } catch {
      // Completion is a convenience signal; do not interrupt the lesson when
      // an activity migration has not yet been deployed.
    }
  }, [completedVideoIds]);

  const closeVideoSummary = useCallback((summary: { watchedSeconds: number; progressPercent: number }) => {
    if (!selectedVideo || !videoSessionId) return;
    if (summary.watchedSeconds < 15 && summary.progressPercent < 10) {
      void authService.recordLearningEvent({ target_type: 'video', target_id: selectedVideo.video_id, event_type: 'skipped_quickly', session_id: videoSessionId, metadata: { duration_seconds: summary.watchedSeconds, progress_percent: summary.progressPercent } }).catch(() => undefined);
    }
  }, [selectedVideo, videoSessionId]);

  const toggleFavourite = async (videoId: string) => {
    const isSaved = favouriteIds.has(videoId);
    setFavouriteIds((current) => { const next = new Set(current); isSaved ? next.delete(videoId) : next.add(videoId); return next; });
    try { if (isSaved) await authService.removeFavourite('video', videoId); else await authService.saveFavourite('video', videoId); } catch { setFavouriteIds((current) => { const next = new Set(current); isSaved ? next.add(videoId) : next.delete(videoId); return next; }); }
  };
  const deleteVideo = async (video: TutorialVideo) => {
    if (!window.confirm(`Delete “${video.title}”? This removes it from your collections and shared links.`)) return;
    try { await authService.deleteTutorialVideo(video.video_id); setVideos((current) => current.filter((item) => item.video_id !== video.video_id)); }
    catch (requestError: any) { setError(requestError.response?.data?.detail || 'This video could not be deleted.'); }
  };

  const submitShare = async () => {
    if (!shareVideo || !recipientEmail.trim()) return;
    setIsSharing(true);
    setShareStatus('');
    try {
      await authService.shareTutorialVideo(shareVideo.video_id, recipientEmail.trim(), shareMessage.trim() || undefined);
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

  const submitEducatorPick = async () => {
    if (!pickVideo || !pickNote.trim() || isSavingPick) return;
    setIsSavingPick(true);
    try {
      const saved = await authService.createEducatorPick('video', pickVideo.video_id, pickNote.trim());
      setMyEducatorPicks((current) => ({ ...current, [pickVideo.video_id]: saved.recommendation_id }));
      setPickVideo(null);
      setPickNote('');
    } finally {
      setIsSavingPick(false);
    }
  };

  const toggleEducatorPick = async (video: TutorialVideo) => {
    const recommendationId = myEducatorPicks[video.video_id];
    if (!recommendationId) { setPickVideo(video); setPickNote(''); return; }
    await authService.deleteEducatorPick(recommendationId);
    setMyEducatorPicks((current) => { const next = { ...current }; delete next[video.video_id]; return next; });
  };

  useEffect(() => {
    const requestedVideoId = searchParams.get('video');
    if (!requestedVideoId || selectedVideo || videos.length === 0) return;
    const requestedVideo = videos.find((video) => video.video_id === requestedVideoId);
    if (requestedVideo) openVideo(requestedVideo);
    setSearchParams({}, { replace: true });
  }, [searchParams, selectedVideo, setSearchParams, videos]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr] lg:grid-rows-[auto_1fr]">
      <AppSidebar />

      <main className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
        <button onClick={() => navigate('/resources')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"><FiArrowLeft /> Back to resources</button>
        {/* Moderation Alerts for educators */}
        {user?.role === 'educator' && <div className="mt-6"><ModerationAlertsPanel /></div>}
        <section className="flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Learning hub</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">Learning Videos</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">Explore clear video lessons for your SPM subjects and play them without leaving Qubo.</p>
          </div>
          <label className="flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
            <FiSearch className="h-5 w-5 flex-none text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search learning videos" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
            {search && <button onClick={() => setSearch('')} aria-label="Clear search" className="text-slate-400 hover:text-slate-700"><FiX /></button>}
          </label>
        </section>

        <section className="mt-6 flex flex-wrap gap-2" aria-label="Filter videos by subject">
          {user?.role === 'educator' && <div className="mr-2 flex rounded-full bg-slate-200 p-1" aria-label="Filter videos by ownership"><button onClick={() => setVisibilityScope('public')} className={`rounded-full px-3 py-1.5 text-sm font-bold ${visibilityScope === 'public' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Public library</button><button onClick={() => setVisibilityScope('private')} className={`rounded-full px-3 py-1.5 text-sm font-bold ${visibilityScope === 'private' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>Only mine</button></div>}
          {subjects.map((subject) => (
            <button key={subject} onClick={() => setSelectedSubject(subject)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${selectedSubject === subject ? 'bg-primary text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-600 shadow-sm hover:bg-blue-50 hover:text-primary'}`}>
              {subject}
            </button>
          ))}
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Tutorial collection</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{selectedSubject === 'All' ? 'All learning videos' : `${selectedSubject} videos`}</h2>
            </div>
            {!isLoading && !error && <p className="text-sm font-semibold text-slate-500">{visibleVideos.length} video{visibleVideos.length === 1 ? '' : 's'}</p>}
          </div>

          {isLoading && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="aspect-video animate-pulse bg-slate-200" /><div className="space-y-3 p-5"><div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" /><div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" /></div></div>)}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
              <FiAlertCircle className="mx-auto h-9 w-9 text-red-400" />
              <p className="mt-4 font-extrabold text-slate-900">Could not load videos</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{error}</p>
              <button onClick={loadVideos} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><FiRefreshCw /> Try again</button>
            </div>
          )}

          {!isLoading && !error && visibleVideos.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FiVideo className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-4 font-extrabold text-slate-800">No videos found</p>
              <p className="mt-2 text-sm text-slate-500">Try another subject or clear the search to see available lessons.</p>
              {(search || selectedSubject !== 'All') && <button onClick={() => { setSearch(''); setSelectedSubject('All'); }} className="mt-4 text-sm font-bold text-primary hover:text-blue-700">Clear filters</button>}
            </div>
          )}

          {!isLoading && !error && visibleVideos.length > 0 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleVideos.map((video) => (
                <article key={video.video_id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <button onClick={() => openVideo(video)} disabled={!!(video.is_deleted)} className="group relative block aspect-video w-full overflow-hidden bg-slate-900 text-left">
                    <img src={getThumbnailUrl(video)} alt={`${video.title} YouTube preview`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-slate-950/20" />
                    {video.is_deleted && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[2px]"><span className="rounded-xl bg-rose-100 px-3 py-1.5 text-sm font-bold text-rose-700 shadow-sm">❌ Removed by admin</span></div>}
                    {!video.is_deleted && video.is_locked && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[2px]"><span className="rounded-xl bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-700 shadow-sm">🔒 Locked by admin</span></div>}
                    <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg"><FiPlay className="ml-0.5 h-6 w-6" /></span>
                  </button>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {video.subject_tag && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">{video.subject_tag}</span>}
                      {video.is_deleted && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">❌ Removed by Admin</span>}
                      {!video.is_deleted && video.is_locked && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">🔒 Locked</span>}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-lg font-extrabold leading-6 text-slate-950">{video.title}</h3>
                    <div className="mt-5 flex gap-3">
                      <button onClick={() => openVideo(video)} disabled={!!(video.is_deleted)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><FiPlay /> Play</button>
                      {!video.is_deleted && !video.is_locked && user?.role !== 'educator' && <button onClick={() => toggleFavourite(video.video_id)} aria-label={`Save ${video.title}`} className={`flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 ${favouriteIds.has(video.video_id) ? 'border-rose-100 bg-rose-50 text-rose-500' : 'text-slate-600 hover:bg-slate-50 hover:text-rose-500'}`}><FiHeart className={favouriteIds.has(video.video_id) ? 'fill-current' : ''} /></button>}
                      {!video.is_deleted && !video.is_locked && <button onClick={() => { setShareVideo(video); setShareStatus(''); }} aria-label={`Share ${video.title}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-primary"><FiShare2 /></button>}
                      {!video.is_deleted && !video.is_locked && user?.role === 'educator' && <button onClick={() => void toggleEducatorPick(video)} aria-label={`Recommend ${video.title} to students`} title={myEducatorPicks[video.video_id] ? 'Remove educator recommendation' : 'Recommend to students'} className={`flex h-11 w-11 items-center justify-center rounded-xl border ${myEducatorPicks[video.video_id] ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600'}`}><FiStar className={myEducatorPicks[video.video_id] ? 'fill-current' : ''} /></button>}
                      {!video.is_deleted && !video.is_locked && user?.role === 'educator' && video.uploaded_by === user.id && <button onClick={() => void deleteVideo(video)} aria-label={`Delete ${video.title}`} title="Delete your video" className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100"><FiTrash2 /></button>}
                      {!video.is_deleted && !video.is_locked && <a href={video.youtube_url} target="_blank" rel="noreferrer" aria-label={`Open ${video.title} on YouTube`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"><FiExternalLink /></a>}
                    </div>
                  </div>

                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Play ${selectedVideo.title}`} onMouseDown={(event) => event.target === event.currentTarget && setSelectedVideo(null)}>
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                {selectedVideo.subject_tag && <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{selectedVideo.subject_tag}</p>}
                <h2 className="mt-1 truncate text-xl font-extrabold text-slate-950">{selectedVideo.title}</h2>
              </div>
              <button onClick={() => setSelectedVideo(null)} aria-label="Close video player" className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"><FiX className="h-5 w-5" /></button>
            </div>
            {getYouTubeVideoId(selectedVideo.youtube_url) ? <YouTubeLearningPlayer videoId={selectedVideo.video_id} youtubeId={getYouTubeVideoId(selectedVideo.youtube_url)} title={selectedVideo.title} sessionId={videoSessionId} onWatchedEnough={() => void markVideoCompleted(selectedVideo, videoSessionId)} onCloseSummary={closeVideoSummary} /> : <div className="flex aspect-video items-center justify-center bg-slate-950 p-6 text-center text-sm font-semibold text-white">This video URL is not a supported YouTube link.</div>}
            <div className="flex justify-end p-4"><a href={selectedVideo.youtube_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Open on YouTube <FiExternalLink /></a></div>
          </div>
        </div>
      )}

      {shareVideo && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Share ${shareVideo.title}`}><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Share inside Qubo</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">{shareVideo.title}</h2></div><button onClick={() => setShareVideo(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close share dialog"><FiX /></button></div><label className="mt-5 block text-sm font-bold text-slate-700">Recipient email<input type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="e.g. student@example.com" autoFocus /></label><p className="mt-2 text-xs leading-5 text-slate-500">The recipient must already have a Qubo account with this email.</p><label className="mt-4 block text-sm font-bold text-slate-700">Message <span className="font-medium text-slate-400">(optional)</span><textarea value={shareMessage} onChange={(event) => setShareMessage(event.target.value)} maxLength={300} rows={3} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="This may help with revision." /></label>{shareStatus && <p className={`mt-4 rounded-xl p-3 text-sm font-semibold ${shareStatus === 'Shared successfully.' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{shareStatus}</p>}<button onClick={submitShare} disabled={!recipientEmail.trim() || isSharing} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white shadow-lg shadow-blue-600/20 disabled:opacity-60"><FiShare2 /> {isSharing ? 'Sharing…' : 'Share video'}</button></div></div>}
      {pickVideo && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Recommend ${pickVideo.title}`}><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-600">Educator's pick</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">Recommend this video</h2></div><button onClick={() => setPickVideo(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close recommendation dialog"><FiX /></button></div><label className="mt-5 block text-sm font-bold text-slate-700">Why should students watch this?<textarea value={pickNote} onChange={(event) => setPickNote(event.target.value)} maxLength={300} rows={4} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 font-medium outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" placeholder="e.g. Explains the key process before students attempt a quiz." autoFocus /></label><button onClick={submitEducatorPick} disabled={!pickNote.trim() || isSavingPick} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-bold text-white shadow-lg shadow-amber-500/20 disabled:opacity-60"><FiStar /> {isSavingPick ? 'Saving…' : 'Recommend to students'}</button></div></div>}
    </div>
  );
}
