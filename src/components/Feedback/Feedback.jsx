// src/components/Feedback/Feedback.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { Check, Quote } from "lucide-react";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../../../firebase";
import { ease, Reveal } from "../../utils/motion";

const DELAY = 5000;
const MAX_MESSAGE = 400;

/* ---------- Validation (same rules as before) ---------- */
const feedbackSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your name")
    .min(3, "Name is too short")
    .max(30, "Name is too long")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email")
    .email("Invalid email address"),
  message: z
    .string()
    .trim()
    .min(1, "Please write a message")
    .min(10, "Message is too short")
    .max(MAX_MESSAGE, "Message is too long"),
});

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-page";
const ringDark =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

// Short quotes get a bigger font, long ones a smaller one
const quoteSize = (len = 0) =>
  len <= 70
    ? "text-2xl leading-9 sm:text-3xl sm:leading-[2.75rem]"
    : len <= 180
      ? "text-lg leading-8 sm:text-xl sm:leading-9"
      : "text-base leading-7 sm:text-lg sm:leading-8";

const initialOf = (name = "") => name.trim().charAt(0).toUpperCase() || "?";

/* ---------- Small pieces ---------- */
function Avatar({ name, className = "h-11 w-11 text-lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} grid shrink-0 place-items-center rounded-full bg-gold-cta font-heading font-bold text-surface-dark`}
    >
      {initialOf(name)}
    </span>
  );
}

