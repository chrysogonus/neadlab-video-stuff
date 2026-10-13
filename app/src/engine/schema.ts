// What a library scene takes (src/scenes/lib-*.ts export a `schema`): its parameters on the timeline entry and
// on each cue, whether it draws the lyric itself, and an example. The cue sheet's entries and cues are checked
// against it when the sheet loads (a sheet is data, written by hand or by a model), and the gallery plays every
// scene with its example.

export interface ParamSpec {
  type: 'string' | 'number' | 'boolean' | 'string[]' | 'number[]';
  description: string;
  /** Used when the parameter is not given; a parameter without a default is required. */
  default?: unknown;
  /** Allowed values (strings). */
  enum?: readonly string[];
  min?: number;
  max?: number;
}

export interface SceneSchema {
  /** What it shows and what it is for, in a sentence or two (read by the model that writes cue sheets). */
  description: string;
  /** The kinds of video it suits. */
  kinds: readonly ('song' | 'explainer')[];
  /** 'own': it draws the sung/spoken line itself (Scene.ownsLyrics); 'layer': the karaoke layer does. */
  lyrics: 'own' | 'layer';
  /** Parameters of the timeline entry (EntryDef.params). */
  entry: Record<string, ParamSpec>;
  /** Parameters of each of its cues (CueDef.params). */
  cue: Record<string, ParamSpec>;
  /** Sample parameters: the gallery's entry params, and its cues' params in turn. */
  example: { entry: Record<string, unknown>; cues: Record<string, unknown>[] };
}

const ok = (s: ParamSpec, v: unknown): boolean => {
  switch (s.type) {
    case 'string': return typeof v === 'string' && (!s.enum || s.enum.includes(v));
    case 'number': return typeof v === 'number' && Number.isFinite(v) && !(s.min !== undefined && v < s.min) && !(s.max !== undefined && v > s.max);
    case 'boolean': return typeof v === 'boolean';
    case 'string[]': return Array.isArray(v) && v.every((x) => typeof x === 'string');
    case 'number[]': return Array.isArray(v) && v.every((x) => typeof x === 'number' && Number.isFinite(x));
  }
};

const want = (s: ParamSpec) =>
  s.enum ? `one of ${s.enum.join(', ')}` : `a ${s.type}${s.min !== undefined || s.max !== undefined ? ` in ${s.min ?? '-∞'}..${s.max ?? '∞'}` : ''}`;

/** Problems with `params` against `specs` (unknown names, missing required ones, wrong types), prefixed by `where`. */
export function paramProblems(specs: Record<string, ParamSpec>, params: Record<string, unknown> | undefined, where: string): string[] {
  const out: string[] = [];
  const p = params ?? {};
  for (const k of Object.keys(p)) if (!specs[k]) out.push(`${where}: unknown parameter '${k}' (takes: ${Object.keys(specs).join(', ') || 'none'})`);
  for (const [k, s] of Object.entries(specs)) {
    if (p[k] === undefined) { if (s.default === undefined) out.push(`${where}: needs parameter '${k}' (${s.description})`); }
    else if (!ok(s, p[k])) out.push(`${where}: parameter '${k}' must be ${want(s)}, not ${JSON.stringify(p[k])}`);
  }
  return out;
}

/** `params` over the defaults of `specs`. */
export function withDefaults<T = Record<string, any>>(specs: Record<string, ParamSpec>, params: Record<string, unknown> | undefined): T {
  return { ...Object.fromEntries(Object.entries(specs).map(([k, s]) => [k, s.default])), ...params } as T;
}
