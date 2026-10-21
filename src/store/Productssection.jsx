// ProductsSection.jsx
// قسم منتجات واحد بتستخدمه في أي مكان: Best sellers / New arrivals / Shop... بس بتغيّر الـ props.
import { useEffect, useState } from "react";
import { motion, MotionConfig } from "motion/react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";
import { ease, Reveal } from "../utils/motion";
import ProductCard from "./Productcard";

export default function ProductsSection({
  title,
  subtitle,
  filter = () => true, // مثال: (p) => p.isBestSeller
  limit = 8,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const shown = products.filter(filter).slice(0, limit);

  // مفيش منتجات مطابقة = القسم كله مايظهرش (مفيش عنوان فاضي)
  if (!loading && shown.length === 0) return null;

  return (
    <MotionConfig reducedMotion="user">
      <section className="mx-auto max-w-6xl px-5 py-8 sm:py-16 font-body sm:px-8 ">
        <div className="mb-8 flex flex-col gap-2 text-center sm:mb-10">
          <Reveal>
            <h2 className="font-heading text-2xl font-bold tracking-wider text-heading sm:text-4xl">
              {title}
            </h2>
          </Reveal>

          {subtitle && (
            <Reveal delay={0.12}>
              <p className=" text-xs uppercase tracking-[0.15em] text-gold-pressed sm:text-sm">
                {subtitle}
              </p>
            </Reveal>
          )}

          <motion.span
            aria-hidden="true"
            className="mx-auto mt-2 block h-2 w-2 bg-gold-cta"
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 45 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="aspect-[4/6] animate-pulse rounded-2xl bg-surface-muted"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {shown.map((p, i) => (
              <motion.div
                key={p.id}
                className="h-full"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: (i % 4) * 0.12, ease }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </MotionConfig>
  );
}
