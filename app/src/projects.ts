// The projects this app renders: one directory per video under projects/ at the repo root, each with a
// project.json (which the analysis pipeline reads too). Every project-specific path follows from the id, so
// the preview audio, the analysis data, the export master and the output file always agree.
// Browser: ?project=<id>; scripts/render.ts: --project <id>; neither: the only project, if there is one.

/** projects/<id>/project.json */
export interface ProjectJson {
  title: string;
  kind: 'song' | 'explainer';
  /** Lossless master, relative to the project directory. */
  audio: string;
  /** Lyric sheet or script, relative to the project directory. */
  transcript: string;
  /** Pipeline steps (./vid) that never run: their committed outputs cannot be made again. */
  frozen?: string[];
}

export interface Project {
  id: string;
  title: string;
  kind: ProjectJson['kind'];
  /** Lossless master the export muxes into the mp4 (the analysis reads it too), relative to the repo root. */
  master: string;
  /** Compressed stream the browser plays, relative to the repo root. Preview only. */
  preview: string;
  /** Directory of audio.json and lyrics.json, relative to the repo root (and served at that URL path). */
  data: string;
  /** Default output file for `bun scripts/render.ts video`, relative to the repo root. */
  out: string;
}

/** The project with this id among `all` (id -> project.json); an unknown or missing id throws with the list. */
export function getProject(all: Record<string, ProjectJson>, id?: string | null): Project {
  const ids = Object.keys(all).sort();
  const pick = id ?? (ids.length === 1 ? ids[0] : undefined);
  if (!pick) throw new Error(`choose a project (?project=<id>, --project <id>): ${ids.join(', ')}`);
  const p = all[pick];
  if (!p) throw new Error(`unknown project '${pick}' (projects/ has: ${ids.join(', ')})`);
  const dir = `projects/${pick}`;
  return {
    id: pick, title: p.title, kind: p.kind,
    master: `${dir}/${p.audio}`, preview: `${dir}/data/preview.mp3`, data: `${dir}/data`, out: `out/${pick}.mp4`,
  };
}
