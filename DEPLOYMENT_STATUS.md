# SignBridge — Deployment Status

**Date:** 2026-05-17
**Live App:** https://signbridge-b4347.web.app

## What's Live Right Now (No External Action Needed)

| Feature | Status | Where it runs |
|---------|--------|----------------|
| Frontend (PWA) | ✓ Live | Firebase Hosting |
| Hand recognition (MediaPipe + rules) | ✓ Live | Browser |
| Motion detection (J, Z, wave HELLO) | ✓ Live | Browser |
| ASL videos (49 signs) | ✓ Live | GitHub + jsDelivr CDN |
| Authentication | ✓ Live | Firebase Auth |
| User profiles + custom dictionary + phrase history | ✓ Live | Firestore |
| Multi-language translation (14 languages) | ✓ Live | Browser → Google Translate (direct, with IndexedDB cache) |
| Predictive phrase suggestions | ✓ Live | Firestore (client-side aggregation) |
| **Personalization** (preload user's top 5 videos on login) | ✓ Live | Firestore (`PhraseService.getFrequent`) |
| Service Worker / offline mode | ✓ Live | Browser |
| Installable PWA (Add to Home Screen) | ✓ Live | Browser |
| Persistent translation cache (IndexedDB) | ✓ Live | Browser |

## Optional Future Upgrades (Code Already Written)

These are deployment optimizations that improve the system but are not required for any feature to work. The code is in this repo, ready to deploy whenever you want.

### A) Translation Worker (Deno Deploy)
**Benefits:** Global translation cache shared across all users; rate limiting; insulation from Google Translate endpoint changes.
**File:** `worker/translator-worker.js`
**Steps to deploy (5 minutes):**
1. Visit https://dash.deno.com → sign in with GitHub
2. New Project → Deploy from GitHub repo → `Shereen777/signbridge-frontend`
3. Entrypoint: `worker/translator-worker.js`
4. Deploy. Note the URL (e.g., `https://signbridge-translator.deno.dev`)
5. Edit `public/js/translator.js` line 17: set `WORKER_URL` to the URL
6. Redeploy frontend: `firebase deploy --only hosting`

Until you do this, the client falls back to calling Google Translate directly (which is what's working now).

### B) Flask Backend (Render free tier)
**Benefits:** Server-side phrase aggregation (more efficient at scale); centralized `/api/personalize` endpoint shared across devices.
**Files:** `server.py`, `requirements.txt`, `render.yaml`
**Steps to deploy (5 minutes):**
1. Visit https://render.com → sign in with GitHub
2. New → Web Service → pick `Shereen777/signbridge-frontend`
3. Render auto-detects `render.yaml` and deploys
4. Note the URL (e.g., `https://signbridge-backend.onrender.com`)
5. Edit `public/js/app.js` line 17: set `BACKEND_URL` to the URL
6. Redeploy frontend: `firebase deploy --only hosting`

Until you do this, the client uses Firestore directly for personalization (which is what's working now).

## What Each Upgrade Buys You

| Upgrade | Without it | With it |
|---------|-----------|---------|
| Translation Worker | Each browser caches translations separately | All users worldwide share a single cache |
| Flask Backend | Personalization loads 200 phrases and counts in JS | Server returns top 5 directly via SQL |
| Both | App works perfectly | App works perfectly, slightly faster |

## Repos

- App: https://github.com/Shereen777/signbridge-frontend
- Videos: https://github.com/Shereen777/signbridge-videos
