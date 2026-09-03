import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] uppercase">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-sm text-white">
            EP
          </span>
          {BRAND.name}
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-muted hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark"
          >
            Get a free demo
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20">
        <section className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-accent">
              Built for local service businesses
            </p>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Stop losing leads you already paid for.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-7 text-muted">
              {BRAND.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark"
              >
                Open your workspace
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink"
              >
                Shop login
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-card p-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted">
              <span>Lead flow</span>
              <span className="text-emerald-400">System ready</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["01 New lead", "Website inquiry captured"],
                ["02 Instant response", "First reply sent"],
                ["03 AI qualification", "Job details collected"],
                ["04 Follow-up", "Quiet leads stay in motion"],
                ["05 Booked job", "Routed to estimate or calendar"],
              ].map(([title, meta]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-line bg-background px-4 py-3"
                >
                  <p className="font-medium text-ink">{title}</p>
                  <p className="text-sm text-muted">{meta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
