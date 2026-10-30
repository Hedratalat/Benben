// HeroSection.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { db } from "../../../firebase";
import { useStore } from "../../store/Storecontext";
import SocialRail from "../SocialRail/SocialRail";
const COLLECTION = "HeroSlides";
const DURATION = 3500;

const FALLBACK_SLIDE = {
  id: "fallback",
  badge: "New season",
  title: "Crafted to be remembered",
  description:
    "Discover pieces made with care, finished by hand, and chosen to last.",
  image: "",
  buttonText: "Shop the collection",
  buttonLink: "/shop",
};

function discountPercent(oldPrice, newPrice) {
  const o = Number(oldPrice);
  const n = Number(newPrice);
  if (!o || !n || n >= o) return 0;
  return Math.round((1 - n / o) * 100);
}

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

/**
 * onBuyNow(slide): اربطها بدالة إضافة المنتج للسلة عندك.
 * السلايد المرتبط بمنتج بيرجّع slide.linkedProductId.
 */
export default function HeroSection() {
  const { addToCart } = useStore();

  async function handleBuyNow(slide) {
    try {
      const snap = await getDoc(doc(db, "Products", slide.linkedProductId));
      if (snap.exists()) addToCart({ id: snap.id, ...snap.data() });
    } catch (err) {
      console.error("Buy now failed:", err);
    }
  }
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);

  /* سلايدات لايف من Firestore */
  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSlides(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Error loading hero slides:", err.code, err.message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const list = slides.length > 0 ? slides : [FALLBACK_SLIDE];
  const count = list.length;

  /* لو سلايد اتمسح والـ index بقى برا الحدود */
  useEffect(() => {
    if (current >= count) setCurrent(0);
  }, [count, current]);

  const go = (i) => setCurrent(((i % count) + count) % count);
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  /* مفاتيح الكيبورد */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(current + 1);
      if (e.key === "ArrowLeft") go(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* سحب باللمس */
  const onTouchStart = (e) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    touchX.current = null;
  };

  const slide = list[current];
  const pct = discountPercent(slide.oldPrice, slide.newPrice);
  const isLinked = !!slide.linkedProductId;
  const hasPrice = slide.oldPrice !== undefined && slide.oldPrice !== "";

  return (
    <>
      <style>{`
        @keyframes heroZoom { from { transform: scale(1.02); } to { transform: scale(1.12); } }
        @keyframes heroUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes heroBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes heroFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .hero-zoom { animation: heroZoom ${DURATION + 1500}ms ease-out both; }
        .hero-up { animation: heroUp .7s cubic-bezier(.2,.7,.2,1) both; }
        .hero-bar { transform-origin: left; animation: heroBar ${DURATION}ms linear both; }
        .hero-float { animation: heroFloat 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hero-zoom, .hero-up, .hero-float { animation: none; }
        }
      `}</style>

      <section
        className="relative bg-surface-dark font-body text-surface"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-roledescription="carousel"
        aria-label="Featured offers"
      >
        <div className="relative min-h-[100svh] overflow-hidden">
          {/* الخلفيات: كل السلايدات فوق بعض والنشط بس ظاهر */}
          {list.map((s, i) => (
            <div
              key={s.id}
              aria-hidden={i !== current}
              className={`absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            >
              {s.image && (
                <img
                  src={s.image}
                  alt=""
                  className={`h-full w-full object-cover ${
                    i === current ? "hero-zoom" : ""
                  }`}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>
          ))}

          {/* طبقات التعتيم: على الموبايل رأسي (فوق لتحت) وعلى الشاشات الكبيرة أفقي */}
          <div className="absolute inset-0 bg-surface-dark/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark/30 via-surface-dark/65 to-surface-dark lg:bg-gradient-to-r lg:from-surface-dark lg:via-surface-dark/70 lg:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface-dark to-transparent" />

          {/* المحتوى: عمود واحد فيه (الجريد + الكنترول) عشان الأسهم تنزل تحت الصورة وماتلزقش فيها */}
          <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-8 pt-28 sm:px-8 sm:pb-10 lg:pt-32">
            <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
              {/* النص: متوسّط على الموبايل ومن الشمال على اللابتوب */}
              <div
                key={slide.id}
                className="flex flex-col items-center gap-4 text-center sm:gap-5 lg:items-start lg:text-left"
              >
                {slide.badge && (
                  <span className="hero-up inline-flex items-center gap-2 rounded-full border border-border-dark bg-surface-dark/60 px-4 py-1.5 text-xs font-semibold text-gold backdrop-blur">
                    <span className="h-1.5 w-1.5 rotate-45 bg-gold-cta" />
                    {slide.badge}
                  </span>
                )}

                <h1
                  className="text-surface hero-up max-w-xl font-heading text-3xl font-bold leading-[1.1] tracking-wide sm:text-5xl lg:text-6xl"
                  style={{ animationDelay: "90ms" }}
                >
                  {slide.title}
                </h1>

                <p
                  className="hero-up max-w-md text-sm leading-6 text-surface/75 sm:text-lg sm:leading-7"
                  style={{ animationDelay: "180ms" }}
                >
                  {slide.description}
                </p>

                {hasPrice && (
                  <div
                    className="hero-up flex flex-wrap items-center justify-center gap-3 lg:justify-start"
                    style={{ animationDelay: "270ms" }}
                  >
                    {slide.newPrice ? (
                      <>
                        <span className="font-heading text-2xl font-bold text-gold sm:text-4xl">
                          {slide.newPrice} EGP
                        </span>
                        <span className="text-base text-surface/55 line-through">
                          {slide.oldPrice} EGP
                        </span>
                        {pct > 0 && (
                          <span className="rounded-full bg-gold-cta px-3 py-1 text-xs font-bold text-surface-dark">
                            Save {pct}%
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="font-heading text-2xl font-bold text-gold sm:text-4xl">
                        {slide.oldPrice} EGP
                      </span>
                    )}
                  </div>
                )}

                <div
                  className="hero-up mt-2 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
                  style={{ animationDelay: "360ms" }}
                >
                  {isLinked ? (
                    <button
                      type="button"
                      onClick={() => handleBuyNow(slide)}
                      className={`inline-flex h-12 items-center gap-2 rounded-full bg-gold-cta px-7 text-sm font-semibold text-surface-dark transition hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none ${ring}`}
                    >
                      <ShoppingBag size={18} />
                      Buy now
                    </button>
                  ) : (
                    slide.buttonText &&
                    slide.buttonLink &&
                    (/^https?:\/\//.test(slide.buttonLink) ? (
                      <a
                        href={slide.buttonLink}
                        className={`inline-flex h-12 items-center rounded-full bg-gold-cta px-7 text-sm font-semibold text-surface-dark transition hover:-translate-y-0.5 hover:shadow-luxury ${ring}`}
                      >
                        {slide.buttonText}
                      </a>
                    ) : (
                      <Link
                        to={slide.buttonLink}
                        className={`inline-flex h-12 items-center rounded-full bg-gold-cta px-7 text-sm font-semibold text-surface-dark transition hover:-translate-y-0.5 hover:shadow-luxury ${ring}`}
                      >
                        {slide.buttonText}
                      </Link>
                    ))
                  )}
                  <Link
                    to="/shop"
                    className={`inline-flex h-12 items-center rounded-full border border-border-dark px-7 text-sm font-medium text-surface transition hover:bg-gold hover:text-surface-dark ${ring}`}
                  >
                    Browse the shop
                  </Link>
                </div>
              </div>

              {/* كارت الصورة (القوس الدهبي) ظاهر على كل الشاشات: فوق النص على الموبايل وعلى اليمين على اللابتوب */}
              <div className="relative order-first justify-self-center lg:order-last lg:justify-self-end">
                <div
                  key={`frame-${slide.id}`}
                  className="hero-up hero-float relative h-80 w-60 overflow-hidden rounded-t-[7.5rem] rounded-b-3xl border border-gold/60 bg-surface-muted/10 p-2 shadow-luxury sm:h-96 sm:w-72 sm:rounded-t-[9rem] lg:h-[30rem] lg:w-[22rem] lg:rounded-t-[11rem]"
                >
                  <div className="h-full w-full overflow-hidden rounded-t-[7rem] rounded-b-2xl bg-surface-dark sm:rounded-t-[8.5rem] lg:rounded-t-[10.5rem]">
                    {slide.image && (
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="h-full w-full object-cover"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    )}
                  </div>
                </div>
                {pct > 0 && (
                  <div className="absolute -left-3 top-16 grid h-16 w-16 place-items-center rounded-full bg-gold-cta text-center font-heading text-surface-dark shadow-luxury sm:-left-6 sm:top-24 sm:h-20 sm:w-20">
                    <span className="text-lg font-bold leading-none sm:text-xl">
                      {pct}%
                      <span className="block text-[10px] font-semibold">
                        OFF
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* الكنترول: النقط + الأسهم تحت الصورة والنص (مش فوقهم) */}
            {count > 1 && (
              <div className="relative z-10 mt-8 flex items-center justify-between gap-4 sm:mt-10">
                <div className="flex items-center gap-2">
                  {list.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => go(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      aria-current={i === current}
                      className={`relative h-1.5 overflow-hidden rounded-full bg-surface/25 transition-all duration-300 motion-reduce:transition-none ${
                        i === current ? "w-14" : "w-6 hover:bg-surface/50"
                      } ${ring}`}
                    >
                      {i === current && (
                        <span
                          key={`bar-${current}`}
                          className="hero-bar absolute inset-0 bg-gold-cta"
                          style={{
                            animationPlayState: paused ? "paused" : "running",
                          }}
                          onAnimationEnd={next}
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous slide"
                    className={`grid h-10 w-10 place-items-center rounded-full border border-border-dark bg-surface-dark/50 text-surface backdrop-blur transition hover:bg-gold hover:text-surface-dark sm:h-11 sm:w-11 ${ring}`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next slide"
                    className={`grid h-10 w-10 place-items-center rounded-full border border-border-dark bg-surface-dark/50 text-surface backdrop-blur transition hover:bg-gold hover:text-surface-dark sm:h-11 sm:w-11 ${ring}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
          <SocialRail />

          {/* لودينج بسيط أول ما الصفحة تفتح */}
          {loading && (
            <div className="absolute inset-0 z-20 grid place-items-center bg-surface-dark">
              <span className="h-3 w-3 rotate-45 animate-pulse bg-gold-cta" />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
