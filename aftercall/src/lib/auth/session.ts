import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ConfigError } from "@/lib/env";
import { hasDashboardAccess } from "@/lib/utils";
import type { Lead, Organization, Profile } from "@/types/database";

export class AuthError extends Error {
  constructor(message = "You need to sign in to continue.") {
    super(message);
    this.name = "AuthError";
  }
}

export class SubscriptionError extends Error {
  constructor(
    message = "An active Elevation Pipeline subscription is required to manage leads.",
  ) {
    super(message);
    this.name = "SubscriptionError";
  }
}

export type TenantContext = {
  userId: string;
  email: string | undefined;
  profile: Profile;
  organization: Organization;
};

export async function getTenantContext(): Promise<TenantContext | null> {
  let supabase;
  try {
    supabase = await createServerSupabaseClient();
  } catch (error) {
    if (error instanceof ConfigError) {
      return null;
    }
    throw error;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (orgError || !organization) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    profile,
    organization,
  };
}

export async function requireTenant(): Promise<TenantContext> {
  const tenant = await getTenantContext();
  if (!tenant) {
    throw new AuthError();
  }
  return tenant;
}

export async function requireBillableTenant(): Promise<TenantContext> {
  const tenant = await requireTenant();
  if (!hasDashboardAccess(tenant.organization.subscription_status)) {
    throw new SubscriptionError();
  }
  return tenant;
}

export async function listOrganizationLeads(): Promise<Lead[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
