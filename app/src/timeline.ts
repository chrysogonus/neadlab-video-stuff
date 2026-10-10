// The edit: which plate plays when. Boundaries are anchored to lyric lines and snapped to the
// beat grid, so they follow the aligned data (data/lyrics.json, data/audio.json). See docs/TREATMENT.md.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  /** Cut on the last beat at/before the first word of the matching line (never after the word). */
  const cut = (q: string, nth = 0, tol = 0.02) => {
    const s = ly.get(q, nth).words[0]!.start;
    return au.timeOfBeat(Math.floor(au.beatAt(s + tol)));
  };

  const b = {
    ice: cut("I couldn't read"),
    keep: cut("I don't have to break"),
    wait1: cut("I'll wait for you", 0),
    qubits: cut('stacking up the qubits'),
    passwords: cut('You changed all'),
    newmath: cut('They handed you'),
    wait2: cut("I'll wait for you", 1),
    ticket: cut('Ticket opened'),
    petabytes: cut('Somebody asked'),
    wait3: cut('I waited for you'),
    thaw: cut('The fridge hums'),
    secure: cut('Connection secure'),
    end: au.duration,
  };

  const E = (id: string, file: string, start: number, end: number, extra: Partial<TimelineEntry> = {}): TimelineEntry =>
    ({ id, load: scene(file), start, end, ...extra });

  return [
    E('send', 'send', 0, b.ice),
    E('ice', 'ice', b.ice, b.keep),
    E('keep', 'keep', b.keep, b.wait1),
    E('wait1', 'wait', b.wait1, b.qubits, { params: { n: 1 } }),
    E('qubits', 'qubits', b.qubits, b.passwords),
    E('passwords', 'passwords', b.passwords, b.newmath),
    E('newmath', 'newmath', b.newmath, b.wait2),
    E('wait2', 'wait', b.wait2, b.ticket, { params: { n: 2 } }),
    E('ticket', 'ticket', b.ticket, b.petabytes),
    E('petabytes', 'petabytes', b.petabytes, b.wait3),
    E('wait3', 'wait', b.wait3, b.thaw, { params: { n: 3 } }),
    E('thaw', 'thaw', b.thaw, b.secure),
    E('secure', 'secure', b.secure, b.end),
  ];
}
