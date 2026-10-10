// One in-game day lasts DAY_SECONDS real seconds (24 minutes by default).
export const DAY_SECONDS = 24 * 60;

export class TimeSystem {
  constructor(game) {
    this.game = game;
    this.titleMinutes = 17 * 60;
    this.wasNight = null;
  }
  get t() {
    return this.game.state?.time ?? { day: 1, minutes: this.titleMinutes };
  }
  realMode() {
    return this.game.settings.clock === 'real';
  }
  minutes() {
    return this.t.minutes;
  }
  hour() {
    return this.t.minutes / 60;
  }
  day() {
    return this.t.day;
  }
  /** Absolute minutes since day 1. */
  abs() {
    return this.t.day * 1440 + this.t.minutes;
  }
  isNight() {
    const h = this.hour();
    return h >= 19 || h < 7;
  }
  update(dt, { paused = false, title = false } = {}) {
    if (title) {
      // fast, looping day/night show behind the title screen
      this.titleMinutes = (this.titleMinutes + dt * 30) % 1440;
      return;
    }
    const t = this.game.state?.time;
    if (!t) return;
    const prevAbs = this.abs();
    if (this.realMode()) {
      const now = new Date();
      t.minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      const stamp = now.toDateString();
      if (t.realStamp !== stamp) {
        if (t.realStamp) this.advanceDay();
        t.realStamp = stamp;
      }
    } else if (!paused) {
      t.minutes += dt * (1440 / DAY_SECONDS);
      if (t.minutes >= 1440) {
        t.minutes -= 1440;
        this.advanceDay();
      }
    }
    const dMin = Math.max(0, this.abs() - prevAbs);
    if (dMin > 0) this.game.events.emit('minutes', dMin);
    const night = this.isNight();
    if (this.wasNight !== null && night !== this.wasNight) this.game.events.emit(night ? 'nightfall' : 'dawn');
    this.wasNight = night;
  }
  advanceDay() {
    this.t.day += 1;
    this.game.events.emit('newDay', this.t.day);
  }
  /** Skip ahead (sleeping, travelling). */
  skip(minutes) {
    if (this.realMode()) return false;
    const t = this.game.state.time;
    t.minutes += minutes;
    while (t.minutes >= 1440) {
      t.minutes -= 1440;
      this.advanceDay();
    }
    this.game.events.emit('minutes', minutes);
    return true;
  }
  /** Sleep until 7:00 the next morning. */
  sleepUntilMorning() {
    const m = this.t.minutes;
    const target = 7 * 60;
    const delta = m < target ? target - m : 1440 - m + target;
    return this.skip(delta);
  }
}
