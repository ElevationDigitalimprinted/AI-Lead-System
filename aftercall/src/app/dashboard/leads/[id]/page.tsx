import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/auth/session";
import { hasDashboardAccess } from "@/lib/utils";
import { LeadDetailForm } from "@/components/dashboard/lead-detail-form";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await getTenantContext();
  if (!tenant) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!lead) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">{lead.lead_phone}</h1>
        <p className="mt-1 text-muted">
          {lead.source.replace("_", " ")} · created{" "}
          {new Date(lead.created_at).toLocaleString()}
        </p>
      </div>
      <LeadDetailForm
        lead={lead}
        canMutate={hasDashboardAccess(tenant.organization.subscription_status)}
      />
    </div>
  );
}
