// StoreContext.jsx
// المكان الوحيد اللي فيه logic السلة والمفضلة + حساب الأسعار + الحفظ في localStorage.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CART_KEY = "bb_cart_v1";
const FAV_KEY = "bb_favs_v1";
const MAX_QTY = 99;

/* ---------- localStorage (كله جوه try/catch عشان الداتا الباظة متعملش كراش) ---------- */
function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* التخزين ممتلي أو ممنوع: نكمل من غير حفظ */
  }
}

/* ---------- الأسعار: مكان واحد بيحسب كل حاجة ---------- */
// سعر منتج (أو Variant معيّن). لو المنتج عنده variants ومفيش واحد متحدد، بناخد الأول (زي الداشبورد).
export function getPrice(product, variant = null) {
  const src =
    variant || (product.variants?.length > 0 ? product.variants[0] : product);
  const oldPrice = Number(src.oldPrice) || 0;
  const newPrice = Number(src.newPrice) || 0;
  const hasDiscount = newPrice > 0 && newPrice < oldPrice;
  const price = hasDiscount ? newPrice : oldPrice;
  const pct = hasDiscount ? Math.round((1 - newPrice / oldPrice) * 100) : 0;
  return { price, oldPrice, hasDiscount, pct };
}

// السعر اللي بيظهر على الكارت: لو فيه variants بنعرض أقل سعر ونكتب "From"
export function getCardPrice(product) {
  const variants = product.variants || [];
  if (variants.length < 2) return { ...getPrice(product), from: false };
  const all = variants.map((v) => getPrice(product, v));
  const cheapest = all.reduce((a, b) => (b.price < a.price ? b : a));
  const from = all.some((p) => p.price !== cheapest.price);
  return { ...cheapest, from };
}

export const formatPrice = (n) =>
  `${Number(n).toLocaleString("en-US")}\u00A0EGP`;
/* ---------- Context ---------- */
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => readList(CART_KEY));
  const [favs, setFavs] = useState(() => readList(FAV_KEY)); // ids بس

  // حفظ فوري مع أي تغيير
  useEffect(() => writeList(CART_KEY, cart), [cart]);
  useEffect(() => writeList(FAV_KEY, favs), [favs]);

  // مزامنة بين التابات المفتوحة
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CART_KEY || e.key === null) setCart(readList(CART_KEY));
      if (e.key === FAV_KEY || e.key === null) setFavs(readList(FAV_KEY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ----- السلة ----- */
  // نفس المنتج بلون/اختيار مختلف = سطر منفصل، ونفس الاختيار = بنزوّد الكمية
  const addToCart = useCallback((product, { variant = null, qty = 1 } = {}) => {
    const v = variant || product.variants?.[0] || null;
    const key = `${product.id}__${v?.label ?? ""}`;
    const { price, oldPrice } = getPrice(product, v);

    setCart((prev) => {
      const i = prev.findIndex((it) => it.key === key);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: Math.min(MAX_QTY, copy[i].qty + qty) };
        return copy;
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          variantLabel: v?.label || "",
          image: v?.image || product.image || "",
          price,
          oldPrice,
          qty: Math.min(MAX_QTY, qty),
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback(
    (key) => setCart((prev) => prev.filter((it) => it.key !== key)),
    [],
  );

  const updateQty = useCallback((key, qty) => {
    setCart((prev) =>
      qty < 1
        ? prev.filter((it) => it.key !== key)
        : prev.map((it) =>
            it.key === key ? { ...it, qty: Math.min(MAX_QTY, qty) } : it,
          ),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  /* ----- المفضلة ----- */
  const toggleFav = useCallback(
    (id) =>
      setFavs((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    [],
  );
  const isFav = useCallback((id) => favs.includes(id), [favs]);

  const value = useMemo(
    () => ({
      cart,
      favs,
      cartCount: cart.reduce((sum, it) => sum + it.qty, 0),
      cartTotal: cart.reduce((sum, it) => sum + it.price * it.qty, 0),
      favCount: favs.length,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      toggleFav,
      isFav,
    }),
    [
      cart,
      favs,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      toggleFav,
      isFav,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
