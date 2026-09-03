"use client";

import { useActionState } from "react";
import {
  updateOrganizationAction,
  type AuthActionState,
} from "@/actions/auth";
import type { Organization } from "@/types/database";

const initial: AuthActionState = { error: null };

export function ShopSettingsForm({
  organization,
  isOwner,
}: {
  organization: Organization;
  isOwner: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateOrganizationAction,
    initial,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Shop name</span>
        <input
          name="name"
          defaultValue={organization.name}
          required
          disabled={!isOwner}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Business type</span>
        <input
          name="businessType"
          defaultValue={organization.business_type}
          required
          disabled={!isOwner}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Owner name</span>
        <input
          name="ownerName"
          defaultValue={organization.owner_name ?? ""}
          disabled={!isOwner}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Service area</span>
        <input
          name="serviceArea"
          defaultValue={organization.service_area ?? ""}
          disabled={!isOwner}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Business hours</span>
        <input
          name="businessHours"
          defaultValue={organization.business_hours ?? ""}
          disabled={!isOwner}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Business phone</span>
        <input
          name="businessPhone"
          defaultValue={organization.business_phone ?? ""}
          disabled={!isOwner}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Owner phone (handoff alerts)</span>
        <input
          name="ownerPhone"
          defaultValue={organization.owner_phone ?? ""}
          disabled={!isOwner}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Twilio number</span>
        <input
          name="twilioNumber"
          defaultValue={organization.twilio_number ?? ""}
          disabled={!isOwner}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button
        type="submit"
        disabled={!isOwner || pending}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save shop settings"}
      </button>
    </form>
  );
}
