/**
 * ASL Classifier
 * Classifies hand landmarks from MediaPipe Hands into ASL letters and words.
 *
 * The recognition engine uses hold-duration to decide:
 *   - Quick sign → letter (fingerspelling)
 *   - Hold 1.5s → word sign
 *
 * This classifier provides both possibilities so the engine can choose.
 */

class ASLClassifier {
  constructor() {
    this.WRIST = 0;
    this.THUMB_CMC = 1; this.THUMB_MCP = 2; this.THUMB_IP = 3; this.THUMB_TIP = 4;
    this.INDEX_MCP = 5; this.INDEX_PIP = 6; this.INDEX_DIP = 7; this.INDEX_TIP = 8;
    this.MIDDLE_MCP = 9; this.MIDDLE_PIP = 10; this.MIDDLE_DIP = 11; this.MIDDLE_TIP = 12;
    this.RING_MCP = 13; this.RING_PIP = 14; this.RING_DIP = 15; this.RING_TIP = 16;
    this.PINKY_MCP = 17; this.PINKY_PIP = 18; this.PINKY_DIP = 19; this.PINKY_TIP = 20;

    this.positionHistory = [];
    this.maxHistory = 15;
  }

  dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + ((a.z || 0) - (b.z || 0)) ** 2);
  }

  angle(a, b, c) {
    const ba = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
    const bc = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };
    const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
    const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
    const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);
    if (magBA === 0 || magBC === 0) return 0;
    return Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC)))) * (180 / Math.PI);
  }

  isExtended(lm, mcp, pip, dip, tip) {
    return this.angle(lm[mcp], lm[pip], lm[dip]) > 140 && this.angle(lm[pip], lm[dip], lm[tip]) > 140;
  }

  isCurled(lm, mcp, pip, dip, tip) {
    return this.angle(lm[mcp], lm[pip], lm[dip]) < 100;
  }

  isThumbOut(lm) {
    return this.dist(lm[this.THUMB_TIP], lm[this.INDEX_MCP]) > this.dist(lm[this.THUMB_MCP], lm[this.INDEX_MCP]) * 0.9;
  }

  isThumbAcross(lm) {
    return this.dist(lm[this.THUMB_TIP], lm[this.MIDDLE_MCP]) < this.dist(lm[this.WRIST], lm[this.MIDDLE_MCP]) * 0.5;
  }

  touching(lm, a, b, thr) { return this.dist(lm[a], lm[b]) < (thr || 0.06); }

  trackPosition(lm) {
    this.positionHistory.push({ x: lm[this.WRIST].x, y: lm[this.WRIST].y, t: Date.now() });
    if (this.positionHistory.length > this.maxHistory) this.positionHistory.shift();
  }

  getFingers(lm) {
    return {
      thumb: this.isThumbOut(lm),
      thumbAcross: this.isThumbAcross(lm),
      index: this.isExtended(lm, 5, 6, 7, 8),
      middle: this.isExtended(lm, 9, 10, 11, 12),
      ring: this.isExtended(lm, 13, 14, 15, 16),
      pinky: this.isExtended(lm, 17, 18, 19, 20),
      indexCurled: this.isCurled(lm, 5, 6, 7, 8),
      middleCurled: this.isCurled(lm, 9, 10, 11, 12),
      ringCurled: this.isCurled(lm, 13, 14, 15, 16),
      pinkyCurled: this.isCurled(lm, 17, 18, 19, 20),
    };
  }

  /**
   * Main classify — returns { letter, word, handShape } so the
   * recognition engine can decide based on hold duration.
   */
  classify(landmarks) {
    if (!landmarks || landmarks.length < 21) return null;
    this.trackPosition(landmarks);

    const letterResult = this.classifyLetter(landmarks);
    const wordResult = this.classifyWord(landmarks);

    return {
      letter: letterResult,
      word: wordResult,
      handShape: letterResult ? letterResult.letter : null
    };
  }

  // ===== LETTER CLASSIFIER =====
  classifyLetter(lm) {
    const f = this.getFingers(lm);
    const allCurled = f.indexCurled && f.middleCurled && f.ringCurled && f.pinkyCurled;
    const extCount = [f.index, f.middle, f.ring, f.pinky].filter(Boolean).length;

    const idxMidSpread = this.dist(lm[8], lm[12]) > this.dist(lm[5], lm[9]) * 1.3;
    const idxMidClose = this.dist(lm[8], lm[12]) < this.dist(lm[5], lm[9]) * 0.8;

    // Finger pointing direction
    const idxPointsSideways = Math.abs(lm[8].x - lm[5].x) > Math.abs(lm[8].y - lm[5].y);
    const idxPointsUp = Math.abs(lm[8].y - lm[5].y) > Math.abs(lm[8].x - lm[5].x) && lm[8].y < lm[5].y;

    let letter = null, conf = 0;

    // === A: fist, thumb to side (not across) ===
    if (allCurled && f.thumb && !f.thumbAcross) {
      letter = 'A'; conf = 0.88;
    }
    // === B: 4 fingers up, thumb tucked ===
    else if (f.index && f.middle && f.ring && f.pinky && f.thumbAcross) {
      letter = 'B'; conf = 0.88;
    }
    // === C: all fingers half-curved (not extended, not fully curled), thumb out ===
    else if (!f.index && !f.middle && !f.ring && !f.pinky &&
             !f.indexCurled && !f.middleCurled && f.thumb) {
      letter = 'C'; conf = 0.7;
    }
    // === D: index up, thumb+middle touching ===
    else if (f.index && !f.middle && !f.ring && !f.pinky &&
             this.touching(lm, 4, 12, 0.08)) {
      letter = 'D'; conf = 0.8;
    }
    // === E: all curled, thumb across ===
    else if (allCurled && f.thumbAcross) {
      letter = 'E'; conf = 0.78;
    }
    // === F: thumb+index circle, other 3 up ===
    else if (this.touching(lm, 4, 8, 0.07) && f.middle && f.ring && f.pinky) {
      letter = 'F'; conf = 0.85;
    }
    // === G: index pointing sideways, thumb out ===
    else if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb && idxPointsSideways) {
      letter = 'G'; conf = 0.72;
    }
    // === H: index+middle pointing sideways ===
    else if (f.index && f.middle && !f.ring && !f.pinky && idxPointsSideways) {
      letter = 'H'; conf = 0.72;
    }
    // === I: pinky up only ===
    else if (!f.index && !f.middle && !f.ring && f.pinky && !f.thumb) {
      letter = 'I'; conf = 0.85;
    }
    // === K: index+middle spread, thumb between ===
    else if (f.index && f.middle && !f.ring && !f.pinky && idxMidSpread && f.thumb) {
      letter = 'K'; conf = 0.75;
    }
    // === L: index up + thumb out (L-shape), pointing up ===
    else if (f.index && !f.middle && !f.ring && !f.pinky && f.thumb && idxPointsUp) {
      letter = 'L'; conf = 0.85;
    }
    // === M: 3 fingers over thumb (fist variant) ===
    else if (allCurled && !f.thumb && !f.thumbAcross &&
             lm[this.THUMB_TIP].y > lm[this.INDEX_PIP].y) {
      letter = 'M'; conf = 0.6;
    }
    // === N: 2 fingers over thumb (fist variant) ===
    else if (allCurled && !f.thumb &&
             lm[this.THUMB_TIP].y > lm[this.MIDDLE_PIP].y &&
             lm[this.THUMB_TIP].y < lm[this.RING_PIP].y) {
      letter = 'N'; conf = 0.55;
    }
    // === O: fingertips touching thumb in O ===
    else if (this.touching(lm, 4, 8, 0.08) && !f.middle && !f.ring && !f.pinky && !f.index) {
      letter = 'O'; conf = 0.7;
    }
    // === R: index+middle crossed together ===
    else if (f.index && f.middle && !f.ring && !f.pinky && idxMidClose && !f.thumb) {
      letter = 'R'; conf = 0.68;
    }
    // === S: fist, thumb over curled fingers ===
    else if (allCurled && !f.thumb && f.thumbAcross) {
      letter = 'S'; conf = 0.75;
    }
    // === T: thumb between index and middle (fist variant) ===
    else if (allCurled && f.thumb &&
             this.dist(lm[4], lm[6]) < 0.06) {
      letter = 'T'; conf = 0.6;
    }
    // === U: index+middle up together, no thumb ===
    else if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb && idxMidClose) {
      letter = 'U'; conf = 0.8;
    }
    // === V: index+middle spread (peace) ===
    else if (f.index && f.middle && !f.ring && !f.pinky && idxMidSpread && !f.thumb) {
      letter = 'V'; conf = 0.88;
    }
    // === W: index+middle+ring up, spread ===
    else if (f.index && f.middle && f.ring && !f.pinky && !f.thumb) {
      letter = 'W'; conf = 0.82;
    }
    // === X: index hooked (half bent), others curled ===
    else if (!f.index && !f.indexCurled && f.middleCurled && f.ringCurled && f.pinkyCurled && !f.thumb) {
      letter = 'X'; conf = 0.65;
    }
    // === Y: thumb+pinky out, others curled ===
    else if (!f.index && !f.middle && !f.ring && f.pinky && f.thumb) {
      letter = 'Y'; conf = 0.88;
    }
    // === Fallback: index only pointing up ===
    else if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumb && idxPointsUp) {
      letter = 'D'; conf = 0.55;
    }
    // === Open hand (all 5 extended + thumb) = B variant ===
    else if (f.index && f.middle && f.ring && f.pinky && f.thumb) {
      letter = 'B'; conf = 0.6;
    }
    // === 4 fingers no thumb ===
    else if (f.index && f.middle && f.ring && f.pinky && !f.thumb) {
      letter = 'B'; conf = 0.55;
    }
    // === Index up only (any direction) ===
    else if (f.index && !f.middle && !f.ring && !f.pinky) {
      letter = 'D'; conf = 0.5;
    }
    // === Index + middle (any direction) ===
    else if (f.index && f.middle && !f.ring && !f.pinky) {
      letter = 'V'; conf = 0.5;
    }
    // === Fist (any kind) ===
    else if (allCurled) {
      letter = 'S'; conf = 0.5;
    }

    if (!letter) return null;
    return { letter, confidence: conf };
  }

  // ===== WORD CLASSIFIER =====
  // Only returns a word when truly confident. Returns null otherwise.
  classifyWord(lm) {
    const f = this.getFingers(lm);
    const wristY = lm[this.WRIST].y;
    const allCurled = f.indexCurled && f.middleCurled && f.ringCurled && f.pinkyCurled;

    // I LOVE YOU: thumb + index + pinky, middle + ring curled — UNIQUE
    if (f.thumb && f.index && !f.middle && !f.ring && f.pinky &&
        f.middleCurled && f.ringCurled) {
      return { word: 'I LOVE YOU', confidence: 0.92 };
    }

    // YES: fist (all curled), hand in upper/middle frame
    if (allCurled && !f.thumb && wristY < 0.55) {
      return { word: 'YES', confidence: 0.78 };
    }

    // HELLO: all 5 fingers open, hand high (near face, wrist above 30%)
    if (f.thumb && f.index && f.middle && f.ring && f.pinky && wristY < 0.3) {
      return { word: 'HELLO', confidence: 0.82 };
    }

    // WHY: Y-hand (thumb+pinky) near forehead
    if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky && wristY < 0.3) {
      return { word: 'WHY', confidence: 0.85 };
    }

    // THANK YOU: open hand near chin (wrist between 0.25-0.4)
    if (f.index && f.middle && f.ring && f.pinky && f.thumb &&
        wristY >= 0.25 && wristY < 0.4 && lm[12].y < lm[0].y) {
      return { word: 'THANK YOU', confidence: 0.78 };
    }

    // HELP: fist with thumb up (A-hand), mid frame
    if (allCurled && f.thumb && !f.thumbAcross && wristY >= 0.35 && wristY < 0.6) {
      return { word: 'HELP', confidence: 0.72 };
    }

    // NO: index+middle+thumb pinched together
    if (this.touching(lm, 4, 8, 0.08) && this.touching(lm, 4, 12, 0.1) &&
        !f.ring && !f.pinky) {
      return { word: 'NO', confidence: 0.8 };
    }

    // THINK: only index pointing up, near forehead
    if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumb && wristY < 0.25) {
      return { word: 'THINK', confidence: 0.75 };
    }

    // GOOD: open hand, chin area (0.3-0.42), fingertips below wrist (palm up)
    if (f.index && f.middle && f.ring && f.pinky && f.thumb &&
        wristY >= 0.3 && wristY < 0.42 && lm[12].y > lm[0].y) {
      return { word: 'GOOD', confidence: 0.72 };
    }

    // STOP: 4 fingers up no thumb, mid frame
    if (f.index && f.middle && f.ring && f.pinky && !f.thumb &&
        wristY >= 0.35 && wristY < 0.6) {
      return { word: 'STOP', confidence: 0.7 };
    }

    // PLEASE: open hand, chest area (0.4-0.6)
    if (f.index && f.middle && f.ring && f.pinky && f.thumb &&
        wristY >= 0.42 && wristY < 0.6) {
      return { word: 'PLEASE', confidence: 0.68 };
    }

    // No confident word match
    return null;
  }
}

window.ASLClassifier = ASLClassifier;
