# Project Progress Report

## Project Title: SignBridge — Real-Time Sign Language ↔ Speech Communication System

**Course:** Software Engineering
**Submitted by:** Shereen
**Date:** April 13, 2026

**Live Application:** https://signbridge-b4347.web.app
**GitHub Repository:** https://github.com/Shereen777/signbridge-frontend

---

## 1. Project Overview

SignBridge is a web-based bidirectional translator between American Sign Language (ASL) and spoken language, designed to enable real-time communication between deaf/hard-of-hearing users and hearing users. Like Google Translate bridges spoken languages, SignBridge bridges sign language and speech in both directions, with support for 14 spoken languages.

The system serves two user types:

- **Deaf users**: Sign to a webcam — the system recognizes hand shapes, builds text, translates it to any chosen language, and speaks it through the device speakers.
- **Hearing users**: Speak (or type) in any of 14 languages — the system transcribes speech, translates it to English, and either plays a real video clip of an ASL signer performing the equivalent sign or fingerspells it letter-by-letter using animated drawings.

---

## 2. Current Progress

The project has reached a working **end-to-end functional prototype** stage. Both communication directions are operational, the application is publicly deployed on Firebase Hosting, and the system supports user accounts with persistent data storage. All core features that map to the use cases in the SRS have been implemented and tested.

### 2.1 Deployment Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✓ Live | Firebase Hosting at signbridge-b4347.web.app |
| Authentication | ✓ Live | Firebase Auth (email/password) |
| Database | ✓ Live | Cloud Firestore with security rules deployed |
| GitHub repo | ✓ Public | Source code at github.com/Shereen777/signbridge-frontend |
| Continuous deployment | ✓ Working | One-command deploy via Firebase CLI |

---

## 3. Tasks Completed

### 3.1 Core Communication Features

**Sign → Speech direction** (Deaf user signs, system speaks)
- Real-time webcam capture and hand tracking using MediaPipe Hands at 30 FPS
- Custom geometric ASL classifier identifying all 26 alphabet letters
- 3 reliable word-level signs (HELLO, WHY, I LOVE YOU) detected from unique hand shapes
- Frame stabilization (6 consecutive frames before emission) eliminates jitter
- Visual feedback: hand skeleton overlay + detection progress bar on the camera view
- Text-to-Speech output in 14 languages via Web Speech API
- Translation of recognized English text to the chosen output language before speaking

**Speech → Sign direction** (Hearing user speaks, system shows signs)
- Microphone-based speech recognition via Web Speech API (continuous, with interim results)
- Manual text input as alternative to speech
- Translation of any input language to English before sign lookup
- Tokenizer that greedily matches 3-word, 2-word, and single-word phrases against the dictionary
- 50+ real ASL signer videos played from a public educational CDN for known words
- Background preloading of the 15 most-common videos on page load to eliminate first-play latency
- Canvas-based fingerspelling animation (each ASL letter drawn as a stylized hand pose) for unknown words
- 5-second safety timeout and play-ID guard preventing video freezing on subsequent plays
- Adjustable playback speed slider (300 ms – 2 s per letter)

### 3.2 Multi-Language Support

- Translation Service supporting all 14 languages: English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi, Urdu, Russian, Turkish
- Bidirectional translation (any-to-English for sign lookup, English-to-any for speech output)
- In-memory translation cache to avoid repeated API calls within a session
- Verified end-to-end: typing "merhaba" with Turkish selected correctly displays the HELLO sign video; typing "hola" with Spanish selected does the same

### 3.3 ASL Word Dictionary

- 184 dictionary entries covering greetings, social phrases, pronouns, question words, common verbs, adjectives, nouns, time expressions, colors, food, animals
- 516 alias mappings (e.g., "hi", "hey", "greetings" all map to HELLO)
- **700 total recognized words/phrases**
- Each entry contains: label, aliases, sign description, display data (hand pose with finger states, body position, motion type)
- Multi-word phrase support (e.g., "thank you", "good morning", "I love you" recognized as single signs)

### 3.4 User Account System

- User registration with email + password + user type (deaf/hearing) + preferred language
- Login / logout with Firebase IndexedDB-backed session persistence (survives page refresh)
- Password change from the profile page
- User profile updates (preferred language)
- Firebase Authentication handles all credential hashing and storage — passwords never seen by application code

### 3.5 Personal Data Features

- **Phrase history**: every spoken or signed phrase is logged with mode + language + timestamp in Firestore
- **Predictive suggestions**: Google-style autocomplete chips combining the user's most-used phrases (weighted ×3) with built-in common ASL phrases, updated as the user types
- **Custom dictionary**: users can add their own word + sign description pairs; these merge into the lookup table on login and appear in suggestions
- **Phrase history viewer** with timestamps, mode labels, and a "Clear All" button
- **Data isolation**: Firestore Security Rules enforce that every user can only read/write their own data

### 3.6 User Interface

