// api/securegive/donors.js
const BASE = process.env.SECUREGIVE_API_URL || 'https://api.securegive.com/v1';
const KEY  = process.env.SECUREGIVE_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, Page, PageSize, LastActivityTsMax, AccountStatus } = req.query;

  try {
    if (id) {
      const r = await fetch(`${BASE}/member/${id}`, { headers:{ Authorization:`Bearer ${KEY}` } });
      const d = await r.json();
      return res.json(d);
    }

    const params = new URLSearchParams();
    if (Page)             params.set('Page', Page);
    if (PageSize)         params.set('PageSize', PageSize || '50');
    if (LastActivityTsMax) params.set('LastActivityTsMax', LastActivityTsMax);
    if (AccountStatus)    params.set('AccountStatus', AccountStatus);

    const r = await fetch(`${BASE}/member?${params}`, { headers:{ Authorization:`Bearer ${KEY}` } });
    if (!r.ok) throw new Error(`SecureGive ${r.status}`);
    const d = await r.json();
    return res.json({ members: d.data ?? d.members ?? [], paging: d.paging });
  } catch (err) {
    console.error('[securegive/donors]', err);
    return res.status(500).json({ error: err.message });
  }
};
