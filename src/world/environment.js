import * as THREE from 'three';
import { clamp, smoothstep } from '../core/utils.js';

// Hour keyframes for the day/night palette. Night is 19:00 – 07:00.
const KEYS = [
  { h: 0, top: '#0e1630', hor: '#26355a', sun: '#8fa6d8', sunI: 0.42, hemiS: '#3a4c7a', hemiG: '#1c2236', hemiI: 0.62, fog: '#1d2a48', water: '#5a6f9e', cloud: '#4c5878' },
  { h: 5.2, top: '#18234a', hor: '#3c4570', sun: '#8fa6d8', sunI: 0.4, hemiS: '#3a4c7a', hemiG: '#1c2236', hemiI: 0.62, fog: '#2a3558', water: '#5a6f9e', cloud: '#5a6588' },
  { h: 6.3, top: '#5c79b8', hor: '#f3b48a', sun: '#ffb47a', sunI: 0.7, hemiS: '#9fb3d8', hemiG: '#6d5a5a', hemiI: 0.75, fog: '#e7b79d', water: '#c9b9c4', cloud: '#f6c7b4' },
  { h: 7.5, top: '#7ec4e2', hor: '#f4ead6', sun: '#ffe2b0', sunI: 1.05, hemiS: '#cfe8f3', hemiG: '#8a8a6a', hemiI: 0.85, fog: '#d9ecec', water: '#ffffff', cloud: '#ffffff' },
  { h: 12, top: '#5fb4dc', hor: '#e2f1ee', sun: '#fff3d6', sunI: 1.2, hemiS: '#d8eef7', hemiG: '#8f9472', hemiI: 0.9, fog: '#d3ecf0', water: '#ffffff', cloud: '#ffffff' },
  { h: 16.5, top: '#6fb7d9', hor: '#f3ead2', sun: '#ffe1a6', sunI: 1.1, hemiS: '#d6e7ef', hemiG: '#8e8a6a', hemiI: 0.85, fog: '#e2ead8', water: '#fff8ec', cloud: '#fffaf0' },
  { h: 18.3, top: '#7a7fc0', hor: '#ffad7a', sun: '#ff9a5c', sunI: 0.95, hemiS: '#c9a8c8', hemiG: '#7a5a58', hemiI: 0.78, fog: '#f0a98a', water: '#ffd2b8', cloud: '#ffc2a0' },
  { h: 19.2, top: '#3a3f80', hor: '#c9708a', sun: '#d77a8a', sunI: 0.55, hemiS: '#6a6496', hemiG: '#3a2c40', hemiI: 0.68, fog: '#7c5a7a', water: '#9a86b0', cloud: '#a78aa8' },
  { h: 20.3, top: '#141c3c', hor: '#33406b', sun: '#8fa6d8', sunI: 0.42, hemiS: '#3a4c7a', hemiG: '#1c2236', hemiI: 0.62, fog: '#22304f', water: '#5a6f9e', cloud: '#4c5878' },
  { h: 24, top: '#0e1630', hor: '#26355a', sun: '#8fa6d8', sunI: 0.42, hemiS: '#3a4c7a', hemiG: '#1c2236', hemiI: 0.62, fog: '#1d2a48', water: '#5a6f9e', cloud: '#4c5878' },
];
const COLOR_FIELDS = ['top', 'hor', 'sun', 'hemiS', 'hemiG', 'fog', 'water', 'cloud'];
const parsed = KEYS.map((k) => {
  const o = { ...k };
  for (const f of COLOR_FIELDS) o[f] = new THREE.Color(k[f]);
  return o;
});

