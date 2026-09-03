"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { deleteLeadAction, updateLeadStatusAction } from "@/actions/leads";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { LEAD_PIPELINE, timeAgo } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";
import Link from "next/link";

function nextStatuses(current: LeadStatus): LeadStatus[] {
  return LEAD_PIPELINE.map((column) => column.status).filter(
    (status) => status !== current,
  );
}

export function LeadPipeline({
  organizationId,
  leads,
  canMutate,
}: {
  organizationId: string;
  leads: Lead[];
  canMutate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`leads-org-${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [organizationId, router]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {LEAD_PIPELINE.map((column) => {
        const cards = leads.filter((lead) => lead.status === column.status);
        return (
          <section
            key={column.status}
            className="rounded-2xl border border-line bg-card/70 p-3"
          >
            <div className="mb-3 flex items-baseline justify-between px-1">
              <div>
                <h2 className="font-semibold text-ink">{column.label}</h2>
                <p className="text-xs text-muted">{column.description}</p>
              </div>
              <span className="text-sm text-muted">{cards.length}</span>
            </div>
            <div className="space-y-3">
              {cards.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
                  No leads
                </p>
              ) : (
                cards.map((lead) => (
                  <article
                    key={lead.id}
                    className="rounded-xl border border-line bg-card p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {lead.lead_phone}
                      </Link>
                      <span className="text-xs text-muted">
                        {timeAgo(lead.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink">
                      {lead.project_need ?? "Need not captured yet"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {[lead.location, lead.timeline].filter(Boolean).join(" · ") ||
                        lead.source.replace("_", " ")}
                    </p>
                    {canMutate ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {nextStatuses(lead.status).map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await updateLeadStatusAction(lead.id, status);
                                router.refresh();
                              })
                            }
                            className="rounded-full border border-line px-2 py-1 text-[11px] text-muted hover:border-ink hover:text-ink disabled:opacity-50"
                          >
                            {LEAD_PIPELINE.find((item) => item.status === status)
                              ?.label ?? status}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await deleteLeadAction(lead.id);
                              router.refresh();
                            })
                          }
                          className="rounded-full px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
