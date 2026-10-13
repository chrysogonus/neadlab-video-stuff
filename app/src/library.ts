// The scene library: every scenes/lib-*.ts by name, with its schema (what it takes, what it is for). The cue
// sheet's entries that play a library scene are checked against it, and the gallery plays them all (in this order).
import type { CueSheet } from './engine/cues';
import { paramProblems, type SceneSchema } from './engine/schema';
import { schema as chart } from './scenes/lib-chart';
import { schema as chat } from './scenes/lib-chat';
import { schema as code } from './scenes/lib-code';
import { schema as compare } from './scenes/lib-compare';
import { schema as counter } from './scenes/lib-counter';
import { schema as field } from './scenes/lib-field';
import { schema as flow } from './scenes/lib-flow';
import { schema as list } from './scenes/lib-list';
import { schema as lyric } from './scenes/lib-lyric';
import { schema as plain } from './scenes/lib-plain';
import { schema as pulse } from './scenes/lib-pulse';
import { schema as quote } from './scenes/lib-quote';
import { schema as slam } from './scenes/lib-slam';
import { schema as steps } from './scenes/lib-steps';
import { schema as terminal } from './scenes/lib-terminal';
import { schema as timeline } from './scenes/lib-timeline';
import { schema as title } from './scenes/lib-title';

export const LIBRARY: Record<string, SceneSchema> = {
  'lib-plain': plain,
  'lib-slam': slam,
  'lib-lyric': lyric,
  'lib-quote': quote,
  'lib-title': title,
  'lib-pulse': pulse,
  'lib-field': field,
  'lib-chat': chat,
  'lib-terminal': terminal,
  'lib-list': list,
  'lib-counter': counter,
  'lib-chart': chart,
  'lib-timeline': timeline,
  'lib-compare': compare,
  'lib-steps': steps,
  'lib-flow': flow,
  'lib-code': code,
};

/** Problems with the parameters of the sheet's library entries and their cues (see LIBRARY). */
export function libraryProblems(sheet: CueSheet): string[] {
  const out: string[] = [];
  for (const e of sheet.entries) {
    const s = LIBRARY[e.file];
    if (!s) {
      if (e.file.startsWith('lib-')) out.push(`entry ${e.id}: no library scene '${e.file}' (has: ${Object.keys(LIBRARY).join(', ')})`);
      continue;
    }
    out.push(...paramProblems(s.entry, e.params, `entry ${e.id} (${e.file})`));
    for (const c of sheet.cues) if (c.scene === e.id) out.push(...paramProblems(s.cue, c.params, `${c.id} (${e.file})`));
  }
  return out;
}