const _a = new THREE.Color();
const _rainTint = new THREE.Color('#8a96a3');

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.hemi = new THREE.HemisphereLight('#d8eef7', '#8f9472', 0.9);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff3d6', 1.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = this.sun.shadow.camera;
    s.left = -45;
    s.right = 45;
    s.top = 45;
    s.bottom = -45;
    s.near = 1;
    s.far = 260;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun);
    scene.add(this.sun.target);
    scene.fog = new THREE.Fog('#d3ecf0', 90, 420);

    this.state = {
      skyTop: new THREE.Color(),
      skyHorizon: new THREE.Color(),
      sunColor: new THREE.Color(),
      cloudColor: new THREE.Color(),
      waterLight: new THREE.Color(),
      sunDir: new THREE.Vector3(),
      moonDir: new THREE.Vector3(),
      stars: 0,
      night: false,
      nightAmount: 0,
      rain: 0,
      wind: 1,
      glow: 0,
    };
  }

  /** hour: 0-24 float, rain: 0-1 */
  update(hour, rain, focus) {
    let i = 0;
    while (i < parsed.length - 2 && parsed[i + 1].h <= hour) i++;
    const a = parsed[i];
    const b = parsed[i + 1];
    const t = clamp((hour - a.h) / (b.h - a.h), 0, 1);
    const st = this.state;
    const mix = (f, out) => out.copy(a[f]).lerp(b[f], t);

    mix('top', st.skyTop);
    mix('hor', st.skyHorizon);
    mix('sun', st.sunColor);
    mix('cloud', st.cloudColor);
    mix('water', st.waterLight);
    mix('hemiS', this.hemi.color);
    mix('hemiG', this.hemi.groundColor);
    mix('fog', this.scene.fog.color);
    let sunI = a.sunI + (b.sunI - a.sunI) * t;
    let hemiI = a.hemiI + (b.hemiI - a.hemiI) * t;

    // rain greys everything out
    if (rain > 0) {
      const r = rain * 0.65;
      st.skyTop.lerp(_a.copy(_rainTint).multiplyScalar(st.night ? 0.3 : 0.9), r);
      st.skyHorizon.lerp(_a.copy(_rainTint).multiplyScalar(st.night ? 0.35 : 1.05), r);
      this.scene.fog.color.lerp(_a.copy(_rainTint).multiplyScalar(st.night ? 0.3 : 0.95), r);
      st.cloudColor.lerp(_a.set('#9aa3ad').multiplyScalar(st.night ? 0.4 : 1), r);
      sunI *= 1 - rain * 0.45;
    }
    this.scene.fog.near = 70 - rain * 30;
    this.scene.fog.far = 420 - rain * 220;

    // Sun is up 7:00 → 19:00 (peaks at 13:00); moon the opposite way.
    const dayT = (hour - 7) / 12; // 0..1 during the day
    const sunAng = dayT * Math.PI;
    st.sunDir.set(Math.cos(sunAng) * 0.9, Math.sin(sunAng), -0.35).normalize();
    const nightT = ((hour - 19 + 24) % 24) / 12;
    const moonAng = nightT * Math.PI;
    st.moonDir.set(Math.cos(moonAng) * 0.85, Math.sin(moonAng) * 0.9 + 0.08, 0.4).normalize();

    st.night = hour >= 19 || hour < 7;
    st.nightAmount = Math.max(smoothstep(18.6, 20.0, hour), 1 - smoothstep(5.6, 7.0, hour));
    st.stars = st.nightAmount * (1 - rain * 0.85);
    st.glow = Math.max(smoothstep(17.8, 19.2, hour), 1 - smoothstep(6.2, 7.4, hour));
    st.rain = rain;

    // Directional light comes from the sun by day and the moon by night.
    const useSun = st.sunDir.y > 0.02;
    const dir = useSun ? st.sunDir : st.moonDir;
    const elev = Math.max(dir.y, 0.15);
    this.sun.color.copy(st.sunColor);
    this.sun.intensity = sunI * 2.1 * smoothstep(0.0, 0.18, elev);
    this.hemi.intensity = hemiI * 1.35;
    if (focus) {
      const d = new THREE.Vector3(dir.x, elev, dir.z).normalize();
      this.sun.position.copy(focus).addScaledVector(d, 120);
      this.sun.target.position.copy(focus);
    }
    return st;
  }
}
