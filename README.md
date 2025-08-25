# AcoomH Landing Page – Dev and Production Guide

This repo contains static HTML/CSS/JS pages, a small build script for minification + cache-busting, and a local dev server with a proxy to the AcoomH API.

## Prerequisites
- Node.js 16+ (18+ recommended)
- npm

## Install dependencies
```powershell
npm install
```

## Development
Use the built-in dev server. It serves files and proxies API calls to avoid CORS.

- Start on default port (3000):
```powershell
npm run dev
```
Then open:
- http://localhost:3000/index.html
- http://localhost:3000/rezervari.html

- Use a custom port (example: 4000):
```powershell
# Either pass flags through npm
npm run dev -- --port 4000
# Or call the script directly
node build.js --dev --port 4000
```

- Change proxy target (default: https://api.acoomh.ro):
```powershell
$env:PROXY_TARGET = "https://staging.api.example.com"; npm run dev
```

### How the proxy works
The dev server proxies requests to the API with these rules:
- /api/*    → https://api.acoomh.ro/* (rewrites ^/api → /)
- /proxy/*  → https://api.acoomh.ro/* (rewrites ^/proxy → /)
- /locations and /locations/* → https://api.acoomh.ro/locations (no rewrite)

In development, pages are coded to call the API via the relative /api path when accessed from localhost, so you shouldn’t see CORS errors as long as you browse through the dev server URL (http://localhost:PORT/... not file://).

## Production build and deploy
Build will minify CSS/JS (when dependencies are installed) and add cache-busting query params to HTML references.

- Build:
```powershell
npm run build
```

- Optional helper (runs build and prints guidance):
```powershell
npm run deploy
```

### What the build does
- Minifies:
  - style.css → style.min.css
  - rezervari-style.css → rezervari-style.min.css
  - restaurant-style.css → restaurant-style.min.css
  - bug-reports-style.css → bug-reports-style.min.css
  - merchant-requests-style.css → merchant-requests-style.min.css
- Minifies:
  - script.js → script.min.js
  - rezervari-script.js → rezervari-script.min.js
  - restaurant-script.js → restaurant-script.min.js
  - bug-reports-script.js → bug-reports-script.min.js
  - merchant-requests-script.js → merchant-requests-script.min.js
- Rewrites HTML to reference the minified files and appends ?v=<timestamp> for cache-busting.
- Writes deploy-info.json for traceability.

If minification deps are missing, the build still runs and keeps original .css/.js, but still updates HTML with cache-busting.

### What to upload to production
Upload the site root contents to your host. With minification enabled, ensure at least:
- index.html, rezervari.html, restaurant.html, bug-reports.html, merchant-requests.html
- style.min.css, script.min.js
- rezervari-style.min.css, rezervari-script.min.js
- restaurant-style.min.css, restaurant-script.min.js
- bug-reports-style.min.css, bug-reports-script.min.js
- merchant-requests-style.min.css, merchant-requests-script.min.js
- acoomh.png and video assets (acoomharta.mp4, acoomharta_noaudio.mp4, acoomharta_safe.mp4)
- nginx.conf (if you manage the server config)

Note: HTML references already include cache-busting (?v=TIMESTAMP). No extra step needed.

## Troubleshooting
- CORS in dev: Make sure you are using the dev server URL (http://localhost:PORT) and API calls hit /api/... not https://api.acoomh.ro directly.
- Dev server missing deps: Install with
```powershell
npm i --save-dev express http-proxy-middleware
```
- Port already in use: Pick another port with --port 4000.
- Minification not happening: Run npm install to ensure clean-css and terser are installed.
- Stale assets after deploy: Cache-busting is appended automatically, but CDN/browser caches can be sticky. Force refresh or invalidate CDN cache.

## Notes
- You can inspect the latest build metadata in deploy-info.json.
- The dev server strips the Origin header on proxied requests to simplify development against stricter CORS backends.
