// POST /api/send-reminder — called by QStash, not by the browser.
// Verifies the request really came from QStash, looks up the subscription
// in Supabase, and sends the actual Web Push notification via VAPID.

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { Receiver } from '@upstash/qstash';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

// QStash signs the raw body, so this route needs the unparsed request body —
// turn off Vercel's default JSON body parsing for this one function.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const rawBody = await readRawBody(req);

  try {
    const isValid = await receiver.verify({
      signature: req.headers['upstash-signature'],
      body: rawBody,
    });
    if (!isValid) return res.status(401).json({ error: 'Invalid QStash signature' });
  } catch (e) {
    return res.status(401).json({ error: 'Signature verification failed' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    return res.status(400).json({ error: 'Bad JSON body' });
  }

  const { endpoint } = payload;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });

  const { data: sub, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('endpoint', endpoint)
    .single();

  if (error || !sub) {
    // Not an error worth retrying — the subscription just isn't there anymore.
    return res.status(200).json({ ok: true, skipped: 'subscription not found' });
  }

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };

  const payloadOut = JSON.stringify({
    title: 'Time to resume scrolling',
    body: 'Your break is over — back to the deck.',
    url: './',
  });

  try {
    await webpush.sendNotification(pushSubscription, payloadOut);
    return res.status(200).json({ ok: true });
  } catch (e) {
    // 404/410 = the browser revoked this subscription (permission pulled,
    // uninstalled, etc.) — clean it up so future sends don't keep failing.
    if (e.statusCode === 404 || e.statusCode === 410) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      return res.status(200).json({ ok: true, cleaned: true });
    }
    return res.status(500).json({ error: e.message });
  }
}
