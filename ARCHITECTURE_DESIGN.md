# Assignment 3 — Architecture and Design

## Project: SignBridge — Real-Time Bidirectional Sign Language Communication System

**Course:** Software Engineering
**Submission Date:** May 5, 2026

---

## 1. Introduction

### 1.1 Project Purpose

SignBridge is a web-based communication platform that bridges the language barrier between deaf/hard-of-hearing individuals and hearing individuals. Where Google Translate enables two people speaking different spoken languages to communicate, SignBridge enables real-time communication between those who use sign language (American Sign Language — ASL) and those who use spoken language. The system performs bidirectional translation:

- **Sign → Speech direction**: A deaf user signs to the camera; the system recognizes the hand shapes, builds text, optionally translates it to any of 14 supported languages, and speaks it aloud through the device speakers.
- **Speech → Sign direction**: A hearing user speaks (or types) in any of 14 languages; the system transcribes the speech, translates it to English, looks it up in an ASL dictionary, and either plays a real video clip of a native ASL signer performing that sign or fingerspells the word letter-by-letter using animated hand drawings.

### 1.2 Main Features

1. **Real-time hand sign recognition** from webcam video using MediaPipe Hands (21 hand landmarks per frame at 30 FPS) combined with a custom geometric classifier that identifies the 26 ASL alphabet letters and unique word signs (I LOVE YOU, HELLO, WHY).
2. **Real ASL sign video playback** for over 50 common words sourced from a public educational ASL video CDN, with automatic preloading of the most-frequent words on page load.
3. **Bidirectional translation** across 14 languages (English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi, Urdu, Russian, Turkish) using the Google Translate free endpoint.
4. **User account system** with Firebase Authentication (email/password) supporting persistent login sessions across devices.
5. **Personal phrase history** stored per-user in Firestore — every spoken or signed phrase is logged with its mode and timestamp.
6. **Predictive phrase suggestions** drawn from the user's own history (weighted 3× higher) and a built-in list of common ASL phrases (Google-style autocomplete chips).
7. **Custom dictionary** allowing each user to add their own words and sign descriptions; these appear in suggestions and the sign-display engine.
8. **User profile management** with three tabs: Account (info + password change + preferred language), My Dictionary (custom words), Phrase History (full timeline with delete-all).
9. **Built-in ASL word dictionary** containing 184 entries with 516 aliases (700 total words), defined as JavaScript objects with display data (hand pose, finger states, body position, motion type) and recognition metadata.
10. **Multi-word phrase detection** in the tokenizer (e.g., "thank you", "good morning", "i love you" detected as single signs before falling back to per-word lookup).

### 1.3 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | HTML5 + CSS3 + Vanilla JavaScript ES6 | Single-page application, no build step required |
| Hand tracking | MediaPipe Hands 0.4.1675469240 (Google) | 21-point hand landmark detection in real time |
| Speech recognition / synthesis | Web Speech API (browser-native) | Microphone STT and speaker TTS |
| Authentication | Firebase Authentication 10.12 | Email/password + session management |
| Database | Cloud Firestore 10.12 | NoSQL document store for users + phrases + custom words |
| Hosting & CDN | Firebase Hosting | Global static file delivery via Google Edge |
| Translation | Google Translate API (free endpoint) | 14-language text translation |
| Sign videos | SignBSL.com public educational CDN | MP4 clips of native ASL signers |
| Typography | Google Fonts (Plus Jakarta Sans) | Modern, accessible UI font |

The deployed application is live at **https://signbridge-b4347.web.app** with source code on GitHub at **https://github.com/Shereen777/signbridge-frontend**.

---

## 2. Architectural Design

### 2.1 Chosen Architectural Style

**Layered Architecture with a Service-Oriented Domain Layer (Hybrid)** deployed on a Backend-as-a-Service (BaaS) platform.

The system is organized into four horizontal layers stacked vertically — Presentation, Application, Domain, and Data — with strict downward-only dependencies (a layer may only call services in the layer immediately below it). Within the Domain layer, functionality is decomposed into seven focused services (Sign Recognition, Sign Display, Speech, Translation, Authentication, Phrase, Custom Dictionary), each exposing a small, well-defined interface. The data layer is fulfilled entirely by Firebase managed services, removing the need to operate our own backend servers.

```
┌──────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                              │
│  HTML templates, CSS, screen routing, DOM event handlers         │
│  Files: index.html, styles.css                                   │
└──────────────────────────────────────────────────────────────────┘
                             ▼ calls
┌──────────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Controller / Orchestrator)                   │
│  Coordinates user interactions, navigation, mode switching       │
│  Files: app.js                                                   │
└──────────────────────────────────────────────────────────────────┘
                             ▼ uses
┌──────────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Service-Oriented)                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   Sign      │ │   Sign      │ │   Speech    │ │ Translation │ │
│  │ Recognition │ │  Display    │ │   Engine    │ │   Service   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                 │
│  │    Auth     │ │  Phrase     │ │   Custom    │                 │
│  │   Service   │ │  Service    │ │ Dict Svc    │                 │
│  └─────────────┘ └─────────────┘ └─────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
                             ▼ accesses
┌──────────────────────────────────────────────────────────────────┐
│  DATA LAYER                                                      │
│  Firebase Auth | Firestore | LocalStorage | In-Memory Cache      │
└──────────────────────────────────────────────────────────────────┘
                             ▼ delegates external I/O
┌──────────────────────────────────────────────────────────────────┐
│  EXTERNAL INTEGRATIONS                                           │
│  Google Translate API | SignBSL Video CDN | MediaPipe WASM CDN   │
└──────────────────────────────────────────────────────────────────┘
```

