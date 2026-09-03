import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getLemonSqueezyEnv } from "@/lib/env";
import {
  asStringId,
  mapSubscriptionStatus,
  verifyLemonSqueezySignature,
  type LemonSqueezyWebhookEvent,
} from "@/lib/lemonsqueezy/webhook";
import type { Organization, SubscriptionStatus } from "@/types/database";

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
  "subscription_payment_failed",
  "subscription_payment_recovered",
]);

function organizationIdFromEvent(event: LemonSqueezyWebhookEvent) {
  return (
    event.meta.custom_data?.organization_id ??
    event.meta.custom_data?.organizationId ??
    null
  );
}

async function findOrganization(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  event: LemonSqueezyWebhookEvent,
) {
  const organizationId = organizationIdFromEvent(event);
  if (organizationId) {
    const { data } = await admin
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .maybeSingle();
    if (data) {
      return data;
    }
  }

  const subscriptionId = event.data.id;
  const { data: bySubscription } = await admin
    .from("organizations")
    .select("*")
    .eq("lemon_squeezy_subscription_id", subscriptionId)
    .maybeSingle();

  if (bySubscription) {
    return bySubscription;
  }

  const customerId = asStringId(event.data.attributes.customer_id);
  if (!customerId) {
    return null;
  }

  const { data: byCustomer } = await admin
    .from("organizations")
    .select("*")
    .eq("lemon_squeezy_customer_id", customerId)
    .maybeSingle();

  return byCustomer;
}

function nextStatus(
  eventName: string,
  payloadStatus: string | undefined,
  current: SubscriptionStatus,
): SubscriptionStatus {
  if (eventName === "subscription_expired") {
    return "expired";
  }
  if (eventName === "subscription_cancelled") {
    return payloadStatus ? mapSubscriptionStatus(payloadStatus) : "cancelled";
  }
  if (eventName === "subscription_paused") {
    return "paused";
  }
  if (eventName === "subscription_payment_failed") {
    return payloadStatus ? mapSubscriptionStatus(payloadStatus) : "past_due";
  }
  if (
    eventName === "subscription_created" ||
    eventName === "subscription_updated" ||
    eventName === "subscription_resumed" ||
    eventName === "subscription_unpaused" ||
    eventName === "subscription_payment_success" ||
    eventName === "subscription_payment_recovered"
  ) {
    return mapSubscriptionStatus(payloadStatus);
  }
  return current;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  let secret: string;
  try {
    secret = getLemonSqueezyEnv().webhookSecret;
  } catch {
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 },
    );
  }

  if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: LemonSqueezyWebhookEvent;
  try {
    event = JSON.parse(rawBody) as LemonSqueezyWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!SUBSCRIPTION_EVENTS.has(event.meta.event_name)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const admin = createAdminSupabaseClient();
  const organization = await findOrganization(admin, event);

  if (!organization) {
    return NextResponse.json(
      { error: "No organization matched this subscription event." },
      { status: 404 },
    );
  }

  const attributes = event.data.attributes;
  const subscriptionStatus = nextStatus(
    event.meta.event_name,
    attributes.status,
    organization.subscription_status,
  );

  const patch: Partial<Organization> = {
    lemon_squeezy_subscription_id: event.data.id,
    lemon_squeezy_customer_id: asStringId(attributes.customer_id),
    lemon_squeezy_order_id: asStringId(attributes.order_id),
    lemon_squeezy_variant_id: asStringId(attributes.variant_id),
    lemon_squeezy_product_id: asStringId(attributes.product_id),
    subscription_status: subscriptionStatus,
    subscription_renews_at: attributes.renews_at ?? null,
    subscription_ends_at: attributes.ends_at ?? null,
  };

  const { error } = await admin
    .from("organizations")
    .update(patch)
    .eq("id", organization.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
