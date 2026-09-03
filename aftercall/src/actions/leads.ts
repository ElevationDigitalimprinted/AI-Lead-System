"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AuthError,
  SubscriptionError,
  requireBillableTenant,
} from "@/lib/auth/session";
import { normalizePhone } from "@/lib/utils";
import type { LeadStatus } from "@/types/database";

const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "booked",
  "lost",
]);

const leadSourceSchema = z.enum([
  "manual",
  "missed_call",
  "inbound_sms",
  "web_form",
]);

const createLeadSchema = z.object({
  leadPhone: z.string().trim().min(7).max(32),
  projectNeed: z.string().trim().max(500).optional().or(z.literal("")),
  timeline: z.string().trim().max(200).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  source: leadSourceSchema.default("manual"),
});

export type LeadActionState = {
  error: string | null;
  success?: string;
};

function actionError(error: unknown): LeadActionState {
  if (error instanceof AuthError || error instanceof SubscriptionError) {
    return { error: error.message };
  }
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: "Something went wrong." };
}

export async function createLeadAction(
  _prev: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  try {
    const tenant = await requireBillableTenant();
    const parsed = createLeadSchema.safeParse({
      leadPhone: formData.get("leadPhone"),
      projectNeed: formData.get("projectNeed") ?? "",
      timeline: formData.get("timeline") ?? "",
      location: formData.get("location") ?? "",
      notes: formData.get("notes") ?? "",
      source: formData.get("source") || "manual",
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid lead." };
    }

    const phone = normalizePhone(parsed.data.leadPhone);
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from("leads").insert({
      organization_id: tenant.organization.id,
      lead_phone: phone,
      project_need: parsed.data.projectNeed || null,
      timeline: parsed.data.timeline || null,
      location: parsed.data.location || null,
      notes: parsed.data.notes || null,
      source: parsed.data.source,
      status: "new",
    });

    if (error) {
      if (error.code === "23505") {
        return { error: "A lead with this phone number already exists." };
      }
      return { error: error.message };
    }

    revalidatePath("/dashboard");
    return { error: null, success: "Lead captured." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus,
): Promise<LeadActionState> {
  try {
    await requireBillableTenant();
    const parsedStatus = leadStatusSchema.parse(status);
    const id = z.string().uuid().parse(leadId);
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("leads")
      .update({ status: parsedStatus })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }
    if (!data) {
      return { error: "Lead not found." };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/leads/${id}`);
    return { error: null };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateLeadAction(
  _prev: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  try {
    await requireBillableTenant();
    const schema = z.object({
      id: z.string().uuid(),
      projectNeed: z.string().trim().max(500).optional().or(z.literal("")),
      timeline: z.string().trim().max(200).optional().or(z.literal("")),
      location: z.string().trim().max(200).optional().or(z.literal("")),
      callbackNumber: z.string().trim().max(32).optional().or(z.literal("")),
      notes: z.string().trim().max(2000).optional().or(z.literal("")),
      status: leadStatusSchema,
    });

    const parsed = schema.safeParse({
      id: formData.get("id"),
      projectNeed: formData.get("projectNeed") ?? "",
      timeline: formData.get("timeline") ?? "",
      location: formData.get("location") ?? "",
      callbackNumber: formData.get("callbackNumber") ?? "",
      notes: formData.get("notes") ?? "",
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid lead." };
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("leads")
      .update({
        project_need: parsed.data.projectNeed || null,
        timeline: parsed.data.timeline || null,
        location: parsed.data.location || null,
        callback_number: parsed.data.callbackNumber
          ? normalizePhone(parsed.data.callbackNumber)
          : null,
        notes: parsed.data.notes || null,
        status: parsed.data.status,
        handoff_sent: formData.get("handoffSent") === "on",
      })
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }
    if (!data) {
      return { error: "Lead not found." };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/leads/${parsed.data.id}`);
    return { error: null, success: "Lead updated." };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteLeadAction(leadId: string): Promise<LeadActionState> {
  try {
    await requireBillableTenant();
    const id = z.string().uuid().parse(leadId);
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }
    if (!data) {
      return { error: "Lead not found." };
    }

    revalidatePath("/dashboard");
    return { error: null, success: "Lead deleted." };
  } catch (error) {
    return actionError(error);
  }
}
