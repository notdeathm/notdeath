export default async function handler(req, res) {
  // Returns a simple SVG badge for the overall status or a component
  // Query parameters: ?component=<id>
  const fs = await import('fs/promises');
  const url = './status.json';
  try {
    const raw = await fs.readFile(url, 'utf8');
    const data = JSON.parse(raw);
    let label = 'status';
    let message = data.summary || (data.status || 'unknown');
    if (req.query && req.query.component && Array.isArray(data.components)) {
      const comp = data.components.find(c => c.id === req.query.component);
      if (comp) {
        label = comp.name || comp.id;
        message = comp.status || 'unknown';
      } else {
        message = 'not found';
      }
    }

    // Simple color mapping
    const color = message === 'online' ? '#4c1' : (message === 'degraded' ? '#dfb317' : (message === 'offline' ? '#e05d44' : '#9f9f9f'));

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#eee" stop-opacity=".7"/>
    <stop offset="1" stop-opacity=".7"/>
  </linearGradient>
  <rect rx="3" width="120" height="20" fill="#555"/>
  <rect rx="3" x="60" width="60" height="20" fill="${color}"/>
  <rect rx="3" width="120" height="20" fill="url(#b)"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,DejaVuSans,Bitstream Vera Sans,Arial,Helvetica,sans-serif" font-size="11">
    <text x="30" y="14">${escapeXml(label)}</text>
    <text x="90" y="14">${escapeXml(message)}</text>
  </g>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml;charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(svg);
  } catch (e) {
    res.status(500).json({ error: 'failed to render badge' });
  }
}

function escapeXml(s) {
  return String(s).replace(/[&"'<>]/g, function (c) { return ({ '&':'&amp;','"':'&quot;',"'":"&apos;","<":"&lt;",">":"&gt;" })[c]; });
}
