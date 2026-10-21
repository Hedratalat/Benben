// src/pages/Cart.jsx
import { Link } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { ease, fadeUp } from "../utils/motion";
import { formatPrice, useStore } from "../store/Storecontext";

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
const ringDark =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

export default function Cart() {
  const { cart, cartCount, cartTotal, updateQty, removeFromCart, clearCart } =
    useStore();

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
              Your cart
            </motion.h2>
            <motion.p
              className="mt-2 font-body text-sm leading-normal text-muted sm:text-base"
              {...fadeUp(0.12)}
            >
              Check your items and quantities before you check out.
            </motion.p>
          </header>

          {cart.length === 0 ? (
            <motion.div
              className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center"
              {...fadeUp(0.2)}
            >
              <span className="grid h-14 w-14 place-items-center rounded-full border border-border-strong text-gold">
                <ShoppingBag size={24} />
              </span>
              <h3 className="font-heading text-xl font-semibold tracking-wide text-heading">
                Your cart is empty
              </h3>
              <p className="max-w-sm font-body text-sm leading-relaxed text-muted">
                Add something you like and it will show up here.
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                <Link
                  to="/shop"
                  className={`rounded-full bg-gold-cta px-8 py-3.5 font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none ${ring}`}
                >
                  Browse the shop
                </Link>
                <Link
                  to="/favorites"
                  className={`rounded-full border border-border-strong px-8 py-3.5 font-heading text-base font-semibold tracking-wider text-heading transition-colors hover:bg-surface-muted ${ring}`}
                >
                  See favorites
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid items-start gap-8 lg:grid-cols-3 lg:gap-10">
              {/* ===== Items ===== */}
              <div className="min-w-0 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-body text-sm text-muted">
                    {cartCount} {cartCount === 1 ? "item" : "items"}
                  </p>
                  <button
                    type="button"
                    onClick={clearCart}
                    className={`rounded font-body text-sm font-medium text-error transition hover:opacity-80 ${ring}`}
                  >
                    Clear cart
                  </button>
                </div>

                <ul className="flex flex-col gap-4">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {cart.map((it) => {
                      const hasDiscount = it.oldPrice > it.price;
                      return (
                        <motion.li
                          key={it.key}
                          layout
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.35, ease }}
                          className="flex gap-4 rounded-2xl border border-border bg-surface p-3 sm:p-4"
                        >
                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:h-28 sm:w-28">
                            {it.image && (
                              <img
                                src={it.image}
                                alt={it.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="line-clamp-2 break-words font-heading text-sm font-bold tracking-wide text-heading sm:text-base">
                                  {it.name}
                                </h3>
                                {it.variantLabel && (
                                  <p className="mt-0.5 break-words font-body text-xs text-muted">
                                    Option: {it.variantLabel}
                                  </p>
                                )}
                                <p className="mt-1 flex flex-wrap items-baseline gap-x-2 font-body">
                                  <span className="text-sm font-semibold text-heading">
                                    {formatPrice(it.price)}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-xs text-muted line-through">
                                      {formatPrice(it.oldPrice)}
                                    </span>
                                  )}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(it.key)}
                                aria-label={`Remove ${it.name}`}
                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-error/10 text-error transition hover:bg-error/20 ${ring}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                              <div className="flex h-10 items-center rounded-full border border-border-strong bg-page">
                                <button
                                  type="button"
                                  onClick={() => updateQty(it.key, it.qty - 1)}
                                  aria-label="Decrease quantity"
                                  className={`grid h-10 w-10 place-items-center rounded-full text-heading transition hover:bg-surface-muted ${ring}`}
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-7 text-center font-body text-sm font-bold text-heading">
                                  {it.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQty(it.key, it.qty + 1)}
                                  aria-label="Increase quantity"
                                  className={`grid h-10 w-10 place-items-center rounded-full text-heading transition hover:bg-surface-muted ${ring}`}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <p className="ml-auto font-heading text-sm font-bold text-heading sm:text-lg">
                                {formatPrice(it.price * it.qty)}
                              </p>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </div>

              {/* ===== Summary ===== */}
              <motion.aside
                className="relative overflow-hidden rounded-3xl bg-surface-dark p-7 text-surface shadow-luxury sm:p-8 lg:sticky lg:top-28"
                {...fadeUp(0.2)}
              >
                {/* gold line that draws itself in */}
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gold-cta"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 0.4, ease }}
                />

                <h3 className="font-heading text-2xl font-semibold tracking-wider text-surface">
                  Order summary
                </h3>

                <dl className="mt-6 space-y-3 font-body text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-surface/70">Items</dt>
                    <dd className="text-surface">{cartCount}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-surface/70">Subtotal</dt>
                    <dd className="text-surface">{formatPrice(cartTotal)}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex items-baseline justify-between border-t border-border-dark pt-5">
                  <span className="font-heading text-base font-semibold tracking-wide text-surface">
                    Total
                  </span>
                  <span className="font-heading text-2xl font-bold text-gold">
                    {formatPrice(cartTotal)}
                  </span>
                </div>

                <p className="mt-3 font-body text-xs leading-relaxed text-surface/60">
                  The final total is confirmed at checkout.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    to="/checkout"
                    className={`rounded-full bg-gold-cta px-8 py-3.5 text-center font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none ${ringDark}`}
                  >
                    Checkout
                  </Link>
                  <Link
                    to="/shop"
                    className={`rounded-full border border-border-dark px-8 py-3.5 text-center font-heading text-base font-semibold tracking-wider text-surface transition-colors hover:bg-gold hover:text-surface-dark ${ringDark}`}
                  >
                    Continue shopping
                  </Link>
                </div>
              </motion.aside>
            </div>
          )}
        </div>
      </main>
    </MotionConfig>
  );
}
