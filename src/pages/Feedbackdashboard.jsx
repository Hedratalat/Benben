// FeedbackDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  Trash2,
  X,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  Mail,
  ChevronDown,
  Inbox,
  Search,
} from "lucide-react";

const COLLECTION = "feedback";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Published" },
];

const inputCls =
  "w-full rounded-lg border border-border bg-page px-3 text-sm text-heading placeholder:text-muted/70 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

// Firestore Timestamp -> readable date (null while the server timestamp is pending)
function formatDate(ts) {
  if (!ts || typeof ts.toDate !== "function") return "Just now";
  return ts.toDate().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(message) {
    setToast({ message, key: Date.now() });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Live feedback from Firestore, newest first
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading feedback:", err.code, err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const approvedCount = items.filter((f) => f.approved).length;
  const pendingCount = items.length - approvedCount;
  const counts = {
    all: items.length,
    pending: pendingCount,
    approved: approvedCount,
  };

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((f) => {
      if (filter === "pending" && f.approved) return false;
      if (filter === "approved" && !f.approved) return false;
      if (!term) return true;
      return [f.name, f.email, f.message].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [items, filter, search]);

  async function setApproved(id, approved) {
    try {
      await updateDoc(doc(db, COLLECTION, id), { approved });
      showToast(approved ? "Feedback published" : "Feedback unpublished");
    } catch (err) {
      console.error("Error updating feedback:", err.code, err.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, COLLECTION, deleteTarget.id));
      if (openId === deleteTarget.id) setOpenId(null);
      showToast("Feedback deleted");
    } catch (err) {
      console.error("Error deleting feedback:", err.code, err.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl font-body" dir="ltr">
      {/* Toast */}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-[200] flex justify-center px-4">
        {toast && (
          <div
            key={toast.key}
            className="toast-anim pointer-events-auto flex max-w-[90vw] items-center gap-2.5 rounded-full bg-surface-dark px-5 py-3 text-primary-foreground shadow-luxury"
          >
            <CheckCircle2 size={18} className="shrink-0 text-gold" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .toast-anim { animation: toastIn 0.3s ease-out both; }
      `}</style>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold text-heading">
          Feedback
        </h2>
        {pendingCount > 0 && (
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-heading">
            {pendingCount} waiting for review
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-luxury sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === f.id
                  ? "bg-gold-cta text-heading"
                  : "bg-surface-muted text-heading hover:bg-gold-hover"
              }`}
            >
              {f.label}
              <span className="text-xs font-semibold opacity-70">
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, message..."
            className={`h-10 pl-9 ${inputCls}`}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface py-14 text-center">
          <Inbox size={28} className="text-muted" />
          <p className="text-sm font-medium text-heading">No feedback yet</p>
          <p className="text-xs text-muted">
            Feedback sent from the home page will appear here for review.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted">No feedback matches your filter.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((fb) => {
            const isPending = !fb.approved;
            const isOpen = openId === fb.id;
            const initial = (fb.name || "?").trim().charAt(0).toUpperCase();

            return (
              <div
                key={fb.id}
                className={`overflow-hidden rounded-xl border bg-surface transition ${
                  isPending ? "border-gold" : "border-border"
                }`}
              >
                {/* Row header */}
                <div className="flex items-center gap-3 p-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : fb.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isPending
                          ? "bg-surface-dark text-gold"
                          : "bg-surface-muted text-heading"
                      }`}
                    >
                      {initial}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold text-heading">
                          {fb.name}
                        </span>
                        {isPending ? (
                          <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-heading">
                            Pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-surface-dark px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                            <Eye size={11} className="text-gold" />
                            Published
                          </span>
                        )}
                      </span>
                      {!isOpen && (
                        <span className="mt-0.5 line-clamp-2 break-words text-xs leading-5 text-muted">
                          {fb.message}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[11px] text-muted/80">
                        {formatDate(fb.createdAt)}
                      </span>
                    </span>

                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Quick approve (only for pending) */}
                  {isPending && (
                    <button
                      onClick={() => setApproved(fb.id, true)}
                      aria-label="Approve and publish"
                      title="Approve and publish"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success transition hover:bg-success/20"
                    >
                      <Check size={16} />
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTarget(fb)}
                    aria-label="Delete"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/10 text-error transition hover:bg-error/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-border bg-surface-muted/50 p-4">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-heading">
                      {fb.message}
                    </p>

                    <p className="mt-4 flex items-center gap-2 break-all text-xs text-muted">
                      <Mail size={14} className="shrink-0 text-gold-pressed" />
                      {fb.email}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => setApproved(fb.id, true)}
                          className="flex h-10 items-center gap-2 rounded-full bg-gold-cta px-5 text-sm font-semibold text-heading transition hover:opacity-90"
                        >
                          <Check size={15} />
                          Approve and publish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setApproved(fb.id, false)}
                          className="flex h-10 items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-medium text-heading transition hover:bg-surface-muted"
                        >
                          <EyeOff size={15} />
                          Unpublish
                        </button>
                      )}
                      <a
                        href={`mailto:${fb.email}?subject=${encodeURIComponent(
                          "Thanks for your feedback",
                        )}`}
                        className="flex h-10 items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-medium text-heading transition hover:bg-surface-muted"
                      >
                        <Mail size={15} />
                        Reply by email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-dark/60 px-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-luxury">
            <button
              onClick={() => setDeleteTarget(null)}
              aria-label="Close"
              className="absolute right-3 top-3 text-muted transition hover:text-heading"
            >
              <X size={18} />
            </button>
            <h3 className="mb-2 font-heading text-lg font-bold text-heading">
              Delete feedback
            </h3>
            <p className="mb-6 text-sm text-muted">
              Are you sure you want to delete the feedback from{" "}
              <span className="font-bold text-heading">
                "{deleteTarget.name}"
              </span>
              ? This can't be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmDelete}
                className="h-11 flex-1 rounded-full bg-error text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-11 flex-1 rounded-full border border-border-strong text-sm font-medium text-heading transition hover:bg-surface-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
