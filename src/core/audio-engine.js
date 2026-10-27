/**
 * KALPA - Web Audio Engine
 * Spatial audio, generative ambient soundscapes, procedural synthesis fallbacks,
 * and automatic ducking system during narration.
 */

import { AUDIO_CONFIG } from '../config/settings.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.narrationGain = null;
    this.sfxGain = null;

    // Active synth nodes
    this.omDroneNodes = null;
    this.oceanNoiseNode = null;
    this.isDucked = false;

    this.settings = { ...AUDIO_CONFIG };
  }

  /**
   * Initialize audio context on first user interaction
   */
  async init() {
    if (this.isInitialized) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Ambient bus (duckable)
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.settings.ambientVolume, this.ctx.currentTime);
    this.ambientGain.connect(this.masterGain);

    // Narration bus
    this.narrationGain = this.ctx.createGain();
    this.narrationGain.gain.setValueAtTime(this.settings.narrationVolume, this.ctx.currentTime);
    this.narrationGain.connect(this.masterGain);

    // SFX bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isInitialized = true;
    console.log('[AudioEngine] Initialized with sampleRate:', this.ctx.sampleRate);
  }

  /**
   * Smoothly duck ambient music/drone when narration speaks
   */
  setDucking(active) {
    if (!this.isInitialized || !this.ambientGain) return;
    this.isDucked = active;
    const now = this.ctx.currentTime;
    const targetGain = active
      ? this.settings.ambientVolume * this.settings.duckingLevel
      : this.settings.ambientVolume;

    const rampTime = active ? this.settings.duckingAttack : this.settings.duckingRelease;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.setTargetAtTime(targetGain, now, rampTime * 0.4);
  }

  /**
   * Generative Om Drone (136.1 Hz Earth-year fundamental + celestial harmonics)
   */
  startOmDrone() {
    if (!this.isInitialized || this.omDroneNodes) return;

    const fundamental = 136.1; // Sacred C#3 Earth frequency
    const harmonics = [1, 2, 3, 4, 6];
    const gains = [0.4, 0.25, 0.15, 0.08, 0.04];
    const nodes = [];

    const droneSubBus = this.ctx.createGain();
    droneSubBus.gain.setValueAtTime(0.001, this.ctx.currentTime);
    droneSubBus.gain.linearRampToValueAtTime(0.75, this.ctx.currentTime + 3.0);
    droneSubBus.connect(this.ambientGain);

    // Lowpass filter for smooth warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    droneSubBus.connect(filter);
    filter.connect(this.ambientGain);

    harmonics.forEach((h, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : (idx % 2 === 0 ? 'triangle' : 'sine');
      // Subtle detune for rich celestial chorus
      const detuneCents = (Math.random() - 0.5) * 8;
      osc.frequency.setValueAtTime(fundamental * h, this.ctx.currentTime);
      osc.detune.setValueAtTime(detuneCents, this.ctx.currentTime);

      gain.gain.setValueAtTime(gains[idx], this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(droneSubBus);
      osc.start();
      nodes.push(osc);
    });

    this.omDroneNodes = { nodes, bus: droneSubBus };
  }

  stopOmDrone(fadeSeconds = 2) {
    if (!this.omDroneNodes) return;
    const { nodes, bus } = this.omDroneNodes;
    bus.gain.setValueAtTime(bus.gain.value, this.ctx.currentTime);
    bus.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + fadeSeconds);
    setTimeout(() => {
      nodes.forEach(n => {
        try { n.stop(); } catch {}
      });
      this.omDroneNodes = null;
    }, fadeSeconds * 1000 + 100);
  }

  /**
   * Generative Impact sound for Theia collision
   */
  playImpactSound() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;

    // Sub-bass drop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

    oscGain.gain.setValueAtTime(1.0, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 2.6);

    // Explosive noise burst
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.3));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 1.5);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noiseSource.start(now);
  }

  /**
   * Generative Shankh / Conch Shell call
   */
  playShankhSound() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.8);
    osc.frequency.linearRampToValueAtTime(435, now + 3.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.6);
    gain.gain.linearRampToValueAtTime(0.4, now + 2.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(now);
    osc.stop(now + 4.1);
  }

  setMasterVolume(val) {
    this.settings.masterVolume = THREE.MathUtils.clamp(val, 0, 1);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.settings.masterVolume, this.ctx.currentTime, 0.05);
    }
  }
}
