# 💀 Death Status Dashboard

<div align="center">

**A minimalist, dark-themed personal engineering status page**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

[View Live](https://notdeath.vercel.app/) • [About](#about) • [Features](#features) • [Tech Stack](#tech-stack)

</div>

---

## 📖 About

> *"Building apps and websites that just work."*

This is my **personal engineering status page** — a clean, modern interface that showcases live project statuses, recent activity, and what I'm currently building. Inspired by [zedruc.net](https://zedruc.net), this dashboard serves as a living portfolio and project tracker.

**No backend. No database. Just pure static HTML/CSS/JS** — fast, secure, and always online.

---

## ✨ Features

### 🎯 Core Functionality

- **✅ Live Project Status** - Real-time up/down indicators for all projects
- **📦 Recent Activity** - Display recent commits and branch information
- **🔗 Quick Links** - Direct access to GitHub repos and live project URLs
- **🛠️ Current Work** - See what I'm actively building right now
- **⚙️ Tech Stack Display** - Visual badges showing technologies used

### Live Status Automation

The dashboard can automatically fetch a JSON status payload and update in near real-time.

- Configure endpoint: add a meta tag in `index.html` like

```html
<meta name="status-endpoint" content="https://example.com/status.json">
```

or set `window.STATUS_ENDPOINT = 'https://example.com/status.json'` before the page script runs.

- Polling: the page polls the endpoint every 30s (backoff to 60s after repeated failures).
- Visibility-aware: fetching pauses while the page is hidden and resumes when visible.
- Manual refresh: click the **Refresh** button in the UI to fetch immediately.

Richer schema (recommended):

```json
{
  "summary": "All systems operational",
  "status": "online",        // 'online' | 'degraded' | 'offline'
  "updated_at": "2025-12-14T12:00:00Z",
  "components":[
    {"id":"site","name":"Website","status":"online","description":"Main site","checked_at":"..."}
  ],
  "incidents":[
    {"id":"20251214-1","title":"API outage","status":"investigating","impact":"major","description":"...","updates":[{"time":"...","content":"..."}]}
  ]
}
```

A local `status.json` file and `status-config.json` are included for quick testing when serving the static site locally.

**Automation Options (free-friendly)**

- **Status Badges**: you can embed a simple badge using Shields.io pointing to the raw `status.json` (example):

```
https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/<owner>/<repo>/main/status.json
```

Replace `<owner>/<repo>` with your repository path. Shields will render a badge from your JSON `status` or `summary` fields.


- **GitHub Actions + Node check script**: a scheduled job runs `scripts/check.js` (no server required) and commits `status.json` to the repo. This is implemented in `.github/workflows/check-status.yml` and is free for public repositories.

- **Vercel Serverless APIs**: optional serverless endpoints are provided in `api/status.js` (on-demand checks) and `api/report.js` (creates GitHub Issue for incident reports). To enable issue creation, set `GITHUB_TOKEN` and `GITHUB_REPO` in Vercel environment variables.

- **Discord Alerts**: `scripts/check.js` supports sending alerts to a Discord webhook when component state changes. Set the webhook in `status-config.json` or as `DISCORD_WEBHOOK` in the environment.

- **EmailJS (contact form)**: the site supports EmailJS. Add meta tags in `index.html` or set `window.EMAILJS_PUBLIC_KEY`, `window.EMAILJS_SERVICE_ID`, and `window.EMAILJS_TEMPLATE_ID` to use real email sends; otherwise the form simulates sending locally. Example meta tags:

```html
<meta name="emailjs-public-key" content="your_public_key">
<meta name="emailjs-service" content="your_service_id">
<meta name="emailjs-template" content="your_template_id">
```

EmailJS client is included via CDN in `index.html`. Once those values are present the contact form will call `emailjs.sendForm` and show success/failure statuses.

Quick EmailJS setup and test

1. Create an EmailJS account and add an email service (e.g., Gmail). Note service ID (e.g., `service_xxx`).
2. Create a template that expects `to_email`, `from_name`, `from_email`, and `message` template variables (or adjust names to match the form).
3. Add meta tags in `index.html` (or set `window.EMAILJS_*` before the script runs):

```html
<meta name="emailjs-public-key" content="Lnl3z8jkAukMKlYF7">
<meta name="emailjs-service" content="your_service_id">
<meta name="emailjs-template" content="your_template_id">
```

4. The contact form includes a hidden `to_email` field set to `notdeath@duck.com` so messages are sent there.

5. Test locally by serving the site (EmailJS works from browser origins):

```bash
python3 -m http.server 8000
# open http://localhost:8000 in your browser and try the contact form
```

If you want, I can add a small serverless `api/send.js` route to send emails server-side (requires private keys) — let me know if you prefer that over client-side EmailJS.

**What to hide / gitignore**

Do NOT commit any private tokens, secrets, or backups. Recommended additions to `.gitignore`:

```
# Local env files
.env
.env.local

# Secrets / backups
.secret*
*credentials*

# If your .well-known/discord contains tokens, don't commit it
/.well-known/discord
```

- Use GitHub Secrets for Actions (no need to commit tokens).
- Use Vercel Environment Variables for runtime secrets (don't commit them).

Note: I sanitized `.well-known/discord` to remove a token; rotate any exposed tokens and consider removing them from git history if you previously committed secrets.

If you want to remove a file from the entire git history (WARNING: this rewrites history and requires a force-push), here are two common approaches:

- Using the BFG Repo Cleaner (simple):

```bash
# install BFG and run from a clone of your repo
bfg --delete-files ".well-known/discord"
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

- Using git-filter-repo (recommended, faster/more flexible):

```bash
# install git-filter-repo and run in a local clone
git filter-repo --invert-paths --paths .well-known/discord
git push --force
```

I removed `.well-known/discord` from the current index (it is no longer tracked) and added a serverless endpoint to serve the discord verification token from environment variables instead.

Quick steps I ran to stop tracking the file in this repository (you can repeat locally if needed):

```bash
# stop tracking the file but keep it locally
git rm --cached .well-known/discord
git commit -m "chore(security): stop tracking .well-known/discord"
# push the removal
git push
```

After rewriting history, rotate any affected tokens (Discord, EmailJS, API keys) immediately and update their stored locations (GitHub Secrets / Vercel environment variables).


Serverless setup (Vercel)

- To serve `/.well-known/discord` without committing the token, set `DISCORD_KEY` in Vercel Environment Variables and the included `vercel.json` rewrites `/.well-known/discord` -> `/api/discord`.

Testing `/.well-known/discord` locally and on Vercel

1. Local (uses local `.well-known/discord` if present):

```bash
# create a local token file (do not commit this)
echo "dh=YOUR_TOKEN_HERE" > .well-known/discord
# start a static server for local testing
python3 -m http.server 8000
# open http://localhost:8000/.well-known/discord
```

2. Vercel (recommended):

- Add `DISCORD_KEY` (your token value) to Project → Settings → Environment Variables in Vercel and deploy the site.
- After deploy, visit `https://your-vercel-deploy.vercel.app/.well-known/discord` and you should see `dh=YOUR_TOKEN_HERE`.

If you see `Not found`, it means no token is configured and no local file exists for the environment the server is running in.

- For contact emails using server-side sending, set `SENDGRID_API_KEY` and `SENDER_EMAIL` in Vercel Environment Variables and the new endpoint `/api/send` will deliver messages sent from the contact form. If you prefer EmailJS client-side sending, add `emailjs-service` and `emailjs-template` meta tags to `index.html`.


### 🎨 Design

- **Dark Theme** - Easy on the eyes, modern aesthetic
- **Smooth Animations** - CSS transitions and gradient effects
- **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- **Icon Integration** - Font Awesome icons for clean visual hierarchy

### ⚡ Performance

- **Zero Dependencies** - No frameworks, no build tools
- **Static Files Only** - Instant load times
- **Always Online** - Hosted on reliable platforms (GitHub Pages / Vercel)
- **Clean Code** - Simple, readable structure

---

## 🖼️ Screenshots

### Desktop View
Coming Soon...
### Mobile View
Coming Soon...
### Project Status Section
Coming Soon...

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Structure & semantic content |
| **CSS3** | Modern dark theme, gradients, animations |
| **JavaScript** | Dynamic project rendering & interactions |
| **Font Awesome** | Icons for status indicators, GitHub, and links |
| **GitHub Pages / Vercel** | Free, zero-config hosting |

### Why No Frameworks?

This project intentionally avoids frameworks to demonstrate:
- Clean, vanilla JavaScript skills
- Understanding of web fundamentals
- Performance optimization without overhead
- Easy maintenance and customization

---

## 📂 Project Structure

```
death-status-dashboard/
├── .well-known/        # Folder for Discord
├── └──discord          # Discord key for connection
├── index.html          # Main HTML structure
├── styles.css          # All styles and animations
├── script.js           # Dynamic project rendering
├── assets/             # Images, icons, media
│   └── screenshots/    # Dashboard screenshots
└── README.md           # You are here!
```

---

## 🌐 View Live

**This is a live web application - visit the website to see it in action:**

### **[notdeath](https://notdeath.vercel.app)**

This dashboard is meant to be **viewed online only**. The code is displayed here for showcase purposes.

---

## 📊 Features Breakdown

### Project Cards

Each project card displays:
- ✅ **Status Indicator** - Green (up) or Red (down)
- 📝 **Project Name** - Clear identification
- 📄 **Description** - Brief overview
- 🔗 **GitHub Link** - Direct to repository
- 🌐 **Live URL** - View deployed project
- 🏷️ **Tech Badges** - Technologies used

### Dynamic Rendering

Projects are dynamically rendered using JavaScript for easy updates and maintenance.

### Responsive Design

Breakpoints ensure perfect display on all devices:
- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

---

## 🎯 Design Philosophy

### Minimalism
- Clean layouts with plenty of whitespace
- Focus on content, not clutter
- Every element serves a purpose

### Dark Theme
- Reduces eye strain
- Modern, professional aesthetic
- Excellent contrast for readability

### Performance First
- No unnecessary libraries
- Optimized assets
- Fast load times

### User Experience
- Intuitive navigation
- Clear visual hierarchy
- Smooth interactions

---

## 🔒 Repository Information

**This is my personal portfolio website repository.**

### ⚠️ Important Notice:

- 📖 **View Only** - This repository is for **showcase purposes**
- 🚫 **No Downloads** - This project is **not meant to be downloaded or run locally**
- 🚫 **No Contributions** - This repository does **not accept pull requests or contributions**
- 🚫 **No Forks** - Please do not fork or copy this repository

### What You Can Do:

- ✅ View the live website online
- ✅ Browse the code to see implementation techniques
- ✅ Learn from the structure and approach
- ✅ Get inspired for your own projects
- ✅ **Report bugs or issues** - Found something broken? [Open an issue](https://github.com/notdeathm/death-status-dashboard/issues)
- ✅ **Share feedback** - Suggestions and thoughts are welcome via Issues

**This code is my personal work and is not available for use, modification, or distribution.**

---

## 📈 Future Enhancements

Potential features I may add:

- [✔️] GitHub API integration for automatic commit updates
- [ ] Blog section for development thoughts
- [ ] Contact form with backend integration
- [✔️] Dark/Light theme toggle
- [ ] Project filtering by technology
- [ ] Analytics dashboard

---

## 👨‍💻 About Me

**Death** — Full-stack developer focused on clean architecture and performance.

> *"Code that lasts longer than the hype."*

### Connect

- 🐦 Twitter/X: [@notdeath_m](https://x.com/notdeath_m)
- 💻 GitHub: [@notdeathm](https://github.com/notdeathm)

### Skills

- **Languages:** HTML, CSS, JavaScript, Node.js
- **Focus Areas:** Web Development, REST APIs, Clean Code
- **Philosophy:** Build things that work, keep it simple, performance matters

---

## 📝 Copyright

**© 2025 Death** — All rights reserved.

This is proprietary code for my personal portfolio. Made with HTML, CSS, and quiet determination.

---

## 🙏 Acknowledgments

- Inspired by [zedruc.net](https://zedruc.net)
- Icons by [Font Awesome](https://fontawesome.com/)
- Hosted on [GitHub Pages](https://pages.github.com/) / [Vercel](https://vercel.com/)

---

<div align="center">

**View the live dashboard at [notdeath](https://notdeath.vercel.app)**

Made with ❤️ by Death

</div>
