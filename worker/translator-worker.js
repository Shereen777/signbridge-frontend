/**
 * SignBridge Translation Proxy Worker
 *
 * Deploys to:
 *   - Cloudflare Workers (uses Workers KV for global cache) — free 100k req/day
 *   - Deno Deploy (uses Deno KV) — free 100k req/day, no card required
 *
 * Endpoint:
 *   GET /translate?text=hello&from=en&to=tr
 *   → { translated: "Merhaba", cached: false, source: "google" }
 *
 * Strategy:
 *   1. Check KV cache (key = `t:${from}:${to}:${textLower}`)
 *   2. On miss, call Google Translate free endpoint
 *   3. Store result in KV with 30-day TTL
 *   4. Rate limit: max 60 requests/minute per IP (key = `r:${ip}:${minute}`)
 */

// ===== Cloudflare Workers entry =====
export default {
  async fetch(request, env) {
    return handle(request, {
      kvGet: (k) => env.TRANSLATIONS.get(k),
      kvPut: (k, v, opts) => env.TRANSLATIONS.put(k, v, { expirationTtl: opts.ttl })
    });
  }
};

// ===== Deno Deploy entry =====
if (typeof Deno !== 'undefined') {
  const kv = await Deno.openKv();
  Deno.serve((request) => handle(request, {
    kvGet: async (k) => {
      const r = await kv.get([k]);
      return r.value;
    },
    kvPut: async (k, v, opts) => {
      await kv.set([k], v, { expireIn: opts.ttl * 1000 });
    }
  }));
}

// ===== Shared logic =====

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

async function handle(request, kv) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);

  if (url.pathname === '/' || url.pathname === '/health') {
    return json({ ok: true, service: 'signbridge-translator', version: '1.0' });
  }

  if (url.pathname !== '/translate') {
    return json({ error: 'Not found' }, 404);
  }

  const text = (url.searchParams.get('text') || '').trim();
  const from = (url.searchParams.get('from') || 'auto').toLowerCase();
  const to   = (url.searchParams.get('to')   || 'en').toLowerCase();

  if (!text) return json({ error: 'text param required' }, 400);
  if (text.length > 500) return json({ error: 'text too long (max 500 chars)' }, 400);

  // Trivially no-op for same-language
  if (from === to) return json({ translated: text, cached: false, source: 'noop' });

  // Rate limit per IP (60 req/min)
  const ip = request.headers.get('cf-connecting-ip')
          || request.headers.get('x-forwarded-for')
          || 'unknown';
  const minute = Math.floor(Date.now() / 60000);
  const rateKey = `r:${ip}:${minute}`;
  const rateCount = parseInt((await kv.kvGet(rateKey)) || '0', 10);
  if (rateCount >= 60) {
    return json({ error: 'rate limited (60/min)' }, 429);
  }
  await kv.kvPut(rateKey, String(rateCount + 1), { ttl: 90 });

  // Cache lookup
  const cacheKey = `t:${from}:${to}:${text.toLowerCase()}`;
  const cached = await kv.kvGet(cacheKey);
  if (cached) {
    return json({ translated: cached, cached: true, source: 'cache' });
  }

  // Cache miss → call Google Translate free endpoint
  try {
    const gUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const r = await fetch(gUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return json({ error: 'upstream failed', status: r.status }, 502);
    const data = await r.json();

    // Response format: [[["translated","original",...],...],...]
    let translated = '';
    if (data && data[0]) {
      for (const seg of data[0]) {
        if (seg[0]) translated += seg[0];
      }
    }
    if (!translated) return json({ error: 'empty translation' }, 502);

    // Store in cache (30 days)
    await kv.kvPut(cacheKey, translated, { ttl: 30 * 24 * 3600 });
    return json({ translated, cached: false, source: 'google' });

  } catch (err) {
    return json({ error: 'translation failed', detail: String(err) }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}
