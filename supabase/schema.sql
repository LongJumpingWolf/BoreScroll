-- Run this once in your Supabase project's SQL editor.
-- One row per device/browser that's opted into break reminders.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_subscriptions_endpoint_idx
  on push_subscriptions (endpoint);

-- Optional housekeeping, run manually whenever: subscriptions the browser
-- revoked are already deleted automatically by /api/send-reminder on a
-- failed send, but this clears out ones that were never re-visited either.
-- delete from push_subscriptions where last_seen_at < now() - interval '90 days';
