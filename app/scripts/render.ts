#!/usr/bin/env bun
// Offline renderer. Drives the app in headless Chrome (?export=1) and either
//   gpu:     bun scripts/render.ts gpu                 (prints the WebGL renderer string)
//   stills:  bun scripts/render.ts stills --t 1.5,23,40.2 [--only id1,id2] [--out dir]
//   sheet:   bun scripts/render.ts sheet --from 20 --to 35 [--n 12] [--cols 4] [--only ids] [--out file.png]   (or --times a,b,c | --cuts)
//   sheets:  bun scripts/render.ts sheets --spec file.json   (several labelled contact sheets in one page load: the spec is
//            [{ "out": "a.png", "times": [..], "labels": [..], "cols": 4 }, ...]; the pipeline's review uses it)
//   gallery: bun scripts/render.ts gallery [--palette night|day] [--only lib-a,lib-b] [--out file.png]   (the scene library over
//            the project's song, src/gallery.ts: a contact sheet, one row per scene at four moments; with --only also
//            full-size stills of those scenes in out/gallery/<scene>/)
//   plates:  bun scripts/render.ts plates   (renders one representative JPEG per plate into public/plates/ (used by the outro's rewind), times from plates.json or entry midpoints)
//   perf:    bun scripts/render.ts perf --from 20 --to 25 [--only ids] [--samples 1] [--shutter 0.5]   (avg ms per frame incl. GPU sync and the export's pixel readback)
//   check:   bun scripts/render.ts check --t 10,55,140 (seek/order determinism: the frames rendered in order, in reverse,
//            and each after a far seek must be byte-identical; also with --samples N)
//   video:   bun scripts/render.ts video [--from 0] [--to <duration>] [--fps 60] [--crf 16] [--x264 aq-mode=3] [--samples 1] [--shutter 0.5] [--out <project's out>] [--noaudio]
//            [--workers 2] [--chunk 8] [--mem-gb 1] [--spool-gb 20]
//            --samples N averages N sub-frames per frame over shutter×(1/fps): motion blur + temporal AA;
//            --samples auto picks the count per 32x32 tile (12, 36, 108 or 324, see Engine.render; --refine frame: per frame)
//            --workers N headless Chromes render chunks of --chunk frames into one ffmpeg, in order (see video())
//   --scale N (all modes): render at N× the 1920x1080 layout (--scale 2 = true 3840x2160); stills are then saved
//            full-res from the pixel buffer, videos are encoded at the physical size.
//   --project ID (all modes): which project of projects/ to render (needed when there are several). The page
//            loads that project's data and timeline; the video muxes its master and defaults to out/<id>.mp4.
//   --gallery (all modes): load the gallery (?gallery, on --palette night|day) instead of the project's own edit.
//   --coverage (stills/check): sample every entry, anchor and transition; stills also writes samples.json.
//   A scene that fails to load or throws while rendering fails the run (non-zero exit).
// Uses the Vite dev server at --url (default http://localhost:5173); starts a private one if unreachable.
import { chromium, type Page } from 'playwright-core';
import { mkdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { project } from './projects';
import { pageURL } from './page-url';
import { coverageTimes, frameFile, type CoverageEntry, type RenderManifest } from './quality-checks';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k: string) => argv.includes(`--${k}`);
const APP = path.resolve(import.meta.dir, '..');
const SCALE = Math.max(1, Math.round(+opt('scale', '1')!));
const OW = 1920 * SCALE, OH = 1080 * SCALE; // output size
// --samples N (fixed) or --samples auto [--min-samples 4] [--max-samples 324] [--tol 3] [--refine tiles|frame]
// (adaptive, see Engine.render)
const SAMPLES = opt('samples', '1') === 'auto'
  ? { min: +opt('min-samples', '4')!, max: +opt('max-samples', '324')!, tol: +opt('tol', '3')!, refine: opt('refine', 'tiles') as 'tiles' | 'frame' }
  : +opt('samples', '1')!;
