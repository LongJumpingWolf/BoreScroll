// POST /api/schedule-reminder
// Body: { endpoint: string, minutes: number }
// Asks Upstash QStash to POST to /api/send-reminder exactly `minutes` from now.
// QStash does the waiting — this function returns immediately.

import { Client } from '@upstash/qstash';

// Your QStash token was issued in the US region, so the client needs to talk
// to the US endpoint specifically — the SDK defaults to EU otherwise, which
// is what caused the "user ... not entitled" error. Baked in directly here
// (not secret — it's just a routing URL) so a missing/mistyped QSTASH_URL
// env var in Vercel can't silently break this again. Still overridable via
// env var if you ever migrate regions later.
const QSTASH_BASE_URL = process.env.QSTASH_URL || 'https://qstash-us-east-1.upstash.io';

const qstash = new Client({
  token: process.env.QSTASH_TOKEN,
  baseUrl: QSTASH_BASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const { endpoint, minutes } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
  if (!process.env.APP_URL) return res.status(500).json({ error: 'APP_URL env var not set' });

  const mins = Math.min(180, Math.max(1, parseInt(minutes, 10) || 5));

  try {
    const result = await qstash.publishJSON({
      url: `${process.env.APP_URL}/api/send-reminder`,
      delay: mins * 60, // seconds
      body: { endpoint },
    });
    return res.status(200).json({ ok: true, messageId: result.messageId, minutes: mins });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}