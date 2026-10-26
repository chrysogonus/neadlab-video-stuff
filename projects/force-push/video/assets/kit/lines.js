// lines.js — line-drawn 3D for the house style (docs/HOUSE-STYLE.md "Light and depth"): the p(doom) engine's techniques
// as one ES module (ported from git show fa164b7:app/src/engine/{lines.ts,util.ts,glsl/common.ts}, scenes/spacetime.ts).
// Canonical copy: templates/hyperframes/assets/kit/lines.js. Every function is a pure function of time or seeded.
//
//   import * as THREE from "./assets/vendor/three.module.js";
//   import * as L from "./assets/kit/lines.js";
//   const renderer = L.renderer(THREE, canvas);                 // sized 1920×1080 logical, true 4K in a 4K render
//   const lines = L.createLines(THREE, 40000);                  // capsule segments, additive: overlaps go hot
//   lines.clear(); lines.polyline(pts, 1.4, L.ACCENT); lines.draw(renderer, camera);
//   const shot = L.createShutter(THREE, renderer);              // sub-frame motion blur for the fast moves
//   shot((t) => { …set the scene to time t…; return [scene, camera] }, t, { samples: 8 });
//
// Colours are display (sRGB) values and add up: the accent's light comes from the light pass (analysis/finish.py),
// which blooms whatever is drawn in the accent, so draw the hot parts in the accent and keep the bone lines thin.
export const ACCENT = [232 / 255, 93 / 255, 38 / 255], BONE = [240 / 255, 236 / 255, 229 / 255];
/** The frame's palette from #root's --hr-accent-rgb / --hr-light-rgb ("r, g, b"), as 0..1 triples. */
export function palette(root) {
  const read = (name, fb) => { const v = getComputedStyle(root).getPropertyValue(name).trim(); return v ? v.split(",").map((x) => +x / 255) : fb; };
  return { accent: read("--hr-accent-rgb", ACCENT), bone: read("--hr-light-rgb", BONE) };
}

// ---- time ---------------------------------------------------------------------------------------------------
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const ease = {
  linear: (t) => t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};
/** Eased progress of x through [a, b]. */
export const prog = (x, a, b, fn = ease.linear) => fn(clamp((x - a) / (b - a)));
/** Piecewise keys [[t, value], …] with an ease per segment: the camera's path through a scene. */
export const keys = (t, ks, fn = ease.inOutCubic) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) if (t < ks[i][0]) return lerp(ks[i - 1][1], ks[i][1], fn((t - ks[i - 1][0]) / (ks[i][0] - ks[i - 1][0])));
  return ks[ks.length - 1][1];
};
/** Damped spring to a step at time 0 (0 -> 1 with overshoot): a kick that settles. */
export const springStep = (t, freq = 4, damping = 0.35) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  return 1 - Math.exp(-damping * w * t) * Math.cos(w * Math.sqrt(1 - damping * damping) * t);
};
/** 1 at t0, halving every hl seconds: a punch on a hit. */
export const pulse = (t, t0, hl = 0.12) => (t < t0 ? 0 : Math.pow(0.5, (t - t0) / hl));
/** Stateless hash to [0, 1). */
export function hash(...xs) {
  let h = 2166136261 >>> 0;
  for (const x of xs) { h ^= Math.floor(x * 1000003) | 0; h = Math.imul(h, 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; }
  return (h >>> 0) / 4294967296;
}
/** Smooth value noise in -1..1: handheld drift and shake (never a new random offset per frame). */
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * f * (f * (f * 6 - 15) + 10);
  return lerp(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, u);
}

// ---- the music (track seconds; window.HR_ENV from env.js) -----------------------------------------------------
const grid = (name) => (window.HR_ENV && window.HR_ENV[name]) || [];
/** The last beat (or downbeat, with "downbeats") at or before t. */
export const beatAt = (t, name = "beats") => { let b = -Infinity; for (const x of grid(name)) { if (x > t) break; b = x; } return b; };
/** Beats (or downbeats) in [a, b). */
export const beatsIn = (a, b, name = "beats") => grid(name).filter((x) => x >= a && x < b);

