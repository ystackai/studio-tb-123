// AudioManager.js — music loop + SFX, stem-adding on pylon collection
import { DEFAULT_WORLD_BASIS } from './lib/WorldBasis.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.stems = [];      // AudioBuffers or null
    this.sfx = {};        // named SFX AudioBuffers
    this.activeStems = 0;
    this.musicPlaying = false;
    this.musicSource = null;
    this.musicSources = [];
    this._musicStartTime = 0;
    this._musicOffset = 0;
    this.stemGains = [];   // one gain node per stem
  }

  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);
  }

  async loadMusic(path) {
    try {
      const resp = await fetch(path);
      const buf = await resp.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(buf);
      this.musicBuffer = decoded;
      return true;
    } catch (e) {
      console.warn('Music load failed, falling back to synth:', e.message);
      this.musicBuffer = null;
      return false;
    }
  }

  async loadSFX(name, path) {
    try {
      const resp = await fetch(path);
      const buf = await resp.arrayBuffer();
      this.sfx[name] = await this.ctx.decodeAudioData(buf);
      return true;
    } catch (e) {
      console.warn(`SFX ${name} load failed:`, e.message);
      return false;
    }
  }

  startMusic() {
    if (this.musicPlaying || !this.ctx) return;
    if (this.musicBuffer) {
      const offset = this._musicOffset % this.musicBuffer.duration;
      this.musicSource = this.ctx.createBufferSource();
      this.musicSource.buffer = this.musicBuffer;
      this.musicSource.loop = true;
      const bedGain = this.ctx.createGain();
      bedGain.gain.value = 0.22;
      this.musicSource.connect(bedGain).connect(this.musicGain);
      this.musicSource.start(0, offset);

      const bands = [
        { type: 'lowpass', frequency: 190, q: 0.7 },
        { type: 'bandpass', frequency: 650, q: 0.85 },
        { type: 'bandpass', frequency: 1800, q: 0.75 },
        { type: 'highpass', frequency: 3600, q: 0.7 }
      ];
      this.musicSources = [];
      this.stemGains = [];
      bands.forEach((band) => {
        const source = this.ctx.createBufferSource();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        source.buffer = this.musicBuffer;
        source.loop = true;
        filter.type = band.type;
        filter.frequency.value = band.frequency;
        filter.Q.value = band.q;
        gain.gain.value = 0;
        source.connect(filter).connect(gain).connect(this.musicGain);
        source.start(0, offset);
        this.musicSources.push(source);
        this.stemGains.push(gain);
      });
      this._musicStartTime = this.ctx.currentTime;
      this.musicPlaying = true;
    } else {
       // Synthesized fallback — 4-on-the-floor bass
      this._startSynthMusic();
    }
  }

  _startSynthMusic() {
    const now = this.ctx.currentTime;
    const bpm = 128;
    const beatDur = 60 / bpm;
    const totalBeats = 64;
    const kick = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(80, now);
    kick.frequency.exponentialRampToValueAtTime(30, now + 0.05);
    kickGain.gain.setValueAtTime(0.6, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    kick.connect(kickGain);
    kickGain.connect(this.musicGain);
    kick.start(now);
    kick.stop(now + beatDur * totalBeats);
    this.musicPlaying = true;
  }

  stopMusic() {
    if (this.musicSource) {
      this._musicOffset = (this.ctx.currentTime - this._musicStartTime) % this.musicBuffer?.duration || 0;
      this.musicSource.stop();
      this.musicSource.disconnect();
      this.musicSource = null;
    }
    this.musicSources.forEach((source) => {
      try { source.stop(); } catch (_) { /* already stopped */ }
      source.disconnect();
    });
    this.musicSources = [];
    this.stemGains = [];
    this.musicPlaying = false;
  }

  playSFX(name, vol = 1) {
    if (!this.ctx || !this.sfx[name]) {
      this._synthSFX(name, vol);
      return;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.sfx[name];
    const g = this.ctx.createGain();
    g.gain.value = vol * 0.6;
    src.connect(g);
    g.connect(this.sfxGain);
    src.start();
  }

  _synthSFX(name, vol) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const baseVol = vol * 0.4;
    switch (name) {
      case 'movement':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.2);
        g.gain.setValueAtTime(baseVol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        break;
      case 'gate':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.1);
        g.gain.setValueAtTime(baseVol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        break;
      case 'pickup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(990, now + 0.08);
        osc.frequency.setValueAtTime(1320, now + 0.16);
        g.gain.setValueAtTime(baseVol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        break;
      case 'danger':
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.3);
        g.gain.setValueAtTime(baseVol * 0.7, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        break;
      case 'reveal':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
        g.gain.setValueAtTime(baseVol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        break;
      case 'impact':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
        g.gain.setValueAtTime(baseVol * 0.8, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        break;
      default:
        osc.type = 'sine';
        osc.frequency.value = 440;
        g.gain.setValueAtTime(baseVol * 0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    }
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1);
  }

  addStem() {
    this.activeStems = Math.min(this.activeStems + 1, 4);
    const stem = this.stemGains[this.activeStems - 1];
    if (stem && this.ctx) {
      stem.gain.cancelScheduledValues(this.ctx.currentTime);
      stem.gain.linearRampToValueAtTime(0.42, this.ctx.currentTime + 0.35);
    }
    if (this.musicGain) {
      this.musicGain.gain.value = 0.45 + this.activeStems * 0.06;
     }
    return this.activeStems;
  }

  resetStems() {
    this.activeStems = 0;
    if (!this.ctx) return;
    this.stemGains.forEach((stem) => {
      stem.gain.cancelScheduledValues(this.ctx.currentTime);
      stem.gain.setValueAtTime(0, this.ctx.currentTime);
    });
    if (this.musicGain) this.musicGain.gain.value = 0.45;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
     }
  }
}
