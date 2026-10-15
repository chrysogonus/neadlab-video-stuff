// Harvest Now, Decrypt Later (Banger Remix): the Earth, from real geography. Natural Earth's coastlines, lakes, ice
// and urban areas (src/assets/earth.json, packed by scripts/earth-pack.ts) are drawn into equirectangular canvas
// maps once; the globe's shader samples them (lon/lat of an earth-fixed direction) and adds what a map lacks:
// fractal coastlines below a texel, the sprawl of city lights, clouds, the air.
import * as THREE from 'three';
import EARTH from '../assets/earth.json';

const MW = 4096, MH = 2048;
let maps: { land: THREE.CanvasTexture; lights: THREE.CanvasTexture } | null = null;

const px = (lon: number) => ((lon + 180) / 360) * MW;
const py = (lat: number) => ((90 - lat) / 180) * MH;

/** Trace the packed rings (delta-encoded [lon, lat] at 1/q degree) as one path. */
function trace(c: CanvasRenderingContext2D, rings: number[][]) {
  const q = EARTH.q;
  c.beginPath();
  for (const r of rings) {
    let x = 0, y = 0;
    for (let i = 0; i < r.length; i += 2) {
      x += r[i]!; y += r[i + 1]!;
      if (i === 0) c.moveTo(px(x / q), py(y / q)); else c.lineTo(px(x / q), py(y / q));
    }
    c.closePath();
  }
}

function texture(cv: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 8;
  return t;
}

/**
 * The maps (made once, shared): `land` (r: land without its lakes, g: ice, b: urban areas) and `lights` (r: the
 * night lights, a glow around every populated place by its population over the urban areas). North is up (flipY).
 */
