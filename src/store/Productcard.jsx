// ProductCard.jsx
// كارت المنتج + المودال بتاعه. استخدمه في أي صفحة: <ProductCard product={p} />
import { useEffect, useMemo, useState } from "react";
import { Check, Heart, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { formatPrice, getCardPrice, getPrice, useStore } from "./Storecontext";

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/* ---------- بادجات المنتج (بيستخدمها الكارت والمودال) ---------- */
function Tags({ pct }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pct > 0 && (
        <span className="rounded-full bg-error px-2 py-1 text-[10px] font-bold leading-none text-primary-foreground sm:px-2.5 sm:py-1 sm:text-[11px]">
          {" "}
          -{pct}%
        </span>
      )}
    </div>
  );
}

function Price({ price, oldPrice, hasDiscount, from, large = false }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {from && <span className="text-xs text-muted">From</span>}
      <span
        className={`font-heading font-bold text-heading ${
          large ? "text-2xl" : "text-base"
        }`}
      >
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <span className="text-xs text-muted line-through">
          {formatPrice(oldPrice)}
        </span>
      )}
    </p>
  );
}

function FavButton({ id, name, className = "" }) {
  const { isFav, toggleFav } = useStore();
  const on = isFav(id);
  return (
    <button
      type="button"
      onClick={() => toggleFav(id)}
      aria-pressed={on}
      aria-label={
        on ? `Remove ${name} from favorites` : `Add ${name} to favorites`
      }
      className={`grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/90 backdrop-blur transition hover:scale-105 motion-reduce:transition-none ${ring} ${className}`}
    >
      <Heart
        size={18}
        className={on ? "fill-error text-error" : "text-heading"}
      />
    </button>
  );
}

/* ---------- المودال ---------- */
function ProductModal({ product, onClose }) {
  const { addToCart } = useStore();
  const variants = product.variants || [];
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants[variantIdx] || null;
  const { price, oldPrice, hasDiscount, pct } = getPrice(product, variant);

  // معرض الصور: الأساسية + التفاصيل + صور الـ variants (من غير تكرار)
  const gallery = useMemo(() => {
    const all = [
      product.image,
      ...(product.images || []),
      ...variants.map((v) => v.image),
    ].filter(Boolean);
    return [...new Set(all)];
  }, [product, variants]);

  const [activeImg, setActiveImg] = useState(variant?.image || product.image);

  function pickVariant(i) {
    setVariantIdx(i);
    if (variants[i]?.image) setActiveImg(variants[i].image);
  }

  // قفل السكرول + Escape
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  function handleAdd() {
    addToCart(product, { variant, qty });
    setAdded(true);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-surface-dark/70 backdrop-blur-sm sm:items-center sm:px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative grid max-h-[92svh] w-full max-w-4xl overflow-y-auto rounded-t-3xl border border-border bg-surface shadow-luxury sm:rounded-3xl md:grid-cols-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-surface/90 text-heading backdrop-blur transition hover:bg-surface-muted ${ring}`}
        >
          <X size={18} />
        </button>

        {/* الصور */}
        <div className="flex flex-col gap-3 bg-surface-muted p-4 sm:p-5">
          <div className="aspect-square overflow-hidden rounded-2xl bg-page">
            {activeImg && (
              <img
                src={activeImg}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImg(src)}
                  aria-label="Show image"
                  aria-current={src === activeImg}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-page transition ${
                    src === activeImg
                      ? "border-gold"
                      : "border-transparent hover:border-border-strong"
                  } ${ring}`}
                >
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* التفاصيل */}
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <Tags product={product} pct={pct} />

          <div>
            {product.category && (
              <p className="mb-1 text-xs text-muted">{product.category}</p>
            )}
            <h3 className="pr-10 font-heading text-2xl font-bold leading-tight text-heading">
              {product.name}
            </h3>
          </div>

          <Price
            price={price}
            oldPrice={oldPrice}
            hasDiscount={hasDiscount}
            large
          />

          {product.description && (
            <p className="text-sm leading-6 text-muted">
              {product.description}
            </p>
          )}

          {variants.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-heading">
                Option: <span className="text-muted">{variant?.label}</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, i) => (
                  <button
                    key={`${v.label}-${i}`}
                    type="button"
                    onClick={() => pickVariant(i)}
                    aria-pressed={i === variantIdx}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      i === variantIdx
                        ? "border-surface-dark bg-surface-dark text-primary-foreground"
                        : "border-border-strong bg-page text-heading hover:border-gold"
                    } ${ring}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex h-12 items-center rounded-full border border-border-strong bg-page">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className={`grid h-12 w-11 place-items-center rounded-full text-heading transition hover:bg-surface-muted ${ring}`}
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-heading">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
                className={`grid h-12 w-11 place-items-center rounded-full text-heading transition hover:bg-surface-muted ${ring}`}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className={`order-last inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gold-cta px-6 text-sm font-semibold text-surface-dark transition hover:opacity-90 active:brightness-90 ${ring}`}
            >
              {added ? (
                <>
                  <Check size={18} className="shrink-0" />
                  <span className="whitespace-nowrap">Added to cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={18} className="shrink-0" />
                  <span className="whitespace-nowrap">Add to cart</span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">
                    {formatPrice(price * qty)}
                  </span>
                </>
              )}
            </button>
            <FavButton
              id={product.id}
              name={product.name}
              className="h-12 w-12"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- الكارت ---------- */