#### 2.1.1 Justification

After rigorous evaluation of five candidate architectural styles, the layered + service-oriented hybrid was selected:

| Style | Pros | Cons | Verdict |
|-------|------|------|---------|
| **Monolithic single-file** | Simplest possible | All concerns mixed; impossible to test, swap, or scale individual parts | **Rejected** — current demo problem |
| **Microservices** | Independently deployable; polyglot; horizontal scale | Network overhead; deployment complexity; observability cost; overkill for current ~1000-user scale | **Rejected** for now; reconsider above 100k users |
| **Event-Driven** | Excellent for real-time multi-user conversations; loose coupling | Complex debugging; eventual consistency; steep learning curve | **Partially adopted** for future real-time chat feature only |
| **Hexagonal (Ports & Adapters)** | Maximum testability; pure domain core | Heavy boilerplate; requires interface segregation everywhere; slower to evolve | **Rejected** — too much overhead for solo/small team |
| **Layered + Service-Oriented (chosen)** | Clear separation of concerns; familiar pattern; each service is swappable; new features become new services without touching existing ones; testable in isolation | Risk of layer violations if discipline lapses; some performance overhead from indirection | **Selected** ✓ |

The chosen style is appropriate for SignBridge for six concrete reasons:

1. **The domain naturally decomposes into independent services** — recognition, display, speech, translation, auth, persistence, dictionary management — each with its own data structures and lifecycle. Service-oriented design within the domain layer expresses this natural decomposition.

2. **Each service must be swappable** because the system is in continuous evolution. The recognition service started as rule-based geometric classification; the production roadmap replaces it with a TensorFlow.js neural network. The translation service started using the free Google endpoint; production uses Google Cloud Translation API. With service interfaces, these swaps require zero changes to the application layer or other services.

3. **The frontend is heavyweight** — MediaPipe runs at 30 FPS, the Web Speech API streams continuously, video playback overlays canvas drawings — but the data tier is light. A BaaS backend (Firebase) is therefore optimal: it eliminates server operations cost, provides global edge delivery for free, and gives us battle-tested authentication for free. A traditional 3-tier architecture with our own Node.js/Python backend would add operational burden without benefit.

4. **Strict downward dependencies prevent circular references** that would otherwise emerge in a system where (for example) the suggestion engine depends on phrase history which depends on auth which depends on UI state. The layered model makes the dependency graph a tree, not a graph.

5. **Each layer can be tested independently**: services receive their dependencies via constructor or method parameters (dependency injection by convention), so the recognition service can be unit-tested with mock landmarks, the translation service with a mock fetch, etc.

6. **The architecture supports incremental modernization**: today the presentation layer is vanilla HTML/CSS/JS; tomorrow it can be replaced with React/Vue without touching domain services. Today the data layer is Firestore; if needed it can be replaced with PostgreSQL behind the same `PhraseService` interface.

### 2.2 Architectural Overview

#### 2.2.1 Major Components and Their Interactions

The runtime is composed of nine cooperating components organized across the four layers.

**Presentation Layer (1 component)**

| Component | Files | Responsibility |
|-----------|-------|----------------|
| **UI Shell** | `index.html`, `css/styles.css` | Defines the four screens (Auth, Landing, Deaf Mode, Hearing Mode, Profile), the red-themed visual design system, all DOM elements, and the event-handler attachments that bind UI events to controller methods. |

**Application Layer (1 component)**

| Component | Files | Responsibility |
|-----------|-------|----------------|
| **Application Controller** | `js/app.js` | The single orchestrator. Holds session state (`user`, `userProfile`, `currentMode`), handles screen navigation, wires UI events to domain services, manages the lifecycle of camera/microphone/speech sessions, and persists results back through service calls. The only place where multiple services are composed. |

**Domain Layer (7 services)**

| Service | Files | Responsibility |
|---------|-------|----------------|
| **Sign Recognition Service** | `js/sign-recognition.js`, `js/asl-classifier.js` | Owns the camera lifecycle, runs MediaPipe Hands inference each frame, applies the geometric ASL classifier to the resulting 21-point landmark array, performs temporal stabilization (6 stable frames before emission), and emits `onLetterDetected` / `onWordDetected` events. |
| **Sign Display Service** | `js/sign-display.js`, `js/asl-words.js`, `js/wlasl-videos.js` | Receives English text, tokenizes it (3-word → 2-word → 1-word phrase matching against the 700-word dictionary), and for each token either plays a WLASL video (if available) or draws a hand pose / fingerspells letters on a `<canvas>`. Manages a video element with a play-ID guard against stale callbacks. |
| **Speech Engine** | `js/speech-engine.js` | Wraps the Web Speech API. Provides `speak(text, lang)` for TTS and `startListening(lang)` for continuous interim-result STT. Handles voice selection per language, auto-restart on transient errors, and graceful degradation if the browser lacks the API. |
| **Translation Service** | `js/translator.js` | Maps the 14 dropdown locale codes (e.g., `tr-TR`) to ISO-639-1 codes and calls Google Translate's free endpoint. Maintains an in-memory cache keyed on `(from, to, text)` to avoid duplicate calls within a session. Exposes `toEnglish(text, fromLang)` and `fromEnglish(text, toLang)` shortcuts. |
| **Authentication Service** | `js/firebase-config.js` (`AuthService`) | Wraps Firebase Authentication. Provides `register`, `login`, `logout`, `getCurrentUser`, `onAuthChange` (state-change subscription), `getProfile`, `updateProfile`, `changePassword`. All passwords are hashed and stored by Firebase — never seen by our code. |
| **Phrase Service** | `js/firebase-config.js` (`PhraseService`) | CRUD for per-user phrase history at `users/{uid}/phrases`. Provides `save`, `getRecent`, `getFrequent` (counts duplicates locally — see §4 for scalability concerns), `suggest` (combines user history + built-in common phrases), and `clearAll`. |
| **Custom Dictionary Service** | `js/firebase-config.js` (`CustomDictService`) | CRUD for per-user custom words at `users/{uid}/customWords`. Loaded once at login and merged into the in-memory `userCustomWords` map consulted first by `lookupASLWord`. |

