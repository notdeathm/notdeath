const sanitizeHtml = (str) => str.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export default async function handler(req, res) {
  // POST: { title, body, honeypot, ts } - creates a GitHub Issue if GITHUB_TOKEN and GITHUB_REPO env are set
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { title, body, honeypot, ts } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'Missing title or body' });
  if (title.length > 100) return res.status(400).json({ error: 'Title too long' });
  if (body.length > 1000) return res.status(400).json({ error: 'Body too long' });

  // Basic anti-spam: honeypot must be empty and form must be open for at least 5 seconds
  const now = Date.now();
  if (honeypot) return res.status(400).json({ error: 'Spam detected' });
  if (!ts || (now - Number(ts) < 5000)) return res.status(400).json({ error: 'Form submitted too quickly' });

  const sanitizedTitle = sanitizeHtml(title);
  const sanitizedBody = sanitizeHtml(body);

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. owner/repo
  if (!GITHUB_TOKEN || !GITHUB_REPO) return res.status(501).json({ error: 'Issue creation not configured (set GITHUB_TOKEN and GITHUB_REPO)' });

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/issues`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `[Status Report] ${sanitizedTitle}`, body: sanitizedBody })
    });
    const json = await r.json();
    if (!r.ok) return res.status(500).json({ error: json });
    return res.status(200).json({ issue: json.html_url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
