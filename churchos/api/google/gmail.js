// api/google/gmail.js
const { google } = require('googleapis');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { to, subject, body } = req.body || {};
  if (!to || !subject || !body) return res.status(400).json({ error: 'to, subject, body required' });

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key:  (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
    });

    const client = await auth.getClient();
    const gmail  = google.gmail({ version:'v1', auth: client });

    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      body,
    ].join('\n');

    const encoded = Buffer.from(message).toString('base64url');

    await gmail.users.messages.send({
      userId:      'me',
      requestBody: { raw: encoded },
    });

    return res.json({ success: true });

  } catch (err) {
    console.error('[google/gmail]', err);
    return res.status(500).json({ error: err.message });
  }
};
