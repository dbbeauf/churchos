// api/rock/guests.js
const ROCK_API_URL = process.env.ROCK_API_URL;
const ROCK_API_KEY = process.env.ROCK_API_KEY;

// TODO: confirm this ID in Rock Admin > General Settings > Defined Values > Person Connection Status
const FIRST_VISIT_STATUS_ID = 65;

const headers = { 'Authorization-Token': ROCK_API_KEY };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { dateMin, dateMax } = req.query;

  try {
    const filters = [`ConnectionStatusValueId eq ${FIRST_VISIT_STATUS_ID}`];
    if (dateMin) filters.push(`CreatedDateTime ge datetime'${dateMin}'`);
    if (dateMax) filters.push(`CreatedDateTime le datetime'${dateMax}T23:59:59'`);

    const url = `${ROCK_API_URL}/v2/People?$filter=${filters.join(' and ')}`
      + `&$select=Id,FirstName,LastName,Email,CreatedDateTime,ConnectionStatusValueId`
      + `&$expand=PhoneNumbers($select=NumberFormatted),ConnectionStatusValue($select=Value)`
      + `&$orderby=CreatedDateTime desc&$top=100`;

    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`Rock ${r.status}`);
    const d = await r.json();

    const guests = (d.value ?? []).map(p => ({
      id:               p.Id,
      firstName:        p.FirstName,
      lastName:         p.LastName,
      email:            p.Email,
      phone:            p.PhoneNumbers?.[0]?.NumberFormatted,
      connectionStatus: p.ConnectionStatusValue?.Value,
      visitDate:        p.CreatedDateTime,
      isFirstTime:      p.ConnectionStatusValueId === FIRST_VISIT_STATUS_ID,
      followedUp:       false,
    }));

    return res.json({ guests });

  } catch (err) {
    console.error('[rock/guests]', err);
    return res.status(500).json({ error: err.message });
  }
};
