// SlidesDashboard.jsx
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Link2,
  Megaphone,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";

const COLLECTION = "HeroSlides";
const PRODUCTS_COLLECTION = "Products";

const EMPTY_FORM = {
  badge: "",
  title: "",
  description: "",
  image: "",
  oldPrice: "",
  newPrice: "",
  buttonText: "",
  buttonLink: "",
  order: "",
  linkedProductId: "",
};

const inputCls =
  "w-full rounded-lg border border-border bg-page px-3 text-sm text-heading placeholder:text-muted/70 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

const lockedCls = " bg-surface-muted text-muted cursor-not-allowed";

// If the product has variants, use the first variant's prices
function getProductPrices(p) {
  const src =
    Array.isArray(p.variants) && p.variants.length > 0 ? p.variants[0] : p;
  return { oldPrice: src.oldPrice ?? "", newPrice: src.newPrice ?? "" };
}

// Map a product to the slide fields that get auto-filled and locked
function productToFields(p) {
  return {
    title: p.name || "",
    description: p.description || "",
    image: p.image || "",
    ...getProductPrices(p),
  };
}

export default function HeroDashboard() {
  const [slides, setSlides] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [slideType, setSlideType] = useState("promo"); // "promo" | "product"
  const [editingId, setEditingId] = useState(null); // null = add mode
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const isLinked = slideType === "product";

  function showToast(message) {
    setToast({ message, key: Date.now() });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Live slides from Firestore, sorted by order
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setSlides(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading slides:", err.code, err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Live products (used for the product picker)
  useEffect(() => {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      orderBy("order", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Error loading products:", err.code, err.message);
      },
    );
    return () => unsub();
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function switchType(type) {
    if (type === slideType) return;
    setSlideType(type);
    // Keep badge and order, reset everything else so no stale/locked data stays
    setForm((prev) => ({
      ...EMPTY_FORM,
      badge: prev.badge,
      order: prev.order,
    }));
  }

  function handleProductSelect(e) {
    const picked = products.find((p) => p.id === e.target.value);
    if (!picked) {
      setForm((prev) => ({
        ...prev,
        ...productToFields({}),
        linkedProductId: "",
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      ...productToFields(picked),
      linkedProductId: picked.id,
    }));
  }

  function startEdit(slide) {
    setEditingId(slide.id);
    const linked = slide.linkedProductId
      ? products.find((p) => p.id === slide.linkedProductId)
      : null;
    setSlideType(slide.linkedProductId ? "product" : "promo");
    setForm({
      badge: slide.badge || "",
      title: slide.title || "",
      description: slide.description || "",
      image: slide.image || "",
      oldPrice: slide.oldPrice ?? "",
      newPrice: slide.newPrice ?? "",
      buttonText: slide.buttonText || "",
      buttonLink: slide.buttonLink || "",
      order: slide.order ?? "",
      linkedProductId: slide.linkedProductId || "",
      // Pull fresh data from the live product when it still exists
      ...(linked ? productToFields(linked) : {}),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setSlideType("promo");
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isLinked && !form.linkedProductId) {
      showToast("Choose a product first");
      return;
    }

    try {
      // If no order is given, put the slide last automatically
      const finalOrder =
        form.order === "" || form.order === null
          ? slides.length === 0
            ? 1
            : Math.max(...slides.map((s) => Number(s.order) || 0)) + 1
          : Number(form.order);

      const data = isLinked
        ? {
            ...form,
            // "Buy now" adds the product straight to the cart on the storefront
            buttonText: "Buy now",
            buttonLink: "",
            order: finalOrder,
          }
        : {
            ...form,
            linkedProductId: "",
            oldPrice: "",
            newPrice: "",
            order: finalOrder,
          };

      if (editingId) {
        await updateDoc(doc(db, COLLECTION, editingId), data);
        showToast("Slide updated");
      } else {
        await addDoc(collection(db, COLLECTION), {
          ...data,
          createdAt: serverTimestamp(),
        });
        showToast("Slide added");
      }
      cancelEdit();
    } catch (err) {
      console.error("Error saving slide:", err.code, err.message);
    }
  }

  // Swap the order of two neighbouring slides in one atomic write
  async function moveSlide(index, direction) {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const current = slides[index];
    const target = slides[targetIndex];

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, COLLECTION, current.id), { order: target.order });
      batch.update(doc(db, COLLECTION, target.id), { order: current.order });
      await batch.commit();
    } catch (err) {
      console.error("Error reordering slides:", err.code, err.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, COLLECTION, deleteTarget.id));
      if (editingId === deleteTarget.id) cancelEdit();
      showToast("Slide deleted");
    } catch (err) {
      console.error("Error deleting slide:", err.code, err.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  const previewButtonText = isLinked ? "Buy now" : form.buttonText;

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

      <h2 className="mb-6 font-heading text-2xl font-bold text-heading">
        {editingId ? "Edit slide" : "Add new slide"}
      </h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-10 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-luxury sm:p-6"
      >
        {/* Slide type */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-heading">Slide type</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => switchType("promo")}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                !isLinked
                  ? "border-gold bg-surface-muted ring-1 ring-gold"
                  : "border-border bg-page hover:border-gold"
              }`}
            >
              <Megaphone
                size={18}
                className="mt-0.5 shrink-0 text-gold-pressed"
              />
              <span>
                <span className="block text-sm font-semibold text-heading">
                  Promo slide
                </span>
                <span className="block text-xs text-muted">
                  Free content. The button goes to a page you choose.
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => switchType("product")}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                isLinked
                  ? "border-gold bg-surface-muted ring-1 ring-gold"
                  : "border-border bg-page hover:border-gold"
              }`}
            >
              <ShoppingBag
                size={18}
                className="mt-0.5 shrink-0 text-gold-pressed"
              />
              <span>
                <span className="block text-sm font-semibold text-heading">
                  Linked product
                </span>
                <span className="block text-xs text-muted">
                  Pick a product. "Buy now" adds it to the cart.
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Product picker (linked mode only) */}
        {isLinked && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-heading">Product</label>
            <select
              value={form.linkedProductId}
              onChange={handleProductSelect}
              className={`h-11 ${inputCls}`}
            >
              <option value="">Choose a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="flex items-start gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs leading-5 text-muted">
              <Link2 size={14} className="mt-0.5 shrink-0 text-gold-pressed" />
              Title, description, image and price come from the product and are
              locked. To change them, edit the product, then reopen this slide.
            </p>
          </div>
        )}

        {/* Live preview */}
        <div className="relative h-44 overflow-hidden rounded-xl border border-border-dark bg-surface-dark">
          {form.image && (
            <img
              src={form.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-50"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div className="relative flex h-full flex-col justify-end gap-2 p-5">
            {form.badge && (
              <span className="w-fit rounded-full bg-gold px-3 py-0.5 text-xs font-semibold text-heading">
                {form.badge}
              </span>
            )}
            <p className="font-heading text-xl font-semibold text-primary-foreground">
              {form.title || "Slide title"}
            </p>
            <p className="line-clamp-2 text-sm text-primary-foreground/70">
              {form.description || "A short description will appear here."}
            </p>
            {isLinked && form.oldPrice !== "" && (
              <p className="text-sm font-semibold text-gold">
                {form.newPrice ? (
                  <>
                    {form.newPrice} EGP
                    <span className="ml-2 text-xs font-normal text-primary-foreground/60 line-through">
                      {form.oldPrice} EGP
                    </span>
                  </>
                ) : (
                  <>{form.oldPrice} EGP</>
                )}
              </p>
            )}
            {previewButtonText && (
              <span className="w-fit rounded-full bg-gold-cta px-4 py-1.5 text-xs font-semibold text-heading">
                {previewButtonText}
              </span>
            )}
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] text-primary-foreground">
            Preview
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-heading">Badge</label>
          <input
            name="badge"
            value={form.badge}
            onChange={handleChange}
            placeholder="e.g. 20% off"
            className={`h-11 ${inputCls}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-heading">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            readOnly={isLinked}
            placeholder="e.g. Summer Collection"
            className={`h-11 ${inputCls}${isLinked ? lockedCls : ""}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-heading">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            readOnly={isLinked}
            rows={3}
            placeholder="A short description of the slide..."
            className={`resize-none py-2 ${inputCls}${isLinked ? lockedCls : ""}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-heading">Image URL</label>
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            required
            readOnly={isLinked}
            placeholder="https://..."
            className={`h-11 ${inputCls}${isLinked ? lockedCls : ""}`}
          />
        </div>

        {/* Prices (linked mode only) */}
        {isLinked && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-heading">
                Price before discount
              </label>
              <input
                name="oldPrice"
                value={form.oldPrice}
                type="number"
                readOnly
                className={`h-11 ${inputCls}${lockedCls}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-heading">
                Price after discount
              </label>
              <input
                name="newPrice"
                value={form.newPrice}
                type="number"
                readOnly
                className={`h-11 ${inputCls}${lockedCls}`}
              />
            </div>
          </div>
        )}

        {/* Button fields (promo mode only) */}
        {!isLinked && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-heading">
                Button text <span className="text-muted">(optional)</span>
              </label>
              <input
                name="buttonText"
                value={form.buttonText}
                onChange={handleChange}
                placeholder="e.g. Shop now"
                className={`h-11 ${inputCls}`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-heading">
                Button link <span className="text-muted">(optional)</span>
              </label>
              <input
                name="buttonLink"
                value={form.buttonLink}
                onChange={handleChange}
                placeholder="e.g. /products"
                className={`h-11 ${inputCls}`}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-heading">
            Display order <span className="text-muted">(optional)</span>
          </label>
          <input
            name="order"
            value={form.order}
            onChange={handleChange}
            type="number"
            placeholder="1 shows first, 2 after it, and so on. Empty = last"
            className={`h-11 ${inputCls}`}
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            className="h-11 rounded-full bg-gold-cta px-6 text-sm font-semibold text-heading transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {editingId ? "Save changes" : "Add slide"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="h-11 rounded-full border border-border-strong px-6 text-sm font-medium text-heading transition hover:bg-surface-muted"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Current slides */}
      <h2 className="mb-4 font-heading text-xl font-bold text-heading">
        Current slides (in display order)
      </h2>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : slides.length === 0 ? (
        <p className="text-sm text-muted">
          No slides yet. Add your first one above.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {slides.map((slide, index) => {
            const linkedProduct = slide.linkedProductId
              ? products.find((p) => p.id === slide.linkedProductId)
              : null;
            // Linked slide whose product was deleted
            const productMissing =
              !!slide.linkedProductId && products.length > 0 && !linkedProduct;

            return (
              <div
                key={slide.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
              >
                {/* Order arrows */}
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={() => moveSlide(index, "up")}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-muted text-heading transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface-muted"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveSlide(index, "down")}
                    disabled={index === slides.length - 1}
                    aria-label="Move down"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-muted text-heading transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface-muted"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <span className="w-6 shrink-0 text-center text-xs font-bold text-gold-pressed">
                  {index + 1}
                </span>

                <img
                  src={slide.image}
                  alt={slide.title}
                  className="h-14 w-14 shrink-0 rounded-lg bg-surface-muted object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-heading">
                    {slide.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {slide.badge || slide.description}
                  </p>
                  {slide.linkedProductId && (
                    <p
                      className={`mt-1 flex items-center gap-1 text-[11px] font-semibold ${
                        productMissing ? "text-error" : "text-gold-pressed"
                      }`}
                    >
                      {productMissing ? (
                        <>
                          <AlertTriangle size={12} />
                          Product deleted. Buy now won't work.
                        </>
                      ) : (
                        <>
                          <Link2 size={12} />
                          Linked product
                        </>
                      )}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => startEdit(slide)}
                  aria-label="Edit"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-heading transition hover:bg-gold-hover"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(slide)}
                  aria-label="Delete"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/10 text-error transition hover:bg-error/20"
                >
                  <Trash2 size={16} />
                </button>
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
              Delete slide
            </h3>
            <p className="mb-6 text-sm text-muted">
              Are you sure you want to delete{" "}
              <span className="font-bold text-heading">
                "{deleteTarget.title}"
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
