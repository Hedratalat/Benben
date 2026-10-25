// src/pages/Shop.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { db } from "../../firebase";
import { ease, fadeUp } from "../utils/motion";
import { getCardPrice } from "../store/Storecontext";
import ProductCard from "../store/Productcard";

const PER_PAGE = 12;

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-page px-3 text-sm text-heading placeholder:text-muted/70 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

// "Electronics " and "electronics" count as the same category
const norm = (s = "") => String(s).trim().toLowerCase();

const fmt = (n) => Number(n).toLocaleString("en-US");

// 1 … 4 5 6 … 10
function getPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

// Round a step to a "nice" number: 1, 2 or 5 × 10^n (e.g. 130 -> 100, 420 -> 500)
function niceStep(raw) {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return Math.max(1, nice * pow);
}

// Ready-made price ranges, built from the real prices in the shop
function buildPricePresets(maxPrice) {
  if (!maxPrice || maxPrice <= 0) return [];
  const step = niceStep(maxPrice / 4);
  return [
    { key: "p1", label: `Up to ${fmt(step)}`, min: "", max: String(step) },
    {
      key: "p2",
      label: `${fmt(step)} – ${fmt(step * 2)}`,
      min: String(step),
      max: String(step * 2),
    },
    {
      key: "p3",
      label: `${fmt(step * 2)} – ${fmt(step * 3)}`,
      min: String(step * 2),
      max: String(step * 3),
    },
    {
      key: "p4",
      label: `${fmt(step * 3)} & above`,
      min: String(step * 3),
      max: "",
    },
  ];
}

/* ---------- A radio row (used for categories and price ranges) ---------- */
function RadioRow({ name, checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-surface-muted/60">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-border-strong transition-colors peer-checked:border-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface peer-checked:[&>span]:scale-100">
        <span className="h-2 w-2 scale-0 rounded-full bg-gold-cta transition-transform motion-reduce:transition-none" />
      </span>
      <span className="min-w-0 flex-1 break-words font-body text-sm text-heading">
        {label}
      </span>
    </label>
  );
}

/* ---------- One collapsible filter block (Udemy-style) ---------- */
function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded text-left font-heading text-base font-bold tracking-wide text-heading ${ring}`}
      >
        {title}
        <ChevronDown
          size={18}
          className={`text-muted transition-transform motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="-mx-1 overflow-hidden"
          >
            <div className="px-1 pb-1 pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* All filters (used by the sidebar and the mobile drawer)*/
