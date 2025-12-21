// JavaScript for Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const icon = themeToggle.querySelector('i');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light-mode') {
    body.classList.add('light-mode');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');
    if (body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        localStorage.setItem('theme', 'dark-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// JavaScript for Contact Form (using EmailJS)
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

// EmailJS Configuration (moved from HTML meta tags)
const EJ_PUBLIC_KEY = 'Lnl3z8jkAukMKlYF7';
const EJ_SERVICE_ID = 'service_nq7sylf';
const EJ_TEMPLATE_ID = 'template_fp4ohcd';

if (contactForm) {
    // Initialize EmailJS
    if (typeof emailjs !== 'undefined') {
        try { 
            emailjs.init(EJ_PUBLIC_KEY); 
        } catch (e) { 
            console.warn('emailjs.init failed', e); 
        }
    }

    contactForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        formStatus.textContent = 'Sending...';
        formStatus.style.color = '#e50914'; // Use dark accent color for sending/error

        if (typeof emailjs !== 'undefined') {
            // Get form data
            const formData = new FormData(this);
            const templateParams = {
                to_email: 'notdeath@duck.com',
                from_name: formData.get('name'),
                from_email: formData.get('email'),
                subject: formData.get('title'),
                message: formData.get('message')
            };

            emailjs.send(EJ_SERVICE_ID, EJ_TEMPLATE_ID, templateParams)
                .then(function() {
                    formStatus.textContent = 'Message sent successfully!';
                    formStatus.style.color = '#00cc00'; // Green for success
                    contactForm.reset();
                }, function(error) {
                    formStatus.textContent = 'Failed to send message. Please try again later.';
                    console.error('FAILED...', error);
                });
            return;
        }

        // Try server-side send (SendGrid) if EmailJS is not available
        try {
            const data = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                title: document.getElementById('title').value,
                message: document.getElementById('message').value,
                to_email: 'notdeath@duck.com'
            };
            const res = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Server error');
            }
            formStatus.textContent = 'Message sent successfully!';
            formStatus.style.color = '#00cc00';
            contactForm.reset();
        } catch (err) {
            console.warn('Send failed:', err);
            formStatus.textContent = 'Failed to send message. Please try again later.';
            formStatus.style.color = '#ff6b6b';
        }
    });
}

