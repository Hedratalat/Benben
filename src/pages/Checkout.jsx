// src/pages/Checkout.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  Banknote,
  Check,
  Copy,
  PackageCheck,
  ShoppingBag,
  Smartphone,
  X,
  Zap,
} from "lucide-react";
import { ease, fadeUp } from "../utils/motion";
import { formatPrice, useStore } from "../store/Storecontext";
import { db } from "../../firebase";

/* =======================
   Constants
======================= */
const PHONE_RE = /^(?:01[0125][0-9]{8}|\+201[0125][0-9]{8})$/;
const GUEST_KEY = "guestIdBenben";

// Replace with your real numbers
const PAYMENT_ACCOUNTS = { instapay: "01000000000", vodafone: "01000000001" };

const PAYMENT_METHODS = [
  { id: "cash", icon: Banknote, label: "Cash on delivery" },
  { id: "instapay", icon: Zap, label: "Instapay" },
  { id: "vodafone", icon: Smartphone, label: "Vodafone Cash" },
];

const PAYMENT_LABELS = {
  cash: "Cash on delivery",
  instapay: "Instapay",
  "vodafone cash": "Vodafone Cash",
};

const egyptCities = [
  { id: "cairo", label: "Cairo" },
  { id: "giza", label: "Giza" },
  { id: "fayoum", label: "Fayoum" },
  { id: "beni-suef", label: "Beni Suef" },
  { id: "minya", label: "Minya" },
  { id: "assiut", label: "Assiut" },
  { id: "sohag", label: "Sohag" },
  { id: "qena", label: "Qena" },
  { id: "nag-hammadi", label: "Nag Hammadi" },
  { id: "luxor", label: "Luxor" },
  { id: "aswan", label: "Aswan" },
  { id: "alexandria", label: "Alexandria" },
  { id: "tanta", label: "Tanta" },
  { id: "mahalla", label: "El Mahalla El Kubra" },
  { id: "mansoura", label: "Mansoura" },
  { id: "suez", label: "Suez" },
  { id: "beheira", label: "Beheira" },
  { id: "sharqia", label: "Sharqia" },
  { id: "10th-of-ramadan", label: "10th of Ramadan" },
  { id: "port-said", label: "Port Said" },
  { id: "ismailia", label: "Ismailia" },
  { id: "damietta", label: "Damietta" },
  { id: "kafr-elsheikh", label: "Kafr El Sheikh" },
  { id: "qalyubia", label: "Qalyubia" },
  { id: "al-gharbia", label: "Gharbia" },
  { id: "monufia", label: "Monufia" },
  { id: "dakahlia", label: "Dakahlia" },
  { id: "north-coast", label: "North Coast" },
  { id: "marsa-matrouh", label: "Marsa Matrouh" },
  { id: "hurghada", label: "Hurghada" },
  { id: "sharm-el-sheikh", label: "Sharm El Sheikh" },
  { id: "marsa-alam", label: "Marsa Alam" },
  { id: "banha", label: "Banha" },
  { id: "badrashin", label: "Badrashin" },
  { id: "hawamdeya", label: "Hawamdeya" },
  { id: "saqqara", label: "Saqqara" },
  { id: "badr-city", label: "Badr City" },
];

const shippingFees = {
  cairo: 70,
  giza: 70,
  fayoum: 110,
  "beni-suef": 110,
  minya: 110,
  assiut: 110,
  sohag: 110,
  qena: 110,
  "nag-hammadi": 110,
  luxor: 110,
  aswan: 120,
  alexandria: 90,
  tanta: 100,
  mahalla: 100,
  mansoura: 100,
  suez: 100,
  beheira: 100,
  sharqia: 100,
  "10th-of-ramadan": 100,
  "port-said": 100,
  ismailia: 100,
  damietta: 100,
  "kafr-elsheikh": 100,
  qalyubia: 100,
  "al-gharbia": 100,
  monufia: 100,
  dakahlia: 100,
  "north-coast": 130,
  "marsa-matrouh": 130,
  hurghada: 140,
  "sharm-el-sheikh": 140,
  "marsa-alam": 140,
  banha: 85,
  badrashin: 85,
  hawamdeya: 85,
  saqqara: 90,
  "badr-city": 85,
};

