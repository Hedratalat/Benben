import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../../store/Storecontext";
import useAuth from "../../store/Useauth";

/* ---------- Icons (inline SVG, no extra packages needed) ---------- */
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

const UserIcon = () => (
  <Svg>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.2-3.6 4.2-5.5 8-5.5s6.8 1.9 8 5.5" />
  </Svg>
);

const HeartIcon = () => (
  <Svg>
    <path d="M12 20s-7.5-4.4-9-9.2C2 7.6 4 5 6.8 5c1.9 0 3.3 1 5.2 3 1.9-2 3.3-3 5.2-3C20 5 22 7.6 21 10.8 19.5 15.6 12 20 12 20z" />
  </Svg>
);

const BagIcon = () => (
  <Svg>
    <path d="M5 8h14l-1 12H6L5 8z" />
    <path d="M9 8V7a3 3 0 0 1 6 0v1" />
  </Svg>
);

/* ---------- Data ---------- */
const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

// One list drives the icons in the header AND the buttons in the mobile drawer
const actions = [
  { to: "/login", label: "Log in", Icon: UserIcon },
  {
    to: "/favorites",
    label: "Favorites",
    Icon: HeartIcon,
    countKey: "fav",
    badge: "bg-gold text-surface-dark",
  },
  {
    to: "/cart",
    label: "Shop bag",
    Icon: BagIcon,
    countKey: "cart",
    badge: "bg-surface-dark text-surface",
    primary: true,
  },
];

/* ---------- Shared class strings ---------- */
const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const iconBtn = `relative grid h-9 w-9 place-items-center rounded-full transition duration-200 hover:-translate-y-0.5 motion-reduce:transition-none sm:h-11 sm:w-11 ${ring}`;
const iconBtnPlain = "text-heading hover:bg-surface-muted";
const iconBtnPrimary =
  "ml-0.5 bg-gold-cta text-surface-dark hover:shadow-luxury active:brightness-90";

const burgerBar =
  "absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 rounded bg-heading transition-transform duration-300 motion-reduce:transition-none";

/* ---------- Small shared pieces ---------- */
const Diamond = ({ className = "" }) => (
  <i
    aria-hidden="true"
    className={`block rotate-45 bg-gold-cta ${className}`}
  />
);

const Badge = ({ n, className }) => (
  <b
    className={`absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-surface px-1 text-[10px] font-bold ${className}`}
  >
    {n}
  </b>
);

/* ---------- Component ---------- */

