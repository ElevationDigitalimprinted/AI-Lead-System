# Elevation Pipeline

Multi-tenant lead capture and follow-up for local service businesses. Next.js App Router, Supabase Auth + Postgres RLS, and Lemon Squeezy billing.

Production URL: https://www.elevationpipeline.com

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Supabase (Postgres, Auth, Row Level Security, Realtime)
- Lemon Squeezy (checkout + subscription webhooks)

## Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in keys.
3. In Lemon Squeezy, create a subscription product and point a webhook at `https://www.elevationpipeline.com/api/webhooks/lemonsqueezy`. Subscribe to subscription created/updated/cancelled/expired/paused/resumed and payment success/failed events. Use the signing secret as `LEMONSQUEEZY_WEBHOOK_SECRET`.
4. Install and run:

```bash
npm install
npm run dev
```

## Tenant isolation

Every `profiles` and `leads` row is scoped by `organization_id`. RLS policies use `current_organization_id()` so a signed-in user can only read or mutate rows for their shop. Billing columns cannot be changed by authenticated users; only the service role (webhook) can.

## Lead ingest

`POST /api/leads/ingest` with header `x-api-key: <organization.api_key>` accepts missed-call, inbound SMS, or website form payloads.