/* =======================
   Validation
======================= */
const checkoutSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Please enter a valid name.")
      .max(40, "Please enter a valid name.")
      .regex(/^[A-Za-z\u0600-\u06FF\s]+$/, "Name should only contain letters."),
    phone: z.string().regex(PHONE_RE, "Phone must be a valid Egyptian number."),
    whatsapp: z
      .string()
      .regex(PHONE_RE, "WhatsApp must be a valid Egyptian number."),
    city: z.string().min(1, "Please choose a city."),
    area: z
      .string()
      .min(2, "Area is required.")
      .max(50, "Area is too long.")
      .regex(/^[A-Za-z\u0600-\u06FF0-9\s]+$/, "Area format is not valid."),
    address: z
      .string()
      .min(10, "Please enter your full address.")
      .max(200, "Address is too long.")
      .regex(
        /^[A-Za-z0-9\u0600-\u06FF\s,.-]+$/,
        "Address format is not valid.",
      ),
    floor: z.string().regex(/^\d*$/, "Floor must be numbers only.").optional(),
    paymentMethod: z.enum(["cash", "instapay", "vodafone"]),
    senderPhone: z.string().optional(),
    referenceNumber: z.string().optional(),
    vodafoneReference: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.paymentMethod === "cash") return true;
      return PHONE_RE.test(d.senderPhone?.trim() || "");
    },
    { message: "Enter the phone number you sent from.", path: ["senderPhone"] },
  )
  .refine(
    (d) => {
      if (d.paymentMethod !== "instapay") return true;
      return /^\d{8,20}$/.test(d.referenceNumber?.trim() || "");
    },
    {
      message: "Enter the reference number .",
      path: ["referenceNumber"],
    },
  )
  .refine(
    (d) => {
      if (d.paymentMethod !== "vodafone") return true;
      return /^\d{6,20}$/.test(d.vodafoneReference?.trim() || "");
    },
    {
      message: "Enter the transaction number .",
      path: ["vodafoneReference"],
    },
  );

const emptyForm = {
  fullName: "",
  phone: "",
  whatsapp: "",
  city: "",
  area: "",
  address: "",
  floor: "",
  paymentMethod: "cash",
  senderPhone: "",
  referenceNumber: "",
  vodafoneReference: "",
};

