export default async function handler(req, res) {
  // Simple serverless status endpoint for Vercel
  // GET: returns current status.json
  // GET?run=1 runs checks on-demand (may be rate-limited)
  const fs = await import('fs/promises');
  async function checkHttp(url, expect) {
    try {
      const r = await fetch(url, { method: 'GET' });
      return { ok: r.ok && (expect ? r.status === expect : r.ok), statusCode: r.status };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  try {
    const raw = await fs.readFile('./status.json', 'utf8');
    const current = JSON.parse(raw);
    if (req.query && req.query.run === '1') {
      // run on-demand checks using status-config.json
      try {
        const cfgRaw = await fs.readFile('./status-config.json', 'utf8');
        const cfg = JSON.parse(cfgRaw);
        const components = [];
        for (const c of cfg.components || []) {
          if (c.type === 'http') {
            const r = await checkHttp(c.url, c.expect);
            components.push({ id: c.id, name: c.name, status: r.ok ? 'online' : 'offline', description: c.description || '', checked_at: new Date().toISOString(), details: r.error || r.statusCode });
          }
        }
        current.components = components;
        current.updated_at = new Date().toISOString();
      } catch (e) {
        // ignore
      }
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(current));
  } catch (e) {
    res.status(404).json({ error: 'status.json not found' });
  }
}
