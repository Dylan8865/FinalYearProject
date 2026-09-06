import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { authService } from '@/lib/authService';
import { SharedCollectionDetail, SharedCollectionItem } from '@/types/collection';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBookOpen,
  FiBox,
  FiCalendar,
  FiCheck,
  FiDownload,
  FiPlay,
  FiRefreshCw,
  FiUser,
} from 'react-icons/fi';
import { useQuizStore } from '@/contexts/quizStore';

const TYPE_LABEL: Record<string, string> = {
  model: '3D Model',
  video: 'Tutorial Video',
  quiz: 'Quiz',
};

const TYPE_STYLE: Record<string, { bg: string; text: string; icon: typeof FiBox }> = {
  model: { bg: 'bg-orange-50', text: 'text-orange-600', icon: FiBox },
  video: { bg: 'bg-blue-50', text: 'text-blue-600', icon: FiPlay },
  quiz: { bg: 'bg-violet-50', text: 'text-violet-600', icon: FiBookOpen },
};

function getYouTubeVideoId(url?: string | null) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    return parsed.searchParams.get('v') || parsed.pathname.split('/embed/')[1] || '';
  } catch {
    return '';
  }
}

export default function SharedCollectionPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const setGeneratedQuiz = useQuizStore((state) => state.setGeneratedQuiz);
  const setSavedQuizId = useQuizStore((state) => state.setSavedQuizId);

  const [detail, setDetail] = useState<SharedCollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingQuizId, setSavingQuizId] = useState<string | null>(null);
  const [savedQuizIds, setSavedQuizIds] = useState<Set<string>>(new Set());
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  const load = useCallback(async () => {
    if (!collectionId) return;
    setIsLoading(true);
    setError('');
    try {
      setDetail(await authService.getSharedCollectionDetail(collectionId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not load this collection.');
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openItem = (item: SharedCollectionItem) => {
    if (item.item_type === 'model') {
      navigate(`/models/${item.target_id}`);
    } else if (item.item_type === 'video') {
      navigate(`/tutorials?video=${item.target_id}`);
    }
  };

  const saveQuiz = async (item: SharedCollectionItem) => {
    if (!collectionId) return;
    setSavingQuizId(item.target_id);
    setSaveMessage('');
    try {
      const result = await authService.saveSharedQuizToLibrary(collectionId, item.target_id);
      setSavedQuizIds((current) => new Set(current).add(item.target_id));
      setSaveMessage(result.message);
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err: any) {
      setSaveMessage(err.response?.data?.detail || 'Could not save this quiz.');
      setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setSavingQuizId(null);
    }
  };

  const startQuiz = async (item: SharedCollectionItem) => {
    setStartingQuizId(item.target_id);
    try {
      const quiz = await authService.getSavedQuiz(item.target_id);
      setGeneratedQuiz(quiz);
      setSavedQuizId(item.target_id);
      navigate('/quiz/session');
    } catch (err: any) {
      setSaveMessage(err.response?.data?.detail || 'Could not start this quiz.');
      setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setStartingQuizId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));

  // Group items by type
  const groups = detail
    ? (['model', 'video', 'quiz'] as const)
        .map((type) => ({
          type,
          items: detail.items.filter((item) => item.item_type === type),
        }))
        .filter((group) => group.items.length > 0)
    : [];

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr] lg:grid-rows-[auto_1fr]">
      <AppSidebar />

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 lg:py-10">
          {/* Back button */}
          <button
            onClick={() => navigate('/learning')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to My Learning
          </button>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-10 w-2/3 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-5 w-1/3 animate-pulse rounded-lg bg-slate-200" />
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200" />
                ))}
              </div>
            </div>
          ) : error ? (
            <section className="flex min-h-[330px] flex-col items-center justify-center rounded-[30px] border border-red-100 bg-white px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <FiAlertCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">{error}</h3>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
              >
                <FiRefreshCw className="h-4 w-4" />
                Try again
              </button>
            </section>
          ) : detail ? (
            <>
              {/* Collection header */}
              <header>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                  Shared collection
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
                  {detail.title}
                </h1>
                {detail.description && (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                    {detail.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <FiUser className="h-4 w-4 text-primary" />
                    {detail.educator_name}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FiCalendar className="h-4 w-4" />
                    Shared {formatDate(detail.shared_at)}
                  </span>
                  {detail.due_at && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-700">
                      <FiCalendar className="h-3.5 w-3.5" />
                      Due {formatDate(detail.due_at)}
                    </span>
                  )}
                </div>
                {detail.message && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-3.5 text-sm font-medium text-slate-600">
                    <span className="font-bold text-primary">Message:</span> {detail.message}
                  </div>
                )}
              </header>

              {/* Toast for save actions */}
              {saveMessage && (
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                  {saveMessage}
                </div>
              )}

              {/* Content grouped by type */}
              <div className="mt-8 space-y-10">
                {groups.map(({ type, items }) => {
                  const style = TYPE_STYLE[type] || TYPE_STYLE.model;
                  const Icon = style.icon;
                  return (
                    <section key={type}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.bg} ${style.text}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-950">
                          {TYPE_LABEL[type] || type}s
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {items.length}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                          <article
                            key={item.collection_item_id}
                            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                          >
                            {/* Thumbnail area */}
                            <div className="mb-4 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                              {item.item_type === 'video' && getYouTubeVideoId(item.youtube_url) ? (
                                <img
                                  src={`https://img.youtube.com/vi/${getYouTubeVideoId(item.youtube_url)}/hqdefault.jpg`}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className={`${style.text}`}>
                                  <Icon className="h-10 w-10 opacity-40" />
                                </div>
                              )}
                            </div>

                            <h3 className="line-clamp-2 text-base font-extrabold text-slate-900">
                              {item.title}
                            </h3>
                            {item.subject_name && (
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {item.subject_name}
                              </p>
                            )}

                            {/* Actions */}
                            <div className="mt-auto pt-4">
                              {item.item_type === 'quiz' ? (
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void startQuiz(item)}
                                    disabled={!!startingQuizId || item.title === 'Unavailable item'}
                                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-45 disabled:cursor-not-allowed"
                                  >
                                    <FiPlay className="h-3.5 w-3.5" />
                                    {startingQuizId === item.target_id ? 'Loading…' : 'Start'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void saveQuiz(item)}
                                    disabled={!!savingQuizId || savedQuizIds.has(item.target_id) || item.title === 'Unavailable item'}
                                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-45 disabled:cursor-not-allowed"
                                  >
                                    {savedQuizIds.has(item.target_id) ? (
                                      <>
                                        <FiCheck className="h-3.5 w-3.5 text-emerald-600" />
                                        Saved
                                      </>
                                    ) : savingQuizId === item.target_id ? (
                                      'Saving…'
                                    ) : (
                                      <>
                                        <FiDownload className="h-3.5 w-3.5" />
                                        Save
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openItem(item)}
                                  disabled={item.title === 'Unavailable item'}
                                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-45 disabled:cursor-not-allowed"
                                >
                                  {item.item_type === 'model' ? (
                                    <>
                                      <FiBox className="h-3.5 w-3.5" />
                                      Explore 3D Model
                                    </>
                                  ) : (
                                    <>
                                      <FiPlay className="h-3.5 w-3.5" />
                                      Watch Video
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
