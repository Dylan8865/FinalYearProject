import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
} from "react-icons/fi";

import { authService } from "@/lib/authService";
import { supabaseRecovery } from "@/lib/supabaseRecovery";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;
    const { data } = supabaseRecovery.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session && mounted) {
          setRecoveryToken(session.access_token);
        }
      },
    );

    void supabaseRecovery.auth.getSession().then(({ data: sessionData }) => {
      if (mounted && sessionData.session) {
        setRecoveryToken(sessionData.session.access_token);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!recoveryToken) {
      setError(
        "This reset link has expired or is invalid. Request a new link.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await authService.completePasswordReset(
        recoveryToken,
        newPassword,
      );
      await supabaseRecovery.auth.signOut();
      authService.clearSession();
      setSuccess(response.message);
      window.setTimeout(() => navigate(`/login?message=${encodeURIComponent(response.message)}`, { replace: true }), 1800);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.detail ||
          "This reset link has expired or is invalid. Request a new link.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-[440px] rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/60 sm:p-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
          Account recovery
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-950">
          Choose a new password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This link is one-time only. For security, signing in again will be
          required on all devices.
        </p>

        {error && (
          <div className="mt-6 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-6 flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <FiCheckCircle className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              New password
            </span>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-14 w-full rounded-xl border border-slate-200 pl-12 pr-12 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="At least 8 characters"
                required
                disabled={isSaving || Boolean(success)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Confirm new password
            </span>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-14 w-full rounded-xl border border-slate-200 pl-12 pr-4 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Repeat new password"
                required
                disabled={isSaving || Boolean(success)}
              />
            </div>
          </label>
          <p className="text-xs leading-5 text-slate-500">
            Use upper- and lower-case letters, a number, and a special
            character.
          </p>
          <button
            type="submit"
            disabled={isSaving || Boolean(success)}
            className="h-14 w-full rounded-full bg-primary font-bold text-white shadow-xl shadow-blue-500/25 transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Updating password..." : "Update password"}
          </button>
        </form>

        <button
          onClick={() => navigate("/login")}
          className="mt-6 w-full text-sm font-bold text-primary hover:text-blue-700"
        >
          Back to login
        </button>
      </section>
    </main>
  );
}