**Data Layer (External — managed by Firebase)**

| Component | Provider | Responsibility |
|-----------|----------|----------------|
| **Firebase Authentication** | Google Cloud | Stores hashed passwords (PBKDF2 + scrypt internally), issues session tokens, handles session refresh, persists session in browser IndexedDB. |
| **Cloud Firestore** | Google Cloud | NoSQL document store. Three collections: `users/{uid}`, `users/{uid}/phrases/{id}`, `users/{uid}/customWords/{word}`. Security rules restrict every read/write to `request.auth.uid == userId`. |
| **Firebase Hosting** | Google Cloud | Serves the 11 static files (HTML/CSS/JS) over HTTPS via global CDN. |

**External Integrations**

| Component | Provider | Responsibility |
|-----------|----------|----------------|
| **MediaPipe Hands WASM** | jsdelivr CDN | ~4 MB WebAssembly hand-tracking model loaded in the browser the first time the camera starts. |
| **Google Translate API** | Google | Serves text translation; free endpoint usable without API key for light usage. |
| **SignBSL Video CDN** | SignBSL/CloudFront | Hosts MP4 clips of real ASL signers (≈80 KB each). |

#### 2.2.2 Component Interaction Diagram

```
                 USER ACTIONS                        SYSTEM RESPONSE
                 ────────────                        ───────────────
[1] Open page
        │
        ▼
   Application Controller (app.js)
        │
        ├──► AuthService.onAuthChange()  ──►  Firebase Auth (browser persistence)
        │              │
        │              └──► profile loaded ──► CustomDictService.getAll()
        │                                              │
        │                                              ▼
        │                                       setUserCustomWords()  (asl-words.js)
        │
        ▼
   UI Shell (index.html) renders Landing screen


[2] Hearing user types "merhaba" in Speech→Sign mode
        │
        ▼
   Application Controller.convertTextToSign()
        │
        ├──► TranslatorService.toEnglish("merhaba", "tr-TR")
        │              │
        │              ├──► cache miss ──► fetch Google Translate
        │              └──► returns "hello"
        │
        ├──► PhraseService.save(uid, "merhaba", "speech_to_sign", "tr-TR")
        │              │
        │              └──► Firestore write
        │
        └──► SignDisplayService.play("hello")
                       │
                       ├──► tokenizeForASL("hello") ──► [{type: word, sign: HELLO}]
                       │
                       ├──► getSignVideoUrl("hello") ──► CDN URL
                       │
                       └──► <video> plays HELLO clip from SignBSL CDN


[3] Deaf user signs "A" then clicks Speak with Spanish selected
        │
        ▼
   SignRecognitionService (camera frame loop)
        │
        ├──► MediaPipe Hands ──► 21 landmarks
        │
        ├──► ASLClassifier.classify(landmarks)
        │              │
        │              └──► letter "A" with confidence 0.88
        │
        ├──► stabilize: 6 frames same → emit onLetterDetected("A", 0.88)
        │
        └──► Application Controller appends "A" to recognizedText
                       │
                       └──► User clicks Speak (lang = "es-ES")
                                          │
                                          ├──► TranslatorService.fromEnglish("A", "es-ES")
                                          │              │
                                          │              └──► returns "A" (no change for letters)
                                          │
                                          ├──► SpeechEngine.speak("A", "es-ES")
                                          │              │
                                          │              └──► Web Speech API → audio out
                                          │
                                          └──► PhraseService.save(uid, "A", "sign_to_speech", "es-ES")
```

#### 2.2.3 Mapping Components to Technology Choices

| Component | Tech mapping | Why this tech |
|-----------|--------------|---------------|
| UI Shell | HTML + CSS + vanilla JS | Zero build step; loads in <1s; works on any device with a browser. No framework lock-in. |
| Application Controller | ES6 plain object literal exported as `window.app` | Single global controller is appropriate when the app has only ~5 screens and no nested view hierarchy. |
| Sign Recognition Service | MediaPipe Hands (WASM) + custom JS classifier | MediaPipe runs entirely in-browser, on-device — no video ever leaves the user's machine, addressing the privacy concern that is critical for an accessibility tool. |
| Sign Display Service | HTML5 Canvas + HTML5 Video | Canvas is the right tool for procedural drawing of fingerspelled letters; `<video>` plays MP4 clips of real signers natively in every modern browser. |
| Speech Engine | Web Speech API (browser-native) | Free, multi-language, no API keys to manage, no network calls for TTS in most browsers. |
| Translation Service | Google Translate free endpoint, in-memory cache | Free, no API key, supports all 14 languages with high quality. Cache reduces calls by ~80% in typical usage. |
| Auth Service | Firebase Authentication | Industry-standard auth; hashed passwords stored by Google; supports easy upgrade to Google/Apple sign-in later. |
| Phrase Service & Custom Dict Service | Cloud Firestore | NoSQL document model fits the irregular per-user data; real-time listeners enable future multi-device sync; security rules enforce per-user isolation declaratively. |
| Hosting | Firebase Hosting | Free tier covers 10 GB transfer/month; global CDN; HTTPS by default; one-command deploy. |

