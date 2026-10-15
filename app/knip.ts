import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { KnipConfig } from 'knip';
import type { CueSheet } from './src/engine/cues';

// Cue sheets name scene modules as data, so static import analysis cannot find all entry points.
const projects = path.resolve(import.meta.dirname, '../projects');
const scenes = readdirSync(projects).flatMap((id) => {
  const file = path.join(projects, id, 'data/cues.json');
  if (!existsSync(file)) return [];
  const sheet = JSON.parse(readFileSync(file, 'utf8')) as CueSheet;
  return sheet.entries.map((e) => `src/scenes/${e.file}.ts`);
});

export default {
  entry: ['scripts/*.ts', 'test/**/*.test.ts', ...new Set(scenes)],
  project: ['src/**/*.ts', 'scripts/**/*.ts', 'test/**/*.ts'],
} satisfies KnipConfig;
