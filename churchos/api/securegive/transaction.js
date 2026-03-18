// api/securegive/transaction.js
const BASE = process.env.SECUREGIVE_API_URL || 'https://api.securegive.com/v1';
const KEY  = process.env.SECUREGIVE_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, dateMin, dateMax, Page, PageSize } = req.query;

  try {
    if (id) {
      const r = await fetch(`${BASE}/transaction/${id}`, { headers:{ Authorization:`Bearer ${KEY}` } });
      const d = await r.json();
      return res.json(d);
    }

    const params = new URLSearchParams();
    if (dateMin)   params.set('TransactionTsMin', dateMin);
    if (dateMax)   params.set('TransactionTsMax', dateMax);
    if (Page)      params.set('Page', Page);
    if (PageSize)  params.set('PageSize', PageSize || '50');

    const r = await fetch(`${BASE}/transaction?${params}`, { headers:{ Authorization:`Bearer ${KEY}` } });
    if (!r.ok) throw new Error(`SecureGive ${r.status}`);
    const d = await r.json();
    return res.json({ transactions: d.data ?? d.transactions ?? [], paging: d.paging });
  } catch (err) {
    console.error('[securegive/transaction]', err);
    return res.status(500).json({ error: err.message });
  }
};
