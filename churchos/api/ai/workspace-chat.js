// api/ai/workspace-chat.js
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { model, max_tokens, system, messages } = req.body || {};
  if (!messages?.length) return res.status(400).json({ error: 'messages required' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      model      || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 600,
        system:     system     || 'You are a helpful church operations assistant.',
        messages,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(r.status).json({ error: err });
    }

    const data = await r.json();
    const rawText = data.content?.[0]?.text || '';

    // Parse <panel>...</panel> block
    const panelMatch = rawText.match(/<panel>([\s\S]*?)<\/panel>/);
    let panel = null;
    let text  = rawText.replace(/<panel>[\s\S]*?<\/panel>/, '').trim();

    if (panelMatch) {
      try { panel = JSON.parse(panelMatch[1].trim()); } catch(e) {}
    }

    return res.json({ text, panel });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
