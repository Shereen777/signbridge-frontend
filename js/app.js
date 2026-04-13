/**
 * SignBridge — Main Application Controller
 * Uses Firebase Auth + Firestore for user management and phrase history.
 */

const app = {
  // State
  currentMode: null,
  recognizedText: '',
  spokenText: '',
  user: null,
  userProfile: null,
  suggestionDebounce: null,

  // Engines
  signRecognition: null,
  speechEngine: null,
  signDisplay: null,

  // DOM refs
  el: {},
  getEl(id) {
    if (!this.el[id]) this.el[id] = document.getElementById(id);
    return this.el[id];
  },

  // ===== Init =====
  init() {
    // Listen for Firebase auth state changes
    AuthService.onAuthChange(async (user) => {
      if (user) {
        this.user = user;
        this.userProfile = await AuthService.getProfile(user.uid);
        // Load custom dictionary words
        try {
          const customWords = await CustomDictService.getAll(user.uid);
          if (typeof setUserCustomWords === 'function') setUserCustomWords(customWords);
        } catch (e) { /* non-critical */ }
        this.showLanding();
      } else {
        this.user = null;
        this.userProfile = null;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        this.getEl('auth-screen').classList.add('active');
      }
    });

    // Enter key on auth forms
    this.getEl('login-password').onkeydown = (e) => { if (e.key === 'Enter') this.login(); };
    this.getEl('reg-password').onkeydown = (e) => { if (e.key === 'Enter') this.register(); };
  },

  // ===== Auth =====
  showLogin() {
    this.getEl('login-form').style.display = '';
    this.getEl('register-form').style.display = 'none';
    this.getEl('login-error').textContent = '';
  },

  showRegister() {
    this.getEl('login-form').style.display = 'none';
    this.getEl('register-form').style.display = '';
    this.getEl('register-error').textContent = '';
  },

  async login() {
    const email = this.getEl('login-username').value.trim();
    const password = this.getEl('login-password').value;
    const errorEl = this.getEl('login-error');
    errorEl.textContent = '';

    if (!email || !password) { errorEl.textContent = 'Please fill in all fields'; return; }
    try {
      await AuthService.login(email, password);
      // Auth state listener handles the rest
    } catch (e) {
      const msg = e.code === 'auth/user-not-found' ? 'No account with this email' :
                  e.code === 'auth/wrong-password' ? 'Incorrect password' :
                  e.code === 'auth/invalid-email' ? 'Invalid email format' :
                  e.code === 'auth/invalid-credential' ? 'Invalid email or password' :
                  e.message;
      errorEl.textContent = msg;
    }
  },

  async register() {
    const username = this.getEl('reg-username').value.trim();
    const email = this.getEl('reg-email').value.trim();
    const password = this.getEl('reg-password').value;
    const userType = this.getEl('reg-user-type').value;
    const errorEl = this.getEl('register-error');
    errorEl.textContent = '';

    if (!username || !email || !password) { errorEl.textContent = 'Please fill in all fields'; return; }
    if (password.length < 6) { errorEl.textContent = 'Password must be at least 6 characters'; return; }
    try {
      await AuthService.register(email, password, username, userType);
      // Auth state listener handles the rest
    } catch (e) {
      const msg = e.code === 'auth/email-already-in-use' ? 'Email already registered' :
                  e.code === 'auth/weak-password' ? 'Password must be at least 6 characters' :
                  e.code === 'auth/invalid-email' ? 'Invalid email format' :
                  e.message;
      errorEl.textContent = msg;
    }
  },

  async logout() {
    if (this.signRecognition) this.signRecognition.stop();
    if (this.speechEngine) this.speechEngine.stopListening();
    await AuthService.logout();
    this.getEl('login-username').value = '';
    this.getEl('login-password').value = '';
  },

  showLanding() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    this.getEl('landing-screen').classList.add('active');
    const greeting = this.getEl('user-greeting');
    if (greeting && this.user) {
      const name = this.user.displayName || (this.userProfile && this.userProfile.username) || 'User';
      greeting.textContent = 'Hello, ' + name;
    }
  },

  // ===== Profile =====
  async showProfile() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    this.getEl('profile-screen').classList.add('active');
    this.switchProfileTab('account');

    // Populate account info
    if (this.user) {
      const name = this.user.displayName || (this.userProfile && this.userProfile.username) || '—';
      this.getEl('profile-username').textContent = name;
      this.getEl('profile-email').textContent = this.user.email || '—';
      this.getEl('profile-type').textContent = (this.userProfile && this.userProfile.userType) || '—';
      const joined = this.userProfile && this.userProfile.createdAt
        ? new Date(this.userProfile.createdAt.seconds * 1000).toLocaleDateString()
        : '—';
      this.getEl('profile-joined').textContent = joined;

      // Phrase count
      try {
        const phrases = await PhraseService.getRecent(this.user.uid, 1000);
        this.getEl('profile-phrases').textContent = phrases.length;
      } catch (e) { this.getEl('profile-phrases').textContent = '—'; }

      // Set language dropdown
      if (this.userProfile && this.userProfile.preferredLanguage) {
        this.getEl('profile-language').value = this.userProfile.preferredLanguage;
      }
    }
  },

  switchProfileTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(p => p.classList.remove('active'));
    this.getEl('tab-' + tab).classList.add('active');
    this.getEl('panel-' + tab).classList.add('active');

    if (tab === 'dictionary') this.loadCustomWords();
    if (tab === 'history') this.loadHistory();
  },

  async changePassword() {
    const pw = this.getEl('new-password').value;
    const confirm = this.getEl('confirm-password').value;
    const msgEl = this.getEl('password-msg');
    msgEl.textContent = '';
    msgEl.className = 'auth-error';

    if (!pw || pw.length < 6) { msgEl.textContent = 'Password must be at least 6 characters'; return; }
    if (pw !== confirm) { msgEl.textContent = 'Passwords do not match'; return; }

    try {
      await AuthService.changePassword(pw);
      msgEl.textContent = 'Password updated successfully!';
      msgEl.className = 'success-msg';
      this.getEl('new-password').value = '';
      this.getEl('confirm-password').value = '';
    } catch (e) {
      msgEl.textContent = e.code === 'auth/requires-recent-login'
        ? 'Please log out and log back in first, then try again'
        : e.message;
    }
  },

  async updatePreferredLanguage() {
    if (!this.user) return;
    const lang = this.getEl('profile-language').value;
    try {
      await AuthService.updateProfile(this.user.uid, { preferredLanguage: lang });
      if (this.userProfile) this.userProfile.preferredLanguage = lang;
    } catch (e) { /* non-critical */ }
  },

  // Custom Dictionary
  async addCustomWord() {
    const word = this.getEl('custom-word').value.trim();
    const desc = this.getEl('custom-desc').value.trim();
    const msgEl = this.getEl('dict-msg');
    msgEl.textContent = '';
    msgEl.className = 'auth-error';

    if (!word) { msgEl.textContent = 'Enter a word'; return; }
    if (!desc) { msgEl.textContent = 'Enter a description of the sign'; return; }

    try {
      await CustomDictService.add(this.user.uid, word, desc);
      msgEl.textContent = 'Word added!';
      msgEl.className = 'success-msg';
      this.getEl('custom-word').value = '';
      this.getEl('custom-desc').value = '';
      this.loadCustomWords();
    } catch (e) {
      msgEl.textContent = e.message;
    }
  },

  async loadCustomWords() {
    if (!this.user) return;
    const container = this.getEl('custom-words-list');
    try {
      const words = await CustomDictService.getAll(this.user.uid);
      if (words.length === 0) {
        container.innerHTML = '<p class="hint-text">No custom words yet</p>';
        return;
      }
      container.innerHTML = words.map(w => `
        <div class="list-item">
          <div>
            <div class="list-item-text"><strong>${w.word}</strong></div>
            <div class="list-item-meta">${w.description}</div>
          </div>
          <button class="list-item-delete" onclick="app.deleteCustomWord('${w.id}')" title="Delete">x</button>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = '<p class="hint-text">Error loading words</p>';
    }
  },

  async deleteCustomWord(wordId) {
    if (!this.user) return;
    try {
      await CustomDictService.remove(this.user.uid, wordId);
      this.loadCustomWords();
    } catch (e) { /* ignore */ }
  },

  // Phrase History
  async loadHistory() {
    if (!this.user) return;
    const container = this.getEl('phrase-history-list');
    try {
      const phrases = await PhraseService.getRecent(this.user.uid, 100);
      if (phrases.length === 0) {
        container.innerHTML = '<p class="hint-text">No phrases yet</p>';
        return;
      }
      container.innerHTML = phrases.map(p => {
        const date = p.usedAt ? new Date(p.usedAt.seconds * 1000).toLocaleString() : '';
        const mode = p.mode === 'sign_to_speech' ? 'Sign→Speech' : 'Speech→Sign';
        return `
          <div class="list-item">
            <span class="list-item-text">${p.phrase}</span>
            <span class="list-item-meta">${mode} · ${date}</span>
          </div>`;
      }).join('');
    } catch (e) {
      container.innerHTML = '<p class="hint-text">Error loading history</p>';
    }
  },

  async clearHistory() {
    if (!this.user || !confirm('Clear all phrase history?')) return;
    try {
      await PhraseService.clearAll(this.user.uid);
      this.loadHistory();
    } catch (e) { /* ignore */ }
  },

  // ===== Navigation =====
  enterMode(mode) {
    this.currentMode = mode;
    this.getEl('landing-screen').classList.remove('active');
    if (mode === 'deaf') {
      this.getEl('deaf-screen').classList.add('active');
      this.initDeafMode();
    } else {
      this.getEl('hearing-screen').classList.add('active');
      this.initHearingMode();
    }
  },

  goHome() {
    if (this.signRecognition) this.signRecognition.stop();
    if (this.speechEngine) this.speechEngine.stopListening();
    if (this.speechEngine) this.speechEngine.stopSpeaking();
    if (this.signDisplay) this.signDisplay.stop();
    this.currentMode = null;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    this.showLanding();
    this.resetDeafUI();
    this.resetHearingUI();
  },

  // ===== Suggestions (Firebase) =====
  async loadSuggestions(prefix, targetId) {
    if (!this.user) return;
    try {
      const suggestions = await PhraseService.suggest(this.user.uid, prefix, 5);
      const bar = this.getEl(targetId);
      if (!bar) return;
      bar.innerHTML = '';
      for (const s of suggestions) {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip source-' + s.source;
        chip.textContent = s.phrase;
        chip.onclick = () => this.useSuggestion(s.phrase, targetId);
        bar.appendChild(chip);
      }
    } catch (e) { /* non-critical */ }
  },

  useSuggestion(phrase, targetId) {
    if (targetId === 'suggestions-bar') {
      if (this.recognizedText && !this.recognizedText.endsWith(' ')) this.recognizedText += ' ';
      this.recognizedText += phrase;
      this.updateRecognizedText();
      this.getEl('btn-speak-text').disabled = false;
    } else if (targetId === 'typing-suggestions') {
      this.getEl('manual-text-input').value = phrase;
      this.convertTextToSign();
    }
  },

  async savePhrase(phrase, mode) {
    if (!phrase || !this.user) return;
    try {
      await PhraseService.save(this.user.uid, phrase, mode);
    } catch (e) { /* non-critical */ }
  },

  onTyping(value) {
    clearTimeout(this.suggestionDebounce);
    this.suggestionDebounce = setTimeout(() => {
      this.loadSuggestions(value.trim(), 'typing-suggestions');
    }, 300);
  },

  // ===== Deaf Mode: Sign → Text → Speech =====
  async initDeafMode() {
    this.speechEngine = this.speechEngine || new SpeechEngine();
    this.signRecognition = this.signRecognition || new SignRecognitionEngine();
    this.recognizedText = '';
    this.updateRecognizedText();
    this.loadSuggestions('', 'suggestions-bar');
  },

  async toggleCamera() {
    const btn = this.getEl('btn-start-camera');

    if (this.signRecognition && this.signRecognition.isRunning) {
      this.signRecognition.stop();
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Start Camera`;
      btn.classList.remove('active');
      this.getEl('detection-status').textContent = 'Camera stopped';
      this.getEl('detection-status').classList.remove('active');
      if (this.recognizedText.trim()) {
        this.savePhrase(this.recognizedText.trim(), 'sign_to_speech');
      }
      return;
    }

    btn.innerHTML = 'Loading model...';
    btn.disabled = true;

    try {
      const video = this.getEl('camera-feed');
      const canvas = this.getEl('hand-overlay');

      if (!this.signRecognition.hands) {
        await this.signRecognition.init(video, canvas);
      } else {
        this.signRecognition.videoEl = video;
        this.signRecognition.canvasEl = canvas;
        this.signRecognition.canvasCtx = canvas.getContext('2d');
      }

      this.signRecognition.onWordDetected = (word, confidence) => {
        if (this.recognizedText.length > 0 && !this.recognizedText.endsWith(' ')) this.recognizedText += ' ';
        this.recognizedText += word;
        this.updateRecognizedText();
        this.getEl('btn-speak-text').disabled = false;

        const badge = this.getEl('current-letter');
        badge.textContent = word;
        badge.style.fontSize = word.length > 4 ? '0.7rem' : '1rem';
        badge.classList.add('visible');
        setTimeout(() => { badge.classList.remove('visible'); badge.style.fontSize = ''; }, 1000);
        this.getEl('confidence-display').innerHTML = `Word: <strong>${word}</strong> (${Math.round(confidence * 100)}%)`;
        this.loadSuggestions(this.recognizedText.trim().split(' ').pop(), 'suggestions-bar');
      };

      this.signRecognition.onLetterDetected = (letter, confidence) => {
        this.recognizedText += letter === ' ' ? ' ' : letter;
        this.updateRecognizedText();
        this.getEl('btn-speak-text').disabled = false;

        const badge = this.getEl('current-letter');
        badge.textContent = letter === ' ' ? '␣' : letter;
        badge.style.fontSize = '';
        badge.classList.add('visible');
        setTimeout(() => badge.classList.remove('visible'), 500);
        this.getEl('confidence-display').innerHTML = `Letter: <strong>${letter}</strong> (${Math.round(confidence * 100)}%)`;
      };

      this.signRecognition.onHandDetected = (detected) => {
        const status = this.getEl('detection-status');
        status.textContent = detected ? 'Hand detected' : 'Waiting for hand...';
        status.classList.toggle('active', detected);
      };

      await this.signRecognition.start();
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Stop Camera`;
      btn.classList.add('active');
      btn.disabled = false;
    } catch (err) {
      console.error('Camera init error:', err);
      btn.innerHTML = 'Camera Error — Retry';
      btn.disabled = false;
      alert('Could not access camera. Please ensure camera permissions are granted and try again.');
    }
  },

  updateRecognizedText() {
    const el = this.getEl('recognized-text');
    if (!this.recognizedText.length) {
      el.innerHTML = '<span class="placeholder-text">Your signs will appear here as text...</span>';
    } else {
      el.textContent = this.recognizedText;
    }
    const bufferEl = this.getEl('buffer-content');
    bufferEl.textContent = (this.signRecognition && this.signRecognition.currentCandidate) || '_';
  },

  async speakRecognizedText() {
    const lang = this.getEl('deaf-language').value;
    const el = this.getEl('recognized-text');
    const text = el.textContent || this.recognizedText;
    if (!text || text.includes('Your signs will appear')) return;

    // Translate English sign text to the selected language before speaking
    let spokenText = text;
    if (!TranslatorService.isEnglish(lang)) {
      spokenText = await TranslatorService.fromEnglish(text, lang);
    }
    this.speechEngine.speak(spokenText, lang);
    this.savePhrase(text.trim(), 'sign_to_speech');
  },

  clearDeafText() {
    this.recognizedText = '';
    this.updateRecognizedText();
    this.getEl('btn-speak-text').disabled = true;
    this.getEl('confidence-display').innerHTML = 'Confidence: <strong>—</strong>';
  },

  resetDeafUI() {
    const btn = this.getEl('btn-start-camera');
    if (btn) {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Start Camera`;
      btn.classList.remove('active');
      btn.disabled = false;
    }
  },

  // ===== Hearing Mode: Speech → Text → Sign =====
  initHearingMode() {
    this.speechEngine = this.speechEngine || new SpeechEngine();
    this.spokenText = '';

    const canvas = this.getEl('sign-canvas');
    if (!this.signDisplay) this.signDisplay = new SignDisplayEngine(canvas);
    this.signDisplay.drawReady();

    const speedSlider = this.getEl('sign-speed');
    const speedLabel = this.getEl('speed-label');
    speedSlider.oninput = () => {
      const ms = parseInt(speedSlider.value);
      this.signDisplay.setSpeed(ms);
      speedLabel.textContent = (ms / 1000).toFixed(1) + 's';
    };

    this.signDisplay.onLetterChange = (letter, index, total) => {
      this.getEl('sign-label').textContent = `${letter === ' ' ? 'SPACE' : letter}  (${index + 1}/${total})`;
    };

    const input = this.getEl('manual-text-input');
    input.onkeydown = (e) => { if (e.key === 'Enter') this.convertTextToSign(); };
    this.loadSuggestions('', 'typing-suggestions');
  },

  toggleMic() {
    const btn = this.getEl('btn-start-mic');
    if (this.speechEngine.isListening) {
      this.speechEngine.stopListening();
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> Start Listening`;
      btn.classList.remove('active');
      return;
    }

    const lang = this.getEl('hearing-language').value;
    this.speechEngine.onTranscript = async (text, isFinal) => {
      if (isFinal) {
        this.spokenText += (this.spokenText ? ' ' : '') + text;
        this.updateSpokenText();
        // Translate to English before ASL lookup if non-English
        let englishText = text;
        if (!TranslatorService.isEnglish(lang)) {
          englishText = await TranslatorService.toEnglish(text, lang);
        }
        this.signDisplay.play(englishText);
        this.savePhrase(text.trim(), 'speech_to_sign');
      } else {
        this.updateSpokenText(text);
      }
    };
    this.speechEngine.onListeningChange = (listening) => {
      if (listening) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> Stop Listening`;
        btn.classList.add('active');
      }
    };
    this.speechEngine.startListening(lang);
  },

  updateSpokenText(interim) {
    const el = this.getEl('spoken-text');
    if (!this.spokenText && !interim) {
      el.innerHTML = '<span class="placeholder-text">Your speech will appear here...</span>';
    } else {
      let display = this.spokenText;
      if (interim) display += (display ? ' ' : '') + `<span style="color:var(--text-dim);font-style:italic;">${interim}</span>`;
      el.innerHTML = display;
    }
  },

  async convertTextToSign() {
    const input = this.getEl('manual-text-input');
    const text = input.value.trim();
    if (!text) return;
    this.spokenText = text;
    this.updateSpokenText();
    // Translate to English before ASL lookup if non-English
    const lang = this.getEl('hearing-language').value;
    let englishText = text;
    if (!TranslatorService.isEnglish(lang)) {
      englishText = await TranslatorService.toEnglish(text, lang);
    }
    this.signDisplay.play(englishText);
    this.savePhrase(text, 'speech_to_sign');
    input.value = '';
    this.getEl('typing-suggestions').innerHTML = '';
  },

  replaySign() {
    if (this.signDisplay) this.signDisplay.replay();
  },

  resetHearingUI() {
    this.spokenText = '';
    const btn = this.getEl('btn-start-mic');
    if (btn) {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> Start Listening`;
      btn.classList.remove('active');
    }
  }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());
