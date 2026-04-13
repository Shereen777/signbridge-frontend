/**
 * Sign Recognition Engine
 * Uses MediaPipe Hands for hand landmark detection.
 *
 * Detection strategy (simplified for reliability):
 *   - Unique word shapes (ILY, WHY near face) → detected as WORD immediately
 *   - All other hand shapes → detected as LETTER
 *   - Stabilization: same sign must hold for 6 frames before emitting
 */

class SignRecognitionEngine {
  constructor() {
    this.hands = null;
    this.camera = null;
    this.videoEl = null;
    this.canvasEl = null;
    this.canvasCtx = null;
    this.classifier = new ASLClassifier();

    this.isRunning = false;
    this.onLetterDetected = null;
    this.onWordDetected = null;
    this.onHandDetected = null;

    // Stabilization
    this.currentCandidate = null;
    this.currentType = null;
    this.frameCount = 0;
    this.stableFrames = 6;
    this.lastEmitTime = 0;
    this.cooldownMs = 500;
  }

  async init(videoEl, canvasEl) {
    this.videoEl = videoEl;
    this.canvasEl = canvasEl;
    this.canvasCtx = canvasEl.getContext('2d');

    this.hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6
    });

    this.hands.onResults((results) => this.processResults(results));
    await this.hands.initialize();
  }

  async start() {
    if (this.isRunning) return;
    this.camera = new Camera(this.videoEl, {
      onFrame: async () => {
        if (this.isRunning) await this.hands.send({ image: this.videoEl });
      },
      width: 640,
      height: 480
    });
    await this.camera.start();
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
    if (this.camera) { this.camera.stop(); this.camera = null; }
    if (this.canvasCtx && this.canvasEl) {
      this.canvasCtx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    }
  }

  processResults(results) {
    if (!this.canvasEl || !this.canvasCtx) return;

    this.canvasEl.width = this.videoEl.videoWidth || 640;
    this.canvasEl.height = this.videoEl.videoHeight || 480;
    this.canvasCtx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const lm = results.multiHandLandmarks[0];
      this.drawHand(lm);
      if (this.onHandDetected) this.onHandDetected(true);

      const result = this.classifier.classify(lm);
      if (!result) { this.reset(); return; }

      // Determine what to emit: word if unique match, letter otherwise
      let candidate, type;
      if (result.word && result.word.confidence >= 0.8) {
        candidate = result.word.word;
        type = 'word';
      } else if (result.letter) {
        candidate = result.letter.letter;
        type = 'letter';
      } else {
        this.reset();
        return;
      }

      // Stabilize
      if (candidate === this.currentCandidate && type === this.currentType) {
        this.frameCount++;
      } else {
        this.currentCandidate = candidate;
        this.currentType = type;
        this.frameCount = 1;
      }

      // Show what's being detected on the overlay
      this.drawDetectionLabel(candidate, type, this.frameCount / this.stableFrames);

      const now = Date.now();
      if (this.frameCount >= this.stableFrames && (now - this.lastEmitTime) > this.cooldownMs) {
        this.lastEmitTime = now;
        this.frameCount = 0;

        if (type === 'word' && this.onWordDetected) {
          this.onWordDetected(candidate, result.word.confidence);
        } else if (type === 'letter' && this.onLetterDetected) {
          this.onLetterDetected(candidate, result.letter.confidence);
        }
      }
    } else {
      if (this.onHandDetected) this.onHandDetected(false);
      this.reset();
    }
  }

  reset() {
    this.currentCandidate = null;
    this.currentType = null;
    this.frameCount = 0;
  }

  drawDetectionLabel(candidate, type, progress) {
    const ctx = this.canvasCtx;
    const w = this.canvasEl.width;

    // Background pill
    const label = type === 'word' ? candidate : candidate;
    const color = type === 'word' ? '#F59E0B' : '#FF6B35';

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(w - 110, 10, 100, 36, 8);
    ctx.fill();

    // Progress bar
    const barWidth = Math.min(1, progress) * 96;
    ctx.fillStyle = color + '40';
    ctx.beginPath();
    ctx.roundRect(w - 108, 12, 96, 32, 6);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(w - 108, 12, barWidth, 32, 6);
    ctx.fill();

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, w - 60, 28);
  }

  drawHand(landmarks) {
    const ctx = this.canvasCtx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;

    const connections = [
      [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],[0,17]
    ];

    ctx.strokeStyle = 'rgba(220,38,38,0.7)';
    ctx.lineWidth = 3;
    for (const [i, j] of connections) {
      ctx.beginPath();
      ctx.moveTo(landmarks[i].x * w, landmarks[i].y * h);
      ctx.lineTo(landmarks[j].x * w, landmarks[j].y * h);
      ctx.stroke();
    }

    for (let i = 0; i < landmarks.length; i++) {
      ctx.beginPath();
      ctx.arc(landmarks[i].x * w, landmarks[i].y * h, 4, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#F59E0B' : [4,8,12,16,20].includes(i) ? '#EF4444' : '#FF6B35';
      ctx.fill();
    }
  }
}

window.SignRecognitionEngine = SignRecognitionEngine;
