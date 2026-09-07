// POST /api/subscribe
// Body: { subscription: PushSubscription } — the raw object from
// reg.pushManager.subscribe() on the client.
// Upserts it into Supabase, keyed by the subscription's unique endpoint URL.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const { subscription } = req.body || {};
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'Invalid subscription payload' });
  }

  const { endpoint, keys } = subscription;

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
}
