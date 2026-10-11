// The export page's URL for render.ts: the dev server URL (which may carry its own path or query) with the
// render's parameters set through URLSearchParams.
export function pageURL(base: string, o: { song: string; only?: string; scale?: number }) {
  const u = new URL(base);
  u.searchParams.set('export', '1');
  u.searchParams.set('song', o.song);
  if (o.only) u.searchParams.set('only', o.only);
  if (o.scale && o.scale !== 1) u.searchParams.set('scale', String(o.scale));
  return u.href;
}
