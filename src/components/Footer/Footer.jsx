import { Link } from "react-router-dom";
import logo from "../../../public/logoo.png";

/* ---------- Data (عدّل الروابط والبيانات حسب موقعك) ---------- */
const explore = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
];

const account = [
  { label: "Log in", href: "/login" },
  { label: "Favorites", href: "/favorites" },
  { label: "Cart", href: "/cart" },
];

// href اللي بيبدأ بـ "/" بيشتغل كـ Link داخلي، والباقي <a> عادي
const contact = [
  { label: "Contact us", href: "/contact" },
  { label: "hello@benben.com", href: "mailto:hello@benben.com" },
  { label: "+20 100 000 0000", href: "tel:+201000000000" },
  { label: "Sat – Thu, 10:00 AM – 9:00 PM" },
  { label: "Online store, Cairo, Egypt" },
];

const socials = [
  { name: "Instagram", href: "#" },
  { name: "Facebook", href: "#" },
  { name: "TikTok", href: "#" },
  { name: "WhatsApp", href: "#" },
];

/* ---------- Shared pieces ---------- */
const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark";

const Diamond = ({ className = "" }) => (
  <i
    aria-hidden="true"
    className={`block rotate-45 bg-gold-cta ${className}`}
  />
);

const linkClass = `rounded font-body text-[15px] text-surface/75 transition-colors duration-200 hover:text-gold-hover ${ring}`;

const Column = ({ title, children }) => (
  <div>
    <h3 className="font-heading text-lg font-semibold tracking-wider text-gold">
      {title}
    </h3>
    <ul className="mt-5 space-y-3.5">{children}</ul>
  </div>
);

const FooterLink = ({ href, children }) =>
  href.startsWith("/") ? (
    <Link to={href} className={linkClass}>
      {children}
    </Link>
  ) : (
    <a href={href} className={`break-words ${linkClass}`}>
      {children}
    </a>
  );

/* ---------- Component ---------- */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-surface-dark text-surface">
      {/* thin gold line on top */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gold-cta"
      />

      <div className="relative mx-auto max-w-6xl px-5 pb-6 pt-10 sm:px-8 sm:pt-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10">
          {/* Brand */}
          <div className="max-w-sm">
            <Link
              to="/"
              aria-label="BENBEN home"
              className={`group inline-flex items-center gap-3 rounded-full font-heading text-[1.65rem] font-bold tracking-[0.18em] text-surface ${ring}`}
            >
              <span>BEN</span>
              <Diamond className="h-3 w-3 transition-transform duration-500 group-hover:rotate-[225deg] group-hover:scale-150 motion-reduce:transition-none" />
              <span>BEN</span>
            </Link>
            <p className="mt-5 font-body text-[15px] leading-relaxed text-surface/70">
              A hand-picked catalogue from suppliers we've vetted. Real delivery
              times, real tracking, and real people when you need help.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className={`rounded-full border border-border-dark px-5 py-2.5 font-body text-[15px] text-surface transition-colors hover:bg-gold hover:text-surface-dark ${ring}`}
                >
                  {s.name}
                </a>
              ))}
            </div>
          </div>

          <Column title="Explore">
            {explore.map((l) => (
              <li key={l.label}>
                <FooterLink href={l.href}>{l.label}</FooterLink>
              </li>
            ))}
          </Column>

          <Column title="My account">
            {account.map((l) => (
              <li key={l.label}>
                <FooterLink href={l.href}>{l.label}</FooterLink>
              </li>
            ))}
          </Column>

          <Column title="Get in touch">
            {contact.map((c) => (
              <li key={c.label}>
                {c.href ? (
                  <FooterLink href={c.href}>{c.label}</FooterLink>
                ) : (
                  <span className="font-body text-[15px] text-surface/75">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </Column>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border-dark pt-6 text-center sm:flex-row sm:text-left">
          <p className="font-body text-[15px] text-surface/60">
            © {year} BENBEN. All rights reserved.
          </p>
          <div className="flex items-center gap-2" aria-hidden="true">
            <Diamond className="h-1.5 w-1.5" />
            <Diamond className="h-2 w-2" />
            <Diamond className="h-1.5 w-1.5" />
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`rounded-full border border-border-dark px-5 py-2.5 font-body text-[15px] text-surface transition-colors hover:bg-gold hover:text-surface-dark ${ring}`}
          >
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
