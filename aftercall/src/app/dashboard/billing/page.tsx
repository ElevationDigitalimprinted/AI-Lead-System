import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/session";
import { hasDashboardAccess } from "@/lib/utils";
import { createCheckoutAction } from "@/actions/billing";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const tenant = await getTenantContext();
  if (!tenant) {
    redirect("/login");
  }

  const params = await searchParams;
  const org = tenant.organization;
  const active = hasDashboardAccess(org.subscription_status);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Billing</h1>
        <p className="mt-1 text-muted">
          Elevation Pipeline is billed per shop through Lemon Squeezy. Access to
          lead mutations stays locked to an active, trial, or past-due
          subscription.
        </p>
      </div>

      {params.checkout === "success" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Checkout completed. Subscription status updates as soon as Lemon
          Squeezy delivers the webhook.
        </p>
      ) : null}

      <section className="rounded-2xl border border-line bg-card p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Status</dt>
            <dd className="font-medium capitalize text-ink">
              {org.subscription_status.replace("_", " ")}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Subscription ID</dt>
            <dd className="font-mono text-xs text-ink">
              {org.lemon_squeezy_subscription_id ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Renews</dt>
            <dd className="text-ink">
              {org.subscription_renews_at
                ? new Date(org.subscription_renews_at).toLocaleString()
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Access</dt>
            <dd className="text-ink">{active ? "Unlocked" : "Gated"}</dd>
          </div>
        </dl>

        {!active ? (
          <form action={createCheckoutAction} className="mt-6">
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              Subscribe with Lemon Squeezy
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">
            Your shop can create, move, and delete leads while this subscription
            remains {org.subscription_status.replace("_", " ")}.
          </p>
        )}
      </section>
    </div>
  );
}