/* Live Status Polling and UI */
(function() {
    const DEFAULT_POLL = 30000; // 30s
    const BACKOFF_POLL = 60000; // 60s after repeated failures

    const statusBanner = document.getElementById('status-banner');
    const statusBadge = document.getElementById('status-badge');
    const statusMessage = document.getElementById('status-message');
    const lastUpdated = document.getElementById('last-updated');
    const statusError = document.getElementById('status-error');
    const refreshBtn = document.getElementById('refresh-status');
    const componentsList = document.getElementById('components-list');
    const incidentsList = document.getElementById('incidents-list');
    const reportForm = document.getElementById('report-form');
    const reportStatus = document.getElementById('report-status');

    if (!statusBadge) return; // No live status UI present

    function getEndpoint() {
        const meta = document.querySelector('meta[name="status-endpoint"]');
        if (window.STATUS_ENDPOINT) return window.STATUS_ENDPOINT;
        if (meta && meta.content) return meta.content;
        return 'status.json';
    }

    function showBanner(text) {
        if (!statusBanner) return;
        statusBanner.classList.remove('hidden');
        document.getElementById('banner-text').textContent = text;
    }

    function hideBanner() {
        if (!statusBanner) return;
        statusBanner.classList.add('hidden');
    }

    function renderComponents(components) {
        if (!componentsList) return;
        componentsList.innerHTML = '';
        if (!components || components.length === 0) {
            componentsList.innerHTML = '<div class="small">No components defined.</div>';
            return;
        }
        components.forEach(c => {
            const el = document.createElement('div');
            el.className = 'component';
            const name = document.createElement('div'); name.className = 'name'; name.textContent = c.name || c.id;
            const status = document.createElement('div'); status.className = 'small'; status.textContent = 'Status: ' + (c.status || 'unknown');
            const desc = document.createElement('div'); desc.className = 'small'; desc.textContent = c.description || '';
            el.appendChild(name); el.appendChild(status); el.appendChild(desc);
            componentsList.appendChild(el);
        });
    }

    function renderIncidents(incidents) {
        if (!incidentsList) return;
        incidentsList.innerHTML = '';
        if (!incidents || incidents.length === 0) {
            incidentsList.textContent = 'No incidents reported.';
            return;
        }
        incidents.forEach(i => {
            const el = document.createElement('div');
            el.className = 'incident';
            const title = document.createElement('div'); title.className = 'name'; title.textContent = i.title || 'Incident';
            const status = document.createElement('div'); status.className = 'small'; status.textContent = (i.status || '') + (i.impact ? (' • ' + i.impact) : '');
            const body = document.createElement('div'); body.className = 'small'; body.textContent = i.description || (i.updates && i.updates[0] && i.updates[0].content) || '';
            el.appendChild(title); el.appendChild(status); el.appendChild(body);
            incidentsList.appendChild(el);
        });
    }

    function setStatusView(state, message, updatedAt) {
        statusBadge.classList.remove('online', 'offline', 'unknown');
        statusBadge.classList.add(state);
        statusBadge.textContent = state.charAt(0).toUpperCase() + state.slice(1);
        statusMessage.textContent = message || '';
        if (updatedAt) {
            const d = new Date(updatedAt);
            lastUpdated.textContent = 'Last updated: ' + d.toLocaleString();
        }
        statusError.textContent = '';
        // Show banner if degraded/offline
        if (state === 'offline' || state === 'degraded') {
            showBanner(message || 'Some services are experiencing issues.');
        } else {
            hideBanner();
        }
    }

    function setError(err) {
        statusBadge.classList.remove('online', 'offline');
        statusBadge.classList.add('unknown');
        statusBadge.textContent = 'Unknown';
        statusError.textContent = err ? String(err) : '';
        showBanner('Unable to fetch status.');
    }

    let pollTimer = null;
    let consecutiveErrors = 0;

    async function fetchStatus() {
        const endpoint = getEndpoint();
        try {
            const res = await fetch(endpoint, { cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            // Support for the richer schema
            // { summary, status, updated_at, components: [], incidents: [] }
            const overall = (data.status || data.overall || data.summary || '').toLowerCase();
            const message = data.message || data.description || data.details || data.summary || '';
            const updated = data.updated_at || data.updated || data.time || new Date().toISOString();

            // Determine top-level state
            let state = 'unknown';
            if (overall === 'online' || overall === 'up' || overall === 'ok') state = 'online';
            else if (overall === 'degraded' || overall === 'maintenance') state = 'degraded';
            else if (overall === 'offline' || overall === 'down') state = 'offline';

            // If components present, derive state from them
            if (Array.isArray(data.components) && data.components.length) {
                renderComponents(data.components);
                // if any component offline -> offline; if any degraded -> degraded
                const hasOffline = data.components.some(c => ['offline','down'].includes((c.status||'').toLowerCase()));
                const hasDegraded = data.components.some(c => ['degraded','maintenance'].includes((c.status||'').toLowerCase()));
                if (hasOffline) state = 'offline';
                else if (hasDegraded) state = 'degraded';
            }

            renderIncidents(data.incidents);

            setStatusView(state, message || (data.summary || ''), updated);
            consecutiveErrors = 0;
        } catch (err) {
            consecutiveErrors += 1;
            setError(err.message || 'Unable to fetch status.');
            console.error('Status fetch error:', err);
        }
        scheduleNext();
    }

    async function submitReport(ev) {
        ev.preventDefault();
        if (!reportForm) return;
        const titleEl = document.getElementById('inc-title');
        const bodyEl = document.getElementById('inc-body');
        const honeypotEl = document.getElementById('hp');
        const tsEl = document.getElementById('report-ts');
        const title = titleEl ? titleEl.value.trim() : '';
        const body = bodyEl ? bodyEl.value.trim() : '';
        const honeypot = honeypotEl ? honeypotEl.value : '';
        const ts = tsEl && tsEl.value ? tsEl.value : String(Date.now());

        reportStatus.textContent = 'Reporting...';
        reportStatus.style.color = '#e50914';

        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, honeypot, ts })
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'HTTP ' + res.status);
            }
            reportStatus.textContent = 'Reported. Thank you.';
            reportStatus.style.color = '#00cc00';
            reportForm.reset();
            showToast('Report sent — thanks.');
        } catch (err) {
            console.error('Report error:', err);
            reportStatus.textContent = 'Failed to report. Please try again later.';
            reportStatus.style.color = '#ff6b6b';
            showToast('Failed to send report.');
        }
        setTimeout(() => { reportStatus.textContent = ''; }, 5000);
    }

    // Set timestamp when report details opened to prevent spam (min time check on server)
    const reportDetails = document.querySelector('.report-box');
    if (reportDetails) {
        reportDetails.addEventListener('toggle', () => {
            const tsEl = document.getElementById('report-ts');
            if (reportDetails.open && tsEl) tsEl.value = String(Date.now());
        });
    }

    // Small toast helper
    function showToast(message, timeout = 3000) {
        let t = document.getElementById('global-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'global-toast';
            t.style.position = 'fixed';
            t.style.right = '20px';
            t.style.bottom = '20px';
            t.style.background = '#111';
            t.style.color = '#fff';
            t.style.padding = '10px 14px';
            t.style.borderRadius = '8px';
            t.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
            document.body.appendChild(t);
        }
        t.textContent = message;
        t.style.opacity = '1';
        setTimeout(() => { t.style.opacity = '0'; }, timeout);
    }

    function scheduleNext() {
        clearTimeout(pollTimer);
        const interval = consecutiveErrors >= 3 ? BACKOFF_POLL : DEFAULT_POLL;
        pollTimer = setTimeout(() => { if (document.visibilityState === 'visible') fetchStatus(); }, interval);
    }

    function start() { fetchStatus(); }
    function stop() { clearTimeout(pollTimer); }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') stop(); else fetchStatus();
    });

    if (refreshBtn) refreshBtn.addEventListener('click', () => { consecutiveErrors = 0; fetchStatus(); });
    if (reportForm) reportForm.addEventListener('submit', submitReport);

    // Start polling
    start();
})();
