/**
 * KALPA - Narration Engine
 * Pluggable TTS architecture (Web Speech API by default, ready for ElevenLabs/OpenAI),
 * script-based playback by chapter, mode selection, and audio ducking coordination.
 */

import scriptData from './script.json';

class WebSpeechAdapter {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.rate = 0.88; // calm, deliberate pacing
    this.pitch = 0.95;

    if (this.synth) {
      this._selectVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this._selectVoice();
      }
    }
  }

  _selectVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prefer warm, deep English voice
    this.voice = voices.find(v => /Natural|Google UK English Male|Daniel|Guy|George|Alex/i.test(v.name)) ||
                 voices.find(v => v.lang.startsWith('en')) ||
                 voices[0];
  }

  speak(text, onStart, onEnd) {
    if (!this.synth) {
      if (onStart) onStart();
      setTimeout(() => { if (onEnd) onEnd(); }, 3000);
      return;
    }

    this.synth.cancel(); // cancel pending
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    utterance.onstart = () => { if (onStart) onStart(); };
    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = (e) => {
      console.warn('[NarrationEngine] TTS error:', e);
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export class NarrationEngine {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.script = scriptData;
    this.adapter = new WebSpeechAdapter();
    this.mode = 'blended'; // 'science' | 'purana' | 'blended'
    this.activeTimeouts = [];
    this.onSubtitleUpdate = null;
    this.currentChapterId = null;
  }

  setMode(mode) {
    this.mode = mode;
    console.log(`[NarrationEngine] Mode set to: ${mode}`);
  }

  setAdapter(adapter) {
    this.adapter = adapter;
  }

  setSubtitleCallback(cb) {
    this.onSubtitleUpdate = cb;
  }

  /**
   * Play narration cues for a given chapter
   */
  playChapter(chapterId) {
    this.stop();
    this.currentChapterId = chapterId;

    const chapterData = this.script.chapters[chapterId.toString()];
    if (!chapterData) return;

    const cues = chapterData[this.mode] || chapterData['blended'] || [];

    cues.forEach((cue) => {
      const delayMs = Math.max(0, cue.time * 1000);
      const timer = setTimeout(() => {
        this._speakCue(cue.text);
      }, delayMs);
      this.activeTimeouts.push(timer);
    });
  }

  _speakCue(text) {
    // Notify subtitles
    if (this.onSubtitleUpdate) {
      this.onSubtitleUpdate(text, true);
    }

    // Duck ambient music
    if (this.audioEngine) {
      this.audioEngine.setDucking(true);
    }

    this.adapter.speak(
      text,
      () => {},
      () => {
        // Unduck ambient music after speech finishes
        if (this.audioEngine) {
          this.audioEngine.setDucking(false);
        }
        // Subtitle stay time before fading
        setTimeout(() => {
          if (this.onSubtitleUpdate) {
            this.onSubtitleUpdate('', false);
          }
        }, 1200);
      }
    );
  }

  stop() {
    this.activeTimeouts.forEach(t => clearTimeout(t));
    this.activeTimeouts = [];
    if (this.adapter) this.adapter.stop();
    if (this.audioEngine) this.audioEngine.setDucking(false);
    if (this.onSubtitleUpdate) this.onSubtitleUpdate('', false);
  }
}
