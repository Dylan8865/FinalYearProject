import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiMail, FiShield } from 'react-icons/fi';
import { useAuthStore } from '@/contexts/authStore';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password, 'admin');
      navigate('/admin/content', { replace: true });
    } catch { /* Store renders the API error. */ }
  };

  return <main className="flex min-h-screen items-center justify-center bg-[#f4f8ff] p-5 text-slate-950">
    <section className="w-full max-w-md rounded-[30px] border border-white bg-white p-7 shadow-2xl shadow-blue-950/10 sm:p-10">
      <button onClick={() => navigate('/login')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary"><FiArrowLeft />Return to Qubo</button>
      <div className="mt-8 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary"><FiShield className="h-6 w-6" /></span><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.24em] text-primary">Institutional security</p><h1 className="mt-3 text-2xl font-extrabold">Qubo Admin</h1><p className="mt-2 text-sm leading-6 text-slate-500">Restricted access for authorized administrators only.</p></div>
      {error && <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
      <form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-bold text-slate-700">Admin email<div className="relative mt-2"><FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl bg-slate-100 pl-11 pr-3 font-medium outline-none ring-primary focus:ring-2" /></div></label><label className="block text-sm font-bold text-slate-700">Password<div className="relative mt-2"><FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl bg-slate-100 pl-11 pr-3 font-medium outline-none ring-primary focus:ring-2" /></div></label><button disabled={isLoading} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60"><FiShield />{isLoading ? 'Securing access…' : 'Secure Login'}</button></form>
    </section>
  </main>;
}