function FieldError({ message }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-1.5 overflow-hidden text-sm text-red-300"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-surface/5 px-4 py-3 font-body text-sm text-surface placeholder:text-surface/40 transition focus:outline-none focus:ring-2 motion-reduce:transition-none ${
    hasError
      ? "border-red-300/70 focus:ring-red-300/60"
      : "border-border-dark focus:border-gold focus:ring-gold/60"
  }`;

/* ---------- Main component ---------- */
export default function Feedback() {
  const [approved, setApproved] = useState([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(feedbackSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", message: "" },
  });

  const nameValue = watch("name");
  const messageLength = watch("message")?.length || 0;

  /* Approved feedback, live from Firestore (newest first) */
  useEffect(() => {
    const q = query(collection(db, "feedback"), where("approved", "==", true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
          );
        setApproved(list);
      },
      (err) => console.error("Error loading feedback:", err.code, err.message),
    );
    return () => unsub();
  }, []);

  const total = approved.length;
  const index = total ? active % total : 0;

  /* Auto-rotate the featured quote */
  useEffect(() => {
    if (total <= 1 || paused) return;
    const t = setInterval(() => setActive((p) => (p + 1) % total), DELAY);
    return () => clearInterval(t);
  }, [total, paused]);

  /* Hide the thank-you message after a few seconds */
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(false), 4500);
    return () => clearTimeout(t);
  }, [sent]);

  const current = total ? approved[index] : null;
  const upNext = Array.from(
    { length: Math.min(2, Math.max(total - 1, 0)) },
    (_, k) => approved[(index + 1 + k) % total],
  );

  const onSubmit = async (data) => {
    setSubmitError("");
    try {
      await addDoc(collection(db, "feedback"), {
        ...data,
        approved: false,
        createdAt: serverTimestamp(),
      });
      reset();
      setSent(true);
    } catch (error) {
      console.error("Feedback failed:", error);
      setSubmitError("Something went wrong. Please try again.");
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <section className="mx-auto max-w-6xl px-5 py-12 font-body sm:px-8 sm:py-20">
        {/* ----- Heading (same pattern as ProductsSection) ----- */}
        <div className="mb-10 flex flex-col gap-2 text-center sm:mb-14">
          <Reveal>
            <h2 className="font-heading text-2xl font-bold tracking-wider text-heading sm:text-4xl">
              What our customers say
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-xs uppercase tracking-[0.15em] text-gold-pressed sm:text-sm">
              Words from people who ordered
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

        <div className="grid items-start gap-8 lg:grid-cols-5 lg:gap-12">
          {/* ===== Left: approved feedback ===== */}
          <Reveal className="min-w-0 lg:col-span-3">
            <div
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
            >
              {!current ? (
                <div className="rounded-3xl border border-dashed border-border-strong/50 bg-surface p-10 text-center">
                  <p className="text-muted">
                    No feedback yet. Be the first to share yours.
                  </p>
                </div>
              ) : (
                <>
                  {/* Featured quote */}
                  <div className="relative flex min-h-[260px] overflow-hidden rounded-3xl border border-border-strong/60 bg-surface p-7 shadow-luxury sm:p-10">
                    <Quote
                      aria-hidden="true"
                      size={72}
                      strokeWidth={1.2}
                      className="absolute right-6 top-6 text-gold/25"
                    />
                    <AnimatePresence mode="wait">
                      <motion.figure
                        key={current.id}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.45, ease }}
                        className="flex w-full min-w-0 flex-col justify-between gap-8"
                      >
                        <blockquote
                          className={`max-w-prose break-words pr-10 text-heading ${quoteSize(
                            current.message?.length,
                          )}`}
                        >
                          {current.message}
                        </blockquote>
                        <figcaption className="flex items-center gap-3">
                          <Avatar name={current.name} />
                          <span className="font-heading text-base font-bold tracking-wide text-heading">
                            {current.name}
                          </span>
                        </figcaption>
                      </motion.figure>
                    </AnimatePresence>
                  </div>

                  {/* Dots */}
                  {total > 1 && (
                    <div className="mt-5 flex items-center justify-center gap-1">
                      {approved.slice(0, 8).map((fb, i) => (
                        <button
                          key={fb.id}
                          type="button"
                          aria-label={`Show feedback ${i + 1}`}
                          aria-current={i === index}
                          onClick={() => setActive(i)}
                          className={`rounded-full p-1.5 ${ring}`}
                        >
                          <motion.span
                            animate={{
                              width: i === index ? 28 : 8,
                              opacity: i === index ? 1 : 0.35,
                            }}
                            transition={{ duration: 0.3, ease }}
                            className="block h-1.5 rounded-full bg-gold-cta"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Up next */}
                  {upNext.length > 0 && (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {upNext.map((fb) => (
                          <motion.button
                            key={fb.id}
                            type="button"
                            layout
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.4, ease }}
                            whileHover={{ y: -4 }}
                            onClick={() =>
                              setActive(
                                approved.findIndex((x) => x.id === fb.id),
                              )
                            }
                            className={`min-w-0 rounded-2xl border border-border bg-surface p-5 text-left transition-shadow duration-300 hover:shadow-luxury motion-reduce:transition-none ${ring}`}
                          >
                            <p className="line-clamp-3 break-words text-sm leading-6 text-muted">
                              {fb.message}
                            </p>
                            <span className="mt-4 flex items-center gap-2">
                              <Avatar
                                name={fb.name}
                                className="h-8 w-8 text-xs"
                              />
                              <span className="font-heading text-sm font-bold tracking-wide text-heading">
                                {fb.name}
                              </span>
                            </span>
                          </motion.button>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </div>
          </Reveal>

          {/* ===== Right: form ===== */}
          <Reveal delay={0.12} className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-3xl bg-surface-dark p-7 text-surface shadow-luxury sm:p-8">
              {/* gold line that draws itself in */}
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gold-cta"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3, ease }}
              />

              <AnimatePresence mode="wait" initial={false}>
                {sent ? (
                  <motion.div
                    key="thanks"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease }}
                    role="status"
                    className="flex min-h-[380px] flex-col items-center justify-center text-center"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 14,
                        delay: 0.1,
                      }}
                      className="grid h-16 w-16 place-items-center rounded-full bg-gold-cta text-surface-dark"
                    >
                      <Check size={28} />
                    </motion.span>
                    <h3 className="mt-5 font-heading text-2xl font-bold tracking-wider text-surface">
                      Thank you
                    </h3>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-surface/70">
                      We'll review your feedback and post it soon.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <Avatar name={nameValue} className="h-12 w-12 text-xl" />
                      <div>
                        <h3 className="font-heading text-xl font-bold leading-tight tracking-wider text-surface">
                          Share your feedback
                        </h3>
                        <p className="text-sm text-surface/60">
                          Tell us how your order went
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="fb-name"
                        className="mb-1.5 block text-sm font-medium text-surface/85"
                      >
                        Name *
                      </label>
                      <input
                        id="fb-name"
                        type="text"
                        autoComplete="name"
                        {...register("name")}
                        placeholder="Enter your full name"
                        data-gramm="false"
                        data-gramm_editor="false"
                        aria-invalid={!!errors.name}
                        className={inputClass(errors.name)}
                      />
                      <FieldError message={errors.name?.message} />
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="fb-email"
                        className="mb-1.5 block text-sm font-medium text-surface/85"
                      >
                        Email *
                      </label>
                      <input
                        id="fb-email"
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                        placeholder="Enter your email"
                        data-gramm="false"
                        data-gramm_editor="false"
                        aria-invalid={!!errors.email}
                        className={inputClass(errors.email)}
                      />
                      <FieldError message={errors.email?.message} />
                    </div>

                    <div className="mb-6">
                      <label
                        htmlFor="fb-message"
                        className="mb-1.5 block text-sm font-medium text-surface/85"
                      >
                        Message *
                      </label>
                      <textarea
                        id="fb-message"
                        rows="4"
                        {...register("message")}
                        placeholder="Write your message..."
                        data-gramm="false"
                        data-gramm_editor="false"
                        aria-invalid={!!errors.message}
                        className={`${inputClass(errors.message)} resize-none`}
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <FieldError message={errors.message?.message} />
                        </div>
                        <span
                          className={`mt-1.5 text-xs ${
                            messageLength > MAX_MESSAGE
                              ? "text-red-300"
                              : "text-surface/50"
                          }`}
                        >
                          {messageLength}/{MAX_MESSAGE}
                        </span>
                      </div>
                    </div>

                    {submitError && (
                      <p role="alert" className="mb-4 text-sm text-red-300">
                        {submitError}
                      </p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                      className={`h-12 w-full rounded-full bg-gold-cta text-sm font-semibold text-surface-dark transition hover:shadow-luxury active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none ${ringDark}`}
                    >
                      {isSubmitting ? "Sending..." : "Send feedback"}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </section>
    </MotionConfig>
  );
}
