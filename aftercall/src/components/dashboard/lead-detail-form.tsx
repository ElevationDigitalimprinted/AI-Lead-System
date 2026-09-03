"use client";

import { useActionState } from "react";
import { updateLeadAction, type LeadActionState } from "@/actions/leads";
import { LEAD_PIPELINE } from "@/lib/utils";
import type { Lead } from "@/types/database";

const initial: LeadActionState = { error: null };

export function LeadDetailForm({
  lead,
  canMutate,
}: {
  lead: Lead;
  canMutate: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateLeadAction, initial);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-line bg-card p-6">
      <input type="hidden" name="id" value={lead.id} />
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Status</span>
        <select
          name="status"
          defaultValue={lead.status}
          disabled={!canMutate}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        >
          {LEAD_PIPELINE.map((column) => (
            <option key={column.status} value={column.status}>
              {column.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Project need</span>
        <input
          name="projectNeed"
          defaultValue={lead.project_need ?? ""}
          disabled={!canMutate}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Timeline</span>
        <input
          name="timeline"
          defaultValue={lead.timeline ?? ""}
          disabled={!canMutate}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Location</span>
        <input
          name="location"
          defaultValue={lead.location ?? ""}
          disabled={!canMutate}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Callback number</span>
        <input
          name="callbackNumber"
          defaultValue={lead.callback_number ?? ""}
          disabled={!canMutate}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Notes</span>
        <textarea
          name="notes"
          rows={4}
          defaultValue={lead.notes ?? ""}
          disabled={!canMutate}
          className="w-full rounded-xl border border-line bg-background px-3 py-2"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="handoffSent"
          defaultChecked={lead.handoff_sent}
          disabled={!canMutate}
        />
        Owner handoff already sent
      </label>
      {lead.message_history ? (
        <pre className="overflow-auto rounded-xl bg-background p-3 text-xs text-muted">
          {lead.message_history}
        </pre>
      ) : null}
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <button
        type="submit"
        disabled={!canMutate || pending}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save lead"}
      </button>
    </form>
  );
}
