"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().trim().min(1).max(80),
  organizationName: z.string().trim().min(2).max(120),
  businessPhone: z.string().trim().max(32).optional().or(z.literal("")),
  serviceArea: z.string().trim().max(200).optional().or(z.literal("")),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AuthActionState = {
  error: string | null;
};

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    organizationName: formData.get("organizationName"),
    businessPhone: formData.get("businessPhone") ?? "",
    serviceArea: formData.get("serviceArea") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid signup details." };
  }

  const supabase = await createServerSupabaseClient();
  const { appUrl } = getPublicEnv();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
        organization_name: parsed.data.organizationName,
        business_phone: parsed.data.businessPhone || null,
        service_area: parsed.data.serviceArea || null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/login?confirmed=0");
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  const next = String(formData.get("next") ?? "/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateOrganizationAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const schema = z.object({
    name: z.string().trim().min(2).max(120),
    businessType: z.string().trim().min(1).max(80),
    ownerName: z.string().trim().max(80).optional().or(z.literal("")),
    serviceArea: z.string().trim().max(200).optional().or(z.literal("")),
    businessHours: z.string().trim().max(200).optional().or(z.literal("")),
    businessPhone: z.string().trim().max(32).optional().or(z.literal("")),
    ownerPhone: z.string().trim().max(32).optional().or(z.literal("")),
    twilioNumber: z.string().trim().max(32).optional().or(z.literal("")),
  });

  const parsed = schema.safeParse({
    name: formData.get("name"),
    businessType: formData.get("businessType"),
    ownerName: formData.get("ownerName") ?? "",
    serviceArea: formData.get("serviceArea") ?? "",
    businessHours: formData.get("businessHours") ?? "",
    businessPhone: formData.get("businessPhone") ?? "",
    ownerPhone: formData.get("ownerPhone") ?? "",
    twilioNumber: formData.get("twilioNumber") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid shop details." };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in to continue." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "owner") {
    return { error: "Only the shop owner can update these settings." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      business_type: parsed.data.businessType,
      owner_name: parsed.data.ownerName || null,
      service_area: parsed.data.serviceArea || null,
      business_hours: parsed.data.businessHours || null,
      business_phone: parsed.data.businessPhone || null,
      owner_phone: parsed.data.ownerPhone || null,
      twilio_number: parsed.data.twilioNumber || null,
    })
    .eq("id", profile.organization_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { error: null };
}
