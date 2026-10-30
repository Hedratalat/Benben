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
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  Pencil,
  Trash2,
  X,
  Plus,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Images,
  Sparkles,
  Star,
  ChevronRight,
  ChevronLeft,
  Tag,
} from "lucide-react";

const COLLECTION_NAME = "Products";
const PROMO_COLLECTION_NAME = "PromoCodes";
const CATEGORY_COLLECTION_NAME = "Categories";
const PRODUCTS_PER_PAGE = 8;

const EMPTY_FORM = {
  name: "",
  category: "",
  description: "",
  image: "", // main image
  images: [], // detail images (array)
  oldPrice: "",
  newPrice: "",
  order: "",
  isNewArrival: false,
  isBestSeller: false,
  variants: [],
};

const inputCls =
  "w-full rounded-lg border border-border bg-page px-3 text-sm text-heading placeholder:text-muted/70 outline-none transition focus:border-gold focus:ring-1 focus:ring-gold";

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [promoCodes, setPromoCodes] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoType, setPromoType] = useState("general");
  const [promoLoading, setPromoLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(true);

  function showToast(message) {
    setToast({ message, key: Date.now() });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading products:", err.code, err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, PROMO_COLLECTION_NAME),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setPromoCodes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setPromoLoading(false);
      },
      (err) => {
        console.error("Error loading promo codes:", err.code, err.message);
        setPromoLoading(false);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, CATEGORY_COLLECTION_NAME),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCategoryLoading(false);
      },
      (err) => {
        console.error("Error loading categories:", err.code, err.message);
        setCategoryLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(products.length / PRODUCTS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginatedProducts = products.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE,
  );

  function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  //  Detail images
  function handleImageFieldChange(index, value) {
    setForm((prev) => {
      const updated = [...prev.images];
      updated[index] = value;
      return { ...prev, images: updated };
    });
  }

  function addImageField() {
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
  }

  function removeImageField(index) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  //  Variants
  function handleVariantChange(index, field, value) {
    setForm((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  }

  function addVariant() {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { label: "", image: "", oldPrice: "", newPrice: "" },
      ],
    }));
  }

  function removeVariant(index) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description,
      image: product.image,
      images: Array.isArray(product.images) ? product.images : [],
      oldPrice: product.oldPrice,
      newPrice: product.newPrice,
      order: product.order,
      isNewArrival: !!product.isNewArrival,
      isBestSeller: !!product.isBestSeller,
      variants: Array.isArray(product.variants) ? product.variants : [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      // No order given: put it last
      const finalOrder =
        form.order === "" || form.order === null
          ? products.length === 0
            ? 1
            : Math.max(...products.map((p) => Number(p.order) || 0)) + 1
          : Number(form.order);

      // Remove empty detail images before saving
      const cleanedImages = form.images
        .map((img) => img.trim())
        .filter((img) => img !== "");

      const cleanedVariants = form.variants
        .map((v) => ({
          label: v.label.trim(),
          image: v.image.trim(),
          oldPrice: v.oldPrice,
          newPrice: v.newPrice,
        }))
        .filter((v) => v.label && v.oldPrice !== "");

      const dataToSave = {
        ...form,
        name: form.name.trim(),
        category: form.category.trim(),
        images: cleanedImages,
        variants: cleanedVariants,
        order: finalOrder,
      };
      if (editingId) {
        await updateDoc(doc(db, COLLECTION_NAME, editingId), dataToSave);
        showToast("Product updated");
      } else {
        await addDoc(collection(db, COLLECTION_NAME), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        showToast("Product added");
      }
      cancelEdit();
    } catch (err) {
      console.error("Error saving product:", err);
    }
  }

  // Swap the order of two neighbouring products (works on the full list, not just the page)
  async function moveProduct(fullIndex, direction) {
    const targetIndex = direction === "up" ? fullIndex - 1 : fullIndex + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const current = products[fullIndex];
    const target = products[targetIndex];

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, COLLECTION_NAME, current.id), {
        order: target.order,
      });
      batch.update(doc(db, COLLECTION_NAME, target.id), {
        order: current.order,
      });
      await batch.commit();
    } catch (err) {
      console.error("Error reordering products:", err);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, deleteTarget.id));
      if (editingId === deleteTarget.id) cancelEdit();
      showToast("Product deleted");
    } catch (err) {
      console.error("Error deleting product:", err);
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleAddPromoCode(e) {
    e.preventDefault();
    const trimmedCode = promoCode.trim();
    const percent = parseFloat(promoDiscount);

    if (!trimmedCode) return;
    if (!percent || percent <= 0 || percent > 100) return;

    try {
      await setDoc(doc(db, PROMO_COLLECTION_NAME, trimmedCode), {
        code: trimmedCode,
        discountPercent: percent,
        type: promoType, // "general" or "firstOrder"
        active: true,
        createdAt: serverTimestamp(),
      });
      showToast("Promo code added");
      setPromoCode("");
      setPromoDiscount("");
      setPromoType("general");
    } catch (err) {
      console.error("Error adding promo code:", err);
    }
  }

  async function deletePromoCode(id) {
    try {
      await deleteDoc(doc(db, PROMO_COLLECTION_NAME, id));
      showToast("Promo code deleted");
    } catch (err) {
      console.error("Error deleting promo code:", err);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    const name = categoryName.trim();
    const image = categoryImage.trim();
    if (!name || !image) return;

    try {
      // اسم الكاتيجوري هو الـ id، فمش هيتكرر
      await setDoc(doc(db, CATEGORY_COLLECTION_NAME, name), {
        name,
        image,
        createdAt: serverTimestamp(),
      });
      showToast("Category saved");
      setCategoryName("");
      setCategoryImage("");
    } catch (err) {
      console.error("Error adding category:", err);
    }
  }

  async function deleteCategory(id) {
    try {
      await deleteDoc(doc(db, CATEGORY_COLLECTION_NAME, id));
      showToast("Category deleted");
    } catch (err) {
      console.error("Error deleting category:", err);
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

      <h2 className="mb-6 font-heading text-2xl font-bold text-heading">
        {editingId ? "Edit product" : "Add new product"}
      </h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-10 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-luxury sm:p-6"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-heading">
            Product name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Wireless Earbuds Pro"
            className={`h-11 ${inputCls}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-heading">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className={`h-11 ${inputCls}`}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-xs text-muted">
              No categories yet. Add one in the "Categories" section below
              first.
            </p>
          )}
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
            rows={3}
            placeholder="A short description of the product..."
            className={`resize-none py-2 ${inputCls}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-heading">
            Main image URL
          </label>
          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            required
            placeholder="https://..."
            className={`h-11 ${inputCls}`}
          />
        </div>

        {/* ===== Detail images ===== */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-heading">
              Detail images <span className="text-muted">(optional)</span>
            </label>
            <button
              type="button"
              onClick={addImageField}
              className="flex items-center gap-1 text-xs font-semibold text-gold-pressed transition hover:opacity-80"
            >
              <Plus size={14} />
              Add image
            </button>
          </div>

          {form.images.length === 0 ? (
            <p className="text-xs text-muted">
              No detail images yet. Click "Add image" to add one.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {form.images.map((imgUrl, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={imgUrl}
                    onChange={(e) =>
                      handleImageFieldChange(index, e.target.value)
                    }
                    placeholder={`Detail image URL ${index + 1}`}
                    className={`h-11 flex-1 ${inputCls}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeImageField(index)}
                    aria-label="Remove image"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/10 text-error transition hover:bg-error/20"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Variants / Options ===== */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-heading">
              Variants / Options <span className="text-muted">(optional)</span>
            </label>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 text-xs font-semibold text-gold-pressed transition hover:opacity-80"
            >
              <Plus size={14} />
              Add variant
            </button>
          </div>

          {form.variants.length === 0 ? (
            <p className="text-xs text-muted">
              If this product comes in several options (size, color, pack...),
              click "Add variant". The base price below then becomes optional.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {form.variants.map((v, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-3"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-page">
                    {v.image ? (
                      <img
                        src={v.image}
                        alt=""
                        className="h-full w-full object-contain"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <Images size={18} className="text-muted/60" />
                    )}
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <input
                      value={v.label}
                      onChange={(e) =>
                        handleVariantChange(index, "label", e.target.value)
                      }
                      required
                      placeholder="Option name (e.g. Large, Red, Pack of 2)"
                      className={`col-span-2 h-10 ${inputCls}`}
                    />
                    <input
                      value={v.image}
                      onChange={(e) =>
                        handleVariantChange(index, "image", e.target.value)
                      }
                      placeholder="Image URL for this variant (optional)"
                      className={`col-span-2 h-10 ${inputCls}`}
                    />
                    <input
                      value={v.oldPrice}
                      onChange={(e) =>
                        handleVariantChange(index, "oldPrice", e.target.value)
                      }
                      required
                      type="number"
                      placeholder="Price before discount"
                      className={`h-10 ${inputCls}`}
                    />
                    <input
                      value={v.newPrice}
                      onChange={(e) =>
                        handleVariantChange(index, "newPrice", e.target.value)
                      }
                      type="number"
                      placeholder="After discount (optional)"
                      className={`h-10 ${inputCls}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    aria-label="Remove variant"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/10 text-error transition hover:bg-error/20"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-heading">
              Price before discount
            </label>
            <input
              name="oldPrice"
              value={form.oldPrice}
              onChange={handleChange}
              required={form.variants.length === 0}
              type="number"
              className={`h-11 ${inputCls}`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-heading">
              Price after discount{" "}
              <span className="text-muted">(optional)</span>
            </label>
            <input
              name="newPrice"
              value={form.newPrice}
              onChange={handleChange}
              type="number"
              className={`h-11 ${inputCls}`}
            />
          </div>
        </div>

        {/* ===== Product tags ===== */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-heading">Product tags</span>
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer">
              <input
                type="checkbox"
                name="isNewArrival"
                checked={form.isNewArrival}
                onChange={handleChange}
                className="peer sr-only"
              />
              <span className="flex items-center gap-2 rounded-xl border border-border-strong bg-page px-4 py-2.5 text-sm font-medium text-heading transition hover:border-gold peer-checked:border-surface-dark peer-checked:bg-surface-dark peer-checked:text-primary-foreground peer-checked:[&>svg]:text-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                <Sparkles size={16} className="text-muted" />
                New arrival
              </span>
            </label>

            <label className="cursor-pointer">
              <input
                type="checkbox"
                name="isBestSeller"
                checked={form.isBestSeller}
                onChange={handleChange}
                className="peer sr-only"
              />
              <span className="flex items-center gap-2 rounded-xl border border-border-strong bg-page px-4 py-2.5 text-sm font-medium text-heading transition hover:border-gold peer-checked:border-gold peer-checked:bg-gold peer-checked:text-heading peer-checked:[&>svg]:fill-current peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                <Star size={16} className="text-muted" />
                Best seller
              </span>
            </label>
          </div>
        </div>

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
            {editingId ? "Save changes" : "Add product"}
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

      {/* ===== Categories ===== */}
      <div className="mb-10 mt-10">
        <h2 className="mb-4 font-heading text-2xl font-bold text-heading">
          Categories
        </h2>

        <form
          onSubmit={handleAddCategory}
          className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-luxury sm:flex-row sm:items-end sm:p-6"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-heading">
              Category name
            </label>
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              placeholder="e.g. Electronics"
              className={`h-11 ${inputCls}`}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-heading">
              Image URL
            </label>
            <input
              value={categoryImage}
              onChange={(e) => setCategoryImage(e.target.value)}
              required
              placeholder="https://..."
              className={`h-11 ${inputCls}`}
            />
          </div>
          <button
            type="submit"
            className="h-11 whitespace-nowrap rounded-full bg-gold-cta px-6 text-sm font-semibold text-heading transition hover:opacity-90"
          >
            Save category
          </button>
        </form>

        {categoryLoading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted">
            No categories yet. Create your first one above.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-14 w-14 shrink-0 rounded-lg bg-surface-muted object-cover"
                />
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-heading">
                  {cat.name}
                </p>
                <button
                  onClick={() => {
                    setCategoryName(cat.name);
                    setCategoryImage(cat.image);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-label="Edit category"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-heading transition hover:bg-gold-hover"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  aria-label="Delete category"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/10 text-error transition hover:bg-error/20"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Promo codes ===== */}
      <div className="mb-10 mt-10">
        <h2 className="mb-4 font-heading text-2xl font-bold text-heading">
          Promo codes
        </h2>

        <form
          onSubmit={handleAddPromoCode}
          className="mb-6 flex flex-col gap-4 rounded-2xl border-2 border-dashed border-gold bg-surface-muted p-5 sm:flex-row sm:items-end sm:p-6"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-heading">Code</label>
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="e.g. SAVE10"
              className={`h-11 font-mono tracking-wider ${inputCls}`}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:w-40">
            <label className="text-sm font-medium text-heading">
              Discount (%)
            </label>
            <input
              value={promoDiscount}
              onChange={(e) => setPromoDiscount(e.target.value)}
              type="number"
              min="1"
              max="100"
              placeholder="e.g. 10"
              className={`h-11 ${inputCls}`}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:w-48">
            <label className="text-sm font-medium text-heading">
              Code type
            </label>
            <select
              value={promoType}
              onChange={(e) => setPromoType(e.target.value)}
              className={`h-11 ${inputCls}`}
            >
              <option value="general">General (any order)</option>
              <option value="firstOrder">First order only</option>
            </select>
          </div>
          <button
            type="submit"
            className="h-11 whitespace-nowrap rounded-full bg-surface-dark px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted"
          >
            Add code
          </button>
        </form>

        {promoLoading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : promoCodes.length === 0 ? (
          <p className="text-sm text-muted">
            No promo codes yet. Create your first one above.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {promoCodes.map((promo) => (
              <div
                key={promo.id}
                className="flex overflow-hidden rounded-xl border border-border bg-surface"
              >
                {/* Ticket stub */}
                <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-surface-dark px-2 py-4 text-primary-foreground">
                  <span className="font-heading text-2xl font-bold leading-none text-gold">
                    {promo.discountPercent}%
                  </span>
                  <span className="mt-1 text-[11px] text-primary-foreground/70">
                    OFF
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3 border-l-2 border-dashed border-border-strong px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-bold tracking-wider text-heading">
                      {promo.code}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Tag size={12} />
                      {promo.type === "firstOrder"
                        ? "First order only"
                        : "Any order"}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePromoCode(promo.id)}
                    aria-label="Delete code"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/10 text-error transition hover:bg-error/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current products */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-heading">
          Current products (in display order)
        </h2>
        {products.length > 0 && (
          <span className="text-xs text-muted">{products.length} products</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted">
          No products yet. Add your first one above.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {paginatedProducts.map((product, i) => {
            const index = startIndex + i; // real index in the full list
            const detailImagesCount = Array.isArray(product.images)
              ? product.images.length
              : 0;
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
              >
                {/* Order arrows */}
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={() => moveProduct(index, "up")}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-muted text-heading transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface-muted"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moveProduct(index, "down")}
                    disabled={index === products.length - 1}
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
                  src={product.image}
                  alt={product.name}
                  className="h-14 w-14 shrink-0 rounded-lg bg-surface-muted object-contain"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-heading">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {product.category}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {Array.isArray(product.variants) &&
                    product.variants.length > 0 ? (
                      <>{product.variants.length} variants</>
                    ) : product.newPrice ? (
                      <>
                        {product.newPrice} EGP
                        <span className="ml-2 text-muted/60 line-through">
                          {product.oldPrice} EGP
                        </span>
                      </>
                    ) : (
                      <>{product.oldPrice} EGP</>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {product.isNewArrival && (
                      <span className="flex items-center gap-1 rounded-md bg-surface-dark px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        <Sparkles size={11} className="text-gold" />
                        New
                      </span>
                    )}
                    {product.isBestSeller && (
                      <span className="flex items-center gap-1 rounded-md border border-gold px-2 py-0.5 text-[11px] font-semibold text-gold-pressed">
                        <Star size={11} className="fill-current" />
                        Best seller
                      </span>
                    )}
                    {detailImagesCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        <Images size={12} />
                        {detailImagesCount} images
                      </span>
                    )}
                  </div>
                  {detailImagesCount > 0 && (
                    <div className="mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1">
                      {product.images.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`${product.name} ${idx + 1}`}
                          className="h-10 w-10 shrink-0 rounded-md border border-border bg-surface-muted object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => startEdit(product)}
                  aria-label="Edit"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-heading transition hover:bg-gold-hover"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(product)}
                  aria-label="Delete"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/10 text-error transition hover:bg-error/20"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}

          {/* ===== Pagination Controls ===== */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-heading transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface-muted"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                      page === currentPage
                        ? "bg-gold-cta text-heading"
                        : "bg-surface-muted text-heading hover:bg-gold-hover"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-heading transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface-muted"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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
              Delete product
            </h3>
            <p className="mb-6 text-sm text-muted">
              Are you sure you want to delete{" "}
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