export function earthMaps() {
  if (maps) return maps;
  const cv = document.createElement('canvas'); cv.width = MW; cv.height = MH;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#000'; c.fillRect(0, 0, MW, MH);
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = '#ff0000'; trace(c, EARTH.land); c.fill('evenodd');
  c.fillStyle = '#00ff00'; trace(c, EARTH.ice); c.fill('evenodd');
  c.fillStyle = '#0000ff'; trace(c, EARTH.urban); c.fill('evenodd');
  // the lakes cut out of the land (red only)
  c.globalCompositeOperation = 'source-over';
  const img = c.getImageData(0, 0, MW, MH);
  const lk = document.createElement('canvas'); lk.width = MW; lk.height = MH;
  const lc = lk.getContext('2d')!;
  lc.fillStyle = '#fff'; trace(lc, EARTH.lakes); lc.fill('evenodd');
  const lake = lc.getImageData(0, 0, MW, MH).data, d = img.data;
  for (let i = 0; i < d.length; i += 4) d[i] = Math.round(d[i]! * (1 - lake[i]! / 255));
  c.putImageData(img, 0, 0);

  const lv = document.createElement('canvas'); lv.width = MW; lv.height = MH;
  const l = lv.getContext('2d')!;
  l.fillStyle = '#000'; l.fillRect(0, 0, MW, MH);
  l.globalCompositeOperation = 'lighter';
  l.filter = 'blur(1.5px)';
  l.fillStyle = 'rgba(255,255,255,0.32)'; trace(l, EARTH.urban); l.fill('evenodd');
  l.filter = 'none';
  const q = EARTH.q, P = EARTH.places;
  // the roads: every town of 20,000 or more joined to its two nearest neighbours (within ~400 km) by a faint line
  const towns: [number, number][] = [];
  for (let i = 0; i < P.length; i += 3) if (P[i + 2]! >= 20) towns.push([P[i]! / q, P[i + 1]! / q]);
  l.strokeStyle = 'rgba(255,255,255,0.075)'; l.lineWidth = 0.7; l.lineCap = 'round';
  l.beginPath();
  for (const [lon, lat] of towns) {
    const k = Math.cos((lat * Math.PI) / 180);
    let a: [number, number, number] = [Infinity, 0, 0], b: [number, number, number] = [Infinity, 0, 0];
    for (const [lo2, la2] of towns) {
      const dx = (lo2 - lon) * k, dy = la2 - lat, d2 = dx * dx + dy * dy;
      if (d2 < 1e-6 || d2 > 13) continue;
      if (d2 < a[0]) { b = a; a = [d2, lo2, la2]; } else if (d2 < b[0]) b = [d2, lo2, la2];
    }
    for (const [d2, lo2, la2] of [a, b]) {
      if (d2 === Infinity || Math.abs(lo2 - lon) > 90) continue;
      l.moveTo(px(lon), py(lat)); l.lineTo(px(lo2), py(la2));
    }
  }
  l.stroke();
  for (let i = 0; i < P.length; i += 3) {
    const lon = P[i]! / q, lat = P[i + 1]! / q, pop = P[i + 2]!; // thousands
    const x = px(lon), y = py(lat), k = 1 / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    const r = Math.min(9, 0.45 + 0.065 * Math.sqrt(pop));
    const a = Math.min(0.9, 0.1 + Math.pow(pop, 0.3) / 14);
    const g = l.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.35, `rgba(255,255,255,${a * 0.4})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    l.save(); l.translate(x, y); l.scale(k, 1); l.fillStyle = g; l.fillRect(-r, -r, 2 * r, 2 * r); l.restore();
  }
  maps = { land: texture(cv), lights: texture(lv) };
  return maps;
}

/** The earth-fixed basis of a local frame (x east, y north, z up) at lat, lon (degrees): its columns. */
export function geoFrame(lat: number, lon: number) {
  const a = (lat * Math.PI) / 180, o = (lon * Math.PI) / 180;
  const east = new THREE.Vector3(Math.cos(o), 0, -Math.sin(o));
  const north = new THREE.Vector3(-Math.sin(a) * Math.sin(o), Math.cos(a), -Math.sin(a) * Math.cos(o));
  const up = new THREE.Vector3(Math.cos(a) * Math.sin(o), Math.sin(a), Math.cos(a) * Math.cos(o));
  return new THREE.Matrix3().set(east.x, north.x, up.x, east.y, north.y, up.y, east.z, north.z, up.z);
}

/**
 * GLSL: the Earth's surface. `earthUV(e)` maps an earth-fixed unit direction to the maps' uv; `earthSurface` returns
 * the land, ice and night-light fields at e for a footprint fp (metres per pixel), with coastlines and lights broken
 * up below the maps' resolution; `earthDay` the albedo in daylight; `clouds` a cloud cover.
 */
export const EARTH_GLSL = /* glsl */ `
uniform sampler2D uLandMap, uLightMap;
const float TEXM = ${((40075016 / MW)).toFixed(1)};
vec2 earthUV(vec3 e) { return vec2(atan(e.x, e.z) / 6.2831853 + 0.5, 0.5 + asin(clamp(e.y, -1.0, 1.0)) / 3.14159265); }
struct Surf { float land; float ice; float urban; float lights; };
Surf earthSurface(vec3 e, float fp) {
  Surf s;
  vec2 uv = earthUV(e);
  float lod = max(0.0, log2(max(fp, 1.0) / TEXM));
  vec4 L = textureLod(uLandMap, uv, lod);
  float li = textureLod(uLightMap, uv, lod).r;
  // fractal detail below a texel: coastlines that keep their wiggle when the map is magnified
  float fine = 1.0 - smoothstep(0.5, 2.0, fp / TEXM);
  float n = fine > 0.0 ? fbm(e * (6.371e6 / 9000.0), 4) : 0.0;
  float w = clamp(fp / TEXM, 0.04, 0.5);
  s.land = smoothstep(0.5 - w, 0.5 + w, L.r + n * 0.32 * fine);
  s.ice = smoothstep(0.35, 0.65, L.g + n * 0.2 * fine) * s.land;
  s.urban = L.b;
  // night lights: the map's glow; magnified, it breaks into towns and streets, points of light on a ~1.2 km grid as
  // dense as the glow, over a dimmer haze
  float pts = 0.0;
  if (fine > 0.0) {
    vec3 g = e * (6.371e6 / 1200.0), id = floor(g), f = fract(g) - 0.5;
    float h = hash13(id);
    pts = step(1.0 - li * 1.5, h) * exp(-dot(f, f) * 9.0) * (0.6 + 0.8 * hash13(id + 7.1));
    pts *= 0.6 + 0.4 * smoothstep(-0.2, 0.6, fbm(e * (6.371e6 / 6000.0), 2));
  }
  s.lights = mix(li, li * 0.35 + pts * 1.4, fine) * s.land;
  return s;
}
/** Daylight albedo: deep ocean, land by latitude and dryness (subtropical deserts, temperate and boreal forest, tundra), ice. */
vec3 earthDay(vec3 e, Surf s) {
  float lat = abs(asin(clamp(e.y, -1.0, 1.0))) * 57.29578;
  float dry = smoothstep(8.0, 22.0, lat) * (1.0 - smoothstep(30.0, 40.0, lat)) + 0.35 * fbm(e * 7.0, 4);
  vec3 forest = mix(vec3(0.045, 0.055, 0.03), vec3(0.06, 0.06, 0.04), smoothstep(45.0, 60.0, lat));
  vec3 desert = vec3(0.34, 0.25, 0.15);
  vec3 tundra = vec3(0.12, 0.11, 0.09);
  vec3 landC = mix(mix(forest, desert, sat(dry)), tundra, smoothstep(58.0, 68.0, lat));
  landC *= 0.85 + 0.3 * (fbm(e * 40.0, 4) * 0.5 + 0.5);
  vec3 ocean = mix(vec3(0.004, 0.018, 0.05), vec3(0.008, 0.03, 0.06), fbm(e * 12.0, 3) * 0.5 + 0.5);
  vec3 c = mix(ocean, landC, s.land);
  return mix(c, vec3(0.75, 0.8, 0.86), s.ice);
}
/** Cloud cover at e (0..1): swirled, banded by latitude, slowly drifting with time t. */
float clouds(vec3 e, float t) {
  vec3 q = e * 3.2 + vec3(t * 0.004, 0.0, 0.0);
  vec3 wq = vec3(fbm(q + 1.7, 3), fbm(q + 9.2, 3), fbm(q + 4.4, 3));
  float n = fbm(q * 2.0 + wq * 1.6, 5);
  float lat = abs(e.y);
  float band = 0.75 + 0.35 * smoothstep(0.55, 0.85, lat) - 0.25 * smoothstep(0.1, 0.35, lat) * (1.0 - smoothstep(0.4, 0.55, lat));
  return smoothstep(0.08, 0.55, n * band + 0.05);
}
`;
