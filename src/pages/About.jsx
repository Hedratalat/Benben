import { Link } from "react-router-dom";
import { motion, MotionConfig, useScroll, useTransform } from "motion/react";
import { ease, Reveal } from "../utils/motion";

/* ---------- Icons ---------- */
const Svg = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="h-5 w-5"
  >
    {children}
  </svg>
);

const GemIcon = () => (
  <Svg>
    <path d="M6 4h12l3 5-9 11L3 9z" />
    <path d="M3 9h18M9 4l3 5 3-5" />
  </Svg>
);
const TruckIcon = () => (
  <Svg>
    <path d="M3 6h11v10H3z" />
    <path d="M14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17" cy="18" r="1.8" />
  </Svg>
);
const ChatIcon = () => (
  <Svg>
    <path d="M4 5h16v11H9l-5 4z" />
  </Svg>
);

/* ---------- Content (edit the wording freely) ---------- */
const benefits = [
  "No warehouse costs, so we only pay for what you actually order.",
  "A wider catalogue, because products come straight from vetted suppliers.",
  "Always fresh: we add and retire items as suppliers do.",
];

const steps = [
  {
    title: "You choose",
    text: "Browse a catalogue picked by hand. Every product shows a realistic shipping estimate before you pay.",
  },
  {
    title: "We confirm",
    text: "Your order comes to us first. We check the details and place it with the supplier for you.",
  },
  {
    title: "It ships",
    text: "The supplier packs and sends it straight to your door, with a tracking number as soon as it's on its way.",
  },
  {
    title: "We look after you",
    text: "Something wrong on arrival? Message us and we sort it out with the supplier, not you.",
  },
];

const values = [
  {
    icon: <GemIcon />,
    title: "Curated, not crowded",
    text: "We say no to far more products than we say yes to. If we wouldn't give it as a gift, it doesn't make the shop.",
  },
  {
    icon: <TruckIcon />,
    title: "Honest delivery",
    text: "Items ship from partner suppliers, so we show real timings and tracking up front. No surprises after checkout.",
  },
  {
    icon: <ChatIcon />,
    title: "Real people on support",
    text: "Write to us and someone from the BENBEN team replies, usually within one working day.",
  },
];

/* ---------- Small shared pieces ---------- */
const SectionHeading = ({ title, text }) => (
  <Reveal className="mb-10 max-w-2xl sm:mb-12">
    <h2 className="text-3xl font-bold tracking-wider sm:text-4xl">{title}</h2>
    {text && (
      <p className="mt-3 font-body text-base leading-relaxed text-muted">
        {text}
      </p>
    )}
  </Reveal>
);

const ctaBase =
  "rounded-full px-8 py-3.5 text-center font-heading text-base tracking-wider transition duration-200 hover:-translate-y-0.5 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

