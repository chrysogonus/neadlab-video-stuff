// The projects on disk (projects/*/project.json, and their cue sheets and styles) for the scripts and tests; the
// browser globs them (main.ts).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getProject, type Project, type ProjectJson } from '../src/projects';
import type { CueSheet } from '../src/engine/cues';
import { makeStyle, type Style } from '../src/engine/style';

export const ROOT = path.resolve(import.meta.dir, '../..');
const DIR = path.join(ROOT, 'projects');

export function loadProjects(): Record<string, ProjectJson> {
  return Object.fromEntries(readdirSync(DIR)
    .filter((id) => existsSync(path.join(DIR, id, 'project.json')))
    .map((id) => [id, JSON.parse(readFileSync(path.join(DIR, id, 'project.json'), 'utf8')) as ProjectJson]));
}

export const project = (id?: string | null): Project => getProject(loadProjects(), id);

const dataFile = (id: string, f: string) => path.join(ROOT, 'projects', id, 'data', f);

/** projects/<id>/data/cues.json, or null for a project without one. */
export const loadSheet = (id: string): CueSheet | null =>
  existsSync(dataFile(id, 'cues.json')) ? JSON.parse(readFileSync(dataFile(id, 'cues.json'), 'utf8')) : null;

/** projects/<id>/data/style.json over the defaults (see makeStyle). */
export const loadStyle = (id: string): Style =>
  makeStyle(existsSync(dataFile(id, 'style.json')) ? JSON.parse(readFileSync(dataFile(id, 'style.json'), 'utf8')) : undefined);