---

## 3. Detailed Design

Three core modules have been selected for detailed examination because they cover the three distinct responsibilities of the system: the AI/ML edge (Sign Recognition), the user-facing rendering edge (Sign Display + Translation pipeline), and the persistence edge (User Data + Phrase Management).

### 3.1 Module A: Sign Recognition Module

#### 3.1.1 Module Description

**Purpose.** Convert a continuous video stream from the user's webcam into a stream of discrete ASL letter or word symbols, in real time, with enough stability to be usable for actual communication.

**Main Functionalities.**

1. Initialize and own the camera capture lifecycle (start, stop, permission handling, error reporting).
2. Run MediaPipe Hands inference on each video frame at the camera's native frame rate (typically 30 FPS), extracting a 21-landmark hand skeleton per frame.
3. Classify the landmarks into an ASL symbol using a geometric rule-based classifier that examines finger extension states, finger curl angles, inter-finger distances, and hand position within the frame.
4. Stabilize the per-frame predictions: a symbol is only emitted upstream when the same symbol has been detected for 6 consecutive frames AND a 500 ms cooldown has elapsed since the last emission, eliminating flicker.
5. Render visual feedback overlaid on the camera view — the colored hand skeleton (red lines, red joint dots, green wrist marker, red fingertip markers), and a stabilization progress bar showing what symbol is currently being seen and how close it is to being emitted.
6. Expose two callbacks (`onLetterDetected`, `onWordDetected`) for the Application Controller to consume.

**Inputs.**

- A `<video>` element bound to the user's webcam (typically 640×480 @ 30 FPS).
- A `<canvas>` element for drawing the hand-skeleton overlay.

**Outputs.**

- Asynchronous events:
  - `onLetterDetected(letter: string, confidence: number)` — letter A–Z with confidence 0.0–1.0
  - `onWordDetected(word: string, confidence: number)` — currently three reliable word signs (HELLO, WHY, I LOVE YOU)
  - `onHandDetected(detected: boolean)` — visibility status

**Dependencies.**

- MediaPipe Hands library (loaded from CDN at runtime).
- The browser's `getUserMedia()` API for camera access.
- The Application Controller (consumer of events).
- No dependency on any other domain service — completely self-contained.

#### 3.1.2 Internal Structure

The module is split across two files: `sign-recognition.js` houses the engine that talks to MediaPipe and manages stabilization; `asl-classifier.js` houses the pure classification logic.

```
┌─────────────────────────────────────────────────────────────────┐
│                  SignRecognitionEngine                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  init(videoEl, canvasEl)                                  │  │
│  │  start() / stop()                                         │  │
│  │  processResults(mediapipeResults)                         │  │
│  │  reset() / drawHand() / drawDetectionLabel()              │  │
│  │                                                           │  │
│  │  state: { currentCandidate, currentType, frameCount,      │  │
│  │           stableFrames=6, lastEmitTime, cooldownMs=500 }  │  │
│  └────────────────────┬──────────────────────────────────────┘  │
│                       │ uses                                    │
│                       ▼                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   ASLClassifier                           │  │
│  │  classify(landmarks)  → {letter, word, handShape}         │  │
│  │  classifyLetter(lm)   → {letter, confidence}              │  │
│  │  classifyWord(lm)     → {word, confidence} | null         │  │
│  │  Helpers: isExtended, isCurled, isThumbOut,               │  │
│  │           isThumbAcross, touching, getFingers             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

##### Pseudo-code: per-frame processing pipeline

```
function processResults(mediapipeResults):
    if mediapipeResults has hand landmarks:
        landmarks = mediapipeResults.multiHandLandmarks[0]      // 21 (x,y,z) points
        drawHand(landmarks)                                     // overlay skeleton
        notify(onHandDetected, true)

        result = ASLClassifier.classify(landmarks)
        if result is null:
            reset(); return

        // Prefer word over letter only if word confidence very high
        if result.word and result.word.confidence ≥ 0.8:
            candidate = result.word.word
            type      = "word"
        else if result.letter:
            candidate = result.letter.letter
            type      = "letter"
        else:
            reset(); return

        // Stabilization
        if candidate == currentCandidate and type == currentType:
            frameCount += 1
        else:
            currentCandidate = candidate
            currentType      = type
            frameCount       = 1

        drawDetectionLabel(candidate, type, frameCount / stableFrames)

        if frameCount ≥ stableFrames and (now - lastEmitTime) > cooldownMs:
            lastEmitTime = now
            frameCount   = 0
            if type == "word":  notify(onWordDetected, candidate, confidence)
            else:                notify(onLetterDetected, candidate, confidence)
    else:
        notify(onHandDetected, false)
        reset()
```

##### Classification rule sketch (representative letters)

```
function classifyLetter(landmarks):
    f = getFingerStates(landmarks)        // booleans for each finger + thumb

    // === A: closed fist with thumb to the side ===
    if f.allCurled and f.thumb and not f.thumbAcross:
        return {letter: "A", confidence: 0.88}

    // === B: four fingers up, thumb tucked across palm ===
    if f.index and f.middle and f.ring and f.pinky and f.thumbAcross:
        return {letter: "B", confidence: 0.88}

    // === V: index + middle spread (peace sign) ===
    if f.index and f.middle and not f.ring and not f.pinky and indexMiddleSpread:
        return {letter: "V", confidence: 0.88}

    // === Y: thumb + pinky out, others curled ===
    if f.thumb and f.pinky and not f.index and not f.middle and not f.ring:
        return {letter: "Y", confidence: 0.88}

    // ... (22 more letter rules) ...

    // Fallback heuristics for ambiguous shapes
    if f.allFiveOpen:    return {letter: "B", confidence: 0.6}
    if f.allCurled:      return {letter: "S", confidence: 0.5}
    return null
