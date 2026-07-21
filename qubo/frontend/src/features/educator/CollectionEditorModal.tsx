import { useEffect, useMemo, useState } from 'react';
import { FiBox, FiCheck, FiFileText, FiLoader, FiPlus, FiTrash2, FiVideo, FiX } from 'react-icons/fi';
import { authService } from '@/lib/authService';
import { CollectionContentOption, CollectionItem, CollectionItemType, EducatorCollection } from '@/types/collection';

interface CollectionEditorModalProps {
  collection: EducatorCollection;
  onClose: () => void;
  onChanged: () => void;
}

const typeLabel: Record<CollectionItemType, string> = {
  model: '3D model',
  video: 'Video',
  quiz: 'Quiz',
};

const typeIcon: Record<CollectionItemType, typeof FiBox> = {
  model: FiBox,
  video: FiVideo,
  quiz: FiFileText,
};

export default function CollectionEditorModal({ collection, onClose, onChanged }: CollectionEditorModalProps) {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [options, setOptions] = useState<CollectionContentOption[]>([]);
  const [filter, setFilter] = useState<'all' | CollectionItemType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingKey, setPendingKey] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [editor, available] = await Promise.all([
        authService.getCollectionEditor(collection.collection_id),
        authService.getCollectionContentOptions(),
      ]);
      setItems(editor.items);
      setOptions(available);
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'The collection editor could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, [collection.collection_id]);

  const included = useMemo(() => new Set(items.map((item) => `${item.item_type}:${item.target_id}`)), [items]);
  const shownOptions = useMemo(
    () => options.filter((option) => filter === 'all' || option.item_type === filter),
    [filter, options],
  );

  const add = async (option: CollectionContentOption) => {
    const key = `${option.item_type}:${option.target_id}`;
    setPendingKey(key);
    setError('');
    try {
      await authService.addCollectionItem(collection.collection_id, {
        item_type: option.item_type,
        target_id: option.target_id,
        sort_order: items.length,
      });
      await load();
      onChanged();
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'This item could not be added.');
    } finally {
      setPendingKey('');
    }
  };

  const remove = async (item: CollectionItem) => {
    setPendingKey(item.collection_item_id);
    setError('');
    try {
      await authService.removeCollectionItem(collection.collection_id, item.collection_item_id);
      await load();
      onChanged();
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'This item could not be removed.');
    } finally {
      setPendingKey('');
    }
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 sm:p-8">
    <section className="mx-auto my-4 w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
      <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-6 py-5 md:px-8">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Collection editor</p><h2 className="mt-1 text-2xl font-extrabold">{collection.title}</h2><p className="mt-2 text-sm text-slate-500">Mix your own 3D models, videos and quizzes before sharing this learning pack.</p></div>
        <button onClick={onClose} aria-label="Close collection editor" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><FiX className="h-5 w-5" /></button>
      </header>
      {error && <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800 md:mx-8">{error}</div>}
      <div className="grid gap-0 lg:grid-cols-2">
        <section className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r md:p-8">
          <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">In this collection</p><h3 className="mt-1 text-lg font-extrabold">{items.length} learning item{items.length === 1 ? '' : 's'}</h3></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">Draft</span></div>
          <div className="mt-5 space-y-3">{isLoading ? <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500"><FiLoader className="animate-spin" />Loading your collection…</div> : items.length ? items.map((item, index) => { const Icon = typeIcon[item.item_type]; return <article key={item.collection_item_id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-primary">{index + 1}</span><Icon className="shrink-0 text-slate-400" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{item.title}</p><p className="mt-0.5 text-xs text-slate-500">{typeLabel[item.item_type]}{item.subject_name ? ` · ${item.subject_name}` : ''}</p></div><button disabled={pendingKey === item.collection_item_id} onClick={() => void remove(item)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50" title="Remove from collection">{pendingKey === item.collection_item_id ? <FiLoader className="animate-spin" /> : <FiTrash2 />}</button></article>; }) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">Add resources from the library on the right.</div>}</div>
        </section>
        <section className="p-6 md:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Your content library</p><h3 className="mt-1 text-lg font-extrabold">Add uploaded teaching content</h3><div className="mt-4 flex flex-wrap gap-2">{(['all', 'model', 'video', 'quiz'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl px-3 py-2 text-xs font-bold ${filter === item ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item === 'all' ? 'All content' : typeLabel[item]}</button>)}</div><div className="mt-5 max-h-[390px] space-y-3 overflow-y-auto pr-1">{isLoading ? <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500"><FiLoader className="animate-spin" />Loading your content…</div> : shownOptions.length ? shownOptions.map((option) => { const Icon = typeIcon[option.item_type]; const key = `${option.item_type}:${option.target_id}`; const exists = included.has(key); return <article key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"><span className="rounded-xl bg-slate-50 p-2.5 text-slate-500"><Icon /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{option.title}</p><p className="mt-0.5 text-xs text-slate-500">{typeLabel[option.item_type]}{option.subject_name ? ` · ${option.subject_name}` : ''}</p></div><button disabled={exists || pendingKey === key} onClick={() => void add(option)} className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold disabled:cursor-not-allowed ${exists ? 'bg-emerald-50 text-emerald-700' : 'bg-primary text-white hover:bg-blue-700'} disabled:opacity-70`}>{pendingKey === key ? <FiLoader className="animate-spin" /> : exists ? <FiCheck /> : <FiPlus />}{exists ? 'Added' : 'Add'}</button></article>; }) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">No {filter === 'all' ? '' : typeLabel[filter].toLowerCase()} content uploaded yet. Use Upload Content first.</div>}</div></section>
      </div>
      <footer className="flex justify-end border-t border-slate-200 px-6 py-4 md:px-8"><button onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Done</button></footer>
    </section>
  </div>;
}
