// api/securegive/webhook.js
const BASE = process.env.SECUREGIVE_API_URL || 'https://api.securegive.com/v1';
const KEY  = process.env.SECUREGIVE_API_KEY;

const recentEvents = [];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — return recent webhook events
  if (req.method === 'GET') {
    return res.json({ events: recentEvents.slice(0, 20) });
  }

  // POST — receive webhook ping from SecureGive
  if (req.method === 'POST') {
    res.status(200).json({ received: true }); // respond immediately

    try {
      const { id, scope } = req.body || {};
      if (!id || !scope) return;

      const endpoint = scope === 'transaction' ? 'transaction'
                     : scope === 'member'      ? 'member'
                     : scope === 'recurring'   ? 'recurring'
                     : null;
      if (!endpoint) return;

      const r = await fetch(`${BASE}/${endpoint}/${id}`, { headers:{ Authorization:`Bearer ${KEY}` } });
      if (!r.ok) return;
      const data = await r.json();

      recentEvents.unshift({ id, scope, data, receivedAt: new Date().toISOString() });
      if (recentEvents.length > 50) recentEvents.pop();
    } catch (err) {
      console.error('[securegive/webhook]', err);
    }
    return;
  }

  return res.status(405).end();
};
