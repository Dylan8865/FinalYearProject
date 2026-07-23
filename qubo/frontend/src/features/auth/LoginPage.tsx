import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import { authService } from '@/lib/authService';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBookOpen,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
} from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'educator'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, error, setError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password, role);
      navigate('/dashboard');
    } catch (err) {
      // Error is already set in the store
    }
  };

  const openRecovery = () => {
    setError(null);
    setResetMessage('');
    setShowRecovery(true);
  };

  const closeRecovery = () => {
    setShowRecovery(false);
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage('');

    if (!email) {
      setError('Enter your email first.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const response = await authService.recoverPassword(email, newPassword, confirmPassword);
      setResetMessage(response.message);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowRecovery(false);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((item: any) => item.msg).join(', '));
      } else {
        setError(detail || 'Unable to reset password.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#75d5d8] lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_26%,rgba(198,255,255,0.72),transparent_34%),radial-gradient(circle_at_16%_14%,rgba(157,119,124,0.42),transparent_34%),linear-gradient(145deg,rgba(65,89,86,0.48),rgba(95,214,215,0.12)_48%,rgba(56,92,85,0.54))]" />
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />

        <div className="relative mx-10 w-full max-w-[480px] rounded-[34px] border border-white/20 bg-white/15 p-9 shadow-2xl shadow-teal-950/20 backdrop-blur-xl">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-lg shadow-teal-900/10">
              <FiBookOpen className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold text-white">Qubo</span>
          </div>

          <h1 className="max-w-sm text-5xl font-extrabold leading-tight tracking-normal text-white">
            Enter your academic sanctuary.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-white/80">
            A premium digital-first space where your focus thrives and complex knowledge becomes intuitive.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur">
              Editorial Design
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur">
              Advanced Analytics
            </span>
          </div>
        </div>

        <div className="absolute bottom-10 left-12 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Trusted by 200+ institutions
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-blue-500/20">
                <FiBookOpen className="h-6 w-6" />
              </span>
              <span className="text-2xl font-bold text-slate-950">Qubo</span>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              {showRecovery ? 'Account recovery' : 'Welcome back'}
            </p>
          </div>

          <div className="mb-8 hidden lg:block">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary">
              {showRecovery ? 'Account recovery' : 'Welcome back'}
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-normal text-slate-950">
              {showRecovery ? 'Reset password' : 'Log in to Qubo'}
            </h2>
            {showRecovery && (
              <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                Use your registered email address and choose a new password.
              </p>
            )}
          </div>

          {!showRecovery && (
            <div className="mb-8 rounded-full bg-slate-100 p-1.5 shadow-inner shadow-slate-200/70">
              <div className="grid grid-cols-2 gap-1">
                {(['student', 'educator'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`h-11 rounded-full text-sm font-bold capitalize transition ${
                      role === item
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <FiAlertCircle className="flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {resetMessage && (
            <div className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm text-green-700">{resetMessage}</p>
            </div>
          )}

          {!showRecovery ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-600">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="h-14 w-full rounded-none border-0 bg-slate-200/75 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-600">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={openRecovery}
                      disabled={isLoading || isResetting}
                      className="text-xs font-bold text-primary hover:text-blue-700 disabled:opacity-50"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="h-14 w-full rounded-none border-0 bg-slate-200/75 pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 h-14 w-full rounded-full bg-blue-600 font-bold text-white shadow-xl shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Logging in...' : 'Log In'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="mx-auto mt-8 flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-slate-900"
              >
                <FiShield className="h-4 w-4" />
                Administrator Access
              </button>

              <p className="mt-8 text-center text-sm font-semibold text-slate-500">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="font-extrabold text-primary hover:text-blue-700"
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <form onSubmit={handleRecoverPassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="h-14 w-full rounded-none border-0 bg-slate-200/75 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
                    required
                    disabled={isResetting}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="h-14 w-full rounded-none border-0 bg-slate-200/75 pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
                    required
                    disabled={isResetting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Confirm New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="h-14 w-full rounded-none border-0 bg-slate-200/75 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
                    required
                    disabled={isResetting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRecovery}
                  disabled={isResetting}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-slate-200 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <FiArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="h-14 w-full rounded-full bg-blue-600 font-bold text-white shadow-xl shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Contact Support</span>
          </div>
        </div>
      </main>
    </div>
  );
}
