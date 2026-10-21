// MessageDashboard.jsx
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
  Mail,
  MailOpen,
  Phone,
  MessageCircle,
  ChevronDown,
  Inbox,
  Search,
} from "lucide-react";

const COLLECTION = "Messages";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "read", label: "Read" },
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

// 01012345678 or +201012345678 -> 201012345678 (for wa.me)
function toWhatsappNumber(phone = "") {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `2${digits}`;
  return digits;
}

export default function MessageDashboard() {
  const [messages, setMessages] = useState([]);
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

  // Live messages from Firestore, newest first
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading messages:", err.code, err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const newCount = messages.filter((m) => m.status === "new").length;
  const readCount = messages.length - newCount;
  const counts = { all: messages.length, new: newCount, read: readCount };

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return messages.filter((m) => {
      const isNew = m.status === "new";
      if (filter === "new" && !isNew) return false;
      if (filter === "read" && isNew) return false;
      if (!term) return true;
      return [m.fullName, m.email, m.phone, m.topic, m.message].some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [messages, filter, search]);

  async function setStatus(id, status) {
    try {
      await updateDoc(doc(db, COLLECTION, id), { status });
    } catch (err) {
      console.error("Error updating message:", err.code, err.message);
    }
  }

  // Opening a new message marks it as read
  function toggleOpen(msg) {
    const willOpen = openId !== msg.id;
    setOpenId(willOpen ? msg.id : null);
    if (willOpen && msg.status === "new") setStatus(msg.id, "read");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, COLLECTION, deleteTarget.id));
      if (openId === deleteTarget.id) setOpenId(null);
      showToast("Message deleted");
    } catch (err) {
      console.error("Error deleting message:", err.code, err.message);
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
          Messages
        </h2>
        {newCount > 0 && (
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-heading">
            {newCount} new
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
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface py-14 text-center">
          <Inbox size={28} className="text-muted" />
          <p className="text-sm font-medium text-heading">No messages yet</p>
          <p className="text-xs text-muted">
            Messages sent from the contact page will appear here.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted">No messages match your filter.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((msg) => {
            const isNew = msg.status === "new";
            const isOpen = openId === msg.id;
            const initial = (msg.fullName || "?")
              .trim()
              .charAt(0)
              .toUpperCase();

            return (
              <div
                key={msg.id}
                className={`overflow-hidden rounded-xl border bg-surface transition ${
                  isNew ? "border-gold" : "border-border"
                }`}
              >
                {/* Row header */}
                <div className="flex items-center gap-3 p-3">
                  <button
                    type="button"
                    onClick={() => toggleOpen(msg)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isNew
                          ? "bg-surface-dark text-gold"
                          : "bg-surface-muted text-heading"
                      }`}
                    >
                      {initial}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold text-heading">
                          {msg.fullName}
                        </span>
                        {isNew && (
                          <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-heading">
                            New
                          </span>
                        )}
                        <span className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-gold-pressed">
                          {msg.topic || "General"}
                        </span>
                      </span>
                      {!isOpen && (
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {msg.message}
                        </span>
                      )}
                      <span className="mt-0.5 block text-[11px] text-muted/80">
                        {formatDate(msg.createdAt)}
                      </span>
                    </span>

                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => setDeleteTarget(msg)}
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
                      {msg.message}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-muted sm:grid-cols-2">
                      <p className="flex items-center gap-2 break-all">
                        <Mail
                          size={14}
                          className="text-sm shrink-0 text-gold-pressed"
                        />
                        {msg.email}
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <Phone
                          size={14}
                          className="shrink-0 text-gold-pressed"
                        />
                        {msg.phone}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${msg.email}?subject=${encodeURIComponent(
                          `Re: ${msg.topic || "Your message"}`,
                        )}`}
                        className="flex h-10 items-center gap-2 rounded-full bg-gold-cta px-5 text-sm font-semibold text-heading transition hover:opacity-90"
                      >
                        <Mail size={15} />
                        Reply by email
                      </a>
                      <a
                        href={`https://wa.me/${toWhatsappNumber(msg.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-medium text-heading transition hover:bg-surface-muted"
                      >
                        <MessageCircle size={15} />
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${msg.phone}`}
                        className="flex h-10 items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-medium text-heading transition hover:bg-surface-muted"
                      >
                        <Phone size={15} />
                        Call
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setStatus(msg.id, isNew ? "read" : "new");
                          showToast(
                            isNew ? "Marked as read" : "Marked as unread",
                          );
                        }}
                        className="flex h-10 items-center gap-2 rounded-full border border-border-strong px-4 text-sm font-medium text-heading transition hover:bg-surface-muted"
                      >
                        <MailOpen size={15} />
                        {isNew ? "Mark as read" : "Mark as unread"}
                      </button>
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
              Delete message
            </h3>
            <p className="mb-6 text-sm text-muted">
              Are you sure you want to delete the message from{" "}
              <span className="font-bold text-heading">
                "{deleteTarget.fullName}"
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