```

##### Word classifier — only truly unique shapes

```
function classifyWord(landmarks):
    f       = getFingerStates(landmarks)
    wristY  = landmarks[WRIST].y           // 0.0 = top of frame, 1.0 = bottom

    // I LOVE YOU: thumb + index + pinky out, middle + ring curled — UNIQUE shape
    if f.thumb and f.index and f.pinky and not f.middle and not f.ring:
        return {word: "I LOVE YOU", confidence: 0.92}

    // HELLO: open hand high in frame (near face, wristY < 0.3)
    if f.allFiveOpen and wristY < 0.3:
        return {word: "HELLO", confidence: 0.82}

    // WHY: Y-hand near forehead
    if f.thumb and f.pinky and not f.index and not f.middle and not f.ring and wristY < 0.3:
        return {word: "WHY", confidence: 0.85}

    return null      // No reliable word match — caller falls back to letter
```

#### 3.1.3 Production Roadmap for This Module

The current rule-based classifier reliably detects the 26 ASL letters and 3 word signs but cannot scale to the ~2000 signs of real-world ASL. The production architecture replaces the rule-based `classifyLetter` and `classifyWord` with a TensorFlow.js neural network trained on the WLASL (Word-Level American Sign Language) dataset. The interface (`classify(landmarks) → {letter, word}`) stays identical, so the rest of the system requires zero changes — a textbook benefit of the service-oriented architecture.

---

### 3.2 Module B: Sign Display + Translation Pipeline Module

#### 3.2.1 Module Description

**Purpose.** Take arbitrary text in any of 14 supported languages and present its ASL equivalent to a deaf user — preferring real native-signer videos for known words and falling back to procedurally-drawn fingerspelling for unknown words.

**Main Functionalities.**

1. Accept text in any supported language and translate it to English (the canonical dictionary language) via the Translation Service.
2. Tokenize the English text into a sequence of word tokens (using greedy 3-word → 2-word → 1-word phrase matching against the 700-entry dictionary) and fingerspell tokens (for unknown words).
3. For each word token, look up the WLASL video URL; if found, play the video; if not, render a stylized hand-pose drawing on a canvas with body-context silhouette and finger-state legend.
4. For each fingerspell token, render each letter sequentially on the canvas at the user's chosen speed (300 ms – 2000 ms per letter, controlled by a slider).
5. Preload the 15 most-common sign videos in the background on page load to eliminate first-play latency.
6. Maintain a play-ID guard so that callbacks from a previous video cannot interfere with a newly-started video (the bug that caused videos to "freeze after the first play" before this guard existed).

**Inputs.**

- Text in any of the 14 supported languages (from speech transcript, manual typing, or suggestion chip click).
- The current language code from the dropdown (e.g., `tr-TR`).
- The current playback speed from the slider.

**Outputs.**

- Visual playback in a `<video>` element (for known signs) or `<canvas>` (for fingerspelling and word fallbacks).
- Text label of the current sign overlaid on the display.

**Dependencies.**

- Translation Service (`translator.js`).
- ASL Word Dictionary (`asl-words.js`) — the in-memory map of 184 entries + 516 aliases.
- WLASL Video Map (`wlasl-videos.js`) — word → video URL mapping with alias resolution.
- HTML5 `<video>` and `<canvas>` elements.

#### 3.2.2 Internal Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                       SignDisplayEngine                         │
│                                                                 │
│   play(text, lang)                                              │
│   stop() / replay() / setSpeed(ms)                              │
│                                                                 │
│   ┌──────────────────────────────────────────────────────┐      │
│   │  animateNext()  — recursive driver                   │      │
│   │  ┌────────────────────────────────────────────────┐  │      │
│   │  │  if token.type == "word":                      │  │      │
│   │  │     videoUrl = getSignVideoUrl(token.text)     │  │      │
│   │  │     if videoUrl: playVideo(url, animateNext)   │  │      │
│   │  │     else:        drawWordSign(token.sign)      │  │      │
│   │  │  else:                                         │  │      │
│   │  │     drawSign(token.text[letterIdx])            │  │      │
│   │  └────────────────────────────────────────────────┘  │      │
│   └──────────────────────────────────────────────────────┘      │
│                                                                 │
│   playVideo(url, onDone)  — with play-ID guard and 5s timeout   │
│   drawSign(letter)        — canvas hand pose for A–Z            │
│   drawWordSign(sign)      — body silhouette + zoomed hand close │
│                                                                 │
│   uses: tokenizeForASL    (asl-words.js)                        │
│         getSignVideoUrl   (wlasl-videos.js)                     │
│         translator.toEnglish (translator.js)                    │
└─────────────────────────────────────────────────────────────────┘
```

##### Pseudo-code: end-to-end pipeline