// ---- renderer ---------------------------------------------------------------------------------------------------
/** A WebGL2 renderer on `canvas` at 1920×1080 logical px and the device's pixel ratio (2 in a --4k render), black. */
export function renderer(THREE, canvas, clear = "#0A0A0A") {
  const r = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  r.setPixelRatio(window.devicePixelRatio || 1);
  r.setSize(1920, 1080, false);
  r.setClearColor(clear, 1);
  r.autoClear = false;
  return r;
}
/** Project a world point to logical px: {x, y, s} (s = px per world unit at its depth), or null behind the camera. */
export function projector(THREE, camera, w = 1920, h = 1080) {
  const v = new THREE.Vector4();
  return (p) => {
    v.set(p.x, p.y, p.z, 1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
    if (v.w <= 0) return null;
    return { x: (v.x / v.w * 0.5 + 0.5) * w, y: (0.5 - v.y / v.w * 0.5) * h, s: camera.projectionMatrix.elements[5] * 0.5 * h / v.w };
  };
}

// ---- lines: instanced anti-aliased capsules (p(doom)'s LineBatch) -------------------------------------------------
const LINE_VERT = /* glsl */ `
precision highp float;
in vec3 position; in vec3 iA; in vec3 iB; in vec4 iColor; in float iWidth;
uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
uniform vec2 res; uniform bool screen2D; uniform bool worldWidth; uniform float pxScale;
out vec2 vLocal; out float vLen; out float vHalfW; out vec4 vColor;
vec4 toClip(vec3 p) {
  if (screen2D) return vec4(p.x / res.x * 2.0 - 1.0, 1.0 - p.y / res.y * 2.0, 0.0, 1.0);
  return projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
void main() {
  vec4 ca = toClip(iA), cb = toClip(iB);
  if (ca.w <= 0.0 || cb.w <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 sa = ca.xy / ca.w * 0.5 * res * pxScale, sb = cb.xy / cb.w * 0.5 * res * pxScale;
  float w = iWidth * pxScale;
  if (worldWidth && !screen2D) w = iWidth * mix(projectionMatrix[1][1] * 0.5 * res.y * pxScale / ca.w, projectionMatrix[1][1] * 0.5 * res.y * pxScale / cb.w, position.x);
  float hw = max(w * 0.5, 0.35) + 1.0;
  vec2 d = sb - sa; float len = length(d);
  vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0), nrm = vec2(-dir.y, dir.x);
  float along = mix(-hw, len + hw, position.x);
  vec2 p = sa + dir * along + nrm * position.y * hw;
  gl_Position = vec4(p / (0.5 * res * pxScale), mix(ca.z / ca.w, cb.z / cb.w, position.x), 1.0);
  vLocal = vec2(along, position.y * hw); vLen = len; vHalfW = max(w * 0.5, 0.35);
  vColor = iColor * vec4(1.0, 1.0, 1.0, min(1.0, w / 0.7)); // hairlines fade instead of thinning below 0.7 px
}`;
const LINE_FRAG = /* glsl */ `
precision highp float;
in vec2 vLocal; in float vLen; in float vHalfW; in vec4 vColor;
out vec4 fragColor;
void main() {
  float d = length(vec2(vLocal.x - clamp(vLocal.x, 0.0, vLen), vLocal.y)) - vHalfW; // capsule SDF in px
  float a = clamp(0.5 - d, 0.0, 1.0) * vColor.a;
  if (a <= 0.0) discard;
  fragColor = vec4(vColor.rgb * a, a);
}`;

/**
 * Up to `capacity` segments per draw. opts.screen2D: coordinates are logical px (x right, y down); default 3D world.
 * opts.worldWidth: widths in world units (perspective-scaled) instead of px. opts.blend: "add" (default: overlaps
 * brighten, the glow) | "max" | "normal". opts.depthTest: hide lines behind solid geometry.
 */
export function createLines(THREE, capacity, opts = {}) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const A = new Float32Array(capacity * 3), B = new Float32Array(capacity * 3), C = new Float32Array(capacity * 4), Wd = new Float32Array(capacity);
  const attrs = [[A, 3, "iA"], [B, 3, "iB"], [C, 4, "iColor"], [Wd, 1, "iWidth"]].map(([arr, n, name]) => {
    const at = new THREE.InstancedBufferAttribute(arr, n); at.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, at); return at;
  });
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG,
    uniforms: { res: { value: new THREE.Vector2(1920, 1080) }, screen2D: { value: !!opts.screen2D }, worldWidth: { value: !!opts.worldWidth }, pxScale: { value: 1 } },
    transparent: true, depthWrite: false, depthTest: !!opts.depthTest, blending: THREE.CustomBlending,
    blendEquation: opts.blend === "max" ? THREE.MaxEquation : THREE.AddEquation, blendSrc: THREE.OneFactor,
    blendDst: opts.blend === "normal" ? THREE.OneMinusSrcAlphaFactor : THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(mesh);
  const cam2D = new THREE.OrthographicCamera(0, 1920, 0, 1080, -1, 1);
  let n = 0;
  const L = {
    get count() { return n; },
    clear() { n = 0; return L; },
    /** A segment a -> b ({x, y, z}), width px (or world units), rgb 0..1 (may exceed 1: it adds), alpha. */
    seg(a, b, width, rgb, alpha = 1) {
      if (n >= capacity) return L;
      const i = n++;
      A[i * 3] = a.x; A[i * 3 + 1] = a.y; A[i * 3 + 2] = a.z || 0;
      B[i * 3] = b.x; B[i * 3 + 1] = b.y; B[i * 3 + 2] = b.z || 0;
      C[i * 4] = rgb[0]; C[i * 4 + 1] = rgb[1]; C[i * 4 + 2] = rgb[2]; C[i * 4 + 3] = alpha;
      Wd[i] = width;
      return L;
    },
    polyline(pts, width, rgb, alpha = 1) { for (let i = 1; i < pts.length; i++) L.seg(pts[i - 1], pts[i], width, rgb, alpha); return L; },
    /** Draw into the current target (or `target`), over what is there. */
    draw(r, camera, target = null) {
      for (const at of attrs) { at.needsUpdate = true; at.clearUpdateRanges(); at.addUpdateRange(0, n * at.itemSize); }
      geo.instanceCount = n;
      mat.uniforms.pxScale.value = target ? target.width / 1920 : r.getPixelRatio();
      r.setRenderTarget(target);
      r.render(scene, camera || cam2D);
      return L;
    },
  };
  return L;
}

// ---- shutter: sub-frame motion blur for a WebGL layer -----------------------------------------------------------
/**
 * Average `samples` renders spread over `angle` degrees of the frame (360 = one frame at `fps`), centred on t.
 * draw(ts, target) renders the layer at time ts into target (lines.draw(r, cam, target), r.render with
 * setRenderTarget(target)); the shutter clears it to black first. The HyperFrames CLI does not expose whole-frame
 * blur (0.8.164–0.8.204), so a WebGL set piece integrates its own; DOM elements use motion-blur.js.
 */
export function createShutter(THREE, r) {
  const size = r.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, depthBuffer: true });
  const acc = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, depthBuffer: false });
  const mat = new THREE.ShaderMaterial({
    uniforms: { src: { value: null }, k: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: "uniform sampler2D src; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(src, vUv).rgb * k, 1.0); }",
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  const scene = new THREE.Scene(); scene.add(quad);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const black = new THREE.Color(0, 0, 0);
  return (draw, t, { samples = 8, angle = 180, fps = 60 } = {}) => {
    const prevClear = r.getClearColor(new THREE.Color()), prevAlpha = r.getClearAlpha();
    // three keeps the clear colour linear and converts it only for the canvas; the float targets are copied to the canvas
    // as they are, so clear them to the display value, or every blurred frame gets a darker ground than a sharp one
    const disp = prevClear.getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
    const ground = new THREE.Color().setRGB(disp.r, disp.g, disp.b, THREE.LinearSRGBColorSpace);
    r.setRenderTarget(acc); r.setClearColor(black, 1); r.clear();
    for (let k = 0; k < samples; k++) {
      r.setRenderTarget(rt); r.setClearColor(ground, prevAlpha); r.clear();
      draw(t + ((k + 0.5) / samples - 0.5) * (angle / 360) / fps, rt);
      mat.uniforms.src.value = rt.texture; mat.uniforms.k.value = 1 / samples;
      r.setRenderTarget(acc); r.render(scene, cam);
    }
    mat.blending = THREE.NoBlending; mat.uniforms.src.value = acc.texture; mat.uniforms.k.value = 1;
    r.setRenderTarget(null); r.render(scene, cam);
    mat.blending = THREE.AdditiveBlending;
    r.setClearColor(prevClear, prevAlpha);
  };
}

// ---- type on a 3D path (Canvas2D over the WebGL layer) ----------------------------------------------------------
/**
 * Lay `text` along a world-space curve, glyph by glyph: each glyph's start and end are projected and the glyph is
 * scaled and rotated to span them, so the words bend, recede and foreshorten with the object. at(u) -> {x, y, z} is
 * the curve at world arclength u from its start; size is the cap height in world units. A glyph seen edge-on fades
 * (its projected advance collapses). opts.lit(i) -> 0..1 fills glyph i as it is sung (dim outline before); opts.hot(i)
 * fills it in the accent; opts.color(i) -> "r, g, b" overrides both (a word landing white-hot and cooling to the accent,
 * p(doom)'s sung glyph: lerp from 255, 236, 220 by e^(−Δt/0.3)); opts.font: a CSS font family/weight string at 100px.
 */
export function textOnPath(ctx, project, at, text, size, opts = {}) {
  const font = opts.font || "900 100px Barlow", fill = opts.fill || "240, 236, 229", accent = opts.accent || "232, 93, 38";
  ctx.save();
  ctx.font = font; ctx.textBaseline = "alphabetic";
  let u = opts.start || 0;
  [...text].forEach((ch, i) => {
    const adv = ctx.measureText(ch).width / 100 * size * 1.4;
    if (ch !== " ") {
      const qa = project(at(u)), qb = project(at(u + adv));
      if (qa && qb) {
        const len = Math.hypot(qb.x - qa.x, qb.y - qa.y), hpx = 0.5 * (qa.s + qb.s) * size * 1.4;
        const gw = ctx.measureText(ch).width, comp = len / Math.max(1, (gw * hpx) / 100);
        const a = (opts.alpha ?? 1) * smoothstep(0.28, 0.62, comp), lit = opts.lit ? clamp(opts.lit(i)) : 1;
        if (a > 0.003) {
          ctx.save();
          ctx.translate(qa.x, qa.y); ctx.rotate(Math.atan2(qb.y - qa.y, qb.x - qa.x)); ctx.scale(len / Math.max(1, gw), hpx / 100);
          if (lit < 1) { ctx.strokeStyle = `rgba(${fill}, ${0.35 * a})`; ctx.lineWidth = 2.5 * 100 / Math.max(1, hpx); ctx.strokeText(ch, 0, 0); }
          if (lit > 0) { ctx.fillStyle = `rgba(${opts.color ? opts.color(i) : opts.hot && opts.hot(i) ? accent : fill}, ${a * lit})`; ctx.fillText(ch, 0, 0); }
          ctx.restore();
        }
      }
    }
    u += adv;
  });
  ctx.restore();
}

// ---- engraving (GLSL for ShaderMaterial / RawShaderMaterial fragment shaders) ------------------------------------
/** hatchD / hatch / engrave (p(doom)'s analytic engraving: line width grows with darkness, AA by fwidth) and heat
 *  (ink -> accent -> white-hot). Prepend to a fragment shader; define ACCENT and BONE (vec3, display values) first. */
export const HATCH_GLSL = /* glsl */ `
float sat(float x) { return clamp(x, 0.0, 1.0); }
mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hatchD(float u, float darkness, float du) {
  float f = abs(fract(u) - 0.5), half_w = 0.5 * sat(darkness), aa = max(du, 1e-4);
  return 1.0 - smoothstep(half_w - aa, half_w + aa, 0.5 - f);
}
float hatch(float u, float darkness) {
  float du = fwidth(u);
  // anti-moiré: lines finer than ~2.5 px fade to their mean ink instead of aliasing
  return mix(hatchD(u, darkness, du), sat(darkness), smoothstep(0.25, 0.45, du));
}
float engrave(vec2 uv, float darkness, float freq, float angle) {
  float a = hatch((rot2(angle) * uv * freq).y, darkness * 1.1);
  float b = hatch((rot2(angle + 1.1) * uv * freq).y, sat(darkness * 2.0 - 1.1));
  return max(a, b);
}
vec3 heat(float x) {
  x = sat(x);
  vec3 c = mix(vec3(0.04), ACCENT * 0.45, smoothstep(0.0, 0.3, x));
  c = mix(c, ACCENT, smoothstep(0.25, 0.6, x));
  return mix(c, vec3(1.0, 0.93, 0.85), smoothstep(0.82, 1.0, x));
}
float aaStroke(float d, float wd) { float w = fwidth(d); return 1.0 - smoothstep(wd * 0.5 - w, wd * 0.5 + w, abs(d)); }
`;
