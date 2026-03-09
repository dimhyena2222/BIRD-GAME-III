/**
 * ═══════════════════════════════════════════════════════
 *  BIRD GAME 3 — Phonk-Sync Audio Engine
 *
 *  Procedural audio that reacts to the player's Kinetic State.
 *  Speed tiers control which layers are active.
 * ═══════════════════════════════════════════════════════
 */

import {
  PHONK_TIER_AMBIENT,
  PHONK_TIER_COWBELL,
  PHONK_TIER_BASS,
  PHONK_TIER_TERMINAL,
} from '../core/constants.js';

/**
 * AudioTier describes the active sound layers
 */
const AudioTier = {
  SILENCE: 0,
  AMBIENT: 1,   // 0–20 mph: chopped-and-screwed ambient
  COWBELL: 2,   // 40–80 mph: cowbell lead, heavy bass
  BASS: 3,      // 80–100 mph: deep bass, increasing intensity
  TERMINAL: 4,  // 100+ mph: aggressive distortion, wind roar
};

export class PhonkSyncEngine {
  constructor() {
    this.ctx = null;      // AudioContext — created on first user gesture
    this.masterGain = null;
    this.currentTier = AudioTier.SILENCE;

    // Oscillator-based layers (placeholder for real samples)
    this.layers = {};
    this.windNoise = null;
    this.isInitialized = false;

    // Owl Silent Glide flag
    this.silentGlide = false;
  }

  /**
   * Initialize Web Audio (must be called after user gesture)
   */
  init() {
    if (this.isInitialized) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.ctx.destination);

    // ─── Layer: Ambient (slow, chopped-and-screwed drone) ───
    this.layers.ambient = this._createToneLayer(55, 'sine', 0); // Low A drone

    // ─── Layer: Cowbell (mid-frequency percussive feel) ───
    this.layers.cowbell = this._createToneLayer(800, 'square', 0);

    // ─── Layer: Bass (heavy sub) ───
    this.layers.bass = this._createToneLayer(40, 'sawtooth', 0);

    // ─── Layer: Wind Noise ───
    this.windNoise = this._createNoiseNode();
    this.windNoiseGain = this.ctx.createGain();
    this.windNoiseGain.gain.value = 0;
    this.windNoise.connect(this.windNoiseGain);
    this.windNoiseGain.connect(this.masterGain);

    this.isInitialized = true;
  }

  /**
   * Update audio layers based on current speed.
   * @param {number} speedMph — player's current speed in mph
   */
  update(speedMph) {
    if (!this.isInitialized) return;

    // Silent Glide (Owl ability) — suppress wind audio
    const windVolume = this.silentGlide ? 0 : Math.min(1, speedMph / 150);
    this.windNoiseGain.gain.setTargetAtTime(windVolume * 0.3, this.ctx.currentTime, 0.1);

    let targetTier;
    if (speedMph >= PHONK_TIER_TERMINAL) {
      targetTier = AudioTier.TERMINAL;
    } else if (speedMph >= PHONK_TIER_BASS) {
      targetTier = AudioTier.BASS;
    } else if (speedMph >= PHONK_TIER_COWBELL) {
      targetTier = AudioTier.COWBELL;
    } else if (speedMph >= PHONK_TIER_AMBIENT) {
      targetTier = AudioTier.AMBIENT;
    } else {
      targetTier = AudioTier.SILENCE;
    }

    if (targetTier === this.currentTier) return;
    this.currentTier = targetTier;

    const t = this.ctx.currentTime;
    const ramp = 0.3; // transition time

    // Ambient
    const ambVol = targetTier >= AudioTier.AMBIENT ? 0.15 : 0;
    this.layers.ambient.gain.gain.setTargetAtTime(ambVol, t, ramp);

    // Cowbell
    const cowVol = targetTier >= AudioTier.COWBELL ? 0.08 : 0;
    this.layers.cowbell.gain.gain.setTargetAtTime(cowVol, t, ramp);

    // Bass
    const bassVol = targetTier >= AudioTier.BASS ? 0.25 : 0;
    this.layers.bass.gain.gain.setTargetAtTime(bassVol, t, ramp);

    // At terminal tier: add distortion effect (increase master slightly)
    const masterVol = targetTier >= AudioTier.TERMINAL ? 0.6 : 0.4;
    this.masterGain.gain.setTargetAtTime(masterVol, t, ramp);
  }

  // ─── Internal Helpers ─────────────────────────────

  _createToneLayer(freq, type, initialVolume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = initialVolume;
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    return { osc, gain };
  }

  _createNoiseNode() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const node = this.ctx.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    node.start();
    return node;
  }

  /** Mute everything */
  mute() {
    if (this.masterGain) this.masterGain.gain.value = 0;
  }

  /** Unmute */
  unmute() {
    if (this.masterGain) this.masterGain.gain.value = 0.4;
  }
}