function FiltersPanel({
  idPrefix,
  showCategory = true,
  search,
  setSearch,
  category,
  setCategory,
  categories,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  maxAvailable,
  pricePresets,
}) {
  const anyPrice = minPrice === "" && maxPrice === "";

  return (
    <div>
      <FilterSection title="Search">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className={`${inputCls} pl-9`}
          />
        </div>
      </FilterSection>

      {showCategory && categories.length > 0 && (
        <FilterSection title="Category">
          <div
            role="radiogroup"
            aria-label="Filter by category"
            className="flex flex-col"
          >
            <RadioRow
              name={`${idPrefix}-category`}
              checked={category === "all"}
              onChange={() => setCategory("all")}
              label="All categories"
            />
            {categories.map((c) => (
              <RadioRow
                key={c.key}
                name={`${idPrefix}-category`}
                checked={category === c.key}
                onChange={() => setCategory(c.key)}
                label={c.label}
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Price (EGP)">
        <div
          role="radiogroup"
          aria-label="Choose a price range"
          className="flex flex-col"
        >
          <RadioRow
            name={`${idPrefix}-price`}
            checked={anyPrice}
            onChange={() => {
              setMinPrice("");
              setMaxPrice("");
            }}
            label="Any price"
          />
          {pricePresets.map((p) => (
            <RadioRow
              key={p.key}
              name={`${idPrefix}-price`}
              checked={minPrice === p.min && maxPrice === p.max}
              onChange={() => {
                setMinPrice(p.min);
                setMaxPrice(p.max);
              }}
              label={p.label}
            />
          ))}
        </div>

        <p className="mb-2 mt-4 font-body text-xs font-medium text-muted">
          Or enter your own range
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className={inputCls}
          />
          <span aria-hidden="true" className="text-muted">
            –
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={maxAvailable ? String(maxAvailable) : "Max"}
            aria-label="Maximum price"
            className={inputCls}
          />
        </div>
      </FilterSection>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const resultsRef = useRef(null);

  // Same live query used by ProductsSection
  useEffect(() => {
    const q = query(collection(db, "Products"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading products:", err.code, err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Categories come from the products themselves
  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const key = norm(p.category);
      if (!key) return;
      if (!map.has(key)) map.set(key, { key, label: p.category.trim() });
    });
    return [...map.values()];
  }, [products]);

  // Highest price in the shop (the "Max" hint + base for the price ranges)
  const maxAvailable = useMemo(
    () => products.reduce((m, p) => Math.max(m, getCardPrice(p).price || 0), 0),
    [products],
  );
  const pricePresets = useMemo(
    () => buildPricePresets(maxAvailable),
    [maxAvailable],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    return products.filter((p) => {
      if (category !== "all" && norm(p.category) !== category) return false;

      if (term) {
        const haystack = `${p.name || ""} ${p.category || ""} ${
          p.description || ""
        }`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      const { price } = getCardPrice(p);
      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;

      return true;
    });
  }, [products, search, category, minPrice, maxPrice]);

  // Back to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [search, category, minPrice, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + PER_PAGE);

  function goToPage(p) {
    if (p < 1 || p > totalPages || p === currentPage) return;
    setPage(p);
    if (resultsRef.current) {
      const top =
        resultsRef.current.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  const activeCount = [
    search.trim() !== "",
    category !== "all",
    minPrice !== "" || maxPrice !== "",
  ].filter(Boolean).length;
  const hasFilters = activeCount > 0;
  const drawerActiveCount = [
    search.trim() !== "",
    minPrice !== "" || maxPrice !== "",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setMinPrice("");
    setMaxPrice("");
  }

  // Mobile drawer: lock scroll + close with Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const panelProps = {
    search,
    setSearch,
    category,
    setCategory,
    categories,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    maxAvailable,
    pricePresets,
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-hidden bg-page px-4 pb-20 pt-32 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Heading (same pattern as About / Contact) */}
          <header className="mb-10 max-w-2xl sm:mb-14">
            <motion.h2
              className="text-4xl font-bold tracking-wider sm:text-5xl"
              {...fadeUp(0)}
            >
              Shop
            </motion.h2>
            <motion.p
              className="mt-2 font-body text-sm leading-normal text-muted sm:text-base"
              {...fadeUp(0.12)}
            >
              The whole catalogue, hand-picked and vetted. Search by name or
              filter by category and price.
            </motion.p>
          </header>

          <div className="grid items-start gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
            {/* ===== Sidebar (desktop) ===== */}
            <motion.aside
              className="hidden rounded-2xl border border-border bg-surface p-5 shadow-luxury lg:block"
              {...fadeUp(0.2)}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-lg font-bold tracking-wide text-heading">
                  Filters
                </h3>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`rounded font-body text-sm font-medium text-heading underline-offset-4 hover:underline ${ring}`}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <FiltersPanel idPrefix="side" {...panelProps} />
            </motion.aside>

            {/* ===== Products ===== */}
            <div ref={resultsRef} className="min-w-0">
              {/* Result count for screen readers only */}
              <p className="sr-only" role="status" aria-live="polite">
                {loading
                  ? "Loading..."
                  : `${filtered.length} ${
                      filtered.length === 1 ? "product" : "products"
                    }`}
              </p>

              {/* Toolbar (mobile only): Filters button + all category chips, wrapping */}
              <div className="mb-5 flex flex-wrap items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 font-body text-sm font-medium text-heading transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-page"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {drawerActiveCount > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold-cta px-1 text-[11px] font-bold text-heading">
                      {drawerActiveCount}
                    </span>
                  )}
                </button>

                {categories.length > 0 && (
                  <div
                    role="radiogroup"
                    aria-label="Filter by category"
                    className="contents"
                  >
                    {[{ key: "all", label: "All" }, ...categories].map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        role="radio"
                        aria-checked={category === c.key}
                        onClick={() => setCategory(c.key)}
                        className={`h-10 rounded-full border px-4 font-body text-sm transition-colors ${
                          category === c.key
                            ? "border-surface-dark bg-surface-dark text-surface"
                            : "border-border-strong/60 text-heading hover:border-gold"
                        } ${ring}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="aspect-[4/6] animate-pulse rounded-2xl bg-surface-muted"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center"
                  {...fadeUp(0.1)}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-border-strong text-gold">
                    <PackageSearch size={24} />
                  </span>
                  <h3 className="font-heading text-xl font-semibold tracking-wide text-heading">
                    {products.length === 0
                      ? "Nothing here yet"
                      : "No products match your filters"}
                  </h3>
                  <p className="max-w-sm font-body text-sm leading-relaxed text-muted">
                    {products.length === 0
                      ? "New pieces are on their way. Check back soon."
                      : "Try a different word, or widen the price range."}
                  </p>
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className={`mt-3 rounded-full bg-gold-cta px-8 py-3.5 font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none ${ring}`}
                    >
                      Clear filters
                    </button>
                  )}
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
                    {pageItems.map((p, i) => (
                      <motion.div
                        key={p.id}
                        className="h-full"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: (i % 3) * 0.08,
                          ease,
                        }}
                      >
                        <ProductCard product={p} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav
                      aria-label="Pagination"
                      className="mt-10 flex flex-wrap items-center justify-center gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                        className={`grid h-10 w-10 place-items-center rounded-full bg-surface-muted text-heading transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface-muted ${ring}`}
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {getPages(currentPage, totalPages).map((p, i) =>
                        p === "…" ? (
                          <span
                            key={`gap-${i}`}
                            aria-hidden="true"
                            className="px-1 text-muted"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => goToPage(p)}
                            aria-label={`Page ${p}`}
                            aria-current={
                              p === currentPage ? "page" : undefined
                            }
                            className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition ${
                              p === currentPage
                                ? "bg-gold-cta text-heading"
                                : "bg-surface-muted text-heading hover:bg-gold-hover"
                            } ${ring}`}
                          >
                            {p}
                          </button>
                        ),
                      )}

                      <button
                        type="button"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                        className={`grid h-10 w-10 place-items-center rounded-full bg-surface-muted text-heading transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface-muted ${ring}`}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ===== Filters drawer (mobile) ===== */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-[100] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-surface-dark/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-surface shadow-luxury"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease }}
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="font-heading text-lg font-bold tracking-wide text-heading">
                  Filters
                </h3>
                <div className="flex items-center gap-3">
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className={`rounded font-body text-sm font-medium text-heading underline-offset-4 hover:underline ${ring}`}
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close filters"
                    className={`grid h-9 w-9 place-items-center rounded-full bg-surface-muted text-heading transition hover:bg-gold-hover ${ring}`}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <FiltersPanel
                  idPrefix="drawer"
                  showCategory={false}
                  {...panelProps}
                />
              </div>

              <div className="border-t border-border p-4">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className={`h-12 w-full rounded-full bg-gold-cta font-heading text-base font-bold tracking-wider text-surface-dark transition active:brightness-90 ${ring}`}
                >
                  Show {filtered.length}{" "}
                  {filtered.length === 1 ? "product" : "products"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
