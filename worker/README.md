# SignBridge Translation Proxy

A small edge worker that proxies translation requests with a shared KV cache.

## Why?

The browser app used to call `translate.googleapis.com` directly (no SLA, easy to break). Now it calls this worker, which:

- Caches results across **all users globally** (Workers KV / Deno KV)
- Rate-limits abuse (60 requests/minute per IP)
- Insulates the app from any single translation backend — swap providers by changing one file

## Deploy to Deno Deploy (free, no card)

1. Go to https://dash.deno.com/ → sign in with GitHub
2. New Project → Deploy from GitHub repo
3. Point at `worker/translator-worker.js`
4. Entrypoint: `worker/translator-worker.js`
5. Click Deploy
6. Note the URL — e.g., `https://signbridge-translator.deno.dev`

## Deploy to Cloudflare Workers (requires card on file but never charged below free tier)

```bash
npm install -g wrangler
cd worker
wrangler login
wrangler kv:namespace create TRANSLATIONS
# Paste the namespace ID into wrangler.toml
wrangler deploy
```

## API

```
GET /translate?text=hello&from=en&to=tr
→ { "translated": "Merhaba", "cached": false, "source": "google" }

GET /translate?text=hello&from=en&to=tr  (second call from anywhere)
→ { "translated": "Merhaba", "cached": true, "source": "cache" }
```

## Health check

```
GET /
→ { "ok": true, "service": "signbridge-translator", "version": "1.0" }
```