/* =======================
   Customer / address helpers
======================= */
function getGuestId() {
  const fallback = () =>
    `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      id = crypto?.randomUUID ? crypto.randomUUID() : fallback();
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  } catch {
    return fallback();
  }
}

const normalizeText = (str = "") =>
  str
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^a-z0-9\u0600-\u06FF]/g, "");

function hashString(str) {
  let h1 = 5381;
  let h2 = 7919;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ c;
    h2 = ((h2 << 7) - h2 + c) | 0;
  }
  return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}

const makeAddressKey = (city, area, address) =>
  hashString(`${city}|${normalizeText(area)}|${normalizeText(address)}`);

// Is this a returning customer (account, guest id, phone or WhatsApp)?
// Has this exact address been used before?
async function lookupCustomer({ identityKey, phone, whatsapp, addressKey }) {
  const idKeys = [
    ...new Set(
      [
        identityKey,
        PHONE_RE.test(phone || "") && `phone_${phone}`,
        PHONE_RE.test(whatsapp || "") && `phone_${whatsapp}`,
      ].filter(Boolean),
    ),
  ];

  const [idSnaps, addrSnap] = await Promise.all([
    Promise.all(idKeys.map((k) => getDoc(doc(db, "Customers", k)))),
    addressKey ? getDoc(doc(db, "Customers", `addr_${addressKey}`)) : null,
  ]);

  return {
    isReturning: idSnaps.some((s) => s.exists()),
    addressExists: !!addrSnap?.exists(),
  };
}

/* =======================
   Shared UI
======================= */
const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
const ringDark =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

const field =
  "w-full border-0 border-b bg-transparent px-0 py-3 font-body text-base text-heading placeholder:text-muted/60 transition-colors focus:outline-none focus:ring-0";

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

const Section = ({ title, first = false, children }) => (
  <section className={first ? "" : "mt-10 border-t border-border pt-10"}>
    <h2 className="text-2xl font-semibold tracking-wider">{title}</h2>
    <div className="mt-6">{children}</div>
  </section>
);

function TransferNumber({ label, number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: the customer can copy it by hand */
    }
  }

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border-strong/60 bg-surface px-3 py-3 sm:px-4">
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm text-muted">{label}</p>
        <p className="break-all font-heading text-sm font-bold tracking-normal text-heading sm:text-lg sm:tracking-wider">
          {number}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        className={`flex shrink-0 items-center shrink-0 gap-1 rounded-full border border-border-strong px-2.5 py-2 sm:gap-1.5 sm:px-4 font-body text-sm font-medium text-heading transition-colors hover:bg-surface-muted ${ring}`}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function ReferenceModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ref-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface shadow-luxury"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-surface-dark px-6 py-5">
              <h2
                id="ref-title"
                className="text-xl font-semibold tracking-wider text-surface"
              >
                Where is the reference number?
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={`grid h-9 w-9 place-items-center rounded-full text-surface/80 transition-colors hover:text-gold ${ringDark}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* simple mock of the Instapay receipt */}
              <div className="mx-auto mb-6 max-w-xs overflow-hidden rounded-2xl border border-border-strong">
                <div className="bg-surface-dark px-5 py-4 text-center">
                  <p className="font-heading text-base font-semibold tracking-wide text-surface">
                    Transfer successful
                  </p>
                </div>
                <div className="space-y-1 p-4 font-body text-sm">
                  <div className="flex justify-between border-b border-border py-2.5">
                    <span className="text-muted">Amount</span>
                    <span className="font-semibold text-heading">
                      Your total
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border py-2.5">
                    <span className="text-muted">Recipient</span>
                    <span className="font-semibold text-heading">BENBEN</span>
                  </div>
                  <div className="my-3 rounded-xl border-2 border-dashed border-gold bg-gold/10 p-3 text-center">
                    <p className="text-xs font-semibold text-heading">
                      Reference number
                    </p>
                    <p className="mt-1 font-heading text-sm font-bold tracking-wider text-heading">
                      It appears here
                    </p>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 font-body text-sm leading-relaxed text-muted">
                <li>
                  You can also find it in the transaction history of your
                  Instapay or bank app.
                </li>
                <li>Copy it exactly as shown, without spaces or symbols.</li>
                <li className="font-semibold text-error">
                  We can't confirm your order without a correct reference
                  number.
                </li>
              </ul>

              <button
                type="button"
                onClick={onClose}
                className={`mt-6 w-full rounded-full bg-gold-cta px-8 py-3.5 font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 ${ring}`}
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =======================
   Page
