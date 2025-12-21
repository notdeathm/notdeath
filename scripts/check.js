#!/usr/bin/env node
// Simple status check script for static sites
// Requires Node 18+ (fetch available)

import fs from 'fs/promises';
import { writeFile } from 'fs/promises';

const CONFIG_FILE = 'status-config.json';
const STATUS_FILE = 'status.json';

function now() { return new Date().toISOString(); }

async function loadConfig() {
  try { const raw = await fs.readFile(CONFIG_FILE, 'utf8'); return JSON.parse(raw); }
  catch (e) { console.error('No config found', e.message); return { components: [] }; }
}

async function loadPrev() {
  try { const raw = await fs.readFile(STATUS_FILE, 'utf8'); return JSON.parse(raw); }
  catch (e) { return null; }
}

async function checkHttp(url, expect) {
  try {
    const res = await fetch(url, { method: 'GET' });
    return { ok: res.ok && (expect ? res.status === expect : res.ok), statusCode: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function sendDiscord(webhook, content) {
  try {
    await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
  } catch (e) { console.warn('Discord webhook failed', e.message); }
}

async function createGitHubIssue(repo, token, title, body, labels = ['incident']) {
  if (!repo || !token) return null;
  const url = `https://api.github.com/repos/${repo}/issues`;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, labels })
    });
    if (!r.ok) {
      const txt = await r.text();
      console.warn('Issue create failed', r.status, txt);
      return null;
    }
    const j = await r.json();
    return j.html_url;
  } catch (e) { console.warn('Issue creation error', e.message); return null; }
}

async function closeGitHubIssue(repo, token, issueNumber) {
  if (!repo || !token || !issueNumber) return false;
  const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}`;
  try {
    const r = await fetch(url, {
      method: 'PATCH',
      headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'closed' })
    });
    return r.ok;
  } catch (e) { console.warn('Issue close failed', e.message); return false; }
}

async function getTlsExpiry(hostname) {
  // Try to read TLS certificate expiry via a TLS socket connection
  try {
    const [hostnameOnly] = hostname.replace(/^https?:\/\//, '').split('/');
    const [host, maybePort] = hostnameOnly.split(':');
    const port = maybePort ? Number(maybePort) : 443;
    const tls = await import('tls');
    return new Promise((resolve) => {
      const sock = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
        try {
          const cert = sock.getPeerCertificate();
          sock.end();
          if (cert && cert.valid_to) return resolve(new Date(cert.valid_to));
          resolve(null);
        } catch (e) { sock.end(); resolve(null); }
      });
      sock.on('error', () => resolve(null));
    });
  } catch (e) { return null; }
}

async function main() {
  const cfg = await loadConfig();
  const prev = await loadPrev();
  const components = [];

  for (const c of (cfg.components || [])) {
    if (c.type === 'http') {
      const r = await checkHttp(c.url, c.expect);
      const expiry = await getTlsExpiry(c.url);
      const status = r.ok ? 'online' : 'offline';
      const details = r.error || (r.statusCode ? String(r.statusCode) : '');
      const checked = now();
      const comp = { id: c.id, name: c.name, status, description: c.description || '', checked_at: checked, details };
      if (expiry) comp.tls_expires = expiry.toISOString();
      components.push(comp);
    } else {
      components.push({ id: c.id, name: c.name, status: 'unknown', description: c.description || '', checked_at: now(), details: 'unsupported check type' });
    }
  }

  const hasOffline = components.some(c => c.status === 'offline');
  const hasDegraded = components.some(c => c.status === 'degraded');
  const overall = hasOffline ? 'offline' : (hasDegraded ? 'degraded' : 'online');

  // incidents will include automatic GitHub issue URLs if created below
  const incidents = (prev && prev.incidents) ? prev.incidents.slice() : [];

  // Optional: discord alerts and github issues on change
  const webhook = process.env.DISCORD_WEBHOOK;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || cfg.github_token || null;
  const GITHUB_REPO = process.env.GITHUB_REPO || cfg.github_repo || null;

  const prevMap = (prev && prev.components) ? Object.fromEntries(prev.components.map(p => [p.id, p])) : {};

  for (const cmp of components) {
    const previous = prevMap[cmp.id];
    // If it changed from online -> offline or degraded, optionally create an issue
    if (previous && previous.status !== cmp.status) {
      // prepare message
      const msg = `Status change for **${cmp.name}**: ${previous.status} → ${cmp.status}`;
      if (webhook && cfg.alerts && cfg.alerts.notify_on_change) await sendDiscord(webhook, msg);

      if (GITHUB_TOKEN && GITHUB_REPO) {
        // create an issue if now offline and there was no incident recorded for it
        if ((cmp.status === 'offline' || cmp.status === 'degraded')) {
          const existing = incidents.find(i => i.component_id === cmp.id && i.status !== 'resolved');
          if (!existing) {
            const title = `Status: ${cmp.name} is ${cmp.status}`;
            const body = `${msg}\n\nChecked at: ${cmp.checked_at}\nDetails: ${cmp.details || ''}`;
            const url = await createGitHubIssue(GITHUB_REPO, GITHUB_TOKEN, title, body, ['incident']);
            incidents.push({ id: `auto-${Date.now()}`, component_id: cmp.id, title, status: 'investigating', issue: url, created_at: now() });
          }
        } else {
          // if restored, mark any active incident as resolved and close issue
          const open = incidents.find(i => i.component_id === cmp.id && i.status !== 'resolved');
          if (open) {
            open.status = 'resolved';
            open.resolved_at = now();
            if (open.issue && open.issue.match(/issues\/(\d+)/)) {
              const m = open.issue.match(/issues\/(\d+)/);
              const num = m && m[1];
              if (num) await closeGitHubIssue(GITHUB_REPO, GITHUB_TOKEN, num);
            }
          }
        }
      }
    }
  }

  const status = {
    summary: hasOffline ? 'Some services are down' : 'All systems operational',
    status: overall,
    updated_at: now(),
    components,
    incidents
  };

  await writeFile(STATUS_FILE, JSON.stringify(status, null, 2), 'utf8');
  console.log('Status written to', STATUS_FILE);

  // write history (append and trim)
  try {
    const historyRaw = await fs.readFile('status-history.json', 'utf8');
    const history = JSON.parse(historyRaw || '[]');
    history.push({ time: status.updated_at, status: status.status, summary: status.summary, components: status.components.map(c => ({ id: c.id, status: c.status })) });
    // keep only last 200 entries
    while (history.length > 200) history.shift();
    await writeFile('status-history.json', JSON.stringify(history, null, 2), 'utf8');
  } catch (e) { console.warn('Failed to write history', e.message); }

  // Optional: discord alerts on change for components not tracked above
  if (webhook && cfg.alerts && cfg.alerts.notify_on_change) {
    const prevMap2 = (prev && prev.components) ? Object.fromEntries(prev.components.map(p => [p.id, p.status])) : {};
    for (const cmp of components) {
      const prevStatus = prevMap2[cmp.id];
      if (prevStatus && prevStatus !== cmp.status) {
        const msg = `Status change for **${cmp.name}**: ${prevStatus} → ${cmp.status}`;
        await sendDiscord(webhook, msg);
      }
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
