# Pre-Trained WLASL Model — Research Log

**Investigation date:** 2026-05-17
**Time budget:** 4 hours (plan budget) — actual ≈ 30 minutes
**Outcome:** No drop-in usable pre-trained model found. Staying with rule-based + motion detection.

---

## Acceptance Criteria (from the plan)

A pre-trained WLASL model would have been integrated if all of these were met:

- TensorFlow.js or ONNX Runtime Web compatible format
- MIT, Apache 2.0, or CC0 license
- Model size ≤ 100 MB
- Recognizes ≥ 100 signs
- Operates on MediaPipe Hands landmarks OR on raw video frames

---

## Sources Searched

| Source | Query | Outcome |
|--------|-------|---------|
| Google Web Search | `pre-trained WLASL ASL sign language tensorflow.js model browser inference 2026` | Only academic Python implementations; no TF.js exports |
| Google Web Search | `"sign language" "tensorflow.js" pretrained model GitHub MediaPipe landmarks classifier word` | Custom-trained projects (alphabet only); no WLASL TF.js |
| Google Web Search | `fingerpose tensorflow.js ASL gesture detector library install npm` | Found Fingerpose — but only ASL alphabet, not WLASL words |
| WLASL official GitHub | https://github.com/dxli94/WLASL | Repo provides PyTorch I3D code + Kinetics weights, but no exported TF.js / ONNX |
| Papers with Code WLASL benchmark | n/a | Same — academic code only |
| HuggingFace search | `wlasl`, `asl recognition`, `sign language` | A handful of fine-tuning experiments; none packaged for browser deployment |
| TensorFlow Hub (`tfhub.dev`) | sign language | Zero sign-language models published |
| MediaPipe Gesture Recognizer | Official Google docs | Only recognizes 7 hardcoded gestures (thumbs up, peace, etc.); custom training requires GCP |

---

## What I Found That Could Help (But Doesn't Meet Criteria)

### 1. WLASL Official Repo (PyTorch I3D)
- **Repo:** https://github.com/dxli94/WLASL
- **Why rejected:** PyTorch-based, video-sequence input, requires GPU inference. Even if exported to TF.js, the model is ~150 MB and operates on 64-frame video clips — incompatible with our single-frame landmark pipeline.

### 2. Fingerpose Library
- **Repo:** https://github.com/andypotato/fingerpose
- **Capabilities:** Rule-based finger-curl detection from MediaPipe landmarks; supports ASL alphabet
- **Why not used:** Our `asl-classifier.js` already implements equivalent finger-state detection. Adding Fingerpose would be a lateral move, not an upgrade. It does NOT add word-level signs.

### 3. MediaPipe Gesture Recognizer (Google official)
- **Docs:** https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer
- **Capabilities:** 7 prebuilt gestures (thumbs up, thumbs down, victory, etc.)
- **Why not used:** Not ASL-specific; would not meaningfully expand our vocabulary; would conflict with our rule-based ASL letter classifier.

### 4. HandSign Browser Demo
- **Article:** https://dev.to/syauqy/handsign-learn-a-sign-language-with-your-camera-2n5
- **Capabilities:** Demonstrates ASL alphabet classification using TF.js Handpose + Fingerpose
- **Why not used:** Same scope as our existing classifier; no word-level signs.

---

## Why a Drop-In Model Doesn't Exist

WLASL-style word recognition fundamentally requires:

1. **Temporal modeling.** ASL signs unfold over 0.5–2 seconds. A single-frame landmark snapshot loses most of the signal.
2. **Two-hand input.** ~60% of WLASL signs use both hands. Our current pipeline tracks one hand.
3. **Body context.** Many signs are defined relative to the face, chest, or shoulder. MediaPipe Hands alone doesn't give us body position.
4. **Heavy compute.** The state-of-the-art models (I3D, Transformer-based) are 100s of MB and run at ~10 FPS on GPU — too slow for in-browser inference.

For these reasons, every published WLASL benchmark uses server-side PyTorch on GPU. The cost of porting any of them to TF.js for browser use is on the order of weeks of work plus a GPU for training.

---

## Decision

**Stay with rule-based classifier + motion detection** (the work completed in Day 5 of the implementation plan):

- 26 ASL alphabet letters (including newly-added J and Z via motion trajectory analysis)
- Wave-HELLO detection via wrist sweep heuristic
- ILY, YES, WHY and 8 other word signs via static hand shape rules

Production roadmap for real ML integration is documented in `ARCHITECTURE_DESIGN.md` (v2 features). The architecture deliberately keeps recognition behind a single `ASLClassifier.classify()` interface so that when a usable WLASL TF.js model becomes available, the swap will require zero changes elsewhere.

---

## What Could Change This Decision

The search would be worth re-running in 6–12 months. The community is actively working on this problem (Google's Sign Language Research, several university projects). Specifically, the **MediaPipe Holistic** model + **WLASL-2000 fine-tuned MoViNet** combination has shown promise in research papers; if anyone exports that pair to TF.js with a permissive license, integration would be straightforward.

Until then: rule-based + motion is the right pragmatic choice.
