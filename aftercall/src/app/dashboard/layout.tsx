import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenantContext();
  if (!tenant) {
    redirect("/login");
  }

  return (
    <DashboardShell
      organization={tenant.organization}
      profile={tenant.profile}
    >
      {children}
    </DashboardShell>
  );
}
