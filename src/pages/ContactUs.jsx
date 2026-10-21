import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { ease, fadeUp } from "../utils/motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

/*  Motion helpers (ease + fadeUp live in ../utils/motion)  */
// Error text that eases in/out instead of popping
const FieldError = ({ id, message }) => (
  <AnimatePresence>
    {message && (
      <motion.p
        id={id}
        className="mt-1.5 font-body text-sm text-error"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {message}
      </motion.p>
    )}
  </AnimatePresence>
);

/*  Icons  */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "h-5 w-5",
};

const PhoneIcon = () => (
  <svg {...base}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);
const MailIcon = () => (
  <svg {...base}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
const PinIcon = () => (
  <svg {...base}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const ClockIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

/*  Contact details (replace with your real data)  */
const details = [
  {
    icon: <PhoneIcon />,
    title: "Call us",
    text: "+20 100 000 0000",
    href: "tel:+201000000000",
  },
  {
    icon: <MailIcon />,
    title: "Email us",
    text: "hello@benben.com",
    href: "mailto:hello@benben.com",
  },
  {
    // Online-only store: no map link
    icon: <PinIcon />,
    title: "Online store",
    text: "Cairo, Egypt",
  },
  {
    icon: <ClockIcon />,
    title: "Opening hours",
    text: "Sat – Thu, 10:00 AM – 9:00 PM",
  },
];

const socials = [
  { name: "Instagram", href: "#" },
  { name: "Facebook", href: "#" },
  { name: "TikTok", href: "#" },
  { name: "WhatsApp", href: "#" },
];

const topics = [
  "General",
  "Order question",
  "Product advice",
  "Returns & exchanges",
  "Partnership",
];

const contactSchema = z.object({
  fullName: z
    .string()
    .min(3, "Please enter a valid name.")
    .max(50, "Please enter a valid name.")
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, "Name should only contain letters"),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .refine(
      (val) => {
        const lowerVal = val.toLowerCase();
        return /^[a-zA-Z][a-zA-Z0-9._%+-]*@gmail\.(com|net|org)(\.eg)?$/.test(
          lowerVal,
        );
      },
      { message: "Email must be a valid Gmail address" },
    ),
  phone: z
    .string()
    .regex(/^(\+2)?01[0125][0-9]{8}$/, "Phone must be a valid Egyptian number"),
  topic: z.string(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(500, "Message must be less than 500 characters"),
});

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  topic: topics[0],
  message: "",
};

/* shared input look: underline style, gold on focus */
const field =
  "w-full border-0 border-b bg-transparent px-0 py-3 font-body text-base text-heading placeholder:text-muted/60 transition-colors focus:outline-none focus:ring-0";

export default function ContactUs() {
  const [status, setStatus] = useState("idle"); // idle | sent | failed

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: emptyForm,
  });

  const onSubmit = async (data) => {
    setStatus("idle");
    try {
      await addDoc(collection(db, "Messages"), {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        topic: data.topic,
        message: data.message.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      });
      setStatus("sent");
      reset(emptyForm);
    } catch (err) {
      console.error("Error sending message:", err.code || "", err.message);
      setStatus("failed");
    }
  };

  const borderFor = (name) =>
    errors[name]
      ? "border-error focus:border-error"
      : "border-border-strong/60 focus:border-gold";

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-hidden bg-page px-4 pb-20 pt-32 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          {/* Heading */}
          <header className="mb-10 max-w-2xl sm:mb-14">
            <motion.h2
              className="text-4xl font-bold tracking-wider sm:text-5xl"
              {...fadeUp(0)}
            >
              Contact us
            </motion.h2>
            <motion.p
              className="mt-2 font-body text-sm leading-normal text-muted sm:text-base"
              {...fadeUp(0.12)}
            >
              A question about an order, a piece you love, or a gift you're
              planning? Write to us and a member of the BENBEN team will reply
              within one working day.
            </motion.p>
          </header>

          <motion.div
            className="grid overflow-hidden rounded-3xl border border-border-strong bg-surface shadow-luxury lg:grid-cols-5"
            {...fadeUp(0.2)}
          >
            {/*  Details panel (first on mobile)  */}
            <aside className="order-1 flex flex-col justify-between gap-10 bg-surface-dark p-7 text-surface sm:p-10 lg:col-span-2">
              <div>
                <h2 className="text-2xl font-semibold tracking-wider text-surface">
                  Find us
                </h2>
                <p className="mt-3 font-body text-sm leading-relaxed text-surface/70">
                  Prefer to talk it through? Reach us any way that suits you.
                </p>

                <ul className="mt-8 space-y-6">
                  {details.map((d, i) => {
                    const inner = (
                      <>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border-dark text-gold transition-colors group-hover:bg-gold group-hover:text-surface-dark">
                          {d.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-heading text-sm font-semibold tracking-wider text-gold">
                            {d.title}
                          </span>
                          <span className="mt-0.5 block break-words font-body text-base text-surface">
                            {d.text}
                          </span>
                        </span>
                      </>
                    );
                    return (
                      <motion.li key={d.title} {...fadeUp(0.3 + i * 0.1)}>
                        {d.href ? (
                          <a
                            href={d.href}
                            target={
                              d.href.startsWith("http") ? "_blank" : undefined
                            }
                            rel="noreferrer"
                            className="group flex items-center gap-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                          >
                            {inner}
                          </a>
                        ) : (
                          <div className="group flex items-center gap-4">
                            {inner}
                          </div>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
              </div>

              <div className="border-t border-border-dark pt-6">
                <p className="font-body text-sm text-surface/70">Follow us</p>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  {socials.map((s, i) => (
                    <motion.a
                      key={s.name}
                      href={s.href}
                      className="rounded-full border border-border-dark px-4 py-2 text-center font-body text-sm text-surface transition-colors hover:bg-gold hover:text-surface-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                      {...fadeUp(0.6 + i * 0.08)}
                    >
                      {s.name}
                    </motion.a>
                  ))}
                </div>
              </div>
            </aside>

            {/*  Form (below on mobile)  */}
            <section className="order-2 p-7 sm:p-10 lg:col-span-3 lg:p-12">
              <h2 className="text-2xl font-semibold tracking-wider">
                Send a message
              </h2>

              {/* swaps between the form and the success message with a fade */}
              <AnimatePresence mode="wait">
                {status === "sent" ? (
                  <motion.div
                    key="sent"
                    role="status"
                    className="mt-8 rounded-2xl border border-success/40 bg-success/10 p-6"
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease }}
                  >
                    <p className="font-heading text-lg font-semibold tracking-wide text-success">
                      Message sent
                    </p>
                    <p className="mt-2 font-body text-base text-heading/80">
                      Thank you for reaching out to us We’ve received your
                      message, and the BENBEN team will get back to you as soon
                      as possible.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus("idle")}
                      className="mt-5 rounded-full border border-border-strong px-5 py-2.5 font-body text-sm font-medium text-heading transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="mt-6 space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Name */}
                      <motion.div {...fadeUp(0.1)}>
                        <label
                          htmlFor="fullName"
                          className="font-body text-sm font-medium text-muted"
                        >
                          Full name
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          autoComplete="name"
                          placeholder="Your name"
                          aria-invalid={!!errors.fullName}
                          aria-describedby={
                            errors.fullName ? "name-err" : undefined
                          }
                          className={`${field} ${borderFor("fullName")}`}
                          {...register("fullName")}
                        />
                        <FieldError
                          id="name-err"
                          message={errors.fullName?.message}
                        />
                      </motion.div>

                      {/* Email */}
                      <motion.div {...fadeUp(0.18)}>
                        <label
                          htmlFor="email"
                          className="font-body text-sm font-medium text-muted"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          aria-invalid={!!errors.email}
                          aria-describedby={
                            errors.email ? "email-err" : undefined
                          }
                          className={`${field} ${borderFor("email")}`}
                          {...register("email")}
                        />
                        <FieldError
                          id="email-err"
                          message={errors.email?.message}
                        />
                      </motion.div>

                      {/* Phone */}
                      <motion.div {...fadeUp(0.26)}>
                        <label
                          htmlFor="phone"
                          className="font-body text-sm font-medium text-muted"
                        >
                          Phone
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="01XXXXXXXXX"
                          aria-invalid={!!errors.phone}
                          aria-describedby={
                            errors.phone ? "phone-err" : undefined
                          }
                          className={`${field} ${borderFor("phone")}`}
                          {...register("phone")}
                        />
                        <FieldError
                          id="phone-err"
                          message={errors.phone?.message}
                        />
                      </motion.div>

                      {/* Topic */}
                      <motion.div className="sm:col-span-2" {...fadeUp(0.34)}>
                        <span
                          id="topic-label"
                          className="font-body text-sm font-medium text-muted"
                        >
                          Choose a topic
                        </span>
                        <div
                          role="radiogroup"
                          aria-labelledby="topic-label"
                          className="mt-3 flex flex-wrap gap-2.5"
                        >
                          {topics.map((t) => (
                            <label key={t} className="cursor-pointer">
                              <input
                                type="radio"
                                value={t}
                                className="peer sr-only"
                                {...register("topic")}
                              />
                              <span className="block rounded-full border border-border-strong/60 px-4 py-2 font-body text-sm text-heading transition-colors hover:border-gold peer-checked:border-surface-dark peer-checked:bg-surface-dark peer-checked:text-surface peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface">
                                {t}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    </div>

                    {/* Message */}
                    <motion.div {...fadeUp(0.42)}>
                      <label
                        htmlFor="message"
                        className="font-body text-sm font-medium text-muted"
                      >
                        Your message
                      </label>
                      <textarea
                        id="message"
                        rows={5}
                        placeholder="How can we help?"
                        aria-invalid={!!errors.message}
                        aria-describedby={
                          errors.message ? "message-err" : undefined
                        }
                        className={`${field} ${borderFor("message")} resize-none`}
                        {...register("message")}
                      />
                      <FieldError
                        id="message-err"
                        message={errors.message?.message}
                      />
                    </motion.div>

                    {status === "failed" && (
                      <p role="alert" className="font-body text-sm text-error">
                        Something went wrong. Please try again.
                      </p>
                    )}

                    <motion.div
                      className="flex pt-2 sm:justify-end"
                      {...fadeUp(0.5)}
                    >
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full bg-gold-cta px-8 py-3.5 font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 sm:w-auto hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                      >
                        {isSubmitting ? "Sending…" : "Send message"}
                      </button>
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>
            </section>
          </motion.div>
        </div>
      </main>
    </MotionConfig>
  );
}
