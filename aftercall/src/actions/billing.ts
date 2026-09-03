"use server";

import { redirect } from "next/navigation";
import { getLemonSqueezyEnv, getPublicEnv } from "@/lib/env";
import { requireTenant } from "@/lib/auth/session";

export async function createCheckoutAction() {
  const tenant = await requireTenant();
  const lemon = getLemonSqueezyEnv();
  const { appUrl } = getPublicEnv();

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${lemon.apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: tenant.email,
            name: tenant.profile.full_name,
            custom: {
              organization_id: tenant.organization.id,
            },
          },
          product_options: {
            redirect_url: `${appUrl}/dashboard/billing?checkout=success`,
          },
          checkout_options: {
            embed: false,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: lemon.storeId },
          },
          variant: {
            data: { type: "variants", id: lemon.variantId },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Unable to start checkout: ${details}`);
  }

  const payload = (await response.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const url = payload.data?.attributes?.url;
  if (!url) {
    throw new Error("Lemon Squeezy did not return a checkout URL.");
  }

  redirect(url);
}
