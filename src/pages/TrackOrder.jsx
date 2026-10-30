// src/pages/TrackOrder.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ClipboardCheck,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { ease, fadeUp } from "../utils/motion";
import { formatPrice } from "../store/Storecontext";
import { db } from "../../firebase";

/* =======================
   Constants
======================= */
// Same key the checkout uses for guest orders
const GUEST_KEY = "guestIdBenben";

// The happy path, in order. "cancelled" is handled separately.
const STEPS = [
  { id: "pending", label: "Order received", icon: ClipboardCheck },
  { id: "confirmed", label: "Confirmed", icon: BadgeCheck },
  { id: "shipped", label: "On its way", icon: Truck },
  { id: "delivered", label: "Delivered", icon: PackageCheck },
];

const STATUS_COPY = {
  pending: {
    title: "We've got your order",
    text: "We're checking the details now. We'll confirm it shortly.",
  },
  confirmed: {
    title: "Your order is confirmed",
    text: "We've placed it with the supplier and it's being prepared.",
  },
  shipped: {
    title: "Your order is on its way",
    text: "It has left the supplier and is heading to your door.",
  },
  delivered: {
    title: "Your order has arrived",
    text: "We hope you love it. Something wrong? Message us and we'll sort it out.",
  },
  cancelled: {
    title: "This order was cancelled",
    text: "If you weren't expecting this, get in touch and we'll help.",
  },
};

const BADGE = {
  pending: "bg-gold/15 text-heading border-gold/50",
  confirmed: "bg-surface-dark text-gold border-surface-dark",
  shipped: "bg-gold-cta text-surface-dark border-transparent",
  delivered: "bg-success text-white border-transparent",
  cancelled: "bg-error/10 text-error border-error/40",
};