export default function ProductCard({ product }) {
  const { addToCart } = useStore();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const { price, oldPrice, hasDiscount, pct, from } = getCardPrice(product);
  const hasVariants = (product.variants || []).length > 0;

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  // لو فيه اختيارات لازم العميل يختار الأول (يفتح المودال)، غير كده نضيف على طول
  function handleQuickAdd() {
    if (hasVariants) return setOpen(true);
    addToCart(product);
    setAdded(true);
  }

  return (
    <>
      <article className="group flex flex-col  h-full overflow-hidden rounded-2xl border border-border bg-surface transition duration-300 hover:-translate-y-1 hover:shadow-luxury motion-reduce:transition-none">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`View ${product.name}`}
            className={`absolute inset-0 h-full w-full ${ring}`}
          >
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </button>

          <div className="pointer-events-none absolute left-2 top-2 sm:left-3 sm:top-3">
            <Tags product={product} pct={pct} />
          </div>

          <FavButton
            id={product.id}
            name={product.name}
            className="absolute right-2 top-2 !h-8 !w-8 sm:right-3 sm:top-3 sm:!h-10 sm:!w-10"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-2.5 sm:p-4">
          <div className="min-w-0">
            {product.category && (
              <p className="mb-0.5 truncate text-xs text-muted">
                {product.category}
              </p>
            )}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`block w-full truncate rounded text-left font-heading text-sm font-bold tracking-wide text-heading hover:text-gold-pressed sm:text-base ${ring}`}
            >
              {product.name}
            </button>
          </div>
          <Price
            price={price}
            oldPrice={oldPrice}
            hasDiscount={hasDiscount}
            from={from}
          />
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`mt-auto flex h-11 w-full shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full px-1 text-[11px] font-semibold leading-none transition active:brightness-90 sm:gap-2 sm:px-4 sm:text-sm ${
              added
                ? "bg-success text-primary-foreground"
                : "bg-surface-dark text-primary-foreground hover:bg-primary-hover"
            } ${ring}`}
          >
            {added ? (
              <>
                <Check size={16} className="hidden shrink-0 sm:block" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag size={16} className="hidden shrink-0 sm:block" />
                <span>{hasVariants ? "Choose options" : "Add to cart"}</span>
              </>
            )}
          </button>
        </div>
      </article>

      {open && (
        <ProductModal product={product} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
