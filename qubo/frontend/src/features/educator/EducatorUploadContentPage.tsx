import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { FiBox, FiCheckCircle, FiChevronDown, FiLink, FiUploadCloud, FiVideo } from 'react-icons/fi';
import { Navigate, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import { Subject } from '@/types/auth';

type AssetType = 'Video' | '3D Model';

const assetOptions: { value: AssetType; icon: typeof FiVideo; description: string }[] = [
  { value: 'Video', icon: FiVideo, description: 'Add a hosted video lesson URL.' },
  { value: '3D Model', icon: FiBox, description: 'Prepare an interactive model resource.' },
];

export default function EducatorUploadContentPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [assetType, setAssetType] = useState<AssetType>('Video');
  const [subject, setSubject] = useState('Physics');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAsset = useMemo(() => assetOptions.find((item) => item.value === assetType)!, [assetType]);

  useEffect(() => {
    let active = true;
    void authService.getSubjects().then((databaseSubjects) => {
      if (!active || !databaseSubjects.length) return;
      setSubjects(databaseSubjects);
      setSubject((current) => databaseSubjects.some((item) => item.subject_name === current) ? current : databaseSubjects[0].subject_name);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  if (user?.role !== 'educator') return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice('');
    setError('');
    if (assetType === '3D Model' && !modelFile) {
      setError('Select a .glb 3D model before publishing.');
      return;
    }
    setIsPublishing(true);
    try {
      if (assetType === 'Video') {
        await authService.createTutorialVideo({ title, youtube_url: url, subject_tag: subject });
        setNotice('Video published successfully. It is now available in the learning resource library.');
      } else if (modelFile) {
        const created = await authService.uploadThreeDModel({ title, subject_name: subject, topic_name: topic || undefined, visibility, model: modelFile });
        navigate(`/models/${created.resource_id}?annotate=1`);
        return;
      }
      setTitle(''); setUrl(''); setTopic(''); setModelFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || 'The resource could not be published. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="min-w-0">
        <header className="flex min-h-[64px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur md:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">Educator workspace</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Upload Content</h1>
          </div>
          <span className="hidden rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-primary sm:inline-flex">Educator tools</span>
        </header>

        <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">New resource asset</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Bring a lesson into Qubo</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Publish videos and 3D models directly to the educator resource library.</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {assetOptions.map(({ value, icon: Icon, description }) => (
                  <button key={value} type="button" onClick={() => setAssetType(value)} className={`rounded-2xl border p-4 text-left transition ${assetType === value ? 'border-primary bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'}`}>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${assetType === value ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-5 w-5" /></span>
                    <p className="mt-4 font-extrabold">{value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-700">Resource title</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="e.g. Acid and Alkali Revision" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-primary focus:bg-white" />
                </label>
                {assetType === 'Video' && <label className="md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-700">YouTube URL</span>
                  <span className="relative block"><FiLink className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={url} onChange={(event) => setUrl(event.target.value)} required placeholder="https://youtube.com/watch?v=..." className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-primary focus:bg-white" /></span>
                </label>}
                {assetType === '3D Model' && <><label className="md:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">GLB model file</span><input ref={fileInputRef} type="file" accept=".glb,model/gltf-binary,application/octet-stream" required onChange={(event) => setModelFile(event.target.files?.[0] || null)} className="block w-full rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-bold file:text-white" />{modelFile && <p className="mt-2 text-xs font-semibold text-emerald-700">Selected: {modelFile.name}</p>}</label><label className="md:col-span-2"><span className="mb-2 block text-sm font-bold text-slate-700">Topic (optional)</span><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Cell structure" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-primary focus:bg-white" /></label></>}
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">Subject</span>
                  <span className="relative block"><select value={subject} onChange={(event) => setSubject(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-primary focus:bg-white">{subjects.length ? subjects.map((item) => <option key={item.id} value={item.subject_name}>{item.subject_name}</option>) : <option value={subject}>{subject}</option>}</select><FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></span>
                </label>
                {assetType === '3D Model' && <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">Visibility</span>
                  <span className="relative block"><select value={visibility} onChange={(event) => setVisibility(event.target.value as 'public' | 'private')} className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition focus:border-primary focus:bg-white"><option value="public">Public — visible to everyone</option><option value="private">Private — only me</option></select><FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></span>
                </label>}
                <div>
                  <span className="mb-2 block text-sm font-bold text-slate-700">Asset type</span>
                  <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700">{selectedAsset.value}</div>
                </div>
              </div>

              {notice && <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><FiCheckCircle className="mt-0.5 h-5 w-5 flex-none" />{notice}</div>}
              {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}
              <div className="mt-8 flex flex-wrap gap-3"><button disabled={isPublishing} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"><FiUploadCloud />{isPublishing ? 'Publishing…' : 'Publish resource'}</button><button type="button" onClick={() => { setTitle(''); setUrl(''); setTopic(''); setModelFile(null); setNotice(''); setError(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Clear form</button></div>
            </form>

            <aside className="rounded-[28px] bg-[#0f2f65] p-6 text-white shadow-[0_18px_40px_rgba(29,78,216,0.22)] md:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><selectedAsset.icon className="h-6 w-6" /></span>
              <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-100">Content workflow</p>
              <h2 className="mt-2 text-2xl font-extrabold">Build lessons your students can revisit.</h2>
              <ol className="mt-7 space-y-5 text-sm text-blue-100"><li><span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-extrabold text-primary">1</span>Add core resource information</li><li><span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-extrabold text-primary">2</span>Review it in your collection</li><li><span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-extrabold text-primary">3</span>Share a finished learning pack</li></ol>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
