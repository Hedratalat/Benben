// Categories.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "../../../firebase";
import { ease, Reveal } from "../../utils/motion";

const AUTO_DELAY = 2500; // كل قد ايه يتحرك لوحده (ms)

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-page";

/* عدد الكروت الظاهرة حسب الشاشة: 2 موبايل / 3 تابلت / 4 لابتوب */
function getPerView() {
  if (typeof window === "undefined") return 2;
  if (window.innerWidth >= 1024) return 4;
  if (window.innerWidth >= 640) return 3;
  return 2;
}

const GRID_COLS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [start, setStart] = useState(0);
  const [direction, setDirection] = useState(1);
  const [perView, setPerView] = useState(getPerView);
  const touchX = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "Categories"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading categories:", err.code, err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  /* تحديث عدد الكروت لما حجم الشاشة يتغير */
  useEffect(() => {
    const onResize = () => setPerView(getPerView());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* لو الكاتيجوريز أكتر من العدد الظاهر: السلايدر شغال، غير كده ثابت */
  const canSlide = categories.length > perView;
  const shownCount = Math.min(perView, categories.length);

  /* لو start بقى برا الحدود (مسح كاتيجوري) */
  useEffect(() => {
    if (categories.length > 0 && start >= categories.length) setStart(0);
  }, [categories.length, start]);

  /* التحرك كارت واحد (دائري) */
  function go(dir) {
    if (!canSlide) return;
    setDirection(dir);
    setStart((s) => (s + dir + categories.length) % categories.length);
  }

  /* سحب باللمس */
  const onTouchStart = (e) => {
    setPaused(true);
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current !== null) {
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      touchX.current = null;
    }
    setTimeout(() => setPaused(false), 2500);
  };

  /* أوتو سلايدر */
  useEffect(() => {
    if (paused || !canSlide) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;
    const t = setInterval(() => go(1), AUTO_DELAY);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, canSlide, categories.length]);

  if (!loading && categories.length === 0) return null;

  /* الكروت الظاهرة: من start ولفة دائرية */
  const visible = Array.from(
    { length: shownCount },
    (_, i) => categories[(start + i) % categories.length],
  );

  return (
    <MotionConfig reducedMotion="user">
      <section className="mx-auto max-w-6xl px-5 py-8 font-body sm:px-8 sm:pt-16">
        {/* العنوان */}
        <div className="mb-8 flex flex-col gap-2 text-center sm:mb-10">
          <Reveal>
            <h2 className="font-heading text-2xl font-bold tracking-wider text-heading sm:text-4xl">
              Shop by category
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-xs uppercase tracking-[0.15em] text-gold-pressed sm:text-sm">
              Find what suits you
            </p>
          </Reveal>
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
          <div className={`grid gap-3 sm:gap-5 ${GRID_COLS[perView]}`}>
            {Array.from({ length: perView }, (_, i) => (
              <div
                key={i}
                className="aspect-[3/4.4] animate-pulse rounded-t-[50%/32%] rounded-b-2xl bg-surface-muted"
              />
            ))}
          </div>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-roledescription="carousel"
            aria-label="Categories"
          >
            <div className="overflow-hidden px-1 py-2">
              <div
                className={`relative grid gap-3 sm:gap-5 ${GRID_COLS[perView]}`}
              >
                <AnimatePresence
                  initial={false}
                  custom={direction}
                  mode="popLayout"
                >
                  {visible.map((cat) => (
                    <motion.div
                      key={cat.id}
                      layout
                      custom={direction}
                      variants={{
                        enter: (d) => ({ opacity: 0, x: d * 60, scale: 0.9 }),
                        center: { opacity: 1, x: 0, scale: 1 },
                        exit: (d) => ({ opacity: 0, x: d * -60, scale: 0.9 }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.5, ease }}
                    >
                      <Link
                        to={`/shop?category=${encodeURIComponent(cat.name)}`}
                        className={`group block rounded-t-[50%/32%] rounded-b-2xl ${ring}`}
                      >
                        {/* القوس الدهبي زي الهيرو */}
                        <div className="relative aspect-[3/4.4] w-full overflow-hidden rounded-t-[50%/32%] rounded-b-2xl border border-gold/60 bg-surface p-1 shadow-luxury transition duration-500 group-hover:-translate-y-1 group-hover:border-gold sm:p-1.5 motion-reduce:transition-none">
                          <div className="relative h-full w-full overflow-hidden rounded-t-[50%/32%] rounded-b-xl bg-surface-muted">
                            {cat.image && (
                              <img
                                src={cat.image}
                                alt={cat.name}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-110 motion-reduce:transition-none"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/85 via-surface-dark/10 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 px-2 pb-3 text-center sm:gap-2 sm:pb-5">
                              <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 rotate-45 bg-gold-cta"
                              />
                              <h3 className="line-clamp-2 font-heading text-xs font-bold tracking-wider text-surface sm:text-sm lg:text-base">
                                {cat.name}
                              </h3>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* الكنترول: نقط + أسهم */}
            {canSlide && (
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {categories.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setDirection(i > start ? 1 : -1);
                        setStart(i);
                      }}
                      aria-label={`Go to category ${i + 1}`}
                      aria-current={i === start}
                      className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                        i === start
                          ? "w-10 bg-gold-cta"
                          : "w-4 bg-border-strong/30 hover:bg-gold"
                      } ${ring}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Previous category"
                    className={`grid h-10 w-10 place-items-center rounded-full border border-border-strong bg-surface text-heading transition hover:bg-gold-hover sm:h-11 sm:w-11 ${ring}`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Next category"
                    className={`grid h-10 w-10 place-items-center rounded-full border border-border-strong bg-surface text-heading transition hover:bg-gold-hover sm:h-11 sm:w-11 ${ring}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </MotionConfig>
  );
}
