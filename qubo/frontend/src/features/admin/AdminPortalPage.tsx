import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiBarChart2,
  FiBookOpen,
  FiFileText,
  FiLogOut,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { authService } from "@/lib/authService";
import { useAuthStore } from "@/contexts/authStore";

type Section = "content" | "analytics" | "users" | "audit-logs";
const nav: Array<{ id: Section; label: string; icon: typeof FiBookOpen }> = [
  { id: "content", label: "Content", icon: FiBookOpen },
  { id: "analytics", label: "Analytics", icon: FiBarChart2 },
  { id: "users", label: "User Security", icon: FiUsers },
  { id: "audit-logs", label: "Audit Logs", icon: FiFileText },
];

const label = (value: string) => value.replace(/_/g, " ");

export default function AdminPortalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const section = (location.pathname.split("/")[2] || "content") as Section;
  const [contentType, setContentType] = useState<"video" | "model">("video");
  const [content, setContent] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      if (section === "content") {
        const [contentResult, analyticsResult] = await Promise.allSettled([
          authService.getAdminContent(contentType),
          authService.getAdminAnalytics(),
        ]);

        if (contentResult.status === "rejected") throw contentResult.reason;
        setContent(contentResult.value);
        if (analyticsResult.status === "fulfilled") {
          setAnalytics(analyticsResult.value);
        }
      }
      if (section === "analytics")
        setAnalytics(await authService.getAdminAnalytics());
      if (section === "users")
        setUsers(await authService.getAdminUsers(search));
      if (section === "audit-logs")
        setLogs(await authService.getAdminAuditLogs());
    } catch (error: any) {
      setMessage(
        error.response?.data?.detail || "Admin data could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [section, contentType]); // eslint-disable-line react-hooks/exhaustive-deps -- search is submitted explicitly

  const removeContent = async (item: any) => {
    if (!window.confirm(`Delete “${item.title}” permanently?`)) return;
    try {
      await authService.deleteAdminContent(item.type, item.id);
      setMessage("Content deleted.");
      await load();
    } catch (error: any) {
      setMessage(
        error.response?.data?.detail || "Content could not be deleted.",
      );
    }
  };

  const userAction = async (target: any, action: "active" | "delete") => {
    try {
      if (action === "active") {
        const nextActiveState = !target.is_active;
        if (
          !window.confirm(
            nextActiveState
              ? `Activate ${target.email}? They can sign in again.`
              : `Deactivate ${target.email}? Their current Qubo session will be ended.`,
          )
        )
          return;
        await authService.setAdminUserActiveStatus(
          target.id,
          nextActiveState,
          "Administrator account status action",
        );
      }
      if (action === "delete") {
        if (
          !window.confirm(
            `Delete ${target.email} and all owned data permanently?`,
          )
        )
          return;
        await authService.deleteAdminUser(target.id);
      }
      setMessage("Security action completed.");
      await load();
    } catch (error: any) {
      setMessage(error.response?.data?.detail || "Security action failed.");
    }
  };

  const logoutAdmin = async () => {
    await logout();
    navigate("/admin/login");
  };
  const counts = useMemo(() => analytics?.accounts || {}, [analytics]);

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-950 lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="flex min-h-screen flex-col border-r border-slate-200 bg-white p-5">
        <div className="px-2">
          <p className="text-xl font-extrabold text-primary">Qubo Admin</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Security & Data Portal
          </p>
        </div>
        <div className="mt-7 rounded-2xl bg-slate-50 p-3">
          <p className="font-bold">{user?.full_name || "Administrator"}</p>
          <p className="mt-1 text-xs text-slate-500">System Administrator</p>
        </div>
        <nav className="mt-7 space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/admin/${item.id}`)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${active ? "bg-blue-50 text-primary shadow-[inset_-3px_0_0_#2563eb]" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
        </nav>
        <button
          onClick={logoutAdmin}
          className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
        >
          <FiLogOut />
          Log out
        </button>
      </aside>
      <main className="min-w-0 p-5 md:p-8">
        <header className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
              Administrative suite
            </p>
            <h1 className="mt-1 text-3xl font-extrabold">
              {section === "content"
                ? "Content Management"
                : section === "analytics"
                  ? "Analytics Dashboard"
                  : section === "users"
                    ? "Registered Users"
                    : "Audit Logs"}
            </h1>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-primary">
            <FiShield className="mr-1 inline" />
            Admin only
          </span>
        </header>
        {message && (
          <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
            {message}
          </p>
        )}
        {section === "content" && (
          <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="flex gap-2">
                <button
                  onClick={() => setContentType("video")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${contentType === "video" ? "bg-primary text-white" : "bg-white text-slate-500"}`}
                >
                  Videos
                </button>
                <button
                  onClick={() => setContentType("model")}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${contentType === "model" ? "bg-primary text-white" : "bg-white text-slate-500"}`}
                >
                  3D Models
                </button>
              </div>
              <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <p className="font-extrabold text-slate-900">
                  Educator-owned publishing
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Videos and 3D models are published from the Educator Upload
                  Content workspace. Administrators can review all published
                  {contentType === "video" ? " videos" : " 3D models"}, verify
                  ownership, and remove unsuitable content.
                </p>
              </div>
              <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 font-extrabold">
                  Manage published resources
                </div>
                {isLoading ? (
                  <p className="p-5 text-sm text-slate-500">Loading…</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {content.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-5"
                      >
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.subject_name || "Uncategorised"} ·{" "}
                            {item.owner_name} · {item.recommendation_count}{" "}
                            educator recommendations
                          </p>
                        </div>
                        <button
                          onClick={() => void removeContent(item)}
                          className="rounded-lg bg-rose-50 p-2 text-rose-600"
                          title="Delete resource"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <aside className="rounded-3xl bg-[#0756d8] p-6 text-white">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-100">
                Quick insights
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/15 p-4">
                  <p className="text-2xl font-extrabold">
                    {analytics?.total_videos ?? "—"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-blue-100">Videos</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-4">
                  <p className="text-2xl font-extrabold">
                    {analytics?.total_models ?? "—"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-blue-100">
                    3D models
                  </p>
                </div>
              </div>
            </aside>
          </section>
        )}
        {section === "analytics" && (
          <section className="mt-7">
            {isLoading ? (
              <p>Loading…</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    ["Internal views", analytics?.total_internal_views],
                    ["Students", counts.student || 0],
                    ["Educators", counts.educator || 0],
                    ["Inactive", analytics?.inactive_accounts],
                  ].map(([name, value]) => (
                    <article
                      key={String(name)}
                      className="rounded-2xl bg-white p-5 shadow-sm"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {name}
                      </p>
                      <p className="mt-2 text-3xl font-extrabold text-primary">
                        {value ?? 0}
                      </p>
                    </article>
                  ))}
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <article className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="font-extrabold">
                      Most educator-recommended
                    </h2>
                    <div className="mt-4 space-y-3">
                      {(analytics?.most_recommended || []).map((item: any) => (
                        <div
                          key={item.content_id}
                          className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"
                        >
                          <span className="font-bold">{item.label}</span>
                          <span className="text-primary">
                            {item.count} recommendations
                          </span>
                        </div>
                      )) || <p>No recommendations yet.</p>}
                    </div>
                  </article>
                  <article className="rounded-3xl bg-white p-6 shadow-sm">
                    <h2 className="font-extrabold">Subject distribution</h2>
                    <div className="mt-4 space-y-3">
                      {(analytics?.subject_distribution || []).map(
                        (item: any) => (
                          <div
                            key={item.subject}
                            className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"
                          >
                            <span className="font-bold">{item.subject}</span>
                            <span>{item.count} resources</span>
                          </div>
                        ),
                      )}
                    </div>
                  </article>
                </div>
              </>
            )}
          </section>
        )}
        {section === "users" && (
          <section className="mt-7">
            <div className="flex max-w-md items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
              <FiSearch className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void load()}
                placeholder="Search users"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                onClick={() => void load()}
                className="text-sm font-bold text-primary"
              >
                Search
              </button>
            </div>
            <div className="mt-5 overflow-x-auto rounded-3xl bg-white shadow-sm">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="p-4">User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="p-4">
                        <p className="font-bold">
                          {item.full_name || item.username}
                        </p>
                        <p className="text-xs text-slate-500">{item.email}</p>
                      </td>
                      <td className="capitalize">{item.role}</td>
                      <td>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${item.is_active === false ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                        >
                          {item.is_active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {item.role !== "admin" && (
                            <>
                              <button
                                onClick={() => void userAction(item, "active")}
                                className={`rounded-lg px-2 py-1 text-xs font-bold ${item.is_active === false ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                              >
                                {item.is_active === false
                                  ? "Activate"
                                  : "Deactivate"}
                              </button>
                              <button
                                onClick={() => void userAction(item, "delete")}
                                className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {section === "audit-logs" && (
          <section className="mt-7 overflow-x-auto rounded-3xl bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="p-4">Time</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th className="p-4">Reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.audit_id} className="border-t border-slate-100">
                    <td className="p-4 text-slate-500">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="font-bold">{label(item.action)}</td>
                    <td>
                      {item.target_type} {item.target_id || ""}
                    </td>
                    <td className="p-4 text-slate-500">{item.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
