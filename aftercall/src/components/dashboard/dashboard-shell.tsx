import Link from "next/link";
import { signOutAction } from "@/actions/auth";
import type { Organization, Profile } from "@/types/database";
import { hasDashboardAccess } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Pipeline" },
  { href: "/dashboard/settings", label: "Shop" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function DashboardShell({
  organization,
  profile,
  children,
}: {
  organization: Organization;
  profile: Profile;
  children: React.ReactNode;
}) {
  const subscribed = hasDashboardAccess(organization.subscription_status);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Elevation Pipeline
            </p>
            <p className="font-semibold text-ink">{organization.name}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-muted hover:bg-background hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 text-muted hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      {!subscribed ? (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <p>
              Subscription status:{" "}
              <span className="font-semibold">
                {organization.subscription_status}
              </span>
              . Activate billing to capture and move leads.
            </p>
            <Link
              href="/dashboard/billing"
              className="rounded-full bg-accent px-3 py-1.5 font-medium text-white"
            >
              Go to billing
            </Link>
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <p className="mb-6 text-sm text-muted">
          Signed in as {profile.full_name} · {profile.role}
        </p>
        {children}
      </main>
    </div>
  );
}
