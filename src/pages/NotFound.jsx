import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-page px-6 pb-20 pt-36">
      <div className="mx-auto max-w-xl text-center">
        {/* 4 ◆ 4 — the diamond echoes the BENBEN logo */}
        <div
          aria-hidden="true"
          className="flex items-center justify-center gap-5 font-heading text-8xl font-bold leading-none text-heading sm:gap-9 sm:text-9xl"
        >
          <span>4</span>
          <i className="block h-12 w-12 rotate-45 bg-gold-cta shadow-luxury sm:h-20 sm:w-20" />
          <span>4</span>
        </div>

        <h1 className="mt-12 text-3xl font-bold tracking-wider sm:text-4xl">
          This page isn't here
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-base leading-relaxed text-muted sm:text-lg">
          The link may be broken, or the page may have moved. Head back home, or
          tell us what you were looking for and we'll point you the right way.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/"
            className="rounded-full bg-gold-cta px-8 py-3.5 font-heading text-base font-bold tracking-wider text-surface-dark transition duration-200 hover:-translate-y-0.5 hover:shadow-luxury active:brightness-90 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            Back to home
          </Link>
          <Link
            to="/contact"
            className="rounded-full border border-border-strong px-8 py-3.5 font-heading text-base font-semibold tracking-wider text-heading transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
