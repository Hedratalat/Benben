// src/pages/Favorites.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Heart } from "lucide-react";
import { db } from "../../firebase";
import { ease, fadeUp } from "../utils/motion";
import ProductCard from "../store/ProductCard";
import { useStore } from "../store/Storecontext";

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-page";

export default function Favorites() {
  const { favs } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Only the products the customer saved (deleted products are skipped)
  const saved = products.filter((p) => favs.includes(p.id));

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
              Favorites
            </motion.h2>
            <motion.p
              className="mt-2 font-body text-sm leading-normal text-muted sm:text-base"
              {...fadeUp(0.12)}
            >
              Everything you’ve fallen for, saved in one place.
            </motion.p>
          </header>

          {favs.length === 0 || (!loading && saved.length === 0) ? (
            <motion.div
              className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center"
              {...fadeUp(0.2)}
            >
              <span className="grid h-14 w-14 place-items-center rounded-full border border-border-strong text-gold">
                <Heart size={24} />
              </span>
              <h3 className="font-heading text-xl font-semibold tracking-wide text-heading">
                No favorites yet
              </h3>
              <p className="max-w-sm font-body text-sm leading-relaxed text-muted">
                Tap the heart on any product and it will be saved here.
              </p>
              <Link
                to="/shop"
                className={`mt-3 rounded-full bg-gold-cta px-8 py-3.5 font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none ${ring}`}
              >
                Browse the shop
              </Link>
            </motion.div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {Array.from({ length: Math.min(favs.length, 4) }, (_, i) => (
                <div
                  key={i}
                  className="aspect-[4/6] animate-pulse rounded-2xl bg-surface-muted"
                />
              ))}
            </div>
          ) : (
            <>
              <p className="mb-5 font-body text-sm text-muted">
                {saved.length} saved {saved.length === 1 ? "item" : "items"}
              </p>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {saved.map((p, i) => (
                    <motion.div
                      key={p.id}
                      layout
                      className="h-full"
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{
                        duration: 0.5,
                        delay: (i % 4) * 0.08,
                        ease,
                      }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </main>
    </MotionConfig>
  );
}
