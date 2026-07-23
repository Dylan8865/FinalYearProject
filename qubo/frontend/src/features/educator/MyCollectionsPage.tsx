import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  FiArchive,
  FiBookOpen,
  FiCopy,
  FiEdit3,
  FiMoreHorizontal,
  FiPlus,
  FiSearch,
  FiShare2,
  FiUsers,
  FiVideo,
  FiBox,
  FiHelpCircle,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import AppSidebar from "@/components/layout/AppSidebar";
import { useAuthStore } from "@/contexts/authStore";
import { authService } from "@/lib/authService";
import {
  CollectionPreviewItem,
  EducatorCollection,
  LinkedStudent,
} from "@/types/collection";
import CollectionEditorModal from "./CollectionEditorModal";
import ModelThumbnail from "@/features/resources/ModelThumbnail";

const label = (status: EducatorCollection["status"]) =>
  status[0].toUpperCase() + status.slice(1);
const statusStyle = {
  draft: "bg-slate-100 text-slate-600",
  shared: "bg-emerald-50 text-emerald-700",
  archived: "bg-slate-100 text-slate-500",
};
const studentLabel = (student: LinkedStudent) =>
  student.full_name || student.username || student.email || "Student";

const getYouTubeVideoId = (url?: string | null) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
    return (
      parsed.searchParams.get("v") || parsed.pathname.split("/embed/")[1] || ""
    );
  } catch {
    return "";
  }
};

function CollectionPreview({ item }: { item?: CollectionPreviewItem }) {
  if (!item)
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/30 bg-white/10 text-white/60">
        <FiPlus />
      </div>
    );
  if (item.item_type === "model")
    return (
      <div className="h-full overflow-hidden rounded-xl bg-blue-50">
        {item.preview_model_url ? (
          <ModelThumbnail
            modelUrl={item.preview_model_url}
            title={item.title}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-blue-100">
            <FiBox className="h-6 w-6" />
          </div>
        )}
      </div>
    );
  if (item.item_type === "video") {
    const videoId = getYouTubeVideoId(item.youtube_url);
    return videoId ? (
      <img
        src={"https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg"}
        alt=""
        className="h-full w-full rounded-xl object-cover"
      />
    ) : (
      <div className="flex h-full items-center justify-center rounded-xl bg-sky-500/40 text-white">
        <FiVideo className="h-6 w-6" />
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl bg-violet-500/50 px-2 text-center text-white">
      <FiHelpCircle className="h-5 w-5" />
      <span className="mt-1 line-clamp-1 text-[10px] font-extrabold">Quiz</span>
    </div>
  );
}

