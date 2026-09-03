import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasDashboardAccess, mapIngestStatus, normalizePhone } from "@/lib/utils";

const ingestSchema = z.object({
  event_type: z
    .enum(["missed_call", "inbound_sms", "web_form"])
    .default("missed_call"),
  from_number: z.string().min(7).max(32),
  to_number: z.string().max(32).optional(),
  call_sid: z.string().max(80).optional(),
  project_need: z.string().max(500).optional(),
  timeline: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  message_history: z.string().max(20000).optional(),
  conversation_status: z
    .enum([
      "new",
      "in_progress",
      "contacted",
      "qualified",
      "booked",
      "closed_not_fit",
      "lost",
    ])
    .optional(),
});

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = ingestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();
  const { data: organization } = await admin
    .from("organizations")
    .select("id, subscription_status")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (!organization) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  if (!hasDashboardAccess(organization.subscription_status)) {
    return NextResponse.json(
      { error: "Subscription is not active." },
      { status: 402 },
    );
  }

  const phone = normalizePhone(parsed.data.from_number);
  const status = mapIngestStatus(parsed.data.conversation_status);
  const source =
    parsed.data.event_type === "inbound_sms"
      ? "inbound_sms"
      : parsed.data.event_type === "web_form"
        ? "web_form"
        : "missed_call";

  const { data: existing } = await admin
    .from("leads")
    .select("id, message_history")
    .eq("organization_id", organization.id)
    .eq("lead_phone", phone)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from("leads")
      .update({
        ...(status ? { status } : {}),
        source,
        call_sid: parsed.data.call_sid ?? null,
        project_need: parsed.data.project_need ?? undefined,
        timeline: parsed.data.timeline ?? undefined,
        location: parsed.data.location ?? undefined,
        notes: parsed.data.notes ?? undefined,
        message_history: parsed.data.message_history
          ? `${existing.message_history}\n${parsed.data.message_history}`.trim()
          : existing.message_history,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lead: data, created: false });
  }

  const { data, error } = await admin
    .from("leads")
    .insert({
      organization_id: organization.id,
      lead_phone: phone,
      status: status ?? "new",
      source,
      call_sid: parsed.data.call_sid ?? null,
      project_need: parsed.data.project_need ?? null,
      timeline: parsed.data.timeline ?? null,
      location: parsed.data.location ?? null,
      notes: parsed.data.notes ?? null,
      message_history: parsed.data.message_history ?? "",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lead: data, created: true }, { status: 201 });
}
