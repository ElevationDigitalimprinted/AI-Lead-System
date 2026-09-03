"use client";

import { useActionState } from "react";
import { createLeadAction, type LeadActionState } from "@/actions/leads";
import { hasDashboardAccess } from "@/lib/utils";
import type { SubscriptionStatus } from "@/types/database";

const initial: LeadActionState = { error: null };

export function NewLeadForm({
  subscriptionStatus,
}: {
  subscriptionStatus: SubscriptionStatus;
}) {
  const [state, formAction, pending] = useActionState(createLeadAction, initial);
  const enabled = hasDashboardAccess(subscriptionStatus);

  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-[1.1fr_1fr_1fr_auto]"
    >
      <input
        name="leadPhone"
        required
        disabled={!enabled}
        placeholder="Lead phone"
        className="rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none ring-accent focus:ring-2 disabled:opacity-50"
      />
      <input
        name="projectNeed"
        disabled={!enabled}
        placeholder="What they need"
        className="rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none ring-accent focus:ring-2 disabled:opacity-50"
      />
      <input
        name="location"
        disabled={!enabled}
        placeholder="City / neighborhood"
        className="rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none ring-accent focus:ring-2 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!enabled || pending}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add lead"}
      </button>
      {state.error ? (
        <p className="text-sm text-red-700 md:col-span-4">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700 md:col-span-4">{state.success}</p>
      ) : null}
    </form>
  );
}
