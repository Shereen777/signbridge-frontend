/**
 * Speech Engine
 * Wraps Web Speech API for:
 *  - Text-to-Speech (TTS): speak recognized sign text in chosen language
 *  - Speech-to-Text (STT): transcribe microphone input to text
 */

class SpeechEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.onTranscript = null;       // callback(text, isFinal)
    this.onListeningChange = null;  // callback(isListening)
    this.voices = [];

    // Pre-load voices
    this.loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    this.voices = this.synth.getVoices();
  }

  // ===== Text-to-Speech =====

  speak(text, lang = 'en-US') {
    if (!text || !text.trim()) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find a voice for the selected language
    const voice = this.voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (voice) utterance.voice = voice;

    this.synth.speak(utterance);
    return utterance;
  }

  stopSpeaking() {
    this.synth.cancel();
  }

  // ===== Speech-to-Text =====

  initRecognition(lang = 'en-US') {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported in this browser.');
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = lang;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (this.onTranscript) {
        if (final) this.onTranscript(final, true);
        else if (interim) this.onTranscript(interim, false);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      }
      // Auto-restart on network errors
      if (['network', 'aborted'].includes(event.error) && this.isListening) {
        setTimeout(() => this.startListening(lang), 300);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (this.isListening) {
        try { this.recognition.start(); } catch (e) {}
      } else {
        if (this.onListeningChange) this.onListeningChange(false);
      }
    };

    return true;
  }

  startListening(lang = 'en-US') {
    if (this.isListening) return;

    if (!this.recognition) {
      if (!this.initRecognition(lang)) return;
    }

    this.recognition.lang = lang;
    this.isListening = true;

    try {
      this.recognition.start();
      if (this.onListeningChange) this.onListeningChange(true);
    } catch (e) {
      // Already started
      console.warn('Recognition start error:', e);
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
    if (this.onListeningChange) this.onListeningChange(false);
  }

  setLanguage(lang) {
    const wasListening = this.isListening;
    if (wasListening) this.stopListening();
    if (this.recognition) this.recognition.lang = lang;
    if (wasListening) {
      setTimeout(() => this.startListening(lang), 200);
    }
  }
}

window.SpeechEngine = SpeechEngine;