- Polished red, white, and gold theme inspired by accessible-design references (Avis, Nagish)
- Large bold red hero banner with the SignBridge title, stats (700+ words, 14 languages, 50+ videos), and a Get Started button
- "Choose Your Mode" section with two large mode cards
- Features grid with red and gold icon cards highlighting capabilities
- Sticky red top navigation with logo, profile icon, and logout icon (icons replace text buttons for cleaner look)
- Dedicated profile screen with three tabs (Account, My Dictionary, Phrase History)
- Plus Jakarta Sans typography for a modern, friendly feel
- Fully responsive across desktop, tablet, and mobile breakpoints

### 3.7 Engineering Quality

- Clean layered + service-oriented architecture: 11 source files organized into 4 layers
- 7 independently swappable domain services (Sign Recognition, Sign Display, Speech, Translation, Auth, Phrase, Custom Dictionary)
- Comprehensive Architecture & Design document (separate deliverable)
- Continuous deployment pipeline: edits → Firebase deploy → live in <1 minute
- Public GitHub repository with version history

---

## 4. Remaining Features to Implement

### 4.1 Higher-Priority Features

**1. Machine Learning Sign Recognition (WLASL Integration)**
The current rule-based classifier reliably detects only 26 alphabet letters and 3 word signs. Replacing it with a TensorFlow.js neural network trained on the WLASL (Word-Level American Sign Language) dataset would expand recognition to 2000+ signs. The architecture is already prepared for this: the recognition logic sits behind a single `ASLClassifier.classify()` interface, so the swap requires zero changes to other modules.

**2. Two-Handed Sign Detection**
Many ASL signs require both hands (e.g., HELP, BOOK, SCHOOL, FAMILY). MediaPipe currently runs in single-hand mode (`maxNumHands: 1`). Upgrading to two-hand tracking and adding the corresponding classifier rules / model inputs is a moderate-scope change.

**3. Continuous Sign Recognition**
Real ASL is signed continuously without pauses between signs. The current system requires the user to hold each sign briefly. A temporal model (LSTM or Transformer) operating over a window of recent frames would handle natural signing flow. This depends on completing the ML model migration first.

**4. Real-Time Two-User Conversation Mode**
A "live conversation" feature where a deaf user and a hearing user are connected via WebRTC video call: the deaf user's signs are transcribed and shown as captions to the hearing user, and the hearing user's speech is shown as ASL videos to the deaf user. Firestore real-time listeners would synchronize the conversation log.

### 4.2 Production-Readiness Improvements

**5. Migrate to Paid Translation API**
The current Translation Service uses Google Translate's free undocumented endpoint, which has no SLA and may be rate-limited. Migrating to the paid Google Cloud Translation API ($20 per million characters) is a one-line change in `translator.js`.

**6. Self-Hosted ASL Sign Videos**
Currently, the 50+ ASL sign videos load from an external public CDN (signbsl.com). Uploading them to Firebase Storage gives us ownership, faster load times, and removes the external dependency. Total size is under 5 MB — well within the free tier.

**7. Server-Side Translation Cache**
The current cache is per-session in browser memory. A Cloudflare Workers KV cache shared across all users would avoid re-translating common phrases ("hello", "thank you") for every visitor.

**8. Denormalized Phrase Counts**
The current `getFrequent` query loads 200 phrases and counts duplicates in JavaScript — works for a typical user but degrades at scale. The fix is a Cloud Function trigger that maintains a separate counts collection, updated atomically on each phrase save.

### 4.3 Polish and Quality-of-Life

**9. Offline Mode**
Service Worker caching of the static files + IndexedDB caching of recent phrases would let the app function without internet for previously-used signs.

**10. Multi-Device Sync**
Real-time Firestore listeners for phrases and custom words mean users see updates instantly when adding a custom word from one device while viewing from another.

**11. Onboarding Tutorial**
A first-run walkthrough showing each feature: how to start the camera, how to hold a sign, how to type for speech-to-sign, how to add custom words.

**12. Conversation Export**
Allow users to download their phrase history as a text or PDF file.

**13. Accessibility Audit**
Full WCAG 2.1 AA compliance check: keyboard navigation through all features, screen-reader labels on every control, color-contrast ratios verified, focus indicators visible.

**14. Mobile Optimization**
The desktop experience is fully working; mobile camera permissions and the small-screen video display need additional testing and refinement.

---

## 5. Summary

The current build is a fully functional end-to-end prototype proving every component of the proposed system works: real-time hand tracking, sign-to-speech with multi-language output, speech-to-sign with real signer videos, user accounts with persistent personal data, predictive suggestions, and custom dictionary management. The remaining work focuses on three areas: increasing recognition accuracy via machine learning (the biggest pending item), adding multi-user real-time conversation, and production-hardening the translation, video hosting, and database query patterns.

The architecture chosen — a layered + service-oriented design on Firebase BaaS — has explicitly been built so that every remaining item closes by replacing one service's implementation while leaving the rest of the system unchanged.

---

## Appendix: Submission Links

- **Live Application:** https://signbridge-b4347.web.app
- **GitHub Repository:** https://github.com/Shereen777/signbridge-frontend
- **Architecture & Design Document:** ARCHITECTURE_DESIGN.md (separate file)
