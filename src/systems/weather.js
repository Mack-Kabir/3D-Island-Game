import { mulberry32, hashString, smoothstep } from '../core/utils.js';

const KINDS = {
  clear: { name: 'Sunny', icon: '☀️', nightIcon: '🌙' },
  cloudy: { name: 'Cloudy', icon: '⛅', nightIcon: '☁️' },
  rain: { name: 'Rain', icon: '🌧️', nightIcon: '🌧️' },
  storm: { name: 'Storm', icon: '⛈️', nightIcon: '⛈️' },
};

/** Daily weather, seeded so it is the same for a given save and day. */
export class Weather {
  constructor(game) {
    this.game = game;
    this.rain = 0;
    game.events.on('newDay', () => this.rollDay());
  }
  rollDay(force = false) {
    const s = this.game.state;
    if (!s) return;
    if (!force && s.weather.day === s.time.day) return;
    const r = mulberry32(hashString('wx' + s.time.day + s.created));
    const x = r();
    let kind = 'clear';
    if (s.time.day > 1) {
      if (x < 0.18) kind = 'rain';
      else if (x < 0.24) kind = 'storm';
      else if (x < 0.45) kind = 'cloudy';
    }
    const start = 6 * 60 + r() * 12 * 60;
    const len = 4 * 60 + r() * 8 * 60;
    s.weather = { day: s.time.day, kind, rainStart: start, rainEnd: start + len };
    if (kind === 'rain' || kind === 'storm') this.game.ui?.toast(`${KINDS[kind].icon} Rain is forecast today. Rare rain fish will bite!`, 'info');
  }
  /** 0..1 rain intensity right now. */
  intensity() {
    const s = this.game.state;
    if (!s) return 0;
    const w = s.weather;
    if (w.kind !== 'rain' && w.kind !== 'storm') return 0;
    const m = s.time.minutes;
    const ramp = smoothstep(w.rainStart, w.rainStart + 40, m) * (1 - smoothstep(w.rainEnd - 40, w.rainEnd, m));
    // overnight spill-over
    const spill = w.rainEnd > 1440 ? 1 - smoothstep(w.rainEnd - 1440 - 40, w.rainEnd - 1440, m) : 0;
    return Math.max(ramp, spill) * (w.kind === 'storm' ? 1 : 0.75);
  }
  raining() {
    return this.rain > 0.3;
  }
  update(dt) {
    const target = this.intensity();
    this.rain += (target - this.rain) * Math.min(1, dt * 0.5);
    if (this.game.state?.weather.kind === 'storm' && this.rain > 0.6 && Math.random() < dt * 0.04) this.game.flashLightning?.();
  }
  info() {
    const s = this.game.state;
    const kind = this.raining() ? (s?.weather.kind === 'storm' ? 'storm' : 'rain') : s?.weather.kind === 'cloudy' ? 'cloudy' : 'clear';
    const k = KINDS[kind];
    const night = this.game.time.isNight();
    return { kind, name: k.name, icon: night && kind !== 'rain' && kind !== 'storm' ? k.nightIcon : k.icon };
  }
}