export default function Navbar() {
  const { favCount, cartCount } = useStore();
  const counts = { fav: favCount, cart: cartCount };
  const { user } = useAuth();
  const initial = (user?.displayName || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0, show: false });
  const itemRefs = useRef({});

  /* active link comes from the URL */
  const active = links.find((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href),
  )?.label;

  /* shrink after scrolling */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* sliding highlight behind the links (hidden when no link is active, e.g. 404) */
  const moveTo = (label) => {
    const el = itemRefs.current[label];
    if (!el) return setPill((p) => ({ ...p, show: false }));
    setPill({ left: el.offsetLeft, width: el.offsetWidth, show: true });
  };

  useEffect(() => {
    moveTo(active);
    const onResize = () => moveTo(active);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  /* close the mobile menu whenever the page changes */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* lock body scroll + close on Escape while the mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 px-3 transition-[padding] duration-300 motion-reduce:transition-none sm:px-6 ${
          scrolled ? "pt-2" : "pt-4"
        }`}
      >
        <div
          className={`pointer-events-auto mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center rounded-full border border-border-strong bg-surface/85 px-2.5 shadow-luxury backdrop-blur-md transition-[padding] duration-300 motion-reduce:transition-none ${
            scrolled ? "py-1.5" : "py-2.5"
          }`}
        >
          {/* LEFT: links (desktop) / burger (mobile) */}
          <div className="flex items-center">
            <nav aria-label="Main" className="hidden lg:block">
              <ul
                className="relative flex gap-0.5"
                onMouseLeave={() => moveTo(active)}
              >
                {/* sliding dark pill */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-surface-dark transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(.6,.05,.2,1)] motion-reduce:transition-none"
                  style={{
                    transform: `translateX(${pill.left}px)`,
                    width: pill.width,
                    opacity: pill.show ? 1 : 0,
                  }}
                />
                {links.map((l) => (
                  <li
                    key={l.label}
                    ref={(el) => (itemRefs.current[l.label] = el)}
                    className="relative z-10"
                  >
                    <Link
                      to={l.href}
                      onMouseEnter={() => moveTo(l.label)}
                      onFocus={() => moveTo(l.label)}
                      className={`block rounded-full px-5 py-2.5 font-body text-sm font-medium tracking-wide transition-colors duration-200 hover:text-gold-hover focus-visible:text-gold-hover ${ring} ${
                        active === l.label ? "text-gold-hover" : "text-heading"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="bb-drawer"
              className={`relative h-9 w-9 rounded-full border border-border-strong bg-surface sm:h-11 sm:w-11 lg:hidden ${ring}`}
            >
              {[
                ["rotate-45", "-translate-y-[3px]"],
                ["-rotate-45", "translate-y-[3px]"],
              ].map(([opened, closed]) => (
                <span
                  key={opened}
                  className={`${burgerBar} ${open ? opened : closed}`}
                />
              ))}
            </button>
          </div>

          {/* CENTER: brand */}
          <Link
            to="/"
            aria-label="BENBEN home"
            className={`group flex items-center gap-2 rounded-full px-2 font-heading text-base font-bold tracking-[0.18em] text-heading sm:gap-3 sm:text-xl lg:text-2xl ${ring}`}
          >
            <span>BEN</span>
            <Diamond className="h-2 w-2 transition-transform duration-500 group-hover:rotate-[225deg] group-hover:scale-150 motion-reduce:transition-none sm:h-2.5 sm:w-2.5" />
            <span>BEN</span>
          </Link>

          {/* RIGHT: icons */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-1.5">
            {actions.map(({ to, label, Icon, countKey, badge, primary }) => {
              const count = countKey ? counts[countKey] : undefined;
              const isAccount = to === "/login" && user;
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label={
                    isAccount
                      ? `Account, ${user.displayName || user.email}`
                      : count === undefined
                        ? label
                        : `${label}, ${count} items`
                  }
                  className={`${iconBtn} ${primary ? iconBtnPrimary : iconBtnPlain}`}
                >
                  {isAccount ? (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-cta font-heading text-sm font-bold text-surface-dark sm:h-8 sm:w-8">
                      {initial}
                    </span>
                  ) : (
                    <Icon />
                  )}
                  {count > 0 && <Badge n={count} className={badge} />}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* MOBILE / TABLET DRAWER */}
      <div
        id="bb-drawer"
        aria-hidden={!open}
        className={`fixed inset-0 z-40 flex flex-col justify-between bg-surface-dark px-7 pb-8 pt-28 text-surface lg:hidden ${
          open
            ? "visible [clip-path:circle(150%_at_50%_0)] [transition:clip-path_.7s_cubic-bezier(.7,0,.2,1),visibility_0s]"
            : "invisible [clip-path:circle(0_at_50%_0)] [transition:clip-path_.7s_cubic-bezier(.7,0,.2,1),visibility_0s_.7s]"
        }`}
      >
        <ul>
          {links.map((l, i) => (
            <li
              key={l.label}
              style={{ transitionDelay: open ? `${150 + i * 60}ms` : "0ms" }}
              className={`border-b border-border-dark transition-all duration-500 motion-reduce:transition-none ${
                open ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
              }`}
            >
              <Link
                to={l.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className={`flex items-center justify-between py-4 font-heading text-3xl font-semibold tracking-wider transition-colors hover:text-gold-hover sm:text-4xl ${
                  active === l.label ? "text-gold" : "text-surface"
                } focus-visible:outline-none focus-visible:text-gold-hover`}
              >
                {l.label}
                {active === l.label && <Diamond className="h-2.5 w-2.5" />}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          {actions.map(({ to, label, Icon, countKey }) => {
            const count = countKey ? counts[countKey] : undefined;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="inline-flex items-center gap-2 rounded-full border border-border-dark px-4 py-2.5 font-body text-sm font-medium text-surface transition-colors hover:bg-gold hover:text-surface-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {to === "/login" && user ? (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-cta font-heading text-xs font-bold text-surface-dark">
                    {initial}
                  </span>
                ) : (
                  <Icon />
                )}
                {to === "/login" && user
                  ? "Account"
                  : count === undefined
                    ? label
                    : `${label} (${count})`}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
