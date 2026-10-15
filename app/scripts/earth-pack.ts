// Packs Natural Earth (public domain, naturalearthdata.com) GeoJSON into src/assets/earth.json for the remix's globe:
// rings of [lon, lat] at 0.02 degree, delta-encoded integers, and populated places as [lon, lat, population / 1000].
// usage: bun scripts/earth-pack.ts <dir with ne_50m_land, ne_50m_lakes, ne_50m_glaciated_areas, ne_50m_urban_areas,
//        ne_10m_populated_places_simple .geojson (github.com/nvkelso/natural-earth-vector, geojson/)> src/assets/earth.json
const D = process.argv[2]!, OUT = process.argv[3]!;
const Q = 50; // 1/50 degree
type Geo = { features: { geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> }[] };
const load = async (n: string) => (await Bun.file(`${D}/${n}.geojson`).json()) as Geo;
function rings(g: Geo) {
  const out: number[][] = [];
  for (const f of g.features) {
    const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][][];
    for (const poly of polys) for (const ring of poly) {
      const r: number[] = [];
      let px = 0, py = 0, first = true;
      for (const [lon, lat] of ring) {
        const x = Math.round(lon! * Q), y = Math.round(lat! * Q);
        if (!first && x === px && y === py) continue;
        r.push(first ? x : x - px, first ? y : y - py);
        px = x; py = y; first = false;
      }
      if (r.length >= 6) out.push(r);
    }
  }
  return out;
}
const land = rings(await load('ne_50m_land'));
const lakes = rings(await load('ne_50m_lakes'));
const ice = rings(await load('ne_50m_glaciated_areas'));
const urban = rings(await load('ne_50m_urban_areas'));
const pp = await load('ne_10m_populated_places_simple');
const places: number[] = [];
for (const f of pp.features) {
  const [lon, lat] = f.geometry.coordinates as number[];
  const pop = Number(f.properties.pop_max ?? 0);
  if (pop < 1000) continue;
  places.push(Math.round(lon! * Q), Math.round(lat! * Q), Math.round(pop / 1000));
}
await Bun.write(OUT, JSON.stringify({ source: 'Natural Earth (public domain), 1:50m land, lakes, glaciated areas, urban areas; 1:10m populated places', q: Q, land, lakes, ice, urban, places }));
console.log(land.length, lakes.length, ice.length, urban.length, places.length / 3);
