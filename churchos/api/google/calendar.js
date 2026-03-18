// api/google/calendar.js
const { google } = require('googleapis');

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return auth.getClient();
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  try {
    const client   = await getAuth();
    const calendar = google.calendar({ version:'v3', auth: client });

    // GET — list events
    if (req.method === 'GET') {
      const { dateMin, dateMax } = req.query;
      const r = await calendar.events.list({
        calendarId,
        timeMin:      dateMin ? new Date(dateMin).toISOString() : new Date().toISOString(),
        timeMax:      dateMax ? new Date(dateMax).toISOString() : undefined,
        singleEvents: true,
        orderBy:      'startTime',
        maxResults:   50,
      });
      return res.json({ events: r.data.items ?? [] });
    }

    // POST — create event
    if (req.method === 'POST') {
      const { summary, location, description, start, end } = req.body || {};
      if (!summary || !start || !end) return res.status(400).json({ error: 'summary, start, end required' });

      const r = await calendar.events.insert({
        calendarId,
        requestBody: { summary, location, description, start, end },
      });
      return res.json(r.data);
    }

    return res.status(405).end();

  } catch (err) {
    console.error('[google/calendar]', err);
    return res.status(500).json({ error: err.message });
  }
};
