// api/rock/events.js
const ROCK_API_URL = process.env.ROCK_API_URL;
const ROCK_API_KEY = process.env.ROCK_API_KEY;

const headers = { 'Authorization-Token': ROCK_API_KEY };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { dateMin, dateMax } = req.query;

  try {
    const filters = [];
    if (dateMin) filters.push(`NextStartDateTime ge datetime'${dateMin}'`);
    if (dateMax) filters.push(`NextStartDateTime le datetime'${dateMax}T23:59:59'`);

    const params = new URLSearchParams({
      $filter:  filters.length ? filters.join(' and ') : 'NextStartDateTime ge datetime\'2020-01-01\'',
      $select:  'Id,Name,Description,NextStartDateTime,EndDateTime,Location',
      $orderby: 'NextStartDateTime asc',
      $top:     '50',
    });

    const r = await fetch(`${ROCK_API_URL}/v1/EventCalendarItems?${params}`, { headers });
    if (!r.ok) throw new Error(`Rock ${r.status}`);
    const d = await r.json();
    return res.json({ events: d });

  } catch (err) {
    console.error('[rock/events]', err);
    return res.status(500).json({ error: err.message });
  }
};
