// Fully procedural audio: ambience, generative island music and sound effects.
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

const DAY_PROG = [
  [60, 64, 67, 72], // C
  [55, 59, 62, 67], // G
  [57, 60, 64, 69], // Am
  [53, 57, 60, 65], // F
];
const NIGHT_PROG = [
  [57, 60, 64, 69], // Am
  [53, 57, 60, 65], // F
  [48, 55, 60, 64], // C
  [55, 59, 62, 67], // G
];
const DAY_SCALE = [60, 62, 64, 67, 69, 72, 74, 76];
const NIGHT_SCALE = [57, 60, 62, 64, 67, 69, 72];

export class AudioSystem {
  constructor(game) {
    this.game = game;
    this.ctx = null;
    this.started = false;
    this.nextBeat = 0;
    this.beat = 0;
  }
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    } catch {
      return;
    }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.connect(c.destination);
    this.musicGain = c.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain = c.createGain();
    this.sfxGain.connect(this.master);
    this.ambGain = c.createGain();
    this.ambGain.connect(this.master);
    this.applyVolumes();

    // shared noise buffer
    const len = c.sampleRate * 2;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02; // brown-ish
      d[i] = last * 3.5;
    }
    this.white = c.createBuffer(1, len, c.sampleRate);
    const wd = this.white.getChannelData(0);
    for (let i = 0; i < len; i++) wd[i] = Math.random() * 2 - 1;

    // ocean waves
    const sea = c.createBufferSource();
    sea.buffer = this.noise;
    sea.loop = true;
    const seaF = c.createBiquadFilter();
    seaF.type = 'lowpass';
    seaF.frequency.value = 500;
    this.seaGain = c.createGain();
    this.seaGain.gain.value = 0.35;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoG = c.createGain();
    lfoG.gain.value = 0.22;
    lfo.connect(lfoG).connect(this.seaGain.gain);
    sea.connect(seaF).connect(this.seaGain).connect(this.ambGain);
    sea.start();
    lfo.start();

    // rain
    const rain = c.createBufferSource();
    rain.buffer = this.white;
    rain.loop = true;
    const rf = c.createBiquadFilter();
    rf.type = 'bandpass';
    rf.frequency.value = 2500;
    rf.Q.value = 0.5;
    this.rainGain = c.createGain();
    this.rainGain.gain.value = 0;
    rain.connect(rf).connect(this.rainGain).connect(this.ambGain);
    rain.start();

    this.nextBeat = c.currentTime + 0.2;
    this.started = true;
  }
  applyVolumes() {
    if (!this.ctx) return;
    const s = this.game.settings;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.master, t, 0.05);
    this.musicGain.gain.setTargetAtTime(s.music * 0.32, t, 0.1);
    this.sfxGain.gain.setTargetAtTime(s.sfx * 0.7, t, 0.05);
    this.ambGain.gain.setTargetAtTime(s.ambient * 0.6, t, 0.1);
  }

  update(dt) {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const g = this.game;
    const night = g.time.isNight();
    const rain = g.weather.rain;
    this.rainGain.gain.setTargetAtTime(rain * 0.3, c.currentTime, 0.5);
    // ambient critters
    this.critterT = (this.critterT ?? 2) - dt;
    if (this.critterT <= 0) {
      this.critterT = night ? 0.5 + Math.random() * 1.2 : 2 + Math.random() * 6;
      if (night) this.cricket();
      else if (rain < 0.3) this.bird();
    }
    // music scheduler (look-ahead)
    const tempo = night ? 70 : 92;
    const spb = 60 / tempo / 2; // eighth notes
    while (this.nextBeat < c.currentTime + 0.25) {
      this.playBeat(this.beat, this.nextBeat, night, spb);
      this.nextBeat += spb;
      this.beat++;
    }
  }

  playBeat(beat, t, night, spb) {
    const prog = night ? NIGHT_PROG : DAY_PROG;
    const bar = Math.floor(beat / 8) % prog.length;
    const pos = beat % 8;
    const chord = prog[bar];
    if (night) {
      // soft marimba arpeggio + occasional bell
      if (pos % 2 === 0) this.marimba(NOTE(chord[(pos / 2) % 4]), t, 0.12);
      if (pos === 0) this.pad(chord.map((n) => NOTE(n - 12)), t, spb * 8, 0.05);
      if (pos === 5 && Math.random() < 0.5) this.bell(NOTE(NIGHT_SCALE[Math.floor(Math.random() * NIGHT_SCALE.length)] + 12), t, 0.05);
    } else {
      // ukulele strum pattern: D - D U - U D U
      const strum = [1, 0, 1, 1, 0, 1, 1, 1][pos];
      if (strum) chord.forEach((n, i) => this.pluck(NOTE(n), t + i * 0.012, pos % 2 ? 0.035 : 0.05));
      if (pos === 0) this.bass(NOTE(chord[0] - 24), t, 0.18);
      if (pos === 4) this.bass(NOTE(chord[2] - 24), t, 0.12);
      // little melody
      if ((pos === 2 || pos === 6) && Math.random() < 0.55) this.marimba(NOTE(DAY_SCALE[Math.floor(Math.random() * DAY_SCALE.length)] + 12), t, 0.06);
    }
  }

  env(gain, t, a, peak, decay) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + a);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
  }
  pluck(freq, t, vol) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3000, t);
    f.frequency.exponentialRampToValueAtTime(600, t + 0.3);
    const g = c.createGain();
    this.env(g, t, 0.005, vol, 0.5);
    o.connect(f).connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.6);
  }
  marimba(freq, t, vol) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const o2 = c.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = freq * 4;
    const g = c.createGain();
    const g2 = c.createGain();
    this.env(g, t, 0.004, vol, 0.7);
    this.env(g2, t, 0.002, vol * 0.25, 0.08);
    o.connect(g).connect(this.musicGain);
    o2.connect(g2).connect(this.musicGain);
    o.start(t);
    o2.start(t);
    o.stop(t + 0.8);
    o2.stop(t + 0.2);
  }
  bell(freq, t, vol) {
    const c = this.ctx;
    [1, 2.76, 5.4].forEach((m, i) => {
      const o = c.createOscillator();
      o.frequency.value = freq * m;
      const g = c.createGain();
      this.env(g, t, 0.003, vol / (i + 1), 1.8 / (i + 1));
      o.connect(g).connect(this.musicGain);
      o.start(t);
      o.stop(t + 2);
    });
  }
  bass(freq, t, vol) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = c.createGain();
    this.env(g, t, 0.01, vol, 0.35);
    o.connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + 0.5);
  }
  pad(freqs, t, dur, vol) {
    const c = this.ctx;
    for (const fr of freqs) {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = fr;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol / freqs.length, t + dur * 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.musicGain);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }
  cricket() {
    const c = this.ctx;
    const t = c.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator();
      o.frequency.value = 4200 + Math.random() * 300;
      const g = c.createGain();
      this.env(g, t + i * 0.06, 0.005, 0.015, 0.04);
      o.connect(g).connect(this.ambGain);
      o.start(t + i * 0.06);
      o.stop(t + i * 0.06 + 0.06);
    }
  }
  bird() {
    const c = this.ctx;
    const t = c.currentTime;
    const n = 2 + Math.floor(Math.random() * 3);
    const base = 2200 + Math.random() * 1200;
    for (let i = 0; i < n; i++) {
      const o = c.createOscillator();
      const tt = t + i * 0.13;
      o.frequency.setValueAtTime(base, tt);
      o.frequency.exponentialRampToValueAtTime(base * 1.4, tt + 0.07);
      const g = c.createGain();
      this.env(g, tt, 0.01, 0.025, 0.08);
      o.connect(g).connect(this.ambGain);
      o.start(tt);
      o.stop(tt + 0.12);
    }
  }

  tone(type, f1, f2, dur, vol, delay = 0) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain();
    this.env(g, t, 0.005, vol, dur);
    o.connect(g).connect(this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  noiseBurst(dur, vol, freq = 1200, type = 'bandpass', delay = 0) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.white;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = c.createGain();
    this.env(g, t, 0.005, vol, dur);
    s.connect(f).connect(g).connect(this.sfxGain);
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }
  arp(notes, step = 0.07, vol = 0.12, type = 'triangle') {
    notes.forEach((n, i) => this.tone(type, NOTE(n), null, 0.25, vol, i * step));
  }

  sfx(name) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    switch (name) {
      case 'click': return this.tone('triangle', 900, 700, 0.05, 0.08);
      case 'open': return this.tone('triangle', 500, 900, 0.09, 0.08);
      case 'close': return this.tone('triangle', 800, 450, 0.08, 0.07);
      case 'step': return this.noiseBurst(0.04, 0.025, 600, 'lowpass');
      case 'jump': return this.tone('sine', 300, 600, 0.12, 0.08);
      case 'splashSmall': return this.noiseBurst(0.12, 0.05, 1800);
      case 'splash': this.noiseBurst(0.35, 0.18, 1400); return this.tone('sine', 400, 120, 0.2, 0.08);
      case 'cast': return this.noiseBurst(0.25, 0.08, 3000, 'highpass');
      case 'bite': this.tone('square', 880, null, 0.08, 0.08); return this.tone('square', 1175, null, 0.1, 0.08, 0.09);
      case 'hook': return this.tone('sawtooth', 200, 600, 0.12, 0.08);
      case 'miss': return this.tone('triangle', 400, 150, 0.4, 0.12);
      case 'coin': this.tone('square', 988, null, 0.06, 0.06); return this.tone('square', 1319, null, 0.15, 0.06, 0.06);
      case 'gem': return this.arp([84, 88, 91, 96], 0.05, 0.08, 'sine');
      case 'pickup': return this.tone('sine', 700, 1200, 0.1, 0.1);
      case 'catch': return this.arp([72, 76, 79, 84], 0.07, 0.12);
      case 'catchRare': return this.arp([72, 76, 79, 84, 88, 91, 96], 0.06, 0.12);
      case 'levelup': return this.arp([67, 72, 76, 79, 84, 88], 0.08, 0.14);
      case 'quest': return this.arp([72, 79, 84], 0.09, 0.12);
      case 'questDone': return this.arp([72, 76, 79, 84, 79, 84], 0.08, 0.14);
      case 'tick': return this.tone('sine', 1200, 1500, 0.08, 0.08);
      case 'error': return this.tone('square', 220, 180, 0.15, 0.06);
      case 'buy': this.sfx('coin'); return;
      case 'plant': return this.noiseBurst(0.2, 0.08, 400, 'lowpass');
      case 'harvest': return this.arp([79, 84], 0.06, 0.1);
      case 'water': return this.noiseBurst(0.4, 0.06, 2600);
      case 'shake': return this.noiseBurst(0.5, 0.1, 900);
      case 'dig': this.noiseBurst(0.12, 0.12, 300, 'lowpass'); return this.noiseBurst(0.12, 0.12, 300, 'lowpass', 0.2);
      case 'chest': return this.arp([79, 83, 86, 91], 0.06, 0.12, 'square');
      case 'build': this.noiseBurst(0.06, 0.15, 300, 'lowpass'); this.noiseBurst(0.06, 0.15, 300, 'lowpass', 0.15); return this.arp([72, 76, 79], 0.1, 0.1);
      case 'swing': return this.noiseBurst(0.15, 0.1, 2200, 'highpass');
      case 'hit': this.tone('square', 180, 80, 0.1, 0.12); return this.noiseBurst(0.08, 0.12, 800);
      case 'hurt': return this.tone('sawtooth', 300, 120, 0.25, 0.12);
      case 'defeat': return this.arp([67, 64, 60], 0.08, 0.1, 'square');
      case 'ko': return this.arp([60, 55, 52, 48], 0.15, 0.12, 'sawtooth');
      case 'heal': return this.arp([72, 79, 84], 0.07, 0.1, 'sine');
      case 'alarm': this.tone('square', 600, 400, 0.3, 0.08); return this.tone('square', 600, 400, 0.3, 0.08, 0.35);
      case 'whistle': return this.tone('sine', 1800, 2400, 0.4, 0.08);
      case 'fanfare': return this.arp([72, 72, 72, 76, 79, 76, 79, 84], 0.12, 0.13, 'square');
      case 'eat': this.noiseBurst(0.08, 0.1, 700, 'lowpass'); return this.noiseBurst(0.08, 0.1, 700, 'lowpass', 0.15);
      case 'travel': return this.arp([60, 64, 67, 72, 76], 0.12, 0.1, 'sine');
      case 'thunder': return this.noiseBurst(1.6, 0.35, 120, 'lowpass');
      case 'type': return this.tone('triangle', 520 + Math.random() * 80, null, 0.025, 0.03);
      default:
        return undefined;
    }
  }
}
