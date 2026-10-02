import * as THREE from 'three';
import { toon, outlineGeometry, outlineMaterial } from './toon.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../core/utils.js';

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const skyFrag = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform vec3 uMoonDir;
uniform float uStars;
uniform float uTime;
varying vec3 vDir;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  // painterly banded gradient
  float t = smoothstep(-0.05, 0.55, h);
  t = floor(t * 7.0 + 0.5) / 7.0 * 0.35 + t * 0.65;
  vec3 col = mix(uHorizon, uTop, t);
  col = mix(col, uHorizon * 0.8, smoothstep(0.0, -0.25, h));

  // sun glow + disc
  float sd = dot(d, normalize(uSunDir));
  col += uSunColor * pow(max(sd, 0.0), 24.0) * 0.35;
  col = mix(col, vec3(1.0, 0.97, 0.85) * (uSunColor * 0.4 + 0.75), smoothstep(0.9975, 0.998, sd));

  // moon (crescent)
  vec3 md = normalize(uMoonDir);
  float mdot = dot(d, md);
  float moon = smoothstep(0.9986, 0.9988, mdot);
  float bite = smoothstep(0.9986, 0.9988, dot(d, normalize(md + vec3(0.018, 0.012, 0.0))));
  col += vec3(0.4, 0.45, 0.6) * pow(max(mdot, 0.0), 200.0) * uStars * 0.6;
  col = mix(col, vec3(0.98, 0.95, 0.82), moon * (1.0 - bite * 0.85) * clamp(uStars + 0.15, 0.0, 1.0));

  // stars
  vec3 p = d * 140.0;
  vec3 cell = floor(p);
  float r = hash13(cell);
  if (r > 0.965 && h > 0.02) {
    vec3 off = vec3(hash13(cell + 1.7), hash13(cell + 4.1), hash13(cell + 9.3)) - 0.5;
    float dist = length(fract(p) - 0.5 - off * 0.6);
    float tw = 0.65 + 0.35 * sin(uTime * (1.5 + r * 4.0) + r * 60.0);
    float star = smoothstep(0.12, 0.0, dist) * tw;
    col += vec3(1.0, 0.96, 0.85) * star * uStars * smoothstep(0.02, 0.2, h);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export class Sky {
  constructor(scene) {
    this.uniforms = {
      uTop: { value: new THREE.Color('#79c3e0') },
      uHorizon: { value: new THREE.Color('#e9f2e6') },
      uSunColor: { value: new THREE.Color('#ffe2a8') },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
      uStars: { value: 0 },
      uTime: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 20), mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
    scene.add(this.mesh);

    this.clouds = new Clouds(scene);
  }
  update(dt, camera, env, time) {
    this.mesh.position.copy(camera.position);
    const u = this.uniforms;
    u.uTop.value.copy(env.skyTop);
    u.uHorizon.value.copy(env.skyHorizon);
    u.uSunColor.value.copy(env.sunColor);
    u.uSunDir.value.copy(env.sunDir);
    u.uMoonDir.value.copy(env.moonDir);
    u.uStars.value = env.stars;
    u.uTime.value = time;
    this.clouds.update(dt, camera, env);
  }
}

class Clouds {
  constructor(scene) {
    this.group = new THREE.Group();
    this.material = toon('#ffffff');
    this.material.fog = true;
    const rnd = mulberry32(42);
    this.items = [];
    for (let i = 0; i < 16; i++) {
      const parts = [];
      const n = 4 + Math.floor(rnd() * 4);
      for (let k = 0; k < n; k++) {
        const g = new THREE.IcosahedronGeometry(1, 1);
        const s = 3 + rnd() * 4;
        g.scale(s, s * 0.7, s);
        g.translate((k - n / 2) * 4 + rnd() * 2, rnd() * 2, rnd() * 4 - 2);
        // flatten bottoms
        const pos = g.getAttribute('position');
        for (let v = 0; v < pos.count; v++) if (pos.getY(v) < -0.5) pos.setY(v, -0.5 + (pos.getY(v) + 0.5) * 0.2);
        g.computeVertexNormals();
        parts.push(g);
      }
      const geom = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)));
      geom.computeVertexNormals();
      const mesh = new THREE.Mesh(geom, this.material);
      const o = new THREE.Mesh(outlineGeometry(geom), outlineMaterial(0.06));
      mesh.add(o);
      const a = rnd() * Math.PI * 2;
      const r = 120 + rnd() * 320;
      mesh.position.set(Math.cos(a) * r, 70 + rnd() * 50, Math.sin(a) * r);
      const sc = 1 + rnd() * 1.6;
      mesh.scale.setScalar(sc);
      mesh.userData.speed = 1.5 + rnd() * 2;
      this.group.add(mesh);
      this.items.push(mesh);
    }
    scene.add(this.group);
  }
  update(dt, camera, env) {
    this.material.color.copy(env.cloudColor);
    for (const c of this.items) {
      c.position.x += c.userData.speed * dt * env.wind;
      if (c.position.x > 480) c.position.x = -480;
    }
  }
}
