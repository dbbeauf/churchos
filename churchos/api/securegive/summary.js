// api/securegive/summary.js
const BASE = process.env.SECUREGIVE_API_URL || 'https://api.securegive.com/v1';
const KEY  = process.env.SECUREGIVE_API_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { dateMin, dateMax } = req.query;

  try {
    const params = new URLSearchParams();
    if (dateMin) params.set('TransactionTsMin', dateMin);
    if (dateMax) params.set('TransactionTsMax', dateMax);

    const [txRes, recurRes, memberRes] = await Promise.all([
      fetch(`${BASE}/transaction?${params}&PageSize=500`, { headers:{ Authorization:`Bearer ${KEY}` } }),
      fetch(`${BASE}/recurring?Status=Active&PageSize=500`,  { headers:{ Authorization:`Bearer ${KEY}` } }),
      fetch(`${BASE}/member?PageSize=500`,                   { headers:{ Authorization:`Bearer ${KEY}` } }),
    ]);

    const [txData, recurData, memberData] = await Promise.all([
      txRes.ok   ? txRes.json()     : { data:[] },
      recurRes.ok ? recurRes.json() : { data:[] },
      memberRes.ok ? memberRes.json(): { data:[] },
    ]);

    const transactions = txData.data    ?? txData.transactions    ?? [];
    const recurrings   = recurData.data ?? recurData.recurrings   ?? [];
    const members      = memberData.data ?? memberData.members    ?? [];

    const totalGiving = transactions.reduce((s, t) => s + (t.transaction_total || 0), 0);
    const recurringMRR = recurrings.reduce((s, r) => {
      const amt = r.transaction_total || 0;
      const freq = (r.frequency || '').toLowerCase();
      if (freq === 'weekly')    return s + amt * 4.33;
      if (freq === 'biweekly') return s + amt * 2.17;
      if (freq === 'monthly')  return s + amt;
      if (freq === 'quarterly')return s + amt / 3;
      if (freq === 'annually') return s + amt / 12;
      return s + amt;
    }, 0);

    const uniqueDonors = new Set(transactions.map(t => t.member_id).filter(Boolean)).size;
    const lapsedCutoff = new Date(); lapsedCutoff.setDate(lapsedCutoff.getDate() - 90);
    const lapsedCount = members.filter(m => {
      if (!m.last_activity_ts) return false;
      return new Date(m.last_activity_ts) < lapsedCutoff;
    }).length;

    const recurringPct = totalGiving > 0 ? (recurringMRR / totalGiving) * 100 : 0;

    return res.json({
      totalGiving,
      recurringMRR,
      recurringPct,
      uniqueDonors,
      newDonors:      members.filter(m => m.account_status === 'New').length,
      newDonorChange: 0,
      lapsedCount,
      yoyChange:      0,
      transactionCount: transactions.length,
    });

  } catch (err) {
    console.error('[securegive/summary]', err);
    return res.status(500).json({ error: err.message });
  }
};