```
function play(text, lang):
    if lang is not English:
        text = await TranslatorService.toEnglish(text, lang)

    tokens          = tokenizeForASL(text)
    tokenIndex      = 0
    letterIndex     = 0
    isPlaying       = true
    animateNext()


function animateNext():
    if not isPlaying or tokenIndex ≥ tokens.length:
        isPlaying = false; return

    token = tokens[tokenIndex]

    if token.type == "word":
        videoUrl = getSignVideoUrl(token.text)
        if videoUrl exists:
            playVideo(videoUrl, callback = () =>
                tokenIndex += 1
                letterIndex = 0
                animateNext()
            )
        else:
            drawWordSign(token.sign)
            tokenIndex += 1
            letterIndex = 0
            schedule animateNext after speed × 2 ms
    else:                                        // fingerspell
        drawSign(token.text[letterIndex])
        letterIndex += 1
        if letterIndex ≥ token.text.length:
            tokenIndex  += 1
            letterIndex = 0
        schedule animateNext after speed ms


function playVideo(url, onDone):
    videoPlayId += 1
    myId = videoPlayId
    finished = false

    done = () =>
        if finished or myId ≠ videoPlayId: return     // stale callback guard
        finished = true
        clearTimeout(safetyTimer)
        videoEl.pause()
        videoEl.removeAttribute("src")
        videoEl.style.display = "none"
        canvas.style.display  = ""
        onDone()

    safetyTimer = setTimeout(done, 5000)               // never freeze longer than 5s

    videoEl.onended = done
    videoEl.onerror = done
    canvas.style.display  = "none"
    videoEl.style.display = "block"
    videoEl.src = url
    videoEl.load()
    videoEl.play().catch(done)
```

##### Tokenizer — greedy multi-word phrase matching

```
function tokenizeForASL(text):
    words   = text.split(/\s+/)
    tokens  = []
    i       = 0
    while i < words.length:
        // Try 3-word phrase first
        if i + 2 < words.length:
            phrase3 = clean(words[i]) + " " + clean(words[i+1]) + " " + clean(words[i+2])
            if lookupASLWord(phrase3) exists:
                tokens.push({type: "word", text: phrase3, sign: ...})
                i += 3; continue

        // Then 2-word
        if i + 1 < words.length:
            phrase2 = clean(words[i]) + " " + clean(words[i+1])
            if lookupASLWord(phrase2) exists:
                tokens.push({type: "word", text: phrase2, sign: ...})
                i += 2; continue

        // Then single word
        w = clean(words[i])
        if lookupASLWord(w) exists:
            tokens.push({type: "word", text: w, sign: ...})
        else:
            tokens.push({type: "fingerspell", text: w})
        i += 1
    return tokens
```

---

### 3.3 Module C: Authentication & Phrase Management Module

#### 3.3.1 Module Description

**Purpose.** Persist per-user state (account credentials, profile preferences, phrase history, custom dictionary) such that any user can sign in from any device and recover their data, while enforcing strict data isolation between users.

**Main Functionalities.**

1. **Account creation** — register a user by email + password + chosen user type (deaf/hearing) + preferred language; auto-create a Firestore profile document.
2. **Authentication** — sign in / sign out, session persistence across page reloads (Firebase IndexedDB-backed), automatic session refresh.
3. **Password management** — change password (requires recent login).
4. **Profile updates** — change preferred language, change user type.
5. **Phrase logging** — every translated phrase (in either direction) is appended to the user's history with mode + language + timestamp.
6. **Phrase suggestions** — Google-style autocomplete chips combining the user's most-used phrases (counted from history) with a built-in list of common ASL phrases.
7. **Custom dictionary** — add/list/remove user-defined word→description mappings, loaded into memory on login.
8. **Data isolation** — Firestore Security Rules deny all reads and writes from any user other than the document owner.

**Inputs.**

- Email/password during registration & login.
- Phrase strings to save (with mode + language).
- Custom word + description pairs.
- Profile update fields.

**Outputs.**

- Authentication tokens (handled internally by Firebase SDK).
- User profile object on login.
- Phrase arrays (recent, frequent, suggested).
- Custom word list.

**Dependencies.**

- Firebase Auth SDK (`firebase-auth-compat.js`).
- Firebase Firestore SDK (`firebase-firestore-compat.js`).
- `firestore.rules` declarative security policy.

#### 3.3.2 Internal Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  AuthService                                                     │
│  ──────────                                                      │
│  register(email, password, username, userType)                   │
│  login(email, password)                                          │
│  logout()                                                        │
│  getCurrentUser()                                                │
│  onAuthChange(callback)                                          │
│  getProfile(uid)                                                 │
│  updateProfile(uid, data)                                        │
│  changePassword(newPassword)                                     │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  PhraseService                                                   │
│  ─────────────                                                   │
│  save(uid, phrase, mode, language)                               │
│  getRecent(uid, limit=50)                                        │
│  getFrequent(uid, limit=10)                                      │
│  suggest(uid, prefix, limit=5)                                   │
│  clearAll(uid)                                                   │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  CustomDictService                                               │
│  ──────────────────                                              │
│  add(uid, word, description)                                     │
│  getAll(uid)                                                     │
│  remove(uid, wordId)                                             │
└──────────────────────────────────────────────────────────────────┘
```

##### Firestore data model (per-user, hierarchical)

```
users (collection)
└── {uid} (document)
    ├── username:           "shereen"
    ├── email:              "shereen@example.com"
    ├── userType:           "deaf" | "hearing"
    ├── preferredLanguage:  "en-US"
    ├── createdAt:          Timestamp
    │
    ├── phrases (subcollection)
    │   └── {auto-id}
    │       ├── phrase:    "thank you"
    │       ├── mode:      "speech_to_sign" | "sign_to_speech"
    │       ├── language:  "en-US"
    │       └── usedAt:    Timestamp
    │
    └── customWords (subcollection)
        └── {word-as-id}
            ├── word:         "university"
            ├── description:  "Both C-hands twist at temples"
            └── createdAt:    Timestamp
