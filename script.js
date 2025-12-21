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
const submitBtn = document.getElementById('submit-btn');

console.log('Contact form found:', contactForm);
console.log('Form status element found:', formStatus);
console.log('Submit button found:', submitBtn);

// EmailJS Configuration
const EJ_PUBLIC_KEY = 'Lnl3z8jkAukMKlYF7';
const EJ_SERVICE_ID = 'service_nq7sylf';
const EJ_CONTACT_TEMPLATE_ID = 'template_fo816z3'; // Contact message to you

// Validation function
function validateForm(formData) {
    const errors = [];
    
    const name = formData.get('name');
    const email = formData.get('email');
    const title = formData.get('title');
    const message = formData.get('message');
    
    console.log('=== FORM VALIDATION DEBUG ===');
    console.log('Name:', name, 'Length:', name ? name.length : 0);
    console.log('Email:', email, 'Length:', email ? email.length : 0);
    console.log('Title:', title, 'Length:', title ? title.length : 0);
    console.log('Message:', message, 'Length:', message ? message.length : 0);
    
    if (!name || name.trim().length === 0) {
        errors.push('Name is required');
    } else if (name.length > 50) {
        errors.push('Name must be less than 50 characters');
    }
    
    if (!email || email.trim().length === 0) {
        errors.push('Email is required');
    } else if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email.trim())) {
        errors.push('Please enter a valid email address');
    }
    
    if (!title || title.trim().length === 0) {
        errors.push('Subject is required');
    } else if (title.length > 100) {
        errors.push('Subject must be less than 100 characters');
    }
    
    if (!message || message.trim().length === 0) {
        errors.push('Message is required');
    } else if (message.length > 1000) {
        errors.push('Message must be less than 1000 characters');
    }
    
    console.log('Validation errors:', errors);
    return errors;
}

// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
    try {
        emailjs.init(EJ_PUBLIC_KEY);
        console.log('EmailJS initialized successfully');
    } catch (e) {
        console.warn('emailjs.init failed', e);
    }
}

// Contact form event handler
if (contactForm && submitBtn) {
    submitBtn.addEventListener('click', async function(event) {
        event.preventDefault();
        
        // Check if EmailJS is available
        if (typeof emailjs === 'undefined') {
            formStatus.textContent = 'Email service not available. Please refresh the page.';
            formStatus.style.color = '#ff6b6b';
            return;
        }
        
        // Disable button during sending
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        formStatus.textContent = 'Sending...';
        formStatus.style.color = '#e50914';
        
        try {
            // Get form data
            const formData = new FormData(contactForm);
            
            // Validate form
            const validationErrors = validateForm(formData);
            if (validationErrors.length > 0) {
                formStatus.textContent = validationErrors[0];
                formStatus.style.color = '#ff6b6b';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
                return;
            }
            
            console.log('=== EMAILJS DEBUG INFO ===');
            console.log('EmailJS available:', typeof emailjs !== 'undefined');
            console.log('Service ID:', EJ_SERVICE_ID);
            console.log('Contact Template ID:', EJ_CONTACT_TEMPLATE_ID);
            console.log('Public Key:', EJ_PUBLIC_KEY);

            // Prepare email parameters - Use standard EmailJS template parameter names
            const contactParams = {
                to_email: 'notdeath@duck.com',
                from_name: formData.get('name'),
                from_email: formData.get('email'),
                subject: formData.get('title'),
                message: formData.get('message')
            };

            console.log('=== EMAILJS PARAMETER CHECK ===');
            console.log('Contact params keys:', Object.keys(contactParams));
            console.log('Contact parameters:', contactParams);

            console.log('=== SENDING EMAILJS REQUEST ===');
            console.log('Service ID:', EJ_SERVICE_ID);
            console.log('Contact Template ID:', EJ_CONTACT_TEMPLATE_ID);

            // Send contact message
            console.log('Sending contact message...');
            const contactResponse = await emailjs.send(EJ_SERVICE_ID, EJ_CONTACT_TEMPLATE_ID, contactParams);
            console.log('Contact email sent successfully!', contactResponse);
            
            formStatus.textContent = 'Message sent successfully!';
            formStatus.style.color = '#00cc00';
            contactForm.reset();
            showToast('Message sent successfully!');
            
        } catch (error) {
            console.error('EmailJS failed:', error);
            console.log('=== EMAILJS ERROR DETAILS ===');
            console.log('Error status:', error.status);
            console.log('Error text:', error.text);
            console.log('Error message:', error.message);
            console.log('Full error object:', error);
            
            // Handle specific EmailJS errors
            let errorMessage = 'Failed to send message. Please try again.';
            
            if (error.status === 422) {
                console.log('422 Error detected - this suggests EmailJS template issues');
                errorMessage = 'EmailJS template configuration issue. Please check your EmailJS service setup.';
            } else if (error.status === 429) {
                errorMessage = 'Too many requests. Please wait a moment before trying again.';
            } else if (error.text && error.text.includes('service')) {
                errorMessage = 'Email service configuration error. Please contact support.';
            } else {
                // More generic error handling
                errorMessage = `EmailJS Error: ${error.message || 'Unknown error'}`;
            }
            
            formStatus.textContent = errorMessage;
            formStatus.style.color = '#ff6b6b';
            showToast('Failed to send message. Please try again.');
            
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
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

