/**
 * SignBridge — Firebase Configuration & Services
 * Handles Auth, Firestore, and all database operations.
 */

const firebaseConfig = {
  apiKey: "AIzaSyBz7Pb5tZ0-bSAWEf6ekVWmvO7I7qd_u7E",
  authDomain: "signbridge-b4347.firebaseapp.com",
  projectId: "signbridge-b4347",
  storageBucket: "signbridge-b4347.firebasestorage.app",
  messagingSenderId: "757679695992",
  appId: "1:757679695992:web:8862c7491240034ed9658d",
  measurementId: "G-K5BRB28LGV"
};

// Initialize Firebase (SDK loaded via CDN in index.html)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== Auth Service =====
const AuthService = {
  async register(email, password, username, userType) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: username });
    // Create user profile in Firestore
    await db.collection('users').doc(cred.user.uid).set({
      username: username,
      email: email,
      userType: userType || 'deaf',
      preferredLanguage: 'en-US',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return cred.user;
  },

  async login(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async logout() {
    await auth.signOut();
  },

  getCurrentUser() {
    return auth.currentUser;
  },

  onAuthChange(callback) {
    return auth.onAuthStateChanged(callback);
  },

  async getProfile(uid) {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  },

  async updateProfile(uid, data) {
    await db.collection('users').doc(uid).update(data);
  },

  async changePassword(newPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not logged in');
    await user.updatePassword(newPassword);
  }
};

// ===== Custom Dictionary Service =====
const CustomDictService = {
  async add(uid, word, description) {
    const key = word.toLowerCase().trim().replace(/[^a-z ]/g, '');
    if (!key) throw new Error('Invalid word');
    await db.collection('users').doc(uid).collection('customWords').doc(key).set({
      word: key,
      description: description.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  async getAll(uid) {
    const snap = await db.collection('users').doc(uid).collection('customWords')
      .orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async remove(uid, wordId) {
    await db.collection('users').doc(uid).collection('customWords').doc(wordId).delete();
  }
};

// ===== Phrase Service =====
const PhraseService = {
  // Save a phrase to user's history
  async save(uid, phrase, mode, language) {
    if (!phrase || !phrase.trim()) return;
    await db.collection('users').doc(uid).collection('phrases').add({
      phrase: phrase.trim().substring(0, 500),
      mode: mode || 'sign_to_speech',
      language: language || 'en-US',
      usedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  // Get user's recent phrases
  async getRecent(uid, limit) {
    const snap = await db.collection('users').doc(uid).collection('phrases')
      .orderBy('usedAt', 'desc')
      .limit(limit || 50)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Get user's most frequent phrases (for suggestions)
  async getFrequent(uid, limit) {
    // Fetch recent 200 phrases and count locally (Firestore doesn't have GROUP BY)
    const snap = await db.collection('users').doc(uid).collection('phrases')
      .orderBy('usedAt', 'desc')
      .limit(200)
      .get();

    const counts = {};
    snap.docs.forEach(d => {
      const p = d.data().phrase.toLowerCase();
      counts[p] = counts[p] || { phrase: d.data().phrase, count: 0 };
      counts[p].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit || 10);
  },

  // Get suggestions based on prefix
  async suggest(uid, prefix, limit) {
    const maxSuggestions = limit || 5;
    const suggestions = [];

    // 1. User's frequent phrases matching prefix
    const frequent = await this.getFrequent(uid, 30);
    const pfx = (prefix || '').toLowerCase();

    for (const f of frequent) {
      if (suggestions.length >= maxSuggestions) break;
      if (!pfx || f.phrase.toLowerCase().startsWith(pfx)) {
        suggestions.push({ phrase: f.phrase, source: 'history', score: f.count * 3 });
      }
    }

    // 2. Built-in common phrases
    const builtins = [
      'Hello', 'Thank you', 'How are you', 'Please help',
      'I need help', 'Where is the bathroom', 'Nice to meet you',
      'My name is', 'Can you repeat', 'I understand',
      'I dont understand', 'Goodbye', 'Yes', 'No', 'Sorry',
      'Excuse me', 'Good morning', 'Good night', 'I love you',
      'What is your name', 'How much', 'Where are you from'
    ];

    for (const b of builtins) {
      if (suggestions.length >= maxSuggestions) break;
      if (!pfx || b.toLowerCase().startsWith(pfx)) {
        if (!suggestions.find(s => s.phrase.toLowerCase() === b.toLowerCase())) {
          suggestions.push({ phrase: b, source: 'common', score: 0 });
        }
      }
    }

    // Sort: history first, then common
    suggestions.sort((a, b) => {
      if (a.source === 'history' && b.source !== 'history') return -1;
      if (b.source === 'history' && a.source !== 'history') return 1;
      return b.score - a.score;
    });

    return suggestions.slice(0, maxSuggestions);
  },

  // Clear all user's phrases
  async clearAll(uid) {
    const snap = await db.collection('users').doc(uid).collection('phrases').get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
};

// Export
window.AuthService = AuthService;
window.CustomDictService = CustomDictService;
window.PhraseService = PhraseService;
window.firebaseAuth = auth;
window.firebaseDb = db;
