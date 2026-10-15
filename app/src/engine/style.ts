// A project's look (projects/<id>/data/style.json): named palettes, font roles and the karaoke layer. Scenes
// read it from ctx.style; a cue's `palette` names one of the palettes. A project without a style.json gets
// DEFAULT_STYLE. Colours are hex strings; a karaoke colour may also name a palette key, looked up in the palette
// of the cue on screen (so the lyric stays legible on every ground).
import { F } from './type';

export interface FontSpec {
  family: 'archivo' | 'archivoItalic' | 'serif' | 'mono';
  /** Archivo width in percent (62..125). */
  width?: number;
  weight?: number;
  italic?: boolean;
}

export interface KaraokeStyle {
  /** Palette its colours are looked up in where no cue names one. */
  palette: string;
  font: FontSpec;
  /** Largest type size (logical px); long lines step down to `minSize` before wrapping to a second row. */
  size: number;
  minSize: number;
  sung: string;
  unsung: string;
  /** Alpha of the words not yet sung. */
  unsungAlpha: number;
  /** The word being sung, settling to `sung` after it ends. */
  active: string;
  /** Baseline of the line's last row, as a fraction of the frame height. */
  y: number;
  /** Darkening behind the lyric (0 = none): a gradient from the bottom edge in `scrimColor`. */
  scrim: number;
  scrimColor: string;
  /** The next line, smaller and dim, under the current one (when it starts within 4 s). */
  next: boolean;
}

export interface Style {
  palettes: Record<string, Record<string, string>>;
  fonts: Record<string, FontSpec>;
  /** The project-wide karaoke layer (shown under every scene that does not draw its own lyrics); false = off. */
  karaoke: KaraokeStyle | false;
  /** Picture aspect: wider than 16:9 (e.g. 2.39) puts black bars above and below every frame (the lyrics may sit in the lower one). */
  aspect?: number;
  /** Post-processing defaults for the whole project (a scene's own overrides still win), e.g. anamorphic streaks. */
  post?: Record<string, unknown>;
}

export const DEFAULT_KARAOKE: KaraokeStyle = {
  palette: 'main', font: { family: 'archivo', width: 100, weight: 700 }, size: 64, minSize: 44,
  sung: 'type', unsung: 'type', unsungAlpha: 0.32, active: 'accent', y: 0.86, scrim: 0.5, scrimColor: 'bg', next: true,
};

export const DEFAULT_STYLE: Style = {
  palettes: { main: { bg: '#0B0B0E', panel: '#16161B', dim: '#6B6B75', type: '#F2F0EA', accent: '#FFC24B' } },
  fonts: {
    display: { family: 'archivo', width: 100, weight: 900 }, body: { family: 'archivo', width: 100, weight: 500 },
    mono: { family: 'mono', weight: 400 }, serif: { family: 'serif', weight: 400, italic: true },
  },
  karaoke: DEFAULT_KARAOKE,
};

export type StyleJson = Partial<Omit<Style, 'karaoke'>> & { karaoke?: Partial<KaraokeStyle> | false };

/**
 * A style.json (possibly partial) over the defaults: its palettes replace the default one, font roles merge by
 * name, karaoke merges by field (its palette defaults to the first one). Throws on a karaoke colour that is
 * neither a hex colour nor a key of every palette (a cue may put any of them on screen).
 */
export function makeStyle(json?: StyleJson): Style {
  const palettes = json?.palettes ?? DEFAULT_STYLE.palettes;
  const k = json?.karaoke;
  const style: Style = {
    palettes,
    fonts: { ...DEFAULT_STYLE.fonts, ...json?.fonts },
    karaoke: k === false ? false : { ...DEFAULT_KARAOKE, palette: Object.keys(palettes)[0]!, ...k },
    ...(json?.aspect ? { aspect: json.aspect } : {}),
    ...(json?.post ? { post: json.post } : {}),
  };
  if (style.karaoke) {
    const ks = style.karaoke;
    if (!palettes[ks.palette]) throw new Error(`style.json: karaoke palette '${ks.palette}' is not one of ${Object.keys(palettes).join(', ')}`);
    for (const f of ['sung', 'unsung', 'active', 'scrimColor'] as const) {
      if (/^#[0-9a-f]{6}$/i.test(ks[f])) continue;
      const lacking = Object.keys(palettes).filter((n) => !(ks[f] in palettes[n]!));
      if (lacking.length) throw new Error(`style.json: karaoke ${f} '${ks[f]}' is neither a hex colour nor a key of palette '${lacking.join("', '")}'`);
    }
  }
  return style;
}

/** A colour: a key of the palette, or the hex value itself. */
export const colorIn = (pal: Record<string, string>, c: string) => pal[c] ?? c;

/** The loaded font family (Canvas2D) for a spec. */
export function fontFamily(s: FontSpec): string {
  switch (s.family) {
    case 'archivo': return F.archivo(s.width, s.weight);
    case 'archivoItalic': return F.archivoItalic(s.width, s.weight);
    case 'serif': return F.serif(s.weight, s.italic);
    case 'mono': return F.mono(s.weight, s.italic);
  }
}