export default function MyCollectionsPage() {
  const user = useAuthStore((state) => state.user);
  const [collections, setCollections] = useState<EducatorCollection[]>([]);
  const [status, setStatus] = useState<"all" | EducatorCollection["status"]>(
    "all",
  );
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selected, setSelected] = useState<EducatorCollection | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [studentMatches, setStudentMatches] = useState<LinkedStudent[]>([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<LinkedStudent[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editorCollection, setEditorCollection] =
    useState<EducatorCollection | null>(null);

  const loadCollections = async () => {
    setIsLoading(true);
    setError("");
    try {
      setCollections(
        await authService.getMyCollections(
          status === "all" ? undefined : status,
        ),
      );
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.detail ||
          "Collections could not be loaded. Apply the collections migration first.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (user?.role === "educator") void loadCollections();
  }, [status, user?.role]);
  useEffect(() => {
    if (!isShareOpen || studentEmail.trim().length < 2) {
      setStudentMatches([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setIsSearchingStudents(true);
      try {
        setStudentMatches(
          await authService.searchStudentsByEmail(studentEmail.trim()),
        );
      } catch {
        setStudentMatches([]);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [isShareOpen, studentEmail]);

  const visible = useMemo(
    () =>
      collections.filter((item) =>
        `${item.title} ${item.description}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [collections, search],
  );
  if (user?.role !== "educator") return <Navigate to="/dashboard" replace />;

  const createCollection = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const created = await authService.createCollection({
        title,
        description,
      });
      setCollections((current) => [created, ...current]);
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.detail ||
          "Collection could not be created.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  const openShare = async (collection: EducatorCollection) => {
    setSelected(collection);
    setSelectedStudents([]);
    setMessage("");
    setDueAt("");
    setStudentEmail("");
    setStudentMatches([]);
    setIsShareOpen(true);
    setError("");
    try {
      setLinkedStudents(await authService.getLinkedStudents());
    } catch {
      setLinkedStudents([]);
      setError("Previously linked students could not be loaded.");
    }
  };
  const toggleStudent = (student: LinkedStudent) =>
    setSelectedStudents((current) =>
      current.some((item) => item.id === student.id)
        ? current.filter((item) => item.id !== student.id)
        : [...current, student],
    );
  const share = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setIsSaving(true);
    setError("");
    try {
      await authService.shareCollection(selected.collection_id, {
        student_ids: selectedStudents.map((student) => student.id),
        message: message || undefined,
        due_at: dueAt || undefined,
      });
      setCollections((current) =>
        current.map((item) =>
          item.collection_id === selected.collection_id
            ? { ...item, status: "shared" }
            : item,
        ),
      );
      setIsShareOpen(false);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.detail ||
          "Collection could not be shared.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  const archive = async (collection: EducatorCollection) => {
    if (!window.confirm(`Archive “${collection.title}”?`)) return;
    try {
      await authService.archiveCollection(collection.collection_id);
      void loadCollections();
    } catch {
      setError("Collection could not be archived.");
    }
  };
  const deleteCollection = async (collection: EducatorCollection) => {
    const warning =
      collection.status === "archived"
        ? "Delete “" +
          collection.title +
          "” permanently? Students will no longer see this archived collection. Your original videos, models and quizzes will stay in their libraries."
        : "Delete draft “" +
          collection.title +
          "”? Your original videos, models and quizzes will stay in their libraries.";
    if (!window.confirm(warning)) return;
    try {
      await authService.deleteCollection(collection.collection_id);
      setCollections((current) =>
        current.filter(
          (item) => item.collection_id !== collection.collection_id,
        ),
      );
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.detail ||
          "Collection could not be deleted.",
      );
    }
  };
  const duplicate = async (collection: EducatorCollection) => {
    try {
      const created = await authService.duplicateCollection(
        collection.collection_id,
      );
      setCollections((current) => [created, ...current]);
    } catch {
      setError("Collection could not be duplicated.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <AppSidebar />
      <main className="min-w-0">
        <header className="flex min-h-[64px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur md:px-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
              Educator workspace
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
              My Collections
            </h1>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
          >
            <FiPlus />
            New collection
          </button>
        </header>
        <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 lg:py-10">
          <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                Create focused learning packs.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Organise your videos, models and quizzes, then share a learning
                pack with selected students.
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              {collections.length} collections
            </p>
          </section>
          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["all", "draft", "shared", "archived"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${status === item ? "bg-blue-50 text-primary" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  {item === "all" ? "All" : label(item)}
                </button>
              ))}
            </div>
            <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:w-80">
              <FiSearch className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or description"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
              />
            </label>
          </section>
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-[24px] bg-slate-200"
                />
              ))}
            </div>
          ) : (
            <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((collection) => (
                <article
                  key={collection.collection_id}
                  className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-28 bg-gradient-to-br from-sky-700 via-blue-700 to-indigo-800 p-3">
                    <div className="grid h-full grid-cols-3 gap-2">
                      {[0, 1, 2].map((index) => (
                        <CollectionPreview
                          key={index}
                          item={collection.preview_items?.[index]}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold">
                          {collection.title}
                        </h3>
                        <p className="mt-2 text-sm leading-5 text-slate-500">
                          {collection.description}
                        </p>
                      </div>
                      <FiMoreHorizontal className="text-slate-400" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[collection.status]}`}
                      >
                        {label(collection.status)}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Version {collection.version}
                      </span>
                    </div>
                    <p className="mt-4 text-xs font-semibold text-slate-500">
                      Updated{" "}
                      {new Date(collection.updated_at).toLocaleDateString()}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                      {collection.status === "draft" ? (
                        <>
                          <button
                            onClick={() => openShare(collection)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white"
                          >
                            <FiShare2 />
                            Share
                          </button>
                          <button
                            onClick={() => setEditorCollection(collection)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                          >
                            <FiEdit3 />
                            Edit
                          </button>
                          <button
                            onClick={() => void deleteCollection(collection)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            <FiTrash2 />
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => duplicate(collection)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-primary"
                          >
                            <FiCopy />
                            Duplicate
                          </button>
                          {collection.status === "shared" && (
                            <button
                              onClick={() => archive(collection)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                            >
                              <FiArchive />
                              Archive
                            </button>
                          )}
                          {collection.status === "archived" && (
                            <button
                              onClick={() => void deleteCollection(collection)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                            >
                              <FiTrash2 />
                              Delete permanently
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}
          {!isLoading && visible.length === 0 && (
            <section className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center">
              <FiBookOpen className="mx-auto h-9 w-9 text-slate-300" />
              <h3 className="mt-4 text-xl font-extrabold">
                No collections yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Turn videos, 3D models, and quizzes into a focused learning
                pack.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
              >
                Create your first collection
              </button>
            </section>
          )}
        </div>
      </main>
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={createCollection}
            className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
              New collection
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">
              Start a teaching pack
            </h2>
            <label className="mt-6 block text-sm font-bold">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-primary"
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-200 p-4 outline-none focus:border-primary"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
              >
                {isSaving ? "Creating…" : "Create draft"}
              </button>
            </div>
          </form>
        </div>
      )}
      {isShareOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={share}
            className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-blue-50 p-3 text-primary">
                <FiUsers />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                  Share to students
                </p>
                <h2 className="mt-1 text-xl font-extrabold">
                  {selected.title}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Choose registered student emails. Sharing automatically adds
                  them to your Class Performance dashboard.
                </p>
              </div>
            </div>
            <label className="mt-5 block text-sm font-bold">
              Find student by email
              <input
                type="email"
                value={studentEmail}
                onChange={(event) => setStudentEmail(event.target.value)}
                placeholder="e.g. student@school.edu"
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-primary"
                autoFocus
              />
            </label>
            <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
              {studentEmail.trim().length >= 2 && isSearchingStudents && (
                <p className="px-1 text-sm text-slate-500">
                  Searching registered students…
                </p>
              )}
              {studentEmail.trim().length >= 2 &&
                !isSearchingStudents &&
                studentMatches.length === 0 && (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    No registered student matches this email.
                  </p>
                )}
              {studentMatches.map((student) => (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl bg-blue-50 p-3 text-sm font-semibold"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.some(
                      (item) => item.id === student.id,
                    )}
                    onChange={() => toggleStudent(student)}
                  />{" "}
                  <span className="min-w-0">
                    <span className="block truncate">
                      {studentLabel(student)}
                    </span>
                    <span className="block truncate text-xs font-medium text-slate-500">
                      {student.email}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {selectedStudents.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  Recipients
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student)}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800"
                    >
                      {student.email || studentLabel(student)}
                      <FiX />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-bold text-slate-600">
                Previously linked students ({linkedStudents.length})
              </summary>
              <div className="mt-2 max-h-32 space-y-2 overflow-y-auto">
                {linkedStudents.map((student) => (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.some(
                        (item) => item.id === student.id,
                      )}
                      onChange={() => toggleStudent(student)}
                    />{" "}
                    <span>
                      {studentLabel(student)}{" "}
                      <span className="text-xs font-medium text-slate-500">
                        {student.email}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </details>
            <label className="mt-4 block text-sm font-bold">
              Message (optional)
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-primary"
              />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Due date (optional)
              <input
                type="date"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-primary"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                disabled={isSaving || selectedStudents.length === 0}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {isSaving
                  ? "Sharing…"
                  : "Share with " + selectedStudents.length}
              </button>
            </div>
          </form>
        </div>
      )}
      {editorCollection && (
        <CollectionEditorModal
          collection={editorCollection}
          onClose={() => setEditorCollection(null)}
          onChanged={() => void loadCollections()}
        />
      )}
    </div>
  );
}
