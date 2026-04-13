/**
 * Sign Display Engine
 * Renders ASL fingerspelling animations on a canvas.
 * Each letter is drawn as a stylized hand diagram showing the correct hand shape.
 * Animates through letters of input text with configurable speed.
 */

// Polyfill for CanvasRenderingContext2D.roundRect (Safari < 16, older browsers)
if (typeof CanvasRenderingContext2D !== 'undefined' &&
    !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const radius = typeof r === 'number' ? r : (Array.isArray(r) ? r[0] : 0);
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.arcTo(x + w, y, x + w, y + radius, radius);
    this.lineTo(x + w, y + h - radius);
    this.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    this.lineTo(x + radius, y + h);
    this.arcTo(x, y + h, x, y + h - radius, radius);
    this.lineTo(x, y + radius);
    this.arcTo(x, y, x + radius, y, radius);
    this.closePath();
  };
}

class SignDisplayEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isPlaying = false;
    this.currentText = '';
    this.currentIndex = 0;
    this.speed = 800; // ms per letter
    this.timer = null;
    this.onLetterChange = null; // callback(letter, index, total)

    // Hand drawing parameters
    this.palmCenterX = 200;
    this.palmCenterY = 220;
    this.scale = 1;

    // Video element for WLASL clips (defined in HTML)
    this.videoEl = document.getElementById('sign-video') || null;
    this.videoPlayId = 0; // unique ID per playback to prevent stale callbacks

    this.resizeCanvas();
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (parent) {
      const size = Math.min(parent.clientWidth, parent.clientHeight, 500);
      this.canvas.width = 400;
      this.canvas.height = 400;
      this.palmCenterX = 200;
      this.palmCenterY = 230;
    }
  }

  setSpeed(ms) {
    this.speed = ms;
  }

  // Play the full text as sign language animation (word-aware)
  async play(text) {
    this.stop();
    this.currentText = text;
    this.tokens = (typeof tokenizeForASL === 'function')
      ? tokenizeForASL(text)
      : [{ type: 'fingerspell', text: text }];
    this.tokenIndex = 0;
    this.letterIndex = 0;
    this.isPlaying = true;
    this.totalSteps = this.tokens.reduce((sum, t) =>
      sum + (t.type === 'word' ? 1 : t.text.length), 0);
    this.currentStep = 0;

    this.animateNext();
  }

  animateNext() {
    if (!this.isPlaying || this.tokenIndex >= this.tokens.length) {
      this.isPlaying = false;
      return;
    }

    const token = this.tokens[this.tokenIndex];

    if (token.type === 'word') {
      // Try video first, then canvas fallback
      const videoUrl = (typeof getSignVideoUrl === 'function') ? getSignVideoUrl(token.text) : null;

      if (videoUrl && this.videoEl) {
        this.playVideo(videoUrl, () => {
          this.tokenIndex++;
          this.letterIndex = 0;
          this.currentStep++;
          this.animateNext();
        });
        if (this.onLetterChange) {
          this.onLetterChange(token.sign.label + ' (video)', this.currentStep, this.totalSteps);
        }
        return;
      }

      // Canvas fallback — make sure canvas is visible, video hidden
      this.canvas.style.display = '';
      if (this.videoEl) this.videoEl.style.display = 'none';
      this.drawWordSign(token.sign);
      if (this.onLetterChange) {
        this.onLetterChange(token.sign.label, this.currentStep, this.totalSteps);
      }
      this.currentStep++;
      this.tokenIndex++;
      this.letterIndex = 0;
      this.timer = setTimeout(() => this.animateNext(), this.speed * 2);
    } else {
      // Fingerspell letter by letter — ensure canvas visible
      this.canvas.style.display = '';
      if (this.videoEl) this.videoEl.style.display = 'none';
      const letter = token.text[this.letterIndex].toUpperCase();
      this.drawSign(letter);
      // Show label indicating fingerspelling mode
      const ctx = this.ctx;
      ctx.fillStyle = '#FF6B35';
      ctx.font = '13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Fingerspelling: "${token.text}"`, 200, 390);

      if (this.onLetterChange) {
        this.onLetterChange(letter, this.currentStep, this.totalSteps);
      }
      this.currentStep++;
      this.letterIndex++;
      if (this.letterIndex >= token.text.length) {
        this.tokenIndex++;
        this.letterIndex = 0;
      }
      this.timer = setTimeout(() => this.animateNext(), this.speed);
    }
  }

  // Video playback — each call gets a unique ID to prevent stale callbacks
  playVideo(url, onDone) {
    if (!this.videoEl) { onDone(); return; }

    // Increment play ID — any callback from a previous play is ignored
    this.videoPlayId++;
    const myId = this.videoPlayId;
    let finished = false;

    const done = () => {
      // Only act if this is still the current playback
      if (finished || myId !== this.videoPlayId) return;
      finished = true;
      clearTimeout(safetyTimer);
      this.videoEl.onended = null;
      this.videoEl.onerror = null;
      this.videoEl.pause();
      this.videoEl.removeAttribute('src');
      this.videoEl.style.display = 'none';
      this.canvas.style.display = '';
      onDone();
    };

    // Safety timeout — 5s max
    const safetyTimer = setTimeout(done, 5000);

    this.videoEl.onended = done;
    this.videoEl.onerror = done;

    this.canvas.style.display = 'none';
    this.videoEl.style.display = 'block';
    this.videoEl.muted = true;
    this.videoEl.src = url;
    this.videoEl.load();
    this.videoEl.play().catch(done);
  }

  stop() {
    this.isPlaying = false;
    this.videoPlayId++; // invalidate any pending video callbacks
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.videoEl) {
      this.videoEl.pause();
      this.videoEl.removeAttribute('src');
      this.videoEl.onended = null;
      this.videoEl.onerror = null;
      this.videoEl.style.display = 'none';
    }
    this.canvas.style.display = '';
  }

  replay() {
    if (this.currentText) {
      this.play(this.currentText);
    }
  }

  // ===== Word-Level Sign Drawing =====
  // Uses a clean layout: person silhouette (left) + large hand close-up (right)

  drawWordSign(sign) {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Background
    ctx.fillStyle = '#F7F7FB';
    ctx.fillRect(0, 0, W, H);

    const disp = sign.display;
    const hands = disp ? disp.hands : [];
    const handCount = hands.length;

    // ---------- TOP: Word label ----------
    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 30px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(sign.label, W / 2, 34);

    // ---------- LEFT HALF: Person with hand position ----------
    const personCX = 120;
    const personTopY = 52;
    this.drawPerson(personCX, personTopY, hands, disp ? disp.motion : 'none');

    // ---------- RIGHT HALF: Large hand close-up ----------
    if (handCount > 0) {
      this.drawLargeHand(280, 185, hands[0]);
      if (handCount > 1) {
        // Draw second hand smaller below
        this.drawLargeHand(280, 320, hands[1], 0.6);
      }
    }

    // ---------- BOTTOM: Description ----------
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    // Word-wrap description
    const words = sign.description.split(' ');
    let line = '';
    let lineY = H - 28;
    const lines = [];
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > W - 30) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    // Draw from bottom up
    for (let i = lines.length - 1; i >= 0; i--) {
      ctx.fillText(lines[i], W / 2, lineY);
      lineY -= 18;
    }

    // Motion label
    if (disp && disp.motion && disp.motion !== 'none') {
      ctx.fillStyle = '#FF6B35';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'left';
      const motionLabel = disp.motion.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      ctx.fillText('Motion: ' + motionLabel, 10, H - 4);
    }
  }

  // Draw a person silhouette with highlighted hand positions
  drawPerson(cx, topY, hands, motion) {
    const ctx = this.ctx;

    // --- Body (clean, thick stroke) ---
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#D0D0DD';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const headR = 20;
    const headCY = topY + headR;
    const neckBottom = headCY + headR + 8;
    const shoulderY = neckBottom + 5;
    const shoulderW = 45;
    const torsoBottom = shoulderY + 110;

    // Head
    ctx.beginPath();
    ctx.arc(cx, headCY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Simple face
    ctx.fillStyle = '#8E8EA9';
    ctx.beginPath(); ctx.arc(cx - 7, headCY - 3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 7, headCY - 3, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8E8EA9'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 5, headCY + 8); ctx.lineTo(cx + 5, headCY + 8); ctx.stroke();

    // Body outline
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#D0D0DD';

    // Neck
    ctx.beginPath();
    ctx.moveTo(cx - 7, headCY + headR);
    ctx.lineTo(cx - 7, neckBottom);
    ctx.lineTo(cx + 7, neckBottom);
    ctx.lineTo(cx + 7, headCY + headR);
    ctx.fill(); ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(cx - shoulderW, shoulderY);
    ctx.lineTo(cx + shoulderW, shoulderY);
    ctx.lineTo(cx + shoulderW - 5, torsoBottom);
    ctx.lineTo(cx - shoulderW + 5, torsoBottom);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Arms (default down position)
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#D0D0DD';
    // Left arm
    ctx.beginPath();
    ctx.moveTo(cx - shoulderW, shoulderY + 5);
    ctx.lineTo(cx - shoulderW - 15, torsoBottom - 10);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(cx + shoulderW, shoulderY + 5);
    ctx.lineTo(cx + shoulderW + 15, torsoBottom - 10);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#475569';

    // --- Draw hands as highlighted circles at the sign position ---
    if (hands && hands.length > 0) {
      for (const hand of hands) {
        const hx = cx - 60 + hand.posX * 150; // map 0-1 to person area
        const hy = topY + hand.posY * 280;

        // Arm line from shoulder to hand position
        const armStartX = hand.side === 'left' ? cx - shoulderW : cx + shoulderW;
        ctx.strokeStyle = '#818CF8';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(armStartX, shoulderY + 5);
        // Mid-elbow
        const elbowX = (armStartX + hx) / 2;
        const elbowY = Math.max(shoulderY + 30, (shoulderY + hy) / 2 + 15);
        ctx.quadraticCurveTo(elbowX, elbowY, hx, hy);
        ctx.stroke();

        // Hand circle (bright, highlighted)
        ctx.fillStyle = '#FCD9B6';
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hx, hy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glow effect
        ctx.strokeStyle = 'rgba(245,158,11,0.3)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(hx, hy, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Motion arrow
        if (motion && motion !== 'none') {
          this.drawMotionArrow(hx, hy, motion);
        }
      }
    }
  }

  // Draw a large clear hand shape (zoomed in)
  drawLargeHand(cx, cy, hand, scl) {
    const ctx = this.ctx;
    const scale = scl || 1;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const states = hand.fingers || ['extended','extended','extended','extended'];
    const thumbState = hand.thumb || 'extended';

    // Palm
    ctx.fillStyle = '#FCD9B6';
    ctx.strokeStyle = '#C9956A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 42, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wrist
    ctx.beginPath();
    ctx.moveTo(-30, 42);
    ctx.lineTo(30, 42);
    ctx.lineTo(26, 80);
    ctx.lineTo(-26, 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fingers — drawn large and clear
    const fingerData = [
      { angle: -0.28, len: 68, baseX: -22, baseY: -44, label: 'I' },
      { angle: -0.1,  len: 76, baseX: -7,  baseY: -50, label: 'M' },
      { angle: 0.08,  len: 70, baseX: 10,  baseY: -48, label: 'R' },
      { angle: 0.25,  len: 56, baseX: 24,  baseY: -40, label: 'P' },
    ];

    for (let i = 0; i < 4; i++) {
      const fd = fingerData[i];
      this.drawClearFinger(fd.baseX, fd.baseY, fd.angle, fd.len, states[i]);
    }

    // Thumb
    this.drawClearThumb(thumbState);

    // Finger state labels (small colored dots)
    for (let i = 0; i < 4; i++) {
      const fd = fingerData[i];
      const color = states[i] === 'extended' ? '#FF6B35' :
                    states[i] === 'curled' ? '#EF4444' : '#FF6B35';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(fd.baseX, fd.baseY + 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Thumb dot
    const thumbColor = thumbState === 'extended' ? '#FF6B35' :
                       thumbState === 'curled' ? '#EF4444' : '#FF6B35';
    ctx.fillStyle = thumbColor;
    ctx.beginPath();
    ctx.arc(-38, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Legend (tiny)
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FF6B35'; ctx.fillText('● open', 50, 50);
    ctx.fillStyle = '#FF6B35'; ctx.fillText('● half', 50, 62);
    ctx.fillStyle = '#EF4444'; ctx.fillText('● closed', 50, 74);

    ctx.restore();
  }

  drawClearFinger(baseX, baseY, angle, length, state) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(angle);

    const w = 14;
    ctx.fillStyle = '#FCD9B6';
    ctx.strokeStyle = '#C9956A';
    ctx.lineWidth = 2;

    if (state === 'extended') {
      // Three straight segments
      for (let i = 0; i < 3; i++) {
        const segLen = length / 3;
        const y = -i * segLen;
        ctx.beginPath();
        ctx.roundRect(-w/2, y - segLen, w, segLen + 1, 5);
        ctx.fill();
        ctx.stroke();
        // Joint line
        if (i > 0) {
          ctx.strokeStyle = '#B8834A';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-w/2 + 2, y);
          ctx.lineTo(w/2 - 2, y);
          ctx.stroke();
          ctx.strokeStyle = '#C9956A';
          ctx.lineWidth = 2;
        }
      }
      // Rounded tip
      ctx.beginPath();
      ctx.ellipse(0, -length, w/2, w/3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (state === 'curled') {
      // First segment up
      const seg = length * 0.32;
      ctx.beginPath();
      ctx.roundRect(-w/2, -seg, w, seg, 5);
      ctx.fill(); ctx.stroke();
      // Curl over
      ctx.save();
      ctx.translate(0, -seg);
      ctx.rotate(Math.PI * 0.55);
      ctx.beginPath();
      ctx.roundRect(-w/2, -seg * 0.7, w, seg * 0.7, 5);
      ctx.fill(); ctx.stroke();
      // Tip curled under
      ctx.save();
      ctx.translate(0, -seg * 0.65);
      ctx.rotate(Math.PI * 0.3);
      ctx.beginPath();
      ctx.roundRect(-w/2, -seg * 0.4, w, seg * 0.4, 4);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      ctx.restore();
    } else {
      // Half bent
      const seg = length * 0.5;
      ctx.beginPath();
      ctx.roundRect(-w/2, -seg, w, seg, 5);
      ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.translate(0, -seg);
      ctx.rotate(Math.PI * 0.28);
      ctx.beginPath();
      ctx.roundRect(-w/2, -seg * 0.55, w, seg * 0.55, 5);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -seg * 0.55, w/2, w/3, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  drawClearThumb(state) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-38, -12);
    ctx.rotate(-1.0);

    const w = 16;
    ctx.fillStyle = '#FCD9B6';
    ctx.strokeStyle = '#C9956A';
    ctx.lineWidth = 2;

    if (state === 'extended') {
      ctx.beginPath();
      ctx.roundRect(-w/2, -45, w, 45, 6);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -45, w/2, w/3, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (state === 'curled') {
      ctx.beginPath();
      ctx.roundRect(-w/2, -18, w, 18, 6);
      ctx.fill(); ctx.stroke();
      ctx.save();
      ctx.translate(0, -16);
      ctx.rotate(Math.PI * 0.4);
      ctx.beginPath();
      ctx.roundRect(-w/2, -12, w, 12, 5);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    } else {
      // half / across
      ctx.beginPath();
      ctx.roundRect(-w/2, -30, w, 30, 6);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -30, w/2, w/3, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // Draw motion arrow near hand position
  drawMotionArrow(x, y, motion) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#FF6B35';
    ctx.fillStyle = '#FF6B35';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 3]);

    const len = 28;
    let ex = x, ey = y;

    if (motion.includes('forward') || motion.includes('out') || motion.includes('away')) {
      ex = x + len; ey = y;
    } else if (motion.includes('down') || motion.includes('drop') || motion.includes('chin')) {
      ex = x; ey = y + len;
    } else if (motion.includes('up') || motion.includes('lift') || motion.includes('flick')) {
      ex = x; ey = y - len;
    } else if (motion.includes('circle') || motion.includes('wave')) {
      ctx.beginPath();
      ctx.arc(x + 22, y, 12, 0, Math.PI * 1.4);
      ctx.stroke();
      ctx.setLineDash([]);
      // arrowhead
      ctx.beginPath();
      ctx.moveTo(x + 15, y - 10); ctx.lineTo(x + 11, y - 18); ctx.lineTo(x + 21, y - 14);
      ctx.fill();
      return;
    } else if (motion.includes('pull') || motion.includes('toward') || motion.includes('beckon')) {
      ex = x - len; ey = y;
    } else if (motion.includes('tap') || motion.includes('nod')) {
      // Double short arrows
      ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x, y + 30); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x - 4, y + 25); ctx.lineTo(x + 4, y + 25); ctx.fill();
      return;
    } else {
      ctx.setLineDash([]); return;
    }

    // Draw line + arrowhead
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
    const dx = ex - x, dy = ey - y;
    const d = Math.sqrt(dx*dx + dy*dy);
    const ux = dx/d, uy = dy/d;
    const s = 8;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - s*ux + s*uy*0.5, ey - s*uy - s*ux*0.5);
    ctx.lineTo(ex - s*ux - s*uy*0.5, ey - s*uy + s*ux*0.5);
    ctx.fill();
  }

  // ===== Fingerspelling Drawing System =====

  drawSign(letter) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.fillStyle = '#F7F7FB';
    ctx.fillRect(0, 0, w, h);

    if (letter === ' ') {
      this.drawSpace();
      return;
    }

    if (!/[A-Z]/.test(letter)) {
      this.drawUnknown(letter);
      return;
    }

    // Draw the hand shape for this letter
    const handPoses = this.getHandPose(letter);
    this.drawHandFromPose(handPoses);

    // Draw letter label
    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(letter, w / 2, 40);
  }

  drawSpace() {
    const ctx = this.ctx;
    ctx.fillStyle = '#8E8EA9';
    ctx.font = '24px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('[ SPACE ]', 200, 200);
  }

  drawUnknown(char) {
    const ctx = this.ctx;
    ctx.fillStyle = '#8E8EA9';
    ctx.font = '20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`"${char}" — no sign`, 200, 200);
  }

  // Draw a hand from finger pose data
  drawHandFromPose(pose) {
    const ctx = this.ctx;
    const cx = this.palmCenterX;
    const cy = this.palmCenterY;

    // Draw palm
    ctx.fillStyle = '#FCD9B6';
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 55, 65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw wrist
    ctx.fillStyle = '#FCD9B6';
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy + 55);
    ctx.lineTo(cx + 40, cy + 55);
    ctx.lineTo(cx + 35, cy + 120);
    ctx.lineTo(cx - 35, cy + 120);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw each finger
    for (const finger of pose.fingers) {
      this.drawFinger(finger);
    }

    // Draw thumb
    if (pose.thumb) {
      this.drawThumb(pose.thumb);
    }
  }

  drawFinger(finger) {
    const ctx = this.ctx;
    const { startX, startY, angle, length, curl, width } = finger;

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);

    const segLen = length / 3;
    const w = width || 14;

    ctx.fillStyle = '#FCD9B6';
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    if (curl === 'extended') {
      // Straight finger — 3 segments
      for (let i = 0; i < 3; i++) {
        const y = -i * segLen;
        ctx.beginPath();
        ctx.roundRect(-w / 2, y - segLen, w, segLen + 2, 4);
        ctx.fill();
        ctx.stroke();
      }
      // Fingertip
      ctx.beginPath();
      ctx.ellipse(0, -length, w / 2.2, w / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (curl === 'curled') {
      // Curled finger — arc back toward palm
      ctx.beginPath();
      ctx.roundRect(-w / 2, -segLen * 1.2, w, segLen * 1.2, 4);
      ctx.fill();
      ctx.stroke();

      // Curled part
      ctx.save();
      ctx.translate(0, -segLen * 1.1);
      ctx.rotate(Math.PI * 0.5);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -segLen * 0.8, w, segLen * 0.8, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (curl === 'half') {
      // Half bent
      ctx.beginPath();
      ctx.roundRect(-w / 2, -segLen * 1.8, w, segLen * 1.8, 4);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(0, -segLen * 1.7);
      ctx.rotate(Math.PI * 0.3);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -segLen * 0.9, w, segLen * 0.9, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  drawThumb(thumb) {
    const ctx = this.ctx;
    const { startX, startY, angle, length, curl, width } = thumb;

    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);

    const segLen = length / 2;
    const w = width || 16;

    ctx.fillStyle = '#FCD9B6';
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 1.5;

    if (curl === 'extended') {
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.roundRect(-w / 2, -(i + 1) * segLen, w, segLen + 2, 5);
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.ellipse(0, -length, w / 2.2, w / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (curl === 'across') {
      ctx.beginPath();
      ctx.roundRect(-w / 2, -segLen * 1.2, w, segLen * 1.2, 5);
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.translate(0, -segLen * 1.1);
      ctx.rotate(-Math.PI * 0.35);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -segLen * 0.8, w, segLen * 0.8, 5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (curl === 'curled') {
      ctx.beginPath();
      ctx.roundRect(-w / 2, -segLen * 0.9, w, segLen * 0.9, 5);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // ===== Hand Pose Definitions for ASL Alphabet =====

  getHandPose(letter) {
    const cx = this.palmCenterX;
    const cy = this.palmCenterY;

    // Default: all fingers extended
    const mkFinger = (startX, startY, angle, length, curl, width) =>
      ({ startX, startY, angle, length, curl: curl || 'extended', width: width || 14 });

    // Finger base positions (on top of palm)
    const indexBase = { x: cx - 30, y: cy - 58 };
    const middleBase = { x: cx - 10, y: cy - 64 };
    const ringBase = { x: cx + 12, y: cy - 60 };
    const pinkyBase = { x: cx + 32, y: cy - 52 };
    const thumbBase = { x: cx - 50, y: cy - 20 };

    const poses = {
      A: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 70, 'curled'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.9, 55, 'extended', 16)
      },
      B: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.08, 80, 'extended'),
          mkFinger(middleBase.x, middleBase.y, -0.02, 85, 'extended'),
          mkFinger(ringBase.x, ringBase.y, 0.04, 78, 'extended'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.12, 68, 'extended'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 50, 'across', 16)
      },
      C: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.3, 65, 'half'),
          mkFinger(middleBase.x, middleBase.y, -0.1, 70, 'half'),
          mkFinger(ringBase.x, ringBase.y, 0.1, 65, 'half'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.3, 55, 'half'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.8, 50, 'extended', 16)
      },
      D: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 82, 'extended'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'across', 16)
      },
      E: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 70, 'curled'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 48, 'across', 16)
      },
      F: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.2, 60, 'half'),
          mkFinger(middleBase.x, middleBase.y, -0.02, 85, 'extended'),
          mkFinger(ringBase.x, ringBase.y, 0.04, 78, 'extended'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.12, 68, 'extended'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.4, 48, 'across', 16)
      },
      G: {
        fingers: [
          mkFinger(indexBase.x - 10, indexBase.y + 10, -1.2, 80, 'extended'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y + 10, -1.3, 50, 'extended', 16)
      },
      H: {
        fingers: [
          mkFinger(indexBase.x - 10, indexBase.y + 10, -1.2, 80, 'extended'),
          mkFinger(middleBase.x - 10, middleBase.y + 10, -1.1, 82, 'extended'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'curled', 16)
      },
      I: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 70, 'curled'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 68, 'extended'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'across', 16)
      },
      J: {
        // J is like I but with a downward motion — show as I with an arc indicator
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 70, 'curled'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 68, 'extended'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'across', 16)
      },
      K: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.15, 82, 'extended'),
          mkFinger(middleBase.x, middleBase.y, 0.15, 80, 'extended'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.5, 50, 'extended', 16)
      },
      L: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 82, 'extended'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -1.3, 55, 'extended', 16)
      },
      M: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 70, 'curled'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x + 20, thumbBase.y + 30, -0.1, 40, 'extended', 16)
      },
      N: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 70, 'curled'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x + 15, thumbBase.y + 20, -0.1, 42, 'extended', 16)
      },
      O: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.25, 55, 'half'),
          mkFinger(middleBase.x, middleBase.y, -0.05, 60, 'half'),
          mkFinger(ringBase.x, ringBase.y, 0.15, 55, 'half'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.3, 48, 'half'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.5, 48, 'across', 16)
      },
      P: {
        // P: like K but pointing down
        fingers: [
          mkFinger(indexBase.x - 15, indexBase.y + 20, -1.5, 78, 'extended'),
          mkFinger(middleBase.x - 10, middleBase.y + 20, -1.2, 75, 'extended'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y + 10, -1.0, 48, 'extended', 16)
      },
      Q: {
        // Q: like G but pointing down
        fingers: [
          mkFinger(indexBase.x - 15, indexBase.y + 20, -1.8, 78, 'extended'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y + 15, -1.5, 48, 'extended', 16)
      },
      R: {
        // R: index and middle crossed
        fingers: [
          mkFinger(indexBase.x + 3, indexBase.y, 0.08, 82, 'extended'),
          mkFinger(middleBase.x - 5, middleBase.y, -0.08, 85, 'extended'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'across', 16)
      },
      S: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 70, 'curled'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 48, 'across', 16)
      },
      T: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 70, 'curled'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x + 10, thumbBase.y - 5, -0.2, 42, 'extended', 16)
      },
      U: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.02, 82, 'extended'),
          mkFinger(middleBase.x, middleBase.y, 0.02, 85, 'extended'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'across', 16)
      },
      V: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.2, 82, 'extended'),
          mkFinger(middleBase.x, middleBase.y, 0.2, 85, 'extended'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'across', 16)
      },
      W: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.2, 80, 'extended'),
          mkFinger(middleBase.x, middleBase.y, 0, 85, 'extended'),
          mkFinger(ringBase.x, ringBase.y, 0.2, 78, 'extended'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'across', 16)
      },
      X: {
        // X: index finger hooked
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 65, 'half'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'across', 16)
      },
      Y: {
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 70, 'curled'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.3, 68, 'extended'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -1.2, 55, 'extended', 16)
      },
      Z: {
        // Z: index traces a Z — show as index pointing with motion indicator
        fingers: [
          mkFinger(indexBase.x, indexBase.y, -0.05, 82, 'extended'),
          mkFinger(middleBase.x, middleBase.y, 0, 75, 'curled'),
          mkFinger(ringBase.x, ringBase.y, 0.05, 70, 'curled'),
          mkFinger(pinkyBase.x, pinkyBase.y, 0.15, 60, 'curled'),
        ],
        thumb: mkFinger(thumbBase.x, thumbBase.y, -0.3, 45, 'across', 16)
      }
    };

    return poses[letter] || poses['A'];
  }

  // Draw a "ready" state
  drawReady() {
    const ctx = this.ctx;
    ctx.fillStyle = '#F7F7FB';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#8E8EA9';
    ctx.font = '22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Speak or type to see', 200, 185);
    ctx.fillText('ASL signs here', 200, 215);
  }
}

window.SignDisplayEngine = SignDisplayEngine;