const GALLERY = mode === 'gallery' || flag('gallery');
const hist = (h: Record<string, number>) => Object.entries(h).sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}:${v}`).join(' ');
const ROOT = path.resolve(APP, '..');
const PROJECT = project(opt('project'));

async function reachable(url: string) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; }
}

async function ensureServer(): Promise<{ url: string; stop: () => void }> {
  const url = opt('url', 'http://localhost:5173')!;
  if (await reachable(url)) return { url, stop: () => {} };
  const port = 5300 + Math.floor(Math.random() * 500);
  // no live reload: a file saved mid-render must not reload the page
  const proc = Bun.spawn(['bunx', 'vite', '--port', String(port), '--strictPort'], { cwd: APP, stdout: 'ignore', stderr: 'ignore', env: { ...process.env, VIDEO_NO_HMR: '1' } });
  const u = `http://localhost:${port}`;
  for (let i = 0; i < 100 && !(await reachable(u)); i++) await Bun.sleep(100);
  return { url: u, stop: () => proc.kill() };
}

// Chrome: an explicit binary (CHROME_PATH or --chrome), since no Linux box has a 'chrome' channel.
const CHROME = opt('chrome', process.env.CHROME_PATH ?? `${process.env.HOME}/opt/chrome/opt/google/chrome/chrome`)!;
// ANGLE backend: 'gl' goes through WSLg's D3D12 to the real GPU. 'vulkan' never works under WSL
// (no hardware Vulkan ICD; it silently lands on lavapipe) and hangs the app's boot.
const ANGLE = opt('angle', 'gl')!;
// WSL exposes /dev/dxg but no DRM render node, so a *headless* Chrome finds no usable EGL config
// and falls back to SwiftShader. Driven through WSLg's X display it gets hardware GL, so default
// to headed whenever DISPLAY is set. --headless forces software; --headed forces a window.
const HEADLESS = flag('headless') || (!flag('headed') && !process.env.DISPLAY);
// D3D12 otherwise picks the integrated GPU; name the discrete one.
const ADAPTER = opt('adapter', process.env.MESA_D3D12_DEFAULT_ADAPTER_NAME ?? 'NVIDIA')!;

