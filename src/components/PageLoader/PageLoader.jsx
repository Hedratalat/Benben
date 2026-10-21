export default function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-surface-dark px-6"
    >
      <div className="flex flex-col items-center gap-9">
        {/* animated emblem */}
        <div
          className="relative grid h-24 w-24 place-items-center"
          aria-hidden="true"
        >
          <span className="absolute inset-0 rounded-full border border-gold/40 motion-safe:animate-ping" />
          <span className="absolute inset-3 motion-safe:animate-[spin_4s_linear_infinite]">
            <span className="block h-full w-full rotate-45 border border-gold/70" />
          </span>
          <i className="block h-4 w-4 rotate-45 bg-gold-cta motion-safe:animate-pulse" />
        </div>

        {/* brand */}
        <p className="font-heading text-2xl font-bold tracking-[0.35em] text-surface sm:text-3xl">
          BENBEN
        </p>

        {/* thin progress line */}
        <div
          className="h-px w-36 overflow-hidden bg-border-dark"
          aria-hidden="true"
        >
          <div className="h-full w-1/2 bg-gold-cta motion-safe:animate-pulse" />
        </div>

        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