/* ---------- Page ---------- */
export default function About() {
  // the hero squares slowly turn as the page scrolls
  const { scrollYProgress } = useScroll();
  const turn = useTransform(scrollYProgress, [0, 1], [45, 225]);
  const turnBack = useTransform(scrollYProgress, [0, 1], [45, -135]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-hidden bg-page px-4 pb-20 pt-32 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* ----- Hero ----- */}
          <section className="grid items-center gap-12 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Reveal>
                <h2 className="text-5xl font-bold tracking-wider sm:text-6xl lg:text-7xl">
                  About BENBEN
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-muted sm:text-xl">
                  A small team, a hand-picked catalogue and suppliers we've
                  vetted, so you get good finds without the guesswork.
                </p>
              </Reveal>
              <Reveal delay={0.24} className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="rounded-full bg-gold-cta px-8 py-3.5 font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-page"
                >
                  Talk to us
                </Link>
              </Reveal>
            </div>

            {/* decorative turning squares, echoing the logo diamond */}
            <motion.div
              aria-hidden="true"
              className="relative mx-auto hidden h-72 w-72 lg:col-span-2 lg:block"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease }}
            >
              <motion.span
                style={{ rotate: turn }}
                className="absolute inset-4 border border-gold/70"
              />
              <motion.span
                style={{ rotate: turnBack }}
                className="absolute inset-14 border border-border-strong"
              />
              <i className="absolute left-1/2 top-1/2 -ml-4 -mt-4 block h-8 w-8 rotate-45 bg-gold-cta shadow-luxury" />
            </motion.div>
          </section>

          {/* ----- Story ----- */}
          <section className="mt-20 sm:mt-28">
            <Reveal>
              <div className="grid overflow-hidden rounded-3xl border border-border-strong bg-surface shadow-luxury lg:grid-cols-5">
                <div className="p-7 sm:p-10 lg:col-span-3 lg:p-12">
                  <h2 className="text-2xl font-semibold tracking-wider sm:text-3xl">
                    Why BENBEN exists
                  </h2>
                  <div className="mt-5 space-y-4 font-body text-base leading-relaxed text-muted">
                    <p>
                      It started with a simple frustration: great products are
                      scattered across the world, and finding ones you can trust
                      takes hours. We do that searching for you.
                    </p>
                    <p>
                      BENBEN is an online store that works with trusted
                      suppliers instead of holding stock in a warehouse of our
                      own. That keeps the catalogue fresh, and it lets us spend
                      our time on what matters: choosing well, and looking after
                      you if anything goes wrong.
                    </p>
                    <p>
                      Because your order ships from a partner supplier, delivery
                      can take a little longer than a local shop. We tell you
                      that before you pay, and we track it with you all the way.
                    </p>
                  </div>
                </div>

                <aside className="bg-surface-dark p-7 text-surface sm:p-10 lg:col-span-2">
                  <h3 className="text-xl font-semibold tracking-wider text-surface">
                    What this means for you
                  </h3>
                  <ul className="mt-6 space-y-5">
                    {benefits.map((b, i) => (
                      <motion.li
                        key={b}
                        className="flex gap-4 font-body text-base leading-relaxed text-surface/80"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{
                          duration: 0.6,
                          delay: 0.2 + i * 0.12,
                          ease,
                        }}
                      >
                        <i
                          aria-hidden="true"
                          className="mt-2 block h-2 w-2 shrink-0 rotate-45 bg-gold-cta"
                        />
                        {b}
                      </motion.li>
                    ))}
                  </ul>
                </aside>
              </div>
            </Reveal>
          </section>

          {/* ----- How it works ----- */}
          <section className="mt-20 sm:mt-28">
            <SectionHeading
              title="How an order works"
              text="From your click to your door, in four simple steps."
            />
            <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <motion.li
                  key={s.title}
                  className="relative overflow-hidden rounded-2xl border border-border bg-surface p-7"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.7, delay: i * 0.12, ease }}
                >
                  {/* gold line that draws itself in */}
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gold-cta"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.3 + i * 0.12, ease }}
                  />
                  <span className="font-heading text-5xl font-bold text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-wide">
                    {s.title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-muted">
                    {s.text}
                  </p>
                </motion.li>
              ))}
            </ol>
          </section>

          {/* ----- Values ----- */}
          <section className="mt-20 sm:mt-28">
            <SectionHeading title="What we stand for" />
            <div className="grid gap-5 md:grid-cols-3">
              {values.map((v, i) => (
                <Reveal key={v.title} delay={i * 0.12}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25, ease }}
                    className="h-full rounded-2xl border border-border-strong/60 bg-surface p-7 transition-shadow duration-300 hover:shadow-luxury"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-border-strong text-gold">
                      {v.icon}
                    </span>
                    <h3 className="mt-5 text-xl font-semibold tracking-wide">
                      {v.title}
                    </h3>
                    <p className="mt-2 font-body text-base leading-relaxed text-muted">
                      {v.text}
                    </p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ----- Closing call to action ----- */}
          <section className="mt-20 sm:mt-28">
            <Reveal>
              <div className="rounded-3xl bg-surface-dark px-7 py-12 text-center shadow-luxury sm:px-12 sm:py-16">
                <h2 className="text-3xl font-bold tracking-wider text-surface sm:text-4xl">
                  Questions before you order?
                </h2>
                <p className="mx-auto mt-4 max-w-lg font-body text-base leading-relaxed text-surface/70">
                  Ask us anything about a product, shipping or returns. We'd
                  rather you know than guess.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                  <Link
                    to="/contact"
                    className={`${ctaBase} bg-gold-cta font-bold text-surface-dark hover:shadow-luxury active:brightness-90`}
                  >
                    Contact us
                  </Link>
                  <Link
                    to="/shop"
                    className={`${ctaBase} border border-border-dark font-semibold text-surface hover:bg-gold hover:text-surface-dark`}
                  >
                    Browse the shop
                  </Link>
                </div>
              </div>
            </Reveal>
          </section>
        </div>
      </main>
    </MotionConfig>
  );
}
