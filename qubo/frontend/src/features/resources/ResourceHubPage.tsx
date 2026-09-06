import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { EducatorRecommendation, LearningRecommendation } from '@/types/resource';
import ModelThumbnail from './ModelThumbnail';
import { FiArrowRight, FiBookmark, FiBox, FiChevronLeft, FiChevronRight, FiClock, FiHeart, FiPlay, FiSearch, FiStar, FiZap } from 'react-icons/fi';

const favouriteKey = (targetType: 'model' | 'video', targetId: string) => `${targetType}:${targetId}`;

const getYouTubeVideoId = (url?: string | null) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    return parsed.searchParams.get('v') || parsed.pathname.split('/embed/')[1] || '';
  } catch { return ''; }
};

export default function ResourceHubPage() {
  const navigate = useNavigate();
  const [educatorPicks, setEducatorPicks] = useState<EducatorRecommendation[]>([]);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [recommendation, setRecommendation] = useState<LearningRecommendation | null>(null);
  const [showRecommendation, setShowRecommendation] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [educatorPicks]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setShowRecommendation(localStorage.getItem('qubo-recommendation-dismissed') !== new Date().toDateString());
    Promise.all([authService.getEducatorPicks(), authService.getFavourites(), authService.getModelRecommendation()])
      .then(([picks, favourites, nextStep]) => {
        setEducatorPicks(picks);
        setFavouriteIds(new Set(favourites.map((item) => favouriteKey(item.target_type, item.target_id))));
        setRecommendation(nextStep);
      })
      .catch(() => undefined);
  }, []);

  const toggleFavourite = async (targetType: 'model' | 'video', targetId: string) => {
    const key = favouriteKey(targetType, targetId);
    const wasSaved = favouriteIds.has(key);
    setFavouriteIds((current) => { const next = new Set(current); wasSaved ? next.delete(key) : next.add(key); return next; });
    try {
      if (wasSaved) await authService.removeFavourite(targetType, targetId);
      else await authService.saveFavourite(targetType, targetId);
    } catch {
      setFavouriteIds((current) => { const next = new Set(current); wasSaved ? next.add(key) : next.delete(key); return next; });
    }
  };

  const openTarget = (targetType: 'model' | 'video', targetId: string) => {
    navigate(targetType === 'model' ? `/models/${targetId}` : `/tutorials?video=${targetId}`);
  };

  const dismissRecommendation = () => {
    localStorage.setItem('qubo-recommendation-dismissed', new Date().toDateString());
    setShowRecommendation(false);
  };

  return <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
    <AppSidebar />
    <div className="min-w-0">
      <header className="sticky top-16 z-20 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <label className="flex h-11 w-full max-w-md items-center gap-3 rounded-full bg-slate-100 px-4 text-slate-400"><FiSearch className="h-4 w-4" /><input placeholder="Search resources, topics, or subjects" onFocus={() => navigate('/resources/explore')} className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none" /></label>
          <div className="text-right"><p className="text-sm font-extrabold text-slate-900">Learning resources</p><p className="text-xs font-medium text-slate-500">SPM resource collection</p></div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl space-y-10 px-5 py-8 md:px-8 lg:py-10">
        <section><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Learning hub</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Educational Resources</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">Explore video lessons and interactive 3D models for clearer, more memorable SPM learning.</p></section>

        <section className="grid gap-6 xl:grid-cols-2">
          <button onClick={() => navigate('/tutorials')} className="rounded-[28px] border-4 border-slate-100 bg-white p-7 text-left shadow-sm transition hover:shadow-lg"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary"><FiPlay className="h-6 w-6" /></span><h2 className="mt-7 text-2xl font-extrabold">Video Tutorials</h2><p className="mt-3 text-sm leading-6 text-slate-500">Watch focused video explanations from trusted educators.</p><span className="mt-7 inline-flex items-center gap-2 font-bold text-primary">Browse Videos <FiArrowRight /></span></button>
          <button onClick={() => navigate('/models')} className="rounded-[28px] border-4 border-slate-100 bg-white p-7 text-left shadow-sm transition hover:shadow-lg"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><FiBox className="h-6 w-6" /></span><h2 className="mt-7 text-2xl font-extrabold">Interactive 3D Models</h2><p className="mt-3 text-sm leading-6 text-slate-500">Rotate and inspect interactive science models.</p><span className="mt-7 inline-flex items-center gap-2 font-bold text-primary">Explore 3D <FiArrowRight /></span></button>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-600">Educator's picks</p><h2 className="mt-2 text-2xl font-extrabold">Recommended for meaningful revision</h2><p className="mt-1 text-sm text-slate-500">Resources personally selected by Qubo educators, with a teaching reason.</p></div><button onClick={() => navigate('/resources/explore')} className="inline-flex items-center gap-1 text-sm font-bold text-primary">Explore resources <FiChevronRight /></button></div>
          {educatorPicks.length > 0 ? <div className="group relative mt-6">{canScrollLeft && <button onClick={() => scroll('left')} className="absolute -left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition hover:scale-105 hover:bg-slate-50 hover:text-primary group-hover:flex" aria-label="Scroll left"><FiChevronLeft className="h-6 w-6" /></button>}{canScrollRight && <button onClick={() => scroll('right')} className="absolute -right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition hover:scale-105 hover:bg-slate-50 hover:text-primary group-hover:flex" aria-label="Scroll right"><FiChevronRight className="h-6 w-6" /></button>}<div ref={scrollContainerRef} onScroll={updateScrollButtons} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{educatorPicks.map((pick) => <article key={pick.recommendation_id} className="w-[340px] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><button onClick={() => openTarget(pick.target_type, pick.target_id)} className="block aspect-video w-full overflow-hidden bg-slate-100">{pick.target_type === 'model' && pick.preview_model_url ? <ModelThumbnail modelUrl={pick.preview_model_url} title={pick.title} /> : <img src={`https://img.youtube.com/vi/${getYouTubeVideoId(pick.youtube_url)}/hqdefault.jpg`} alt={`${pick.title} video preview`} className="h-full w-full object-cover" />}</button><div className="flex h-[170px] flex-col p-5"><div className="flex items-start gap-3"><button onClick={() => openTarget(pick.target_type, pick.target_id)} className="min-w-0 flex-1 text-left"><p className="truncate font-extrabold text-slate-950">{pick.title}</p><p className="mt-1 text-sm text-slate-500">{pick.subject_name || 'SPM learning'} · {pick.target_type === 'model' ? '3D model' : 'Video lesson'}</p></button><button onClick={() => toggleFavourite(pick.target_type, pick.target_id)} aria-label={`Save ${pick.title}`} className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${favouriteIds.has(favouriteKey(pick.target_type, pick.target_id)) ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500 hover:text-rose-500'}`}><FiHeart className={favouriteIds.has(favouriteKey(pick.target_type, pick.target_id)) ? 'fill-current' : ''} /></button></div><div className="mt-auto rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-950"><p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-700"><FiStar /> {pick.educator_name} recommends</p><p className="mt-1.5 line-clamp-2">{pick.note}</p></div></div></article>)}</div></div> : <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><FiStar className="mx-auto h-8 w-8 text-amber-400" /><p className="mt-3 font-extrabold text-slate-800">Educator picks are coming soon</p><p className="mt-1 text-sm text-slate-500">Educators can recommend their best resources with a short learning reason.</p></div>}
        </section>

        {recommendation && showRecommendation && <section className="overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-sm"><div className="grid md:grid-cols-[260px_1fr]"><div className="min-h-48 bg-slate-100">{recommendation.target_type === 'model' && recommendation.preview_model_url ? <ModelThumbnail modelUrl={recommendation.preview_model_url} title={recommendation.title} /> : <img src={`https://img.youtube.com/vi/${getYouTubeVideoId(recommendation.youtube_url)}/hqdefault.jpg`} alt={`${recommendation.title} preview`} className="h-full w-full object-cover" />}</div><div className="p-6 md:p-7"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary"><FiZap /> Next step for {recommendation.subject_name || 'your learning'}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"><FiClock /> {recommendation.estimated_minutes} min · {recommendation.target_type === 'model' ? 'Visual model' : 'Video lesson'}</span></div><h2 className="mt-4 text-2xl font-extrabold text-slate-950">{recommendation.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{recommendation.reason}</p><div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900"><span className="font-extrabold">Learning goal: </span>{recommendation.learning_goal}</div><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => openTarget(recommendation.target_type, recommendation.target_id)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">{recommendation.target_type === 'model' ? 'Explore model' : 'Watch lesson'} <FiArrowRight /></button><button onClick={() => toggleFavourite(recommendation.target_type, recommendation.target_id)} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${favouriteIds.has(favouriteKey(recommendation.target_type, recommendation.target_id)) ? 'border-rose-100 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><FiBookmark className={favouriteIds.has(favouriteKey(recommendation.target_type, recommendation.target_id)) ? 'fill-current' : ''} />{favouriteIds.has(favouriteKey(recommendation.target_type, recommendation.target_id)) ? 'Saved' : 'Save for later'}</button><button onClick={dismissRecommendation} className="rounded-xl px-3 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100">Not now</button></div></div></div></section>}
      </main>
    </div>
  </div>;
}