======================= */
export default function Checkout() {
  const { cart, cartCount, cartTotal, clearCart } = useStore();

  const [user, setUser] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [showRefModal, setShowRefModal] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoStatus, setPromoStatus] = useState("idle"); // idle | checking | invalid
  const [promoError, setPromoError] = useState("");

  const submitErrorRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: emptyForm,
    mode: "onChange",
  });

  const paymentMethod = watch("paymentMethod");
  const selectedCity = watch("city");

  // Logged in or guest: both can check out. We only watch the auth state.
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (u) => setUser(u || null));
    return unsub;
  }, []);

  // Prefill the name for logged-in users
  useEffect(() => {
    if (user?.displayName && !getValues("fullName")) {
      setValue("fullName", user.displayName);
    }
  }, [user, getValues, setValue]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (submitError && submitErrorRef.current) {
      submitErrorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [submitError]);

  /* ----- totals ----- */
  const shippingCost = selectedCity ? shippingFees[selectedCity] || 0 : 0;
  const discountAmount = useMemo(
    () =>
      appliedPromo
        ? Math.round((cartTotal * appliedPromo.discountPercent) / 100)
        : 0,
    [appliedPromo, cartTotal],
  );
  const grandTotal = cartTotal + shippingCost - discountAmount;

  /* ----- promo ----- */
  const applyPromoCode = async () => {
    const trimmed = promoInput.trim();
    if (!trimmed) return;

    setPromoStatus("checking");
    setPromoError("");

    try {
      const snap = await getDoc(doc(db, "PromoCodes", trimmed));
      if (!snap.exists() || snap.data().active === false) {
        setAppliedPromo(null);
        setPromoStatus("invalid");
        setPromoError("This code isn't valid.");
        return;
      }
      const promoData = snap.data();
      setAppliedPromo({
        code: trimmed,
        discountPercent: promoData.discountPercent,
        type: promoData.type || "general",
      });
      setPromoStatus("idle");
    } catch {
      setAppliedPromo(null);
      setPromoStatus("invalid");
      setPromoError("Something went wrong. Please try again.");
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoStatus("idle");
    setPromoError("");
  };

  /* ----- submit ----- */
  const onSubmit = async (data) => {
    if (cart.length === 0) return;
    setSubmitError("");

    try {
      // Same collection for both: logged-in orders carry the account,
      // guest orders carry a guest id.
      const guestId = user ? null : getGuestId();
      const identityKey = user ? `uid_${user.uid}` : `guest_${guestId}`;
      const addressKey = makeAddressKey(data.city, data.area, data.address);

      let lookup = null;
      try {
        lookup = await lookupCustomer({
          identityKey,
          phone: data.phone,
          whatsapp: data.whatsapp,
          addressKey,
        });
      } catch (err) {
        console.error("Customer lookup failed:", err);
      }

      // Mandatory re-check for first-order codes
      if (appliedPromo?.type === "firstOrder") {
        if (!lookup) {
          setSubmitError(
            "We couldn't verify your discount code. Please try again.",
          );
          return;
        }
        if (lookup.isReturning) {
          removePromoCode();
          setSubmitError(
            "Your discount code was removed because it only applies to a first order. Please review your new total, then place your order again.",
          );
          return;
        }
      }

      const paymentMethodForDB =
        data.paymentMethod === "vodafone"
          ? "vodafone cash"
          : data.paymentMethod;

      const orderData = {
        isGuest: !user,
        userId: user?.uid || null,
        guestId,
        email: user?.email || "",
        fullName: data.fullName.trim(),
        phone: data.phone,
        whatsapp: data.whatsapp,
        city: data.city,
        cityLabel: egyptCities.find((c) => c.id === data.city)?.label || "",
        area: data.area,
        address: data.address,
        floor: data.floor || "",
        addressKey,
        // Admin warning only: same address used before by someone else
        duplicateAddress:
          !!lookup && !lookup.isReturning && lookup.addressExists,
        paymentMethod: paymentMethodForDB,
        ...(data.paymentMethod === "instapay" && {
          senderPhone: data.senderPhone,
          referenceNumber: data.referenceNumber,
        }),
        ...(data.paymentMethod === "vodafone" && {
          senderPhone: data.senderPhone,
          vodafoneReference: data.vodafoneReference,
        }),
        items: cart.map((it) => ({
          productId: it.productId,
          key: it.key,
          name: it.variantLabel ? `${it.name} - ${it.variantLabel}` : it.name,
          variant: it.variantLabel || "",
          image: it.image || "",
          price: it.price,
          quantity: it.qty,
          total: it.price * it.qty,
        })),
        subtotal: cartTotal,
        shippingFee: shippingCost,
        promoCode: appliedPromo?.code || null,
        promoType: appliedPromo?.type || null,
        discountPercent: appliedPromo?.discountPercent || 0,
        discountAmount,
        grandTotal,
        status: "pending",
        createdAt: serverTimestamp(),
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };

      await addDoc(collection(db, "Orders"), orderData);

      // Register the customer. If a doc already exists the Rules reject it,
      // which is expected, so we ignore it.
      const customerKeys = [
        ...new Set([
          identityKey,
          `phone_${data.phone}`,
          `phone_${data.whatsapp}`,
          `addr_${addressKey}`,
        ]),
      ];
      await Promise.allSettled(
        customerKeys.map((k) =>
          setDoc(doc(db, "Customers", k), {
            hasOrdered: true,
            userId: user?.uid || null,
            createdAt: serverTimestamp(),
          }),
        ),
      );

      clearCart();
      setPlacedOrder(orderData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error saving order:", err.code || "", err.message);
      setSubmitError(
        "Something went wrong placing your order. Please try again.",
      );
    }
  };

  const borderFor = (name) =>
    errors[name]
      ? "border-error focus:border-error"
      : "border-border-strong/60 focus:border-gold";

  /* ================= Success ================= */
  if (placedOrder) {
    const firstName = placedOrder.fullName.split(" ")[0];
    return (
      <MotionConfig reducedMotion="user">
        <main className="min-h-screen overflow-x-hidden bg-page px-4 pb-20 pt-32 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <motion.div
              className="overflow-hidden rounded-3xl border border-border-strong bg-surface shadow-luxury"
              {...fadeUp(0)}
            >
              <div className="relative bg-surface-dark px-7 py-12 text-center sm:px-12">
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gold-cta"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 0.3, ease }}
                />
                <motion.span
                  className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold-cta text-surface-dark shadow-luxury"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.15, ease }}
                >
                  <Check size={30} strokeWidth={3} />
                </motion.span>
                <h2 className="mt-6 text-3xl font-bold tracking-wider text-surface sm:text-4xl">
                  Order confirmed
                </h2>
                <p className="mx-auto mt-3 max-w-md font-body text-base leading-relaxed text-surface/70">
                  Thank you, {firstName}. We've received your order and the
                  BENBEN team is getting it ready.
                </p>
              </div>

              <div className="p-7 sm:p-10">
                <TransferNumber
                  label="Order number"
                  number={placedOrder.orderNumber}
                />

                <p className="mt-3 font-body text-base leading-relaxed text-muted">
                  Please copy and save this number. You'll need it to track your
                  order or contact us about it.
                </p>

                <dl className="mt-6 space-y-4 font-body text-base">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted">Payment method</dt>
                    <dd className="font-semibold text-heading">
                      {PAYMENT_LABELS[placedOrder.paymentMethod]}
                    </dd>
                  </div>

                  {placedOrder.discountAmount > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted">
                        Discount {placedOrder.discountPercent}% (
                        {placedOrder.promoCode})
                      </dt>
                      <dd className="font-semibold text-success">
                        - {formatPrice(placedOrder.discountAmount)}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-6 flex items-baseline justify-between border-t border-border pt-6">
                  <span className="font-heading text-base font-semibold tracking-wide">
                    Total
                  </span>
                  <span className="text-right">
                    {placedOrder.discountAmount > 0 && (
                      <span className="block font-body text-sm text-muted line-through">
                        {formatPrice(
                          placedOrder.subtotal + placedOrder.shippingFee,
                        )}
                      </span>
                    )}
                    <span className="font-heading text-3xl font-bold text-gold">
                      {formatPrice(placedOrder.grandTotal)}
                    </span>
                  </span>
                </div>

                <p className="mt-6 rounded-2xl border border-border bg-surface-muted px-5 py-4 font-body text-sm leading-relaxed text-muted">
                  We'll message you on WhatsApp at{" "}
                  <bdi className="font-semibold text-heading">
                    {placedOrder.whatsapp}
                  </bdi>{" "}
                  to confirm your delivery details.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/shop"
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full bg-gold-cta px-8 py-3.5 text-center font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none ${ring}`}
                  >
                    <ShoppingBag size={18} />
                    Continue shopping
                  </Link>
                  <Link
                    to="/"
                    className={`flex-1 rounded-full border border-border-strong px-8 py-3.5 text-center font-heading text-base font-semibold tracking-wider text-heading transition-colors hover:bg-surface-muted ${ring}`}
                  >
                    Back to home
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </MotionConfig>
    );
  }

  /* ================= Empty cart ================= */
  if (cart.length === 0) {
    return (
      <MotionConfig reducedMotion="user">
        <main className="min-h-screen overflow-x-hidden bg-page px-4 pb-20 pt-32 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <motion.div
              className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center"
              {...fadeUp(0)}
            >
              <span className="grid h-14 w-14 place-items-center rounded-full border border-border-strong text-gold">
                <ShoppingBag size={24} />
              </span>
              <h2 className="font-heading text-xl font-semibold tracking-wide text-heading">
                Your cart is empty
              </h2>
              <p className="max-w-sm font-body text-sm leading-relaxed text-muted">
                Add something you like, then come back to check out.
              </p>
              <Link
                to="/shop"
                className={`mt-3 rounded-full bg-gold-cta px-8 py-3.5 font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none ${ring}`}
              >
                Browse the shop
              </Link>
            </motion.div>
          </div>
        </main>
      </MotionConfig>
    );
  }

  /* ================= Checkout form ================= */
  const referenceFields = (
    <motion.div
      key={paymentMethod}
      className="mt-6 space-y-5 rounded-2xl border border-border-strong/60 bg-surface-muted p-5"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease }}
    >
      <TransferNumber
        label={
          paymentMethod === "instapay"
            ? "Send the total to this Instapay number"
            : "Send the total to this Vodafone Cash number"
        }
        number={PAYMENT_ACCOUNTS[paymentMethod]}
      />

      <div>
        <label
          htmlFor="senderPhone"
          className="font-body text-sm font-medium text-muted"
        >
          Phone number you sent from
        </label>
        <input
          id="senderPhone"
          type="tel"
          inputMode="tel"
          placeholder="01XXXXXXXXX"
          aria-invalid={!!errors.senderPhone}
          aria-describedby={errors.senderPhone ? "sender-err" : undefined}
          className={`${field} ${borderFor("senderPhone")}`}
          {...register("senderPhone")}
        />
        <FieldError id="sender-err" message={errors.senderPhone?.message} />
      </div>

      {paymentMethod === "instapay" ? (
        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="referenceNumber"
              className="font-body text-sm font-medium text-muted"
            >
              Reference number
            </label>
            <button
              type="button"
              onClick={() => setShowRefModal(true)}
              className={`rounded font-body text-sm font-medium text-gold hover:underline ${ring}`}
            >
              Where do I find it?
            </button>
          </div>
          <input
            id="referenceNumber"
            type="text"
            inputMode="numeric"
            placeholder="Reference number from your transfer"
            aria-invalid={!!errors.referenceNumber}
            aria-describedby={errors.referenceNumber ? "ref-err" : undefined}
            className={`${field} ${borderFor("referenceNumber")}`}
            {...register("referenceNumber")}
          />
          <FieldError id="ref-err" message={errors.referenceNumber?.message} />
        </div>
      ) : (
        <div>
          <label
            htmlFor="vodafoneReference"
            className="font-body text-sm font-medium text-muted"
          >
            Transaction number
          </label>
          <input
            id="vodafoneReference"
            type="text"
            inputMode="numeric"
            placeholder="Transaction number from your transfer"
            aria-invalid={!!errors.vodafoneReference}
            aria-describedby={errors.vodafoneReference ? "voda-err" : undefined}
            className={`${field} ${borderFor("vodafoneReference")}`}
            {...register("vodafoneReference")}
          />
          <FieldError
            id="voda-err"
            message={errors.vodafoneReference?.message}
          />
        </div>
      )}
    </motion.div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-x-hidden bg-page px-4 pb-20 pt-32 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10 max-w-2xl sm:mb-14">
            <motion.h2
              className="text-4xl font-bold tracking-wider sm:text-5xl"
              {...fadeUp(0)}
            >
              Checkout
            </motion.h2>
            <motion.p
              className="mt-2 font-body text-sm leading-normal text-muted sm:text-base"
              {...fadeUp(0.12)}
            >
              Tell us where to send your order and how you'd like to pay.
              {!user && " No account needed."}
            </motion.p>
          </header>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="grid items-start gap-8 lg:grid-cols-3 lg:gap-10"
          >
            {/* ===== Form card ===== */}
            <motion.div
              className="rounded-3xl border border-border-strong bg-surface p-7 shadow-luxury sm:p-10 lg:col-span-2 lg:p-12"
              {...fadeUp(0.2)}
            >
              <Section title="Contact details" first>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
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
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="font-body text-sm font-medium text-muted"
                    >
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="01XXXXXXXXX"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "phone-err" : undefined}
                      className={`${field} ${borderFor("phone")}`}
                      {...register("phone")}
                    />
                    <FieldError
                      id="phone-err"
                      message={errors.phone?.message}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="whatsapp"
                      className="font-body text-sm font-medium text-muted"
                    >
                      WhatsApp
                    </label>
                    <input
                      id="whatsapp"
                      type="tel"
                      inputMode="tel"
                      placeholder="01XXXXXXXXX"
                      aria-invalid={!!errors.whatsapp}
                      aria-describedby={errors.whatsapp ? "wa-err" : undefined}
                      className={`${field} ${borderFor("whatsapp")}`}
                      {...register("whatsapp")}
                    />
                    <FieldError
                      id="wa-err"
                      message={errors.whatsapp?.message}
                    />
                  </div>
                </div>
              </Section>

              <Section title="Delivery address">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="city"
                      className="font-body text-sm font-medium text-muted"
                    >
                      City
                    </label>
                    <select
                      id="city"
                      aria-invalid={!!errors.city}
                      aria-describedby={errors.city ? "city-err" : undefined}
                      className={`${field} ${borderFor("city")}`}
                      {...register("city")}
                    >
                      <option value="">Choose a city</option>
                      {egyptCities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <FieldError id="city-err" message={errors.city?.message} />
                  </div>

                  <div>
                    <label
                      htmlFor="area"
                      className="font-body text-sm font-medium text-muted"
                    >
                      Area / district
                    </label>
                    <input
                      id="area"
                      type="text"
                      placeholder="e.g. Nasr City"
                      aria-invalid={!!errors.area}
                      aria-describedby={errors.area ? "area-err" : undefined}
                      className={`${field} ${borderFor("area")}`}
                      {...register("area")}
                    />
                    <FieldError id="area-err" message={errors.area?.message} />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="address"
                      className="font-body text-sm font-medium text-muted"
                    >
                      Full address
                    </label>
                    <textarea
                      id="address"
                      rows={2}
                      placeholder="Street, building number, nearest landmark"
                      aria-invalid={!!errors.address}
                      aria-describedby={errors.address ? "addr-err" : undefined}
                      className={`${field} ${borderFor("address")} resize-none`}
                      {...register("address")}
                    />
                    <FieldError
                      id="addr-err"
                      message={errors.address?.message}
                    />
                  </div>

                  <div className="sm:w-1/2">
                    <label
                      htmlFor="floor"
                      className="font-body text-sm font-medium text-muted"
                    >
                      Floor (optional)
                    </label>
                    <input
                      id="floor"
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 3"
                      aria-invalid={!!errors.floor}
                      aria-describedby={errors.floor ? "floor-err" : undefined}
                      className={`${field} ${borderFor("floor")}`}
                      {...register("floor")}
                    />
                    <FieldError
                      id="floor-err"
                      message={errors.floor?.message}
                    />
                  </div>
                </div>
              </Section>

              <Section title="Payment">
                <div
                  role="radiogroup"
                  aria-label="Payment method"
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    return (
                      <label key={m.id} className="cursor-pointer">
                        <input
                          type="radio"
                          value={m.id}
                          className="peer sr-only"
                          {...register("paymentMethod")}
                        />
                        <span className="flex h-full flex-col items-center gap-2 rounded-2xl border border-border-strong/60 px-4 py-5 text-center font-body text-sm font-medium text-heading transition-colors hover:border-gold peer-checked:border-surface-dark peer-checked:bg-surface-dark peer-checked:text-surface peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface">
                          <Icon size={24} />
                          {m.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {paymentMethod !== "cash" && referenceFields}
                </AnimatePresence>
              </Section>
            </motion.div>

            {/* ===== Order summary ===== */}
            <motion.aside
              className="relative overflow-hidden rounded-3xl bg-surface-dark p-7 text-surface shadow-luxury sm:p-8 lg:sticky lg:top-28"
              {...fadeUp(0.3)}
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gold-cta"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.5, ease }}
              />

              <h3 className="flex items-center gap-2.5 font-heading text-2xl font-semibold tracking-wider text-surface">
                <PackageCheck size={22} className="text-gold" />
                Order summary
              </h3>

              <ul className="mt-6 max-h-72 space-y-4 overflow-y-auto pr-1">
                {cart.map((it) => (
                  <li key={it.key} className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface/10">
                      {it.image && (
                        <img
                          src={it.image}
                          alt={it.name}
                          className="h-full w-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-semibold text-surface">
                        {it.name}
                      </p>
                      <p className="font-body text-xs text-surface/60">
                        {it.variantLabel ? `${it.variantLabel} · ` : ""}
                        Qty {it.qty}
                      </p>
                    </div>
                    <p className="shrink-0 font-body text-sm font-semibold text-surface">
                      {formatPrice(it.price * it.qty)}
                    </p>
                  </li>
                ))}
              </ul>

              {/* promo code */}
              <div className="mt-6 border-t border-border-dark pt-6">
                {!appliedPromo ? (
                  <div className="flex items-end gap-3">
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor="promo"
                        className="font-body text-sm text-surface"
                      >
                        Discount code
                      </label>
                      <input
                        id="promo"
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value);
                          setPromoStatus("idle");
                          setPromoError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyPromoCode();
                          }
                        }}
                        placeholder="Enter code"
                        className={`w-full border-0 border-b bg-transparent px-0 py-2.5 font-body text-sm text-surface placeholder:text-surface/40 transition-colors focus:outline-none focus:ring-0 ${
                          promoStatus === "invalid"
                            ? "border-error"
                            : "border-border-dark focus:border-gold"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyPromoCode}
                      disabled={
                        promoStatus === "checking" || !promoInput.trim()
                      }
                      className={`shrink-0 rounded-full border border-border-dark px-5 py-2 font-body text-sm font-medium text-surface transition-colors hover:bg-gold hover:text-surface-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-surface ${ringDark}`}
                    >
                      {promoStatus === "checking" ? "Checking…" : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2.5">
                    <span className="font-body text-sm font-semibold text-surface">
                      {appliedPromo.code}: {appliedPromo.discountPercent}% off
                    </span>
                    <button
                      type="button"
                      onClick={removePromoCode}
                      className={`rounded font-body text-xs font-semibold text-surface/70 transition-colors hover:text-gold ${ringDark}`}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="mt-2 font-body text-sm text-error">
                    {promoError}
                  </p>
                )}
              </div>

              {/* totals */}
              <dl className="mt-6 space-y-3 font-body text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-surface">
                    Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
                  </dt>
                  <dd className="text-surface">{formatPrice(cartTotal)}</dd>
                </div>
                {appliedPromo && (
                  <div className="flex items-center justify-between">
                    <dt className="text-surface/70">
                      Discount ({appliedPromo.discountPercent}%)
                    </dt>
                    <dd className="text-gold">
                      - {formatPrice(discountAmount)}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-surface">Shipping</dt>
                  <dd className="text-surface">
                    {selectedCity ? formatPrice(shippingCost) : "Choose a city"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between border-t border-border-dark pt-5">
                <span className="font-heading text-base font-semibold tracking-wide text-surface">
                  Total
                </span>
                <span className="font-heading text-2xl font-bold text-gold">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              {submitError && (
                <p
                  ref={submitErrorRef}
                  role="alert"
                  className="mt-5 rounded-xl border border-error/40 bg-error/10 px-4 py-3 font-body text-sm text-surface"
                >
                  {submitError}
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-full bg-gold-cta px-8 py-3.5 text-center font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none ${ringDark}`}
                >
                  {isSubmitting ? "Placing order…" : "Place order"}
                </button>
                <Link
                  to="/cart"
                  className={`rounded-full border border-border-dark px-8 py-3.5 text-center font-heading text-base font-semibold tracking-wider text-surface transition-colors hover:bg-gold hover:text-surface-dark ${ringDark}`}
                >
                  Back to cart
                </Link>
              </div>
            </motion.aside>
          </form>
        </div>
      </main>

      <ReferenceModal
        open={showRefModal}
        onClose={() => setShowRefModal(false)}
      />
    </MotionConfig>
  );
}