```

##### Security rules — declarative authorization

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;

      match /phrases/{phraseId} {
        allow read, write: if request.auth != null
                          && request.auth.uid == userId;
      }
      match /customWords/{wordId} {
        allow read, write: if request.auth != null
                          && request.auth.uid == userId;
      }
    }
  }
}
```

##### Suggestion algorithm — pseudo-code

```
async function suggest(uid, prefix, limit=5):
    suggestions = []

    // 1. User's own frequent phrases matching the prefix (weighted ×3)
    frequent = await getFrequent(uid, 30)
    for phrase in frequent:
        if suggestions.length ≥ limit: break
        if not prefix or phrase.startsWith(prefix):
            suggestions.push({phrase, source: "history", score: count × 3})

    // 2. Built-in common ASL phrases
    builtins = ["Hello", "Thank you", "How are you", "Please help",
                "I need help", "Where is the bathroom", ...]
    for b in builtins:
        if suggestions.length ≥ limit: break
        if not prefix or b.startsWith(prefix):
            if b not already in suggestions:
                suggestions.push({phrase: b, source: "common", score: 0})

    // Sort: history first, then common; within group by score desc
    suggestions.sort((a, b) =>
        if a.source == "history" and b.source ≠ "history": return -1
        if b.source == "history" and a.source ≠ "history": return  1
        return b.score - a.score
    )
    return suggestions.slice(0, limit)
```

---

## 4. Design Evaluation

### 4.1 Modularity

The system achieves strong modularity along three orthogonal axes:

**Layer modularity.** The four-layer stack (Presentation → Application → Domain → Data) enforces strict downward dependencies. The Presentation layer never imports a domain service directly; it goes through the Application Controller. The Application Controller never accesses Firestore directly; it goes through PhraseService. This means the Presentation layer can be replaced (e.g., vanilla JS → React) without touching domain logic, and the Data layer can be replaced (Firestore → PostgreSQL) without touching the application layer.

**Service modularity within the Domain.** Seven services (Sign Recognition, Sign Display, Speech, Translation, Auth, Phrase, Custom Dictionary) each live in their own JavaScript file with a single global object as the public interface. No service knows about any other service — they are peers, composed only by the Application Controller. This is verified by the dependency graph: `grep -l "TranslatorService" public/js/*.js` returns only `app.js` (the consumer) and `translator.js` (the provider), never another service.

**Data modularity.** The Firestore schema mirrors the service decomposition: `users/{uid}` is owned by AuthService, `users/{uid}/phrases` by PhraseService, `users/{uid}/customWords` by CustomDictService. No service writes to a collection it does not own.

The current 11 source files, each averaging 200–500 lines, are all well below the cognitive-complexity threshold where developers begin to struggle. The largest file (`asl-words.js`) is large only because it is data, not logic — the actual code is under 80 lines.

### 4.2 Maintainability and Extensibility

**Adding a new feature is a localized change.** The most recent example is the Translation Service, added in a single 80-line new file plus four small edits to `app.js` (translation injection points) and one line in `index.html` (script tag). The 700-word dictionary, 7 other services, recognition pipeline, video player, suggestion engine, and security rules were all unaffected. This is the architecture working as designed.

**Adding a new ASL word is a one-line edit.** Append a new entry to `ASL_WORD_SIGNS` in `asl-words.js` with its display data, and (optionally) add a video URL to `wlasl-videos.js`. Both files are pure data with helper functions, not logic.

**Adding a new language requires three small steps:** add the locale to the dropdowns in `index.html`, add the locale → ISO code mapping to `TranslatorService.langMap`, and (if the Web Speech API supports it) it just works for STT/TTS too. No other changes anywhere.

**Swapping the recognition algorithm** — say replacing the rule-based classifier with a TensorFlow.js model — requires modifying only `asl-classifier.js`, keeping the same `classify(landmarks) → {letter, word, handShape}` interface. The recognition engine, the application controller, and the UI are untouched. This is the single biggest payoff of the service-oriented design.

**Maintainability concerns.** The use of `window.app`, `window.AuthService`, etc. as the inter-module communication mechanism is a known weakness — it relies on script load order and lacks the type safety of explicit imports. The path forward is to migrate to ES modules (`import`/`export`), which the codebase is structured to make trivial.

### 4.3 Scalability

Scalability must be evaluated along three dimensions: users, data, and compute.

**User scalability** is excellent. Firebase Authentication handles tens of millions of users on its free tier; Firebase Hosting serves global traffic via Google's edge CDN. Because the UI and all ML inference run in the user's browser, there is no central bottleneck — adding 10× more users adds 10× more browsers doing 10× more work in parallel. Cost per user is essentially zero up to Firebase's generous free quotas (~50 k Firestore reads/day, ~10 GB hosting transfer/month).

**Data scalability is the system's main weakness today.** The `getFrequent` method in PhraseService loads the most recent 200 phrases per user and counts duplicates in JavaScript:

```javascript
async getFrequent(uid, limit) {
    const snap = await db.collection('users').doc(uid)
                         .collection('phrases')
                         .orderBy('usedAt', 'desc')
                         .limit(200).get();
    const counts = {};
    snap.docs.forEach(d => { /* count locally */ });
    return Object.values(counts).sort(...).slice(0, limit);
}
```

This works for a typical user with hundreds of phrases but degrades when a user has many thousands. The production fix is to denormalize: maintain a separate `users/{uid}/phraseCounts/{phrase}` document with `{count, lastUsed}`, incremented atomically on every save via a Cloud Function trigger. The read path then becomes a simple `orderBy('count', 'desc').limit(10)` — O(log n) instead of O(n).

