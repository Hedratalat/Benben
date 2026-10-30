// OrdersDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Inbox,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  Smartphone,
  Tag,
  TriangleAlert,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";

const COLLECTION = "Orders";
const PER_PAGE = 10;

/* ---------- Statuses (edit the list to add / rename states) ---------- */
const STATUSES = [
  {
    id: "pending",
    label: "Pending",
    card: "border-gold bg-gold/10",
    badge: "bg-gold text-heading",
    dot: "bg-gold",
  },
  {
    id: "confirmed",
    label: "Confirmed",
    card: "border-surface-dark/60 bg-surface-dark/5",
    badge: "bg-surface-dark text-gold",
    dot: "bg-surface-dark",
  },
  {
    id: "shipped",
    label: "Shipped",
    card: "border-blue-800/60 bg-blue-800/10",
    badge: "bg-blue-800 text-white",
    dot: "bg-blue-800",
  },
  {
    id: "delivered",
    label: "Delivered",
    card: "border-success/60 bg-success/10",
    badge: "bg-success text-white",
    dot: "bg-success",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    card: "border-error/50 bg-error/10",
    badge: "bg-error text-white",
    dot: "bg-error",
  },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.id, s]));
const getStatus = (id) => STATUS_MAP[id] || STATUS_MAP.pending;

const PAYMENTS = [
  { id: "cash", label: "Cash on delivery", icon: Banknote },
  { id: "instapay", label: "Instapay", icon: Zap },
  { id: "vodafone cash", label: "Vodafone Cash", icon: Smartphone },
];
const PAYMENT_MAP = Object.fromEntries(PAYMENTS.map((p) => [p.id, p]));

const inputCls =
  "w-full rounded-lg border border-border bg-page px-3 text-sm text-heading placeholder:text-muted/70 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

/* ---------- helpers ---------- */
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

function toWhatsappNumber(phone = "") {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `2${digits}`;
  return digits;
}

const money = (n) => `${Number(n || 0).toLocaleString("en-US")} EGP`;

const cityOf = (o) => o.cityLabel || o.city || "";

// One lowercase string with everything searchable in the order
function buildHaystack(o) {
  return [
    o.orderNumber,
    o.fullName,
    o.phone,
    o.whatsapp,
    o.email,
    o.senderPhone,
    o.referenceNumber,
    o.vodafoneReference,
    cityOf(o),
    o.area,
    o.address,
    o.floor,
    o.promoCode,
    o.status,
    PAYMENT_MAP[o.paymentMethod]?.label,
    o.paymentMethod,
    o.isGuest ? "guest" : "account",
    o.grandTotal,
    ...(Array.isArray(o.items) ? o.items.map((i) => i.name) : []),
  ]
    .filter((v) => v !== undefined && v !== null)
    .join(" ")
    .toLowerCase();
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-heading">
        {children}
      </span>
    </div>
  );
}

