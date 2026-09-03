import { listOrganizationLeads, getTenantContext } from "@/lib/auth/session";
import { hasDashboardAccess } from "@/lib/utils";
import { NewLeadForm } from "@/components/dashboard/new-lead-form";
import { LeadPipeline } from "@/components/dashboard/lead-pipeline";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const tenant = await getTenantContext();
  if (!tenant) {
    redirect("/login");
  }

  const leads = await listOrganizationLeads();
  const canMutate = hasDashboardAccess(tenant.organization.subscription_status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Lead pipeline</h1>
        <p className="mt-1 text-muted">
          New, contacted, qualified, booked, and lost — live for{" "}
          {tenant.organization.name}.
        </p>
      </div>
      <NewLeadForm subscriptionStatus={tenant.organization.subscription_status} />
      <LeadPipeline
        organizationId={tenant.organization.id}
        leads={leads}
        canMutate={canMutate}
      />
    </div>
  );
}
