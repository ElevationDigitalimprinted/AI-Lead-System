import type { LeadStatus, SubscriptionStatus } from "@/types/database";

export const LEAD_PIPELINE: {
  status: LeadStatus;
  label: string;
  description: string;
}[] = [
  {
    status: "new",
    label: "New",
    description: "Just captured",
  },
  {
    status: "contacted",
    label: "Contacted",
    description: "First response sent",
  },
  {
    status: "qualified",
    label: "Qualified",
    description: "Details collected",
  },
  {
    status: "booked",
    label: "Booked",
    description: "Estimate or job set",
  },
  {
    status: "lost",
    label: "Lost",
    description: "Not a fit or went quiet",
  },
];

export const BILLABLE_STATUSES: SubscriptionStatus[] = [
  "active",
  "on_trial",
  "past_due",
];

export function hasDashboardAccess(status: SubscriptionStatus) {
  return BILLABLE_STATUSES.includes(status);
}

export function formatPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  return digits;
}

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return trimmed.startsWith("+") ? trimmed : `+${digits || trimmed}`;
}

export function timeAgo(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function mapIngestStatus(
  status: string | undefined,
): LeadStatus | undefined {
  if (!status) {
    return undefined;
  }
  const mapped: Record<string, LeadStatus> = {
    new: "new",
    in_progress: "contacted",
    contacted: "contacted",
    qualified: "qualified",
    booked: "booked",
    closed_not_fit: "lost",
    lost: "lost",
  };
  return mapped[status];
}
