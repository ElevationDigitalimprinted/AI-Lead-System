import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/session";
import { ShopSettingsForm } from "@/components/dashboard/shop-settings-form";

export default async function SettingsPage() {
  const tenant = await getTenantContext();
  if (!tenant) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Shop settings</h1>
        <p className="mt-1 text-muted">
          These values drive your missed-call recovery prompt and handoff alerts.
        </p>
      </div>
      <ShopSettingsForm
        organization={tenant.organization}
        isOwner={tenant.profile.role === "owner"}
      />
      <section className="rounded-2xl border border-line bg-card p-6">
        <h2 className="font-semibold text-ink">Inbound lead API key</h2>
        <p className="mt-1 text-sm text-muted">
          Send missed-call events from Make.com or Twilio to{" "}
          <code className="rounded bg-background px-1">/api/leads/ingest</code>{" "}
          with header <code className="rounded bg-background px-1">x-api-key</code>.
        </p>
        <p className="mt-3 break-all rounded-xl bg-background px-3 py-2 font-mono text-sm">
          {tenant.organization.api_key}
        </p>
      </section>
    </div>
  );
}