function Block({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gold-pressed">
        <Icon size={14} />
        {title}
      </h4>
      {children}
    </div>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  async function copy(e) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy"
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-surface-muted hover:text-heading"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

/* ---------- page ---------- */
export default function OrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);
  const [toast, setToast] = useState(null);

  function showToast(message) {
    setToast({ message, key: Date.now() });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Live orders, newest first
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading orders:", err.code, err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Back to the first page whenever the filters change
  useEffect(() => {
    setVisibleCount(PER_PAGE);
  }, [statusFilter, cityFilter, paymentFilter, search]);

  const counts = useMemo(() => {
    const c = { all: orders.length };
    STATUSES.forEach((s) => (c[s.id] = 0));
    orders.forEach((o) => {
      const id = STATUS_MAP[o.status] ? o.status : "pending";
      c[id] += 1;
    });
    return c;
  }, [orders]);

  // Cities that actually appear in orders
  const cities = useMemo(() => {
    const set = new Map();
    orders.forEach((o) => {
      if (o.city) set.set(o.city, cityOf(o));
    });
    return [...set.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [orders]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => {
      const st = STATUS_MAP[o.status] ? o.status : "pending";
      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (cityFilter !== "all" && o.city !== cityFilter) return false;
      if (paymentFilter !== "all" && o.paymentMethod !== paymentFilter)
        return false;
      if (!term) return true;
      return buildHaystack(o).includes(term);
    });
  }, [orders, statusFilter, cityFilter, paymentFilter, search]);

  const shown = visible.slice(0, visibleCount);
  const hasFilters =
    statusFilter !== "all" ||
    cityFilter !== "all" ||
    paymentFilter !== "all" ||
    search.trim() !== "";

  function clearFilters() {
    setStatusFilter("all");
    setCityFilter("all");
    setPaymentFilter("all");
    setSearch("");
  }

  async function changeStatus(order, status) {
    if (order.status === status) return;
    try {
      await updateDoc(doc(db, COLLECTION, order.id), { status });
      showToast(`Order marked as ${getStatus(status).label.toLowerCase()}`);
    } catch (err) {
      console.error("Error updating order:", err.code, err.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, COLLECTION, deleteTarget.id));
      if (openId === deleteTarget.id) setOpenId(null);
      showToast("Order deleted");
    } catch (err) {
      console.error("Error deleting order:", err.code, err.message);
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
        <h2 className="font-heading text-2xl font-bold text-heading">Orders</h2>
        {counts.pending > 0 && (
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-heading">
            {counts.pending} pending
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-luxury">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number, name, phone, city, address, product, reference..."
            className={`h-11 pl-9 ${inputCls}`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[{ id: "all", label: "All" }, ...STATUSES].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(s.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                statusFilter === s.id
                  ? "bg-gold-cta text-heading"
                  : "bg-surface-muted text-heading hover:bg-gold-hover"
              }`}
            >
              {s.dot && <span className={`h-2 w-2 rounded-full ${s.dot}`} />}
              {s.label}
              <span className="text-xs font-semibold opacity-70">
                {counts[s.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            aria-label="Filter by city"
            className={`h-10 ${inputCls}`}
          >
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            aria-label="Filter by payment method"
            className={`h-10 ${inputCls}`}
          >
            <option value="all">All payment methods</option>
            {PAYMENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="h-10 rounded-lg border border-border-strong text-sm font-medium text-heading transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface py-14 text-center">
          <Inbox size={28} className="text-muted" />
          <p className="text-sm font-medium text-heading">No orders yet</p>
          <p className="text-xs text-muted">
            Orders placed at checkout will appear here.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted">No orders match your filters.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted">
            Showing {shown.length} of {visible.length} orders
          </p>

          {shown.map((o) => {
            const st = getStatus(o.status);
            const isOpen = openId === o.id;
            const pay = PAYMENT_MAP[o.paymentMethod];
            const PayIcon = pay?.icon || Banknote;
            const items = Array.isArray(o.items) ? o.items : [];
            const itemsCount = items.reduce(
              (sum, i) => sum + (Number(i.quantity) || 0),
              0,
            );
            const isCancelled = o.status === "cancelled";

            return (
              <div
                key={o.id}
                className={`overflow-hidden rounded-xl border-2 transition-colors ${st.card}`}
              >
                {/* Row header */}
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : o.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 basis-64 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-dark text-gold">
                      <Package size={20} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-heading text-sm font-bold text-heading">
                          {o.orderNumber}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.badge}`}
                        >
                          {st.label}
                        </span>
                        {o.duplicateAddress && (
                          <span className="flex items-center gap-1 rounded-md border border-error/50 px-2 py-0.5 text-[11px] font-semibold text-error">
                            <TriangleAlert size={11} />
                            Duplicate address
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-heading">
                        {o.fullName}
                        <span className="text-muted"> · {cityOf(o)}</span>
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
                        <span>{formatDate(o.createdAt)}</span>
                        <span>
                          {itemsCount} {itemsCount === 1 ? "item" : "items"}
                        </span>
                        <span className="flex items-center gap-1">
                          <PayIcon size={11} />
                          {pay?.label || o.paymentMethod}
                        </span>
                      </span>
                    </span>

                    <span
                      className={`shrink-0 font-heading text-base font-bold text-heading ${
                        isCancelled ? "line-through opacity-60" : ""
                      }`}
                    >
                      {money(o.grandTotal)}
                    </span>

                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-muted transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={STATUS_MAP[o.status] ? o.status : "pending"}
                      onChange={(e) => changeStatus(o, e.target.value)}
                      aria-label="Change order status"
                      className="h-9 rounded-full border border-border-strong bg-surface px-3 text-xs font-semibold text-heading outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setDeleteTarget(o)}
                      aria-label="Delete"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/10 text-error transition hover:bg-error/20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-border/70 bg-surface/60 p-4">
                    {/* status buttons */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="mr-1 text-xs font-medium text-muted">
                        Set status:
                      </span>
                      {STATUSES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => changeStatus(o, s.id)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                            o.status === s.id
                              ? s.badge
                              : "border border-border-strong bg-surface text-heading hover:bg-surface-muted"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {/* Customer */}
                      <Block icon={User} title="Customer">
                        <InfoRow label="Name">{o.fullName}</InfoRow>
                        <InfoRow label="Phone">
                          <bdi>{o.phone}</bdi>
                        </InfoRow>
                        <InfoRow label="WhatsApp">
                          <bdi>{o.whatsapp}</bdi>
                        </InfoRow>
                        {o.email && <InfoRow label="Email">{o.email}</InfoRow>}
                        <InfoRow label="Order by">
                          {o.isGuest ? "Guest" : "Account holder"}
                        </InfoRow>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            href={`https://wa.me/${toWhatsappNumber(o.whatsapp)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-9 items-center gap-2 rounded-full bg-gold-cta px-4 text-xs font-semibold text-heading transition hover:opacity-90"
                          >
                            <MessageCircle size={14} />
                            WhatsApp
                          </a>
                          <a
                            href={`tel:${o.phone}`}
                            className="flex h-9 items-center gap-2 rounded-full border border-border-strong px-4 text-xs font-medium text-heading transition hover:bg-surface-muted"
                          >
                            <Phone size={14} />
                            Call
                          </a>
                        </div>
                      </Block>

                      {/* Delivery */}
                      <Block icon={MapPin} title="Delivery address">
                        <InfoRow label="City">{cityOf(o)}</InfoRow>
                        <InfoRow label="Area">{o.area}</InfoRow>
                        <InfoRow label="Address">{o.address}</InfoRow>
                        {o.floor && <InfoRow label="Floor">{o.floor}</InfoRow>}
                        {o.duplicateAddress && (
                          <p className="mt-2 flex items-start gap-2 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-xs text-error">
                            <TriangleAlert
                              size={14}
                              className="mt-0.5 shrink-0"
                            />
                            This address was used before by a different
                            customer.
                          </p>
                        )}
                      </Block>

                      {/* Payment */}
                      <Block icon={PayIcon} title="Payment">
                        <InfoRow label="Method">
                          {pay?.label || o.paymentMethod}
                        </InfoRow>
                        {o.senderPhone && (
                          <InfoRow label="Sent from">
                            <bdi>{o.senderPhone}</bdi>
                          </InfoRow>
                        )}
                        {o.referenceNumber && (
                          <InfoRow label="Reference no.">
                            <bdi>{o.referenceNumber}</bdi>
                            <CopyButton value={o.referenceNumber} />
                          </InfoRow>
                        )}
                        {o.vodafoneReference && (
                          <InfoRow label="Transaction no.">
                            <bdi>{o.vodafoneReference}</bdi>
                            <CopyButton value={o.vodafoneReference} />
                          </InfoRow>
                        )}
                        {o.paymentMethod === "cash" && (
                          <p className="mt-1 text-xs text-muted">
                            Collect {money(o.grandTotal)} on delivery.
                          </p>
                        )}
                      </Block>

                      {/* Totals */}
                      <Block icon={Tag} title="Totals">
                        <InfoRow label="Subtotal">{money(o.subtotal)}</InfoRow>
                        {o.discountAmount > 0 && (
                          <InfoRow label={`Discount ${o.discountPercent}%`}>
                            <span className="text-success">
                              - {money(o.discountAmount)}
                            </span>
                          </InfoRow>
                        )}
                        {o.promoCode && (
                          <InfoRow label="Promo code">
                            <span className="font-mono tracking-wider">
                              {o.promoCode}
                            </span>
                            {o.promoType === "firstOrder" && (
                              <span className="ml-1 text-xs text-muted">
                                (first order)
                              </span>
                            )}
                          </InfoRow>
                        )}
                        <InfoRow label="Shipping">
                          {money(o.shippingFee)}
                        </InfoRow>
                        <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3">
                          <span className="text-sm font-bold text-heading">
                            Total
                          </span>
                          <span className="font-heading text-lg font-bold text-heading">
                            {money(o.grandTotal)}
                          </span>
                        </div>
                      </Block>
                    </div>

                    {/* Items */}
                    <div className="mt-3 rounded-xl border border-border bg-surface p-4">
                      <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gold-pressed">
                        <Package size={14} />
                        Items ({itemsCount})
                      </h4>
                      <ul className="flex flex-col gap-3">
                        {items.map((it, idx) => (
                          <li
                            key={`${it.key || it.productId}-${idx}`}
                            className="flex items-center gap-3"
                          >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt={it.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) =>
                                    (e.currentTarget.style.display = "none")
                                  }
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-heading">
                                {it.name}
                              </p>
                              <p className="text-xs text-muted">
                                {money(it.price)} × {it.quantity}
                              </p>
                            </div>
                            <p className="shrink-0 text-sm font-bold text-heading">
                              {money(it.total)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {visible.length > visibleCount && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PER_PAGE)}
              className="mx-auto mt-2 h-11 rounded-full border border-border-strong px-8 text-sm font-medium text-heading transition hover:bg-surface-muted"
            >
              Show more ({visible.length - visibleCount} left)
            </button>
          )}
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
              Delete order
            </h3>
            <p className="mb-6 text-sm text-muted">
              Are you sure you want to delete order{" "}
              <span className="font-bold text-heading">
                "{deleteTarget.orderNumber}"
              </span>
              ? This can't be undone. To keep a record, mark it as cancelled
              instead.
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