const BADGE_LABEL = {
  pending: "Received",
  confirmed: "Confirmed",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_LABELS = {
  cash: "Cash on delivery",
  instapay: "Instapay",
  "vodafone cash": "Vodafone Cash",
};

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/* =======================
   Helpers
======================= */
const readGuestId = () => {
  try {
    return localStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
};

// Pending server timestamps are null for a moment: treat them as "now"
const createdMs = (o) => o.createdAt?.toMillis?.() ?? Date.now();

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

/* =======================
   Status badge (animates when the status changes)
======================= */
function StatusBadge({ status }) {
  const key = BADGE[status] ? status : "pending";
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={key}
        className={`inline-block rounded-full border px-3 py-1 font-body text-xs font-semibold ${BADGE[key]}`}
        initial={{ opacity: 0, y: 8, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.9 }}
        transition={{ duration: 0.3, ease }}
      >
        {BADGE_LABEL[key]}
      </motion.span>
    </AnimatePresence>
  );
}

/* =======================
   Timeline
======================= */
function StatusTracker({ status }) {
  const cancelled = status === "cancelled";
  const current = Math.max(
    0,
    STEPS.findIndex((s) => s.id === status),
  );
  const progress = cancelled ? 0 : current / (STEPS.length - 1);
  const delivered = status === "delivered";

  return (
    <div className="relative">
      {/* line: 4 equal columns, so node centres sit at 12.5% .. 87.5% */}
      <div
        aria-hidden="true"
        className="absolute left-[12.5%] right-[12.5%] top-5 h-0.5 bg-border-strong/40"
      />
      <motion.div
        aria-hidden="true"
        className={`absolute left-[12.5%] right-[12.5%] top-5 h-0.5 origin-left ${
          cancelled ? "bg-error/40" : "bg-gold-cta"
        }`}
        initial={false}
        animate={{ scaleX: progress }}
        transition={{ duration: 0.9, ease }}
      />

      <ol className="relative grid grid-cols-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = !cancelled && i < current;
          const isCurrent = !cancelled && i === current;
          const reached = done || isCurrent;

          return (
            <li key={s.id} className="flex flex-col items-center text-center">
              <div className="relative grid h-10 w-10 place-items-center">
                {isCurrent && !delivered && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-gold/40"
                    animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
                <motion.span
                  className={`relative grid h-10 w-10 place-items-center rounded-full border ${
                    reached
                      ? "border-transparent bg-gold-cta text-surface-dark shadow-luxury"
                      : cancelled
                        ? "border-error/30 bg-surface text-error/50"
                        : "border-border-strong bg-surface text-muted"
                  }`}
                  initial={false}
                  animate={{ scale: isCurrent ? 1.12 : 1 }}
                  transition={{ duration: 0.4, ease }}
                >
                  {done || (isCurrent && delivered) ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    <Icon size={18} />
                  )}
                </motion.span>
              </div>
              <span
                className={`mt-2 px-1 font-body text-xs leading-tight sm:text-sm ${
                  reached
                    ? "font-semibold text-heading"
                    : cancelled
                      ? "text-muted/60"
                      : "text-muted"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* =======================
   Order card
======================= */
function OrderCard({ order, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const status = BADGE[order.status] ? order.status : "pending";
  const copy = STATUS_COPY[status];
  const cancelled = status === "cancelled";
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsCount = items.reduce((n, i) => n + (Number(i.quantity) || 0), 0);

  return (
    <motion.article
      layout="position"
      className={`overflow-hidden rounded-3xl border bg-surface shadow-luxury ${
        cancelled ? "border-error/40" : "border-border-strong"
      }`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease }}
    >
      <div className="p-6 sm:p-8">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-body text-sm text-muted">Order number</p>
            <h3 className="break-all font-heading text-lg font-bold tracking-wide sm:text-xl">
              {order.orderNumber}
            </h3>
            <p className="mt-1 font-body text-sm text-muted">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* timeline */}
        <div className="mt-8">
          <StatusTracker status={status} />
        </div>

        {/* message for the current status */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={status}
            className={`mt-8 rounded-2xl border px-5 py-4 ${
              cancelled
                ? "border-error/30 bg-error/10"
                : "border-border bg-surface-muted"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease }}
            role="status"
          >
            <p
              className={`flex items-center gap-2 font-heading text-base font-semibold tracking-wide ${
                cancelled ? "text-error" : "text-heading"
              }`}
            >
              {cancelled && <XCircle size={18} />}
              {copy.title}
            </p>
            <p className="mt-1 font-body text-sm leading-relaxed text-muted">
              {copy.text}
            </p>
            {cancelled && (
              <Link
                to="/contact"
                className={`mt-3 inline-block rounded-full border border-border-strong px-5 py-2 font-body text-sm font-medium text-heading transition-colors hover:bg-surface ${ring}`}
              >
                Contact us
              </Link>
            )}
          </motion.div>
        </AnimatePresence>

        {/* toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`mt-6 flex w-full items-center justify-between rounded-full border border-border-strong px-5 py-3 font-body text-sm font-medium text-heading transition-colors hover:bg-surface-muted ${ring}`}
        >
          <span>
            Order details · {itemsCount} {itemsCount === 1 ? "item" : "items"} ·{" "}
            {formatPrice(order.grandTotal || 0)}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* details */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <div className="border-t border-border px-6 pb-8 pt-6 sm:px-8">
              <ul className="space-y-4">
                {items.map((it, idx) => (
                  <li
                    key={`${it.key || it.productId}-${idx}`}
                    className="flex items-center gap-3"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                      {it.image && (
                        <img
                          src={it.image}
                          alt={it.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-semibold text-heading">
                        {it.name}
                      </p>
                      <p className="font-body text-xs text-muted">
                        {formatPrice(it.price)} × {it.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 font-body text-sm font-semibold text-heading">
                      {formatPrice(it.total)}
                    </p>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-2.5 border-t border-border pt-5 font-body text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Delivering to</dt>
                  <dd className="text-right font-medium text-heading">
                    {[order.area, order.cityLabel || order.city]
                      .filter(Boolean)
                      .join(", ")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Payment</dt>
                  <dd className="font-medium text-heading">
                    {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="text-heading">
                    {formatPrice(order.subtotal || 0)}
                  </dd>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">
                      Discount {order.discountPercent}%
                    </dt>
                    <dd className="text-success">
                      - {formatPrice(order.discountAmount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Shipping</dt>
                  <dd className="text-heading">
                    {formatPrice(order.shippingFee || 0)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                  <dt className="font-heading text-base font-semibold tracking-wide">
                    Total
                  </dt>
                  <dd className="font-heading text-xl font-bold text-gold">
                    {formatPrice(order.grandTotal || 0)}
                  </dd>
                </div>
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* =======================
   Page
======================= */
export default function TrackOrder() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // search
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchState, setSearchState] = useState("idle"); // idle | loading | found | notfound | error
  const [found, setFound] = useState(null);

  // my orders (account + this device)
  const [myOrders, setMyOrders] = useState([]);
  const [myLoading, setMyLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => {
      setUser(u || null);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  /* ----- live lookup by order number ----- */
  useEffect(() => {
    if (!searchTerm) {
      setFound(null);
      setSearchState("idle");
      return;
    }
    setSearchState("loading");
    const q = query(
      collection(db, "Orders"),
      where("orderNumber", "==", searchTerm),
      limit(1),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setFound(null);
          setSearchState("notfound");
        } else {
          const d = snap.docs[0];
          setFound({ id: d.id, ...d.data() });
          setSearchState("found");
        }
      },
      (err) => {
        console.error("Order lookup failed:", err.code, err.message);
        setFound(null);
        setSearchState("error");
      },
    );
    return unsub;
  }, [searchTerm]);

  /* ----- live "my orders": logged-in account + guest id from this device ----- */
  useEffect(() => {
    if (!authReady) return;

    const guestId = readGuestId();
    const queries = [];
    if (user) {
      queries.push(
        query(collection(db, "Orders"), where("userId", "==", user.uid)),
      );
    }
    if (guestId) {
      queries.push(
        query(collection(db, "Orders"), where("guestId", "==", guestId)),
      );
    }

    if (queries.length === 0) {
      setMyOrders([]);
      setMyLoading(false);
      return;
    }

    setMyLoading(true);
    const buckets = queries.map(() => []);
    const merge = () => {
      const map = new Map();
      buckets.flat().forEach((o) => map.set(o.id, o));
      setMyOrders(
        [...map.values()].sort((a, b) => createdMs(b) - createdMs(a)),
      );
      setMyLoading(false);
    };

    const unsubs = queries.map((q, i) =>
      onSnapshot(
        q,
        (snap) => {
          buckets[i] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          merge();
        },
        (err) => {
          console.error("Loading orders failed:", err.code, err.message);
          setMyLoading(false);
        },
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [authReady, user]);

  /* ----- handlers ----- */
  const onSubmit = (e) => {
    e.preventDefault();
    const term = input.trim().toUpperCase();
    if (!term) {
      setInputError("Enter your order number.");
      return;
    }
    setInputError("");
    setSearchTerm(term);
  };

  const clearSearch = () => {
    setInput("");
    setInputError("");
    setSearchTerm("");
  };

  // the searched order is shown on top, so don't repeat it in the list
  const listOrders = myOrders.filter((o) => o.id !== found?.id);

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-hidden bg-page px-4 pb-20 pt-32 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Heading */}
          <header className="mb-10 max-w-2xl sm:mb-14">
            <motion.h2
              className="text-4xl font-bold tracking-wider sm:text-5xl"
              {...fadeUp(0)}
            >
              Track your order
            </motion.h2>
            <motion.p
              className="mt-2 font-body text-sm leading-normal text-muted sm:text-base"
              {...fadeUp(0.12)}
            >
              Enter the order number you saved at checkout, or find your recent
              orders below.
            </motion.p>
          </header>
          {/* Search */}
          <motion.form
            onSubmit={onSubmit}
            noValidate
            className="rounded-3xl border border-border-strong bg-surface px-5 py-3 shadow-luxury sm:px-8"
            {...fadeUp(0.2)}
          >
            <label htmlFor="orderNumber" className="sr-only">
              Order number
            </label>
            <div className="flex items-center gap-3 sm:gap-4">
              <Search
                size={18}
                aria-hidden="true"
                className="shrink-0 text-gold"
              />
              <div className="relative min-w-0 flex-1">
                <input
                  id="orderNumber"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Type your order number here to search"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setInputError("");
                  }}
                  aria-invalid={!!inputError}
                  aria-describedby={inputError ? "order-err" : undefined}
                  className={`w-full border-0 border-b bg-transparent px-0 py-3 pr-8 font-body text-base text-heading placeholder:text-muted/60 transition-colors focus:outline-none focus:ring-0 ${
                    inputError
                      ? "border-error focus:border-error"
                      : "border-border-strong/60 focus:border-gold"
                  }`}
                />
                {input && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear"
                    className={`absolute right-0 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:text-heading ${ring}`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={searchState === "loading"}
                className={`shrink-0 rounded-full bg-gold-cta px-5 py-2.5 font-heading text-sm font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none sm:px-7 ${ring}`}
              >
                {searchState === "loading" ? "Searching…" : "Track"}
              </button>
            </div>
            <AnimatePresence>
              {inputError && (
                <motion.p
                  id="order-err"
                  className="mt-1 pb-1 pl-8 font-body text-sm text-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {inputError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>
          {/* Search result */}
          <div className="mt-8" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {searchState === "found" && found && (
                <OrderCard key={found.id} order={found} defaultOpen />
              )}

              {searchState === "notfound" && (
                <motion.div
                  key="notfound"
                  className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-border-strong text-gold">
                    <Search size={22} />
                  </span>
                  <h3 className="font-heading text-lg font-semibold tracking-wide">
                    We couldn't find that order
                  </h3>
                  <p className="max-w-sm font-body text-sm leading-relaxed text-muted">
                    Check the number for typos, or{" "}
                    <Link
                      to="/contact"
                      className="font-medium text-gold hover:underline"
                    >
                      contact us
                    </Link>{" "}
                    and we'll look it up.
                  </p>
                </motion.div>
              )}

              {searchState === "error" && (
                <motion.p
                  key="error"
                  role="alert"
                  className="rounded-2xl border border-error/40 bg-error/10 px-5 py-4 font-body text-sm text-error"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  Something went wrong while looking up your order. Please try
                  again.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          {/* My orders */}
          <section className="mt-16 sm:mt-20">
            <motion.div
              className="mx-auto mb-6 max-w-2xl text-center"
              {...fadeUp(0.1)}
            >
              <h2 className="text-2xl font-semibold tracking-wider">
                {user ? "Your orders" : "Orders on this device"}
              </h2>
              <p className="mt-1.5 font-body text-sm leading-relaxed text-muted">
                {user
                  ? "Orders from your account and from this device."
                  : "Orders you placed on this device show up here automatically."}
              </p>
            </motion.div>

            {!authReady || myLoading ? (
              <div className="flex justify-center py-16" aria-label="Loading">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-gold/30 border-t-gold motion-reduce:animate-none" />
              </div>
            ) : listOrders.length === 0 && !found ? (
              <motion.div
                className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center"
                {...fadeUp(0)}
              >
                <span className="grid h-14 w-14 place-items-center rounded-full border border-border-strong text-gold">
                  <ShoppingBag size={24} />
                </span>
                <h3 className="font-heading text-xl font-semibold tracking-wide">
                  No orders yet
                </h3>
                <p className="max-w-sm font-body text-sm leading-relaxed text-muted">
                  When you place an order, you'll be able to follow it here.
                </p>
                <Link
                  to="/shop"
                  className={`mt-3 rounded-full bg-gold-cta px-8 py-3.5 font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none ${ring}`}
                >
                  Browse the shop
                </Link>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-6">
                <AnimatePresence initial={false}>
                  {listOrders.map((o, i) => (
                    <OrderCard key={o.id} order={o} defaultOpen={false} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>
      </main>
    </MotionConfig>
  );
}
