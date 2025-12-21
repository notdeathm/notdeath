const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, title, message, to_email } = req.body || {};
  if (!name || !email || !title || !message) return res.status(400).json({ error: 'Missing fields' });
  if (name.length > 50) return res.status(400).json({ error: 'Name too long' });
  if (title.length > 100) return res.status(400).json({ error: 'Title too long' });
  if (message.length > 1000) return res.status(400).json({ error: 'Message too long' });
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email' });

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const SENDER_EMAIL = process.env.SENDER_EMAIL || '{{email}}';
  const recipient = to_email || 'notdeath@duck.com';

  if (!SENDGRID_API_KEY) {
    return res.status(501).json({ error: 'No email provider configured. Set SENDGRID_API_KEY in environment.' });
  }

  try {
    const payload = {
      personalizations: [{ to: [{ email: recipient }] }],
      from: { email: SENDER_EMAIL },
      subject: `[${title}] Contact form message from ${name}`,
      content: [{ type: 'text/plain', value: `From: ${name} <${email}>\nSubject: ${title}\n\n${message}` }]
    };

    const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SENDGRID_API_KEY}` },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('SendGrid error', r.status, text);
      return res.status(500).json({ error: 'SendGrid error', detail: text });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Mail send failed', e.message);
    return res.status(500).json({ error: e.message });
  }
}
