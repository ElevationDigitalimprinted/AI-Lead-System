import { createHmac, timingSafeEqual } from "node:crypto";
import type { SubscriptionStatus } from "@/types/database";

export type LemonSqueezyWebhookEvent = {
  meta: {
    event_name: string;
    custom_data?: {
      organization_id?: string;
      organizationId?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      store_id?: number | string;
      customer_id?: number | string;
      order_id?: number | string;
      product_id?: number | string;
      variant_id?: number | string;
      status?: string;
      status_formatted?: string;
      renews_at?: string | null;
      ends_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
  };
};

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  on_trial: "on_trial",
  active: "active",
  paused: "paused",
  past_due: "past_due",
  unpaid: "unpaid",
  cancelled: "cancelled",
  expired: "expired",
};

export function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
) {
  if (!signatureHeader) {
    return false;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = Buffer.from(signatureHeader);
  const expected = Buffer.from(digest);

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

export function mapSubscriptionStatus(status: string | undefined): SubscriptionStatus {
  if (!status) {
    return "inactive";
  }
  return STATUS_MAP[status] ?? "inactive";
}

export function asStringId(value: number | string | undefined | null) {
  if (value === undefined || value === null) {
    return null;
  }
  return String(value);
}