async function openPage(url: string) {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: HEADLESS,
    env: { ...process.env, MESA_D3D12_DEFAULT_ADAPTER_NAME: ADAPTER },
    args: [`--use-angle=${ANGLE}`, '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const logs: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const only = opt('only');
  // (built with URL so a --url carrying its own path or query keeps it)
  const extra: Record<string, string> = GALLERY ? { gallery: '1', palette: opt('palette', 'night')! } : {};
  await page.goto(pageURL(url, { project: PROJECT.id, only, scale: SCALE, extra }));
  await page.waitForFunction(() => (window as any).__video?.ready || (window as any).__video?.error, null, { timeout: 120000 });
  const err = await page.evaluate(() => (window as any).__video.error);
  if (err) throw new Error(`app failed to boot:\n${err}\n${logs.join('\n')}`);
  const loaded: string = await page.evaluate(() => (window as any).__video.project);
  if (loaded !== PROJECT.id) throw new Error(`page loaded project '${loaded}', expected '${PROJECT.id}'`);
  const size: [number, number] = await page.evaluate(() => [(window as any).__video.width ?? 1920, (window as any).__video.height ?? 1080]);
  if (size[0] !== OW || size[1] !== OH) throw new Error(`app renders ${size[0]}x${size[1]}, expected ${OW}x${OH} (--scale ${SCALE})`);
  await checkScenes(page);
  return { browser, page, logs };
}

/** Throw if any scene failed to load or threw while rendering (the engine records both in __video.errors). */
async function checkScenes(page: Page) {
  const sceneErrors: string[] = await page.evaluate(() => (window as any).__video.errors);
  if (sceneErrors.length) throw new Error('SCENE ERRORS:\n' + sceneErrors.join('\n'));
}

async function coverage(page: Page): Promise<RenderManifest> {
  const { entries, duration } = await page.evaluate(() => {
    const E = (window as any).__video.engine;
    return {
      duration: E.duration as number,
      entries: E.timeline.map((e: any) => ({
        id: e.id, start: e.start, end: e.end,
        anchors: e.params?.cues ? e.params.cues.map((c: any) => c.at)
          : E.lyrics.lines.filter((l: any) => l.start >= e.start && l.start < e.end).map((l: any) => l.start),
      })) as CoverageEntry[],
    };
  });
  if (typeof SAMPLES !== 'number') throw new Error('--coverage requires a fixed --samples count');
  return { project: PROJECT.id, width: OW, height: OH, samples: SAMPLES, shutter: +opt('shutter', '0.5')!, entries, times: coverageTimes(entries, duration) };
}

async function stills(page: Page, times: number[], outDir: string, covered = false) {
  mkdirSync(outDir, { recursive: true });
  const files: string[] = [];
  for (const t of times) {
    const k: number = await page.evaluate(([t, s, sh]) => (window as any).__video.still(t, s, sh), [t, SAMPLES, +opt('shutter', '0.5')!] as const);
    const f = path.join(outDir, covered ? frameFile(t) : `f_${t.toFixed(2).padStart(7, '0')}.png`);
    if (typeof SAMPLES !== 'number') console.log(`t=${t}: ${k} sub-frames`);
    // at scale > 1 the canvas is shown downscaled on the page: save the full-res pixel buffer instead
    if (SCALE !== 1) await Bun.write(f, Buffer.from(await page.evaluate(() => (window as any).__video.png()), 'base64'));
    else await page.screenshot({ path: f, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    files.push(f);
  }
  return files;
}

async function sheet(page: Page, times: number[], cols: number, out: string, labels?: string[]) {
  const dataUrl: string = await page.evaluate(async ({ times, cols, labels }) => {
    const P = (window as any).__video;
    const cw = 480, ch = 270, pad = 4, lab = 18;
    const rows = Math.ceil(times.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * (cw + pad) + pad; cv.height = rows * (ch + lab + pad) + pad;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#222'; c.fillRect(0, 0, cv.width, cv.height);
    const src = document.getElementById('c') as HTMLCanvasElement;
    times.forEach((t: number, i: number) => {
      P.still(t);
      const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + lab + pad);
      c.drawImage(src, x, y + lab, cw, ch);
      c.fillStyle = '#ddd'; c.font = '13px monospace'; c.fillText(`${labels?.[i] ? `${labels[i]}  ` : ''}${t.toFixed(2)}s`, x + 2, y + 13);
    });
    return cv.toDataURL('image/png');
  }, { times, cols, labels });
  mkdirSync(path.dirname(out), { recursive: true });
  await Bun.write(out, Buffer.from(dataUrl.split(',')[1]!, 'base64'));
}

/**
 * Render [from, to) into one encoder. `--workers N` headless Chromes (default 2; each its own GPU process)
 * take chunks of `--chunk` frames in order; the server puts their frames back in order and writes them to a
 * single ffmpeg, so the file is the same as with one worker. A frame is acknowledged once it is written or
 * waiting in a bounded reorder buffer, and each page keeps at most a few frames unacknowledged, so memory stays
 * bounded at 4K. One worker already keeps the GPU busy in the heavy scenes; a second one fills the gaps in the
 * light ones (2D drawing, readback, transfer).
 */
async function video(url: string, from: number, to: number, fps: number, out: string) {
  mkdirSync(path.dirname(out), { recursive: true });
  const crf = opt('crf', '16')!;
  const audio = path.join(ROOT, PROJECT.master);
  if (!flag('noaudio') && !existsSync(audio)) throw new Error(`master not found: ${audio}`);
  // (frames come as rgb24: the same YUV out of the scaler as from rgba, a quarter fewer bytes to move)
  const args = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${OW}x${OH}`, '-r', String(fps), '-i', 'pipe:0'];
  if (!flag('noaudio')) args.push('-ss', String(from), '-t', String(to - from), '-i', audio);
  // Frames are sRGB (toSRGB in the final pass): convert with the BT.709 matrix and tag the stream,
  // otherwise ffmpeg converts with BT.601 while players and YouTube decode untagged HD as BT.709.
  // scale tags the matrix and range; primaries and transfer need setparams (the -color_* output flags don't reach the stream).
  // (explicit maps: the rendered frames and the master's audio, whatever else the audio file carries)
  args.push('-map', '0:v');
  if (!flag('noaudio')) args.push('-map', '1:a');
  args.push('-vf', 'vflip,scale=out_color_matrix=bt709,setparams=color_primaries=bt709:color_trc=bt709', '-c:v', 'libx264', '-preset', opt('preset', 'slow')!, '-crf', crf, '-pix_fmt', 'yuv420p', '-tune', 'grain', '-x264-params', opt('x264', 'aq-mode=3')!);
  if (!flag('noaudio')) args.push('-c:a', 'aac', '-b:a', '320k', '-shortest');
  args.push('-movflags', '+faststart', out);
  const ff = Bun.spawn(args, { stdin: 'pipe', stdout: 'inherit', stderr: 'inherit' });

  const f0 = Math.round(from * fps), f1 = Math.round(to * fps), total = f1 - f0;
  const chunk = Math.max(1, +opt('chunk', '8')!);
  const workers = Math.max(1, Math.min(+opt('workers', '2')!, Math.ceil(total / chunk)));
  // reorder buffer: frames waiting for an earlier one or for the encoder, acknowledged while under ~1 GB in
  // memory; past that they go to a spool on disk (up to --spool-gb, default 20), so the renderers never wait
  // for x264 in the light scenes and x264 catches up in the heavy ones, where the CPU is free
  const frameBytes = OW * OH * 3;
  const cap = Math.max(4, Math.floor((+opt('mem-gb', '1')! * 1e9) / frameBytes));
  const spoolCap = Math.floor((+opt('spool-gb', '20')! * 1e9) / frameBytes);
  const spoolDir = path.join(tmpdir(), `video-spool-${process.pid}`);
  mkdirSync(spoolDir, { recursive: true });
  for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => { ff.kill(9); rmSync(spoolDir, { recursive: true, force: true }); process.exit(130); });
  const spooled = new Set<number>();
  let spoolPeak = 0;
  const spoolFile = (n: number) => path.join(spoolDir, `${n}.rgb`);
  const toSpool = (n: number, buf: Uint8Array) => {
    // (written synchronously: the frame must be on disk before drain() looks for it)
    writeFileSync(spoolFile(n), buf);
    spooled.add(n);
    spoolPeak = Math.max(spoolPeak, spooled.size);
  };
  const waiting = new Map<number, Uint8Array>();
  const owed = new Map<number, number>(); // frames in memory over the cap, not yet acknowledged -> their worker
  const queue: number[][] = Array.from({ length: workers }, () => []); // frame numbers each worker will send, in order
  const sockets: any[] = [];
  const ackCount = new Array(workers).fill(0);
  const ack = (k: number) => { ackCount[k]++; sockets[k]?.send(String(ackCount[k])); };
  let next = f0, written = 0, cursor = f0, ending = false;

  // any failure stops the render: closing the sockets makes every page's stream() throw
  let failure: Error | null = null, rejectFailed!: (e: Error) => void, resolveWritten!: () => void;
  const failed = new Promise<never>((_, rej) => { rejectFailed = rej; });
  failed.catch(() => {});
  const allWritten = new Promise<void>((res) => { resolveWritten = res; });
  const fail = (e: unknown) => {
    if (failure) return;
    failure = e instanceof Error ? e : new Error(String(e));
    for (const ws of sockets) ws?.close();
    rejectFailed(failure);
  };
  void ff.exited.then((code) => { if (!ending) fail(new Error(`ffmpeg exited early (code ${code})`)); });

  const t0 = performance.now();
  let draining = false;
  const drain = async () => {
    if (draining || failure) return;
    draining = true;
    try {
      while (!failure && (waiting.has(next) || spooled.has(next))) {
        let buf = waiting.get(next);
        if (buf) waiting.delete(next);
        else {
          buf = await Bun.file(spoolFile(next)).bytes();
          spooled.delete(next);
          rmSync(spoolFile(next));
        }
        ff.stdin.write(buf);
        await ff.stdin.flush();
        // a frame written is acknowledged if it was not yet; then the oldest owed while there is room
        const k = owed.get(next);
        if (k !== undefined) { owed.delete(next); ack(k); }
        next++; written++;
        for (const [m, kk] of owed) {
          if (waiting.size > cap) {
            if (spooled.size >= spoolCap) break;
            toSpool(m, waiting.get(m)!);
            waiting.delete(m);
          }
          owed.delete(m);
          ack(kk);
        }
        if (written % 60 === 0 || written === total) {
          const el = (performance.now() - t0) / 1000;
          process.stdout.write(`\r${written}/${total} frames  ${(written / el).toFixed(1)} fps  eta ${((total - written) / (written / el)).toFixed(0)}s   `);
        }
        if (written === total) resolveWritten();
      }
    } catch (e) { fail(e); } finally { draining = false; }
  };
  const server = Bun.serve<{ k: number }>({
    port: 0,
    fetch(req, srv) { return srv.upgrade(req, { data: { k: +(new URL(req.url).searchParams.get('w') ?? 0) } }) ? undefined : new Response('ws only', { status: 400 }); },
    websocket: {
      maxPayloadLength: Math.max(64 * 1024 * 1024, OW * OH * 3 + 1024),
      open(ws) { sockets[ws.data.k] = ws; if (failure) ws.close(); },
      message(ws, msg) {
        if (failure) return;
        try {
          const k = ws.data.k, n = queue[k]!.shift(), buf = msg as Uint8Array;
          if (n === undefined) throw new Error(`worker ${k} sent a frame it was not given`);
          if (buf.length !== frameBytes) throw new Error(`worker ${k} sent ${buf.length} bytes for frame ${n}`);
          if (waiting.size < cap || n === next) { waiting.set(n, buf); ack(k); }
          else if (spooled.size < spoolCap) { toSpool(n, buf); ack(k); }
          else { waiting.set(n, buf); owed.set(n, k); }
          void drain();
        } catch (e) { fail(e); }
      },
    },
  });
  // chunks in order from a shared cursor
  const take = () => { if (cursor >= f1) return null; const a = cursor; cursor = Math.min(f1, a + chunk); return [a, cursor] as const; };
  const pages: Awaited<ReturnType<typeof openPage>>[] = [];
  const used: Record<string, number> = {};
  const closePages = async () => {
    for (const p of pages.splice(0)) {
      if (p.logs.length) console.error('BROWSER LOG:\n' + p.logs.slice(0, 40).join('\n'));
      await p.browser.close().catch(() => {});
    }
  };
  let ok = false;
  try {
    const opened = await Promise.allSettled(Array.from({ length: workers }, () => openPage(url)));
    for (const o of opened) if (o.status === 'fulfilled') pages.push(o.value);
    for (const o of opened) if (o.status === 'rejected') throw o.reason;
    const rendering = Promise.all(pages.map(async ({ page }, k) => {
      for (let r = take(); r && !failure; r = take()) {
        for (let n = r[0]; n < r[1]; n++) queue[k]!.push(n);
        const h: Record<string, number> = await page.evaluate((o) => (window as any).__video.stream(o), {
          from: r[0] / fps, to: r[1] / fps, fps, ws: `ws://localhost:${server.port}/?w=${k}`, samples: SAMPLES, shutter: +opt('shutter', '0.5')!, inflight: 4,
        });
        for (const [c, m] of Object.entries(h)) used[c] = (used[c] ?? 0) + m;
        await checkScenes(page);
      }
    }));
    rendering.catch(() => {});
    // (a page error stops the render; a failure on this side stops waiting for the pages)
    await Promise.race([rendering, failed]).catch((e) => { fail(e); throw failure; });
    await Promise.race([allWritten, failed]);
    await closePages();
    ending = true;
    ff.stdin.end();
    const code = await ff.exited;
    if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`);
    ok = true;
  } finally {
    ending = true;
    // (killed, ffmpeg leaves an unplayable file rather than a finished-looking truncated one)
    if (!ok) ff.kill(9);
    await closePages();
    server.stop(true);
    rmSync(spoolDir, { recursive: true, force: true });
  }
  console.log(`\nwrote ${out} (${written} frames in ${((performance.now() - t0) / 1000).toFixed(1)}s, ${workers} workers${spoolPeak ? `, up to ${spoolPeak} frames spooled to disk` : ''})`);
  console.log(`sub-frames per frame (count:frames): ${hist(used)}`);
}

const { url, stop } = await ensureServer();
if (mode === 'video') {
  try {
    // (the duration comes from the audio analysis, the same in every page)
    const { browser, page } = await openPage(url);
    const dur: number = await page.evaluate(() => (window as any).__video.duration);
    await browser.close();
    await video(url, +opt('from', '0')!, +opt('to', String(dur))!, +opt('fps', '60')!, path.resolve(opt('out', path.join(ROOT, PROJECT.out))!));
  } finally { stop(); }
  process.exit(0);
}
const { browser, page, logs } = await openPage(url);
try {
  if (mode === 'gpu') {
    console.log(await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2')!;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    }));
  } else if (mode === 'stills') {
    const manifest = flag('coverage') ? await coverage(page) : null;
    const times = manifest?.times ?? (opt('t') ?? '0').split(',').map(Number);
    const out = opt('out', path.join(ROOT, 'out/stills'))!;
    const files = await stills(page, times, out, !!manifest);
    await checkScenes(page);
    if (manifest) writeFileSync(path.join(out, 'samples.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(files.join('\n'));
  } else if (mode === 'sheet') {
    const from = +opt('from', '0')!, to = +opt('to', '10')!, n = +opt('n', '12')!;
    let times = Array.from({ length: n }, (_, i) => from + ((to - from) * i) / Math.max(1, n - 1));
    if (opt('times')) times = opt('times')!.split(',').map(Number);
    if (flag('cuts')) {
      // 4 frames around every timeline boundary: 2 frames before, 2 after
      const tl: { id: string; start: number }[] = await page.evaluate(() => (window as any).__video.timeline);
      times = tl.slice(1).flatMap((e) => [e.start - 0.1, e.start - 1 / 60, e.start + 1 / 60, e.start + 0.1]);
    }
    const out = opt('out', path.join(ROOT, `out/sheets/sheet_${from}-${to}.png`))!;
    await sheet(page, times, +opt('cols', '4')!, out);
    console.log(out);
  } else if (mode === 'sheets') {
    const spec: { out: string; times: number[]; labels?: string[]; cols?: number }[] = await Bun.file(opt('spec')!).json();
    for (const s of spec) { await sheet(page, s.times, s.cols ?? 4, s.out, s.labels); console.log(s.out); }
  } else if (mode === 'gallery') {
    const tl: { id: string; start: number; end: number }[] = await page.evaluate(() => (window as any).__video.timeline);
    const only = opt('only')?.split(',');
    const shown = tl.filter((e) => !only || only.includes(e.id));
    const times = shown.flatMap((e) => [0.12, 0.4, 0.7, 0.95].map((k) => +(e.start + (e.end - e.start) * k).toFixed(2)));
    const out = opt('out', path.join(ROOT, `out/gallery-${opt('palette', 'night')}${only ? `-${only.join('+')}` : ''}.png`))!;
    await sheet(page, times, 4, out, shown.flatMap((e) => [e.id, '', '', '']));
    console.log(out);
    if (only) for (const e of shown) console.log((await stills(page, times.filter((t) => t >= e.start && t < e.end), path.join(ROOT, 'out/gallery', `${e.id}-${opt('palette', 'night')}`))).join('\n'));
  } else if (mode === 'plates') {
    const tl: { id: string; start: number; end: number }[] = await page.evaluate(() => (window as any).__video.timeline);
    const figs = tl.map((e) => e.id);
    const overrides: Record<string, number> = existsSync(path.join(APP, 'plates.json')) ? await Bun.file(path.join(APP, 'plates.json')).json() : {};
    const dir = path.join(APP, 'public/plates');
    mkdirSync(dir, { recursive: true });
    await page.evaluate(() => { (window as any).__video.engine.hudOff = true; });
    for (let i = 0; i < figs.length; i++) {
      const e = tl.find((x) => x.id === figs[i]);
      if (!e) continue;
      const t = overrides[figs[i]!] ?? (e.start + e.end) / 2;
      await page.evaluate((t) => (window as any).__video.still(t, 4, 0.2), t);
      const f = path.join(dir, `fig${String(i + 1).padStart(2, '0')}.jpg`);
      await page.screenshot({ path: f, type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
      console.log(f, t.toFixed(2));
    }
  } else if (mode === 'check') {
    // the same frames three ways — in order, in reverse, and each right after a seek far away — compared pixel
    // by pixel. Scenes are pure functions of t, so they must agree; Chrome's GPU Canvas2D can rasterise a few
    // antialiased hairline pixels a level or two differently on a path's first draw, which --tol allows.
    const times = flag('coverage') ? (await coverage(page)).times : (opt('t') ?? '5,30,55,100,140,170,200').split(',').map(Number);
    const tol = +opt('tol', '8')!, maxPx = +opt('max-px', '0.001')!; // levels, share of pixels
    const res: { t: number; diff: number; px: number }[] = await page.evaluate(async ([times, s, sh]) => {
      const P = (window as any).__video;
      const grab = async (t: number, pre: number | null) => {
        if (pre !== null) P.still(pre, 1, sh);
        P.still(t, s, sh);
        return (await P.engine.readPixelsAsync()).slice() as Uint8Array;
      };
      // Coverage can include hundreds of frames: retain one reference set, compare the other passes as they render.
      const a = new Map<number, Uint8Array>();
      const results = new Map(times.map((t) => [t, { t, diff: 0, px: 0 }]));
      for (const t of times) a.set(t, await grab(t, null));
      const compare = (t: number, y: Uint8Array) => {
        let diff = 0, px = 0;
        const x = a.get(t)!;
        for (let i = 0; i < x.length; i += 4) {
          const d = Math.max(Math.abs(x[i]! - y[i]!), Math.abs(x[i + 1]! - y[i + 1]!), Math.abs(x[i + 2]! - y[i + 2]!));
          if (d) { px++; diff = Math.max(diff, d); }
        }
        const r = results.get(t)!;
        r.diff = Math.max(r.diff, diff); r.px = Math.max(r.px, px);
      };
      for (const t of [...times].reverse()) compare(t, await grab(t, null));
      for (const t of times) compare(t, await grab(t, t > 100 ? 1 : 205));
      return [...results.values()];
    }, [times, SAMPLES, +opt('shutter', '0.5')!] as const);
    const total = OW * OH;
    let bad = 0;
    for (const r of res) {
      const ok = r.diff <= tol && r.px / total <= maxPx;
      if (!ok) bad++;
      console.log(`t=${r.t}: ${r.px === 0 ? 'identical' : `max ${r.diff} levels on ${r.px} px (${((100 * r.px) / total).toFixed(4)} %)`} ${ok ? 'ok' : 'FAIL'}`);
    }
    if (bad) throw new Error(`${bad} frame(s) depend on render order beyond --tol ${tol} / --max-px ${maxPx}`);
    console.log(`determinism: ${times.length} frames agree in order, in reverse and after seeks (samples ${JSON.stringify(SAMPLES)})`);
  } else if (mode === 'perf') {
    const from = +opt('from', '0')!, to = +opt('to', '5')!;
    const r = await page.evaluate(async ({ from, to, samples, shutter }) => {
      const P = (window as any).__video;
      const ms: number[] = [];
      const buf = new Uint8Array(P.width * P.height * 4);
      P.still(from);
      const used: Record<number, number> = {};
      for (let t = from; t < to; t += 1 / 60) {
        const a = performance.now();
        const k = P.engine.render(t, 1 / 60, false, samples, shutter);
        used[k] = (used[k] ?? 0) + 1;
        await P.engine.readPixelsAsync(buf);
        ms.push(performance.now() - a);
      }
      ms.sort((a, b) => a - b);
      return { n: ms.length, avg: ms.reduce((a, b) => a + b, 0) / ms.length, p50: ms[ms.length >> 1], p95: ms[Math.floor(ms.length * 0.95)], max: ms[ms.length - 1], used };
    }, { from, to, samples: SAMPLES, shutter: +opt('shutter', '0.5')! });
    console.log(`frames ${r.n}  avg ${r.avg.toFixed(1)}ms  p50 ${r.p50.toFixed(1)}  p95 ${r.p95.toFixed(1)}  max ${r.max.toFixed(1)}  sub-frames ${hist(r.used)}`);
  }
  if (mode !== 'gpu') await checkScenes(page);
  if (logs.length) console.error('BROWSER LOG:\n' + logs.slice(0, 40).join('\n'));
} finally {
  await browser.close();
  stop();
}
