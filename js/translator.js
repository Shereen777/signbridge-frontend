/**
 * SignBridge Translation Service
 * Translates text between languages using Google Translate free API.
 * Used to:
 *   1. Translate non-English speech to English before ASL dictionary lookup
 *   2. Translate recognized English sign text to the user's chosen language before speaking
 */

const TranslatorService = {
  // Cache to avoid repeated API calls
  cache: {},

  // Map our dropdown lang codes to ISO 639-1 codes
  langMap: {
    'en-US': 'en', 'es-ES': 'es', 'fr-FR': 'fr', 'de-DE': 'de',
    'it-IT': 'it', 'pt-BR': 'pt', 'zh-CN': 'zh', 'ja-JP': 'ja',
    'ko-KR': 'ko', 'ar-SA': 'ar', 'hi-IN': 'hi', 'ur-PK': 'ur',
    'ru-RU': 'ru', 'tr-TR': 'tr'
  },

  getCode(langTag) {
    return this.langMap[langTag] || langTag.split('-')[0];
  },

  /**
   * Translate text between two languages.
   * Returns the translated text, or the original if translation fails.
   */
  async translate(text, fromLang, toLang) {
    if (!text || !text.trim()) return text;

    const from = this.getCode(fromLang);
    const to = this.getCode(toLang);
    if (from === to) return text;

    // Check cache
    const cacheKey = `${from}|${to}|${text.toLowerCase().trim()}`;
    if (this.cache[cacheKey]) return this.cache[cacheKey];

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text.trim())}`;
      const res = await fetch(url);
      const data = await res.json();

      // Response format: [[["translated text","original text",...],...],...]
      let translated = '';
      if (data && data[0]) {
        for (const segment of data[0]) {
          if (segment[0]) translated += segment[0];
        }
      }

      if (translated) {
        this.cache[cacheKey] = translated;
        return translated;
      }
      return text;
    } catch (e) {
      console.warn('Translation failed:', e);
      return text; // Return original on error
    }
  },

  /**
   * Translate any language to English (for ASL dictionary lookup).
   */
  async toEnglish(text, fromLang) {
    return this.translate(text, fromLang, 'en-US');
  },

  /**
   * Translate English to any language (for speaking recognized signs).
   */
  async fromEnglish(text, toLang) {
    return this.translate(text, 'en-US', toLang);
  },

  /**
   * Check if a language code is English.
   */
  isEnglish(langTag) {
    return this.getCode(langTag) === 'en';
  }
};

window.TranslatorService = TranslatorService;
