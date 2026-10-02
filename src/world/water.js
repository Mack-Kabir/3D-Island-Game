import * as THREE from 'three';

const vert = /* glsl */ `
#include <fog_pars_vertex>
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const frag = /* glsl */ `
uniform float uTime;
uniform sampler2D uHeight;
uniform vec4 uBounds;   // minX, minZ, size, hasMap
uniform vec2 uRange;    // min height, max height
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform vec3 uLight;
uniform float uSparkle;
uniform float uRain;
varying vec3 vWorld;
#include <fog_pars_fragment>

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 uv = (vWorld.xz - uBounds.xy) / uBounds.z;
  float h = -14.0;
  if (uBounds.w > 0.5 && uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
    h = mix(uRange.x, uRange.y, texture2D(uHeight, uv).r);
  }
  float depth = max(-h, 0.0);
  float t = uTime;
  vec3 col = mix(uShallow, uDeep, smoothstep(0.3, 6.0, depth));

  // toon ripple streaks
  float n = vnoise(vWorld.xz * 0.11 + vec2(t * 0.07, t * 0.04)) + 0.5 * vnoise(vWorld.xz * 0.29 - vec2(t * 0.09, -t * 0.05));
  float streak = smoothstep(0.96, 0.99, n) - smoothstep(1.03, 1.06, n);
  col = mix(col, mix(col, uFoam, 0.75), streak * uSparkle);

  // rain dimples
  if (uRain > 0.01) {
    vec2 c = floor(vWorld.xz * 1.3);
    float rr = hash(c + floor(t * 3.0));
    float ring = fract(t * 3.0 + rr);
    float d = length(fract(vWorld.xz * 1.3) - 0.5);
    col = mix(col, uFoam, uRain * 0.35 * step(0.82, rr) * (1.0 - smoothstep(0.0, 0.05, abs(d - ring * 0.45))) * (1.0 - ring));
  }

  // shoreline foam + incoming wave bands
  float wob = vnoise(vWorld.xz * 0.45 + t * 0.25) * 0.3;
  float foam = 1.0 - smoothstep(0.18 + wob, 0.28 + wob, depth);
  float ring = fract(depth * 0.8 - t * 0.22 + wob * 0.5);
  float band = (1.0 - smoothstep(0.0, 0.07, abs(ring - 0.5))) * (1.0 - smoothstep(0.4, 2.4, depth)) * step(0.0001, depth);
  col = mix(col, uFoam, max(foam, band * 0.45));

  col *= uLight;
  float alpha = mix(0.5, 0.94, smoothstep(0.0, 3.5, depth));
  alpha = max(alpha, foam * 0.95);
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export class Water {
  constructor(scene) {
    const blank = new THREE.DataTexture(new Uint8Array([0]), 1, 1, THREE.RedFormat);
    blank.needsUpdate = true;
    this.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uHeight: { value: blank },
        uBounds: { value: new THREE.Vector4(0, 0, 1, 0) },
        uRange: { value: new THREE.Vector2(-10, 10) },
        uDeep: { value: new THREE.Color('#2d6f8a') },
        uShallow: { value: new THREE.Color('#7fd3c9') },
        uFoam: { value: new THREE.Color('#f4fbf6') },
        uLight: { value: new THREE.Color('#ffffff') },
        uSparkle: { value: 0.6 },
        uRain: { value: 0 },
      },
    ]);
    this.uniforms.uHeight.value = blank;
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      fog: true,
      depthWrite: false,
    });
    const geom = new THREE.PlaneGeometry(4000, 4000, 1, 1);
    geom.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.renderOrder = 2;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }
  setHeightMap(tex, minX, minZ, size, minH, maxH) {
    this.uniforms.uHeight.value = tex;
    this.uniforms.uBounds.value.set(minX, minZ, size, tex ? 1 : 0);
    this.uniforms.uRange.value.set(minH, maxH);
  }
  update(dt, env, time, palette) {
    const u = this.uniforms;
    u.uTime.value = time;
    u.uLight.value.copy(env.waterLight);
    u.uRain.value = env.rain;
    u.uSparkle.value = env.night ? 0.35 : 0.6;
    if (palette) {
      u.uDeep.value.set(palette.deep);
      u.uShallow.value.set(palette.shallow);
    }
  }
}