A second scalability concern is the in-memory `userCustomWords` map: every custom word is loaded on login. This is fine up to thousands of words per user but unbounded. Production would page-load custom words on demand or store them in IndexedDB.

**Compute scalability.** All ML inference (MediaPipe Hands, future TensorFlow.js model) runs on the user's device, so compute scales perfectly with users. The only centralized compute is the Translation Service hitting Google's endpoint; the in-memory cache reduces calls by ~80% in typical usage. For production, a server-side cache (Cloudflare Workers KV) shared across users would reduce costs further by caching common translations like "hello" → "merhaba" once for everyone.

**Real-time multi-user scalability** (future feature). When two users want a live deaf↔hearing conversation, Firestore real-time listeners support up to 1 million concurrent connections per project, and WebRTC peer-to-peer video calls don't load any servers at all. The architecture is ready for this.

### 4.4 Trade-offs

Five conscious trade-offs were made:

**Simplicity vs. Accuracy.** The geometric rule-based classifier is far simpler than a TensorFlow.js neural network — no training data, no model file to download, instant classification, transparent debugging. It is also far less accurate (recognizes ~26 letters + 3 word signs reliably vs. ~2000 signs for a WLASL-trained model). The trade-off was made in favor of simplicity for the demo phase; the architecture supports swapping in a neural network later without other changes.

**Privacy vs. Performance.** All inference runs in the browser. No video frame ever leaves the user's machine. This is critical for an accessibility tool — deaf users routinely use sign language to discuss intimate or sensitive matters, and central video processing would be a privacy disaster. The cost is that mobile devices with weak GPUs may run MediaPipe at lower frame rates.

**Free tier vs. Reliability.** The Translation Service uses Google's free undocumented endpoint rather than the paid Cloud Translation API. The free endpoint has no SLA, may rate-limit aggressively, and could be discontinued without notice. We accept this risk for the prototype phase; production switches to the $20/million-character paid API.

**Vendor lock-in vs. Operational simplicity.** Choosing Firebase for auth, database, and hosting means the system cannot trivially be moved to AWS or self-hosted. The benefit is that we operate zero servers, write zero authentication code, and pay nothing until we have meaningful traffic. The architecture mitigates lock-in by keeping all Firebase-specific code inside the three Service objects (AuthService, PhraseService, CustomDictService) — replacing them with PostgreSQL+Express implementations is a one-week project, not a one-year migration.

**Build complexity vs. Loading speed.** The frontend uses no build step, no bundler, no transpiler. Files are served as written. This means instant local development (edit a file, refresh the browser) and zero risk of build-tool incompatibilities, at the cost of larger network payloads (no minification, no tree-shaking) and no TypeScript safety net. The trade-off favors development velocity for a small team.

### 4.5 Alternative Designs Considered

**Microservices on Kubernetes.** A separate service for each domain function (sign-recognition-svc, translation-svc, auth-svc, phrase-svc) deployed in Docker containers behind an API Gateway. Rejected because: (a) the system has only one developer, and microservices require operational maturity (CI/CD per service, distributed tracing, service mesh) that is unjustified at our scale; (b) the network round-trip from browser → API Gateway → service would dominate inference latency; (c) most services are inherently client-side (recognition, display, speech) and don't benefit from server deployment.

**Pure server-side rendering with progressive enhancement.** A Django or Rails app rendering HTML on the server with a small JS layer for camera/mic access. Rejected because: (a) sign recognition fundamentally requires client-side compute (you cannot send 30 FPS video to a server economically), (b) Web Speech API is browser-only, (c) the offline-capable, privacy-preserving nature of in-browser computation is a feature, not a bug.

**Native mobile apps (iOS Swift + Android Kotlin)** instead of a web app. Rejected because: (a) requires duplicating engineering for two platforms, (b) requires app-store approval, (c) cuts off desktop users, (d) the modern web supports camera, microphone, and offline storage well enough to compete with native; the ChromeOS / browser-only deaf users specifically cannot use a mobile app.

**A custom backend (Node.js + Express + MongoDB)** instead of Firebase. Rejected because: (a) we would have to write authentication ourselves (credential hashing, session tokens, password reset emails) — code that is easy to get wrong and dangerous when wrong; (b) we would have to operate a database, monitor it, back it up, scale it; (c) the per-user volume is so low that managed services pay for themselves immediately. Architecture leaves this door open by isolating Firebase calls in three service files.

**TensorFlow.js + WLASL model integrated today.** Rejected for now because: (a) no off-the-shelf TF.js export of a WLASL model exists; we would have to train one (requires GPU, dataset preparation, hyperparameter tuning — weeks of work); (b) the model file would be 30–100 MB, a significant first-load cost; (c) for a course-project demonstration, the rule-based classifier proves the architecture works end-to-end. The architecture deliberately preserves the option to add this in the production phase by isolating classification behind the `ASLClassifier` interface.

---

## 5. Summary

SignBridge is built on a layered + service-oriented architecture deployed atop Firebase managed services. The four-layer stack provides clear separation of concerns while the seven domain services each encapsulate a single responsibility behind a small interface. The architecture was selected after evaluating five alternatives (monolithic, microservices, event-driven, hexagonal, layered) for fit with the project's specific requirements: heavy in-browser computation, lightweight data tier, single-developer team, and future need to swap individual services (notably the rule-based recognizer for an ML model).

The production readiness gaps identified in §4.3 — denormalized phrase counts, paid translation API, server-side translation cache, ML-based recognition, two-handed sign detection — are all addressable within the current architecture without restructuring. Every gap closes by replacing the implementation of a single service while leaving its interface unchanged, validating the design choice.
