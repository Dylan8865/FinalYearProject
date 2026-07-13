import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/contexts/authStore';
import { FiAlertCircle, FiBookOpen, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
    role: 'student' as 'student' | 'educator',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register, isLoading, error, setError } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.full_name)) {
      newErrors.full_name = 'Full name must contain only letters and spaces';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.username,
        formData.full_name,
        formData.role
      );
      navigate(formData.role === 'educator' ? '/dashboard' : '/learning-style-assessment');
    } catch (err) {
      // Error is already set in the store
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
            Start your learning journey.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-white/80">
            Build your account, choose your role, and personalize the experience for SPM mastery.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur">
              Student first
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur">
              Educator tools
            </span>
          </div>
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[460px]">
          <div className="mb-8 hidden lg:block">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary">Create account</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-normal text-slate-950">Register to Qubo</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
              Create your account in one step, then personalize your learning profile.
            </p>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-8">
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                <FiAlertCircle className="flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@university.edu"
                    className="h-14 w-full rounded-none border-0 bg-slate-200/75 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="username"
                    className="h-14 w-full rounded-none border-0 bg-slate-200/75 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                </div>
                {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="h-14 w-full rounded-none border-0 bg-slate-200/75 px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
                {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="h-14 w-full rounded-none border-0 bg-slate-200/75 pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
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
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Confirm Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="h-14 w-full rounded-none border-0 bg-slate-200/75 pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">Account Type</label>
                <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1.5 shadow-inner shadow-slate-200/70">
                  {(['student', 'educator'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, role: item }))}
                      className={`h-11 rounded-full text-sm font-bold capitalize transition ${
                        formData.role === item
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 h-14 w-full rounded-full bg-blue-600 font-bold text-white shadow-xl shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating account...' : 'Register'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="font-semibold text-primary hover:underline">
                Login
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
