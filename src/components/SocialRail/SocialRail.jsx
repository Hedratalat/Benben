import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa6";

export const socials = [
  {
    label: "Facebook",
    href: "https://facebook.com/yourpage",
    Icon: FaFacebookF,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/yourpage",
    Icon: FaInstagram,
  },
  { label: "TikTok", href: "https://tiktok.com/@yourpage", Icon: FaTiktok },
  { label: "WhatsApp", href: "https://wa.me/201000000000", Icon: FaWhatsapp },
];

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export default function SocialRail() {
  return (
    <aside
      aria-label="Social media"
      className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 xl:block"
    >
      <ul className="flex flex-col gap-1 rounded-full border border-border-strong bg-surface/85 p-1.5 shadow-luxury backdrop-blur-md">
        {socials.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={`grid h-10 w-10 place-items-center rounded-full text-heading transition duration-200 hover:-translate-y-0.5 hover:bg-gold hover:text-surface-dark motion-reduce:transition-none ${ring}`}
            >
              <Icon size={17} />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
