#!/usr/bin/env bun
// Mechanical checks of what the pipeline's model steps write, by stage (./vid make runs them after each step and
// hands the problems back to the step until they are gone):
//   style   data/style.json loads; every palette has bg, type and accent; contrast type/bg >= 7, accent/bg >= 3
//   cues    data/cues.json resolves against the data (every line covered, cuts, anchors, sections), library
//           scene parameters match their schemas, every entry plays a library scene or a custom <id>-<name> scene
//           pictures over type: at most 2 entries set the lyric as type (lib-lyric, lib-slam, lib-quote); a song
//           plays 4 to 8 custom scenes
//   scenes  every entry's scene module exists, and the app typechecks
//   scene:<file>  that one custom scene exists, and the app typechecks (the scenes step writes them one at a time)
//   bun scripts/check.ts <id> <stage...>     (prints the problems; exit 1 if there are any)
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Lyrics } from '../src/engine/lyrics';
import { AudioData } from '../src/engine/audio';
import { CueError, resolveCues, resolveEntries, type CueSheet } from '../src/engine/cues';
import { makeStyle } from '../src/engine/style';
import { LIBRARY, libraryProblems } from '../src/library';
import { ROOT, project } from './projects';

const [id, ...stages] = process.argv.slice(2);
const p = project(id);
const DATA = path.join(ROOT, p.data), SCENES = path.join(ROOT, 'app/src/scenes');
const problems: string[] = [];

/** WCAG contrast ratio of two hex colours. */
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  };
  const [x, y] = [lum(a), lum(b)].sort((u, v) => v - u);
  return (x! + 0.05) / (y! + 0.05);
}

/** Library scenes whose content is the sung line itself, set as type. */
const LYRIC_TYPE = ['lib-lyric', 'lib-slam', 'lib-quote'];

const json = (f: string) => {
  const file = path.join(DATA, f);
  if (!existsSync(file)) { problems.push(`${f}: missing`); return null; }
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch (e) { problems.push(`${f}: not valid JSON (${(e as Error).message})`); return null; }
};

function checkStyle() {
  const j = json('style.json');
  if (!j) return;
  try { makeStyle(j); } catch (e) { problems.push((e as Error).message); return; }
  const hex = /^#[0-9a-f]{6}$/i;
  for (const [name, pal] of Object.entries((j.palettes ?? {}) as Record<string, Record<string, string>>)) {
    for (const k of ['bg', 'type', 'accent']) if (!hex.test(pal[k] ?? '')) problems.push(`style.json: palette '${name}' needs "${k}" as #RRGGBB`);
    for (const [k, v] of Object.entries(pal)) if (!hex.test(v)) problems.push(`style.json: palette '${name}' ${k} '${v}' is not #RRGGBB`);
    if (hex.test(pal.bg ?? '') && hex.test(pal.type ?? '') && contrast(pal.type!, pal.bg!) < 7)
      problems.push(`style.json: palette '${name}': type on bg has contrast ${contrast(pal.type!, pal.bg!).toFixed(1)}, needs >= 7`);
    if (hex.test(pal.bg ?? '') && hex.test(pal.accent ?? '') && contrast(pal.accent!, pal.bg!) < 3)
      problems.push(`style.json: palette '${name}': accent on bg has contrast ${contrast(pal.accent!, pal.bg!).toFixed(1)}, needs >= 3`);
  }
  if (!j.palettes) problems.push('style.json: needs "palettes"');
}

async function checkCues(scenes: boolean) {
  const sheet = json('cues.json') as CueSheet | null;
  if (!sheet) return;
  const ly = new Lyrics(await Bun.file(path.join(DATA, 'lyrics.json')).json());
  const au = new AudioData(await Bun.file(path.join(DATA, 'audio.json')).json());
  let palettes: string[] | undefined;
  try { palettes = Object.keys(makeStyle(json('style.json') ?? undefined).palettes); } catch { /* reported by the style stage */ }
  problems.push(...libraryProblems(sheet));
  for (const e of sheet.entries ?? []) {
    if (typeof e?.file !== 'string') continue;
    if (!LIBRARY[e.file] && !e.file.startsWith(`${p.id}-`) && !existsSync(path.join(SCENES, `${e.file}.ts`)))
      problems.push(`entry ${e.id}: file '${e.file}' is neither a library scene nor a custom scene named '${p.id}-<name>'`);
    else if (scenes && !existsSync(path.join(SCENES, `${e.file}.ts`))) problems.push(`entry ${e.id}: app/src/scenes/${e.file}.ts does not exist`);
  }
  const files = (sheet.entries ?? []).map((e) => e?.file).filter((f): f is string => typeof f === 'string');
  const type = files.filter((f) => LYRIC_TYPE.includes(f)).length;
  if (type > 2) problems.push(`cues.json: ${type} entries set the lyric as type (${LYRIC_TYPE.join(', ')}); at most 2 (the karaoke layer carries the words, scenes show pictures)`);
  const custom = new Set(files.filter((f) => f.startsWith(`${p.id}-`))).size;
  if (p.kind === 'song' && (custom < 4 || custom > 8)) problems.push(`cues.json: ${custom} custom scenes; a song plays 4 to 8 (the pictures the library cannot draw)`);
  try { resolveEntries(ly, au, sheet, resolveCues(ly, au, sheet, palettes)); } catch (e) {
    if (e instanceof CueError) problems.push(...e.problems); else problems.push(String(e));
  }
}

function checkTypes() {
  const r = Bun.spawnSync(['bunx', 'tsc', '--noEmit', '-p', 'tsconfig.json'], { cwd: path.join(ROOT, 'app') });
  if (r.exitCode !== 0) problems.push(...r.stdout.toString().trim().split('\n').filter(Boolean).map((l) => `typecheck: ${l}`));
}

if (!stages.length) throw new Error('usage: bun scripts/check.ts <id> style|cues|scenes|scene:<file> ...');
for (const s of stages) {
  if (s === 'style') checkStyle();
  else if (s === 'cues') await checkCues(false);
  else if (s === 'scenes') { await checkCues(true); checkTypes(); }
  else if (s.startsWith('scene:')) {
    if (!existsSync(path.join(SCENES, `${s.slice(6)}.ts`))) problems.push(`app/src/scenes/${s.slice(6)}.ts does not exist`);
    checkTypes();
  }
  else throw new Error(`unknown stage '${s}'`);
}
const uniq = [...new Set(problems)];
if (uniq.length) { console.log(`${uniq.length} problem(s):\n${uniq.map((x) => `- ${x}`).join('\n')}`); process.exit(1); }
console.log(`${p.id}: ${stages.join(', ')} ok`);
