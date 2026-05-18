/**
 * SignBridge Translation Service
 *
 * Translation strategy:
 *   1. Check IndexedDB persistent cache (per-browser, survives reload)
 *   2. If miss, call our translation proxy (Cloudflare Worker / Deno Deploy)
 *      which has its own globally-shared Workers KV cache
 *   3. On proxy failure, fall back directly to Google Translate free endpoint
 *   4. Store result in IndexedDB for next time
 */

const TranslatorService = {
  // In-memory cache (fastest tier)
  memCache: {},
  db: null,
  dbReady: null,

  // Our deployed worker — falls back to direct Google if unreachable
  // Update this once the worker is deployed; if empty, skip directly to Google
  WORKER_URL: '', // e.g., 'https://signbridge-translator.deno.dev'

  langMap: {
    'en-US': 'en', 'es-ES': 'es', 'fr-FR': 'fr', 'de-DE': 'de',
    'it-IT': 'it', 'pt-BR': 'pt', 'zh-CN': 'zh', 'ja-JP': 'ja',
    'ko-KR': 'ko', 'ar-SA': 'ar', 'hi-IN': 'hi', 'ur-PK': 'ur',
    'ru-RU': 'ru', 'tr-TR': 'tr'
  },

  getCode(tag) {
    return this.langMap[tag] || tag.split('-')[0];
  },

  // ===== IndexedDB cache =====
  async openDB() {
    if (this.dbReady) return this.dbReady;
    this.dbReady = new Promise((resolve, reject) => {
      const req = indexedDB.open('signbridge-cache', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('translations')) {
          db.createObjectStore('translations');
        }
      };
      req.onsuccess = () => { this.db = req.result; resolve(this.db); };
      req.onerror = () => reject(req.error);
    });
    return this.dbReady;
  },

  async cacheGet(key) {
    if (this.memCache[key]) return this.memCache[key];
    try {
      const db = await this.openDB();
      return await new Promise((resolve) => {
        const tx = db.transaction('translations', 'readonly');
        const r = tx.objectStore('translations').get(key);
        r.onsuccess = () => {
          if (r.result) this.memCache[key] = r.result;
          resolve(r.result || null);
        };
        r.onerror = () => resolve(null);
      });
    } catch { return null; }
  },

  async cachePut(key, value) {
    this.memCache[key] = value;
    try {
      const db = await this.openDB();
      const tx = db.transaction('translations', 'readwrite');
      tx.objectStore('translations').put(value, key);
    } catch { /* ignore */ }
  },

  // ===== Main API =====
  async translate(text, fromLang, toLang) {
    if (!text || !text.trim()) return text;
    const from = this.getCode(fromLang);
    const to = this.getCode(toLang);
    if (from === to) return text;

    const key = `${from}|${to}|${text.toLowerCase().trim()}`;
    const cached = await this.cacheGet(key);
    if (cached) return cached;

    let translated = null;

    // Try our proxy worker first (if configured)
    if (this.WORKER_URL) {
      try {
        const url = `${this.WORKER_URL}/translate?text=${encodeURIComponent(text)}&from=${from}&to=${to}`;
        const r = await fetch(url);
        if (r.ok) {
          const data = await r.json();
          translated = data.translated;
        }
      } catch { /* fall through */ }
    }

    // Fallback to Google direct
    if (!translated) {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text.trim())}`;
        const r = await fetch(url);
        const data = await r.json();
        if (data && data[0]) {
          translated = '';
          for (const seg of data[0]) {
            if (seg[0]) translated += seg[0];
          }
        }
      } catch (e) {
        console.warn('Translation failed:', e);
        return text; // give up — return original
      }
    }

    if (translated) {
      await this.cachePut(key, translated);
      return translated;
    }
    return text;
  },

  async toEnglish(text, fromLang) {
    return this.translate(text, fromLang, 'en-US');
  },

  async fromEnglish(text, toLang) {
    return this.translate(text, 'en-US', toLang);
  },

  isEnglish(tag) {
    return this.getCode(tag) === 'en';
  }
};

window.TranslatorService = TranslatorService;
