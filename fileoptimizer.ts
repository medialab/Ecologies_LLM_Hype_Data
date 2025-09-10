/**
 * Simple video optimizer: given a folder, compress all videos inside it
 * to 1280x720 WEBM using a sequential queue.
 *
 * Usage:
 *   ts-node fileoptimizer.ts <folder> [--overwrite|-y] [--skip-existing|-n] [--skip-compliant] [--concurrency=N] [--threads=N] [--hwdecode]
 *   npx tsx fileoptimizer.ts <folder> [--overwrite|-y] [--skip-existing|-n] [--skip-compliant] [--concurrency=N] [--threads=N] [--hwdecode]
*
* Interactivity:
*   If an output file already exists, the script prompts to overwrite.
*   Use --overwrite/-y to overwrite all without prompting, or --skip-existing/-n to skip all.
 *
 * Output files are created next to the originals with suffix `_720p.webm`.
 */

import { readdir, stat, access } from 'fs/promises';
import { constants as fsConstants, statSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { spawn } from 'child_process';
import readline from 'readline';
import os from 'os';

type VideoExt = '.mp4' | '.mov' | '.mkv' | '.avi' | '.m4v' | '.webm';
const VIDEO_EXTS: VideoExt[] = ['.mp4', '.mov', '.mkv', '.avi', '.m4v', '.webm'];

async function ensureFfmpeg(): Promise<void> {
  // Check ffmpeg
  await new Promise<void>((resolve, reject) => {
    const p = spawn('ffmpeg', ['-version']);
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error('ffmpeg not found in PATH'));
    });
  });
  // Check ffprobe
  await new Promise<void>((resolve, reject) => {
    const p = spawn('ffprobe', ['-version']);
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error('ffprobe not found in PATH'));
    });
  });
}

async function probeDurationSec(inputPath: string): Promise<number | null> {
  return await new Promise<number | null>((resolve) => {
    const args = [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=nw=1:nk=1',
      inputPath,
    ];
    const p = spawn('ffprobe', args);
    let out = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.on('close', () => {
      const v = parseFloat(out.trim());
      if (!isNaN(v) && isFinite(v)) resolve(v);
      else resolve(null);
    });
    p.on('error', () => resolve(null));
  });
}

type StreamInfo = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
};

async function probeStreams(inputPath: string): Promise<StreamInfo[]> {
  return await new Promise<StreamInfo[]>((resolve) => {
    const args = ['-v', 'error', '-show_streams', '-of', 'json', inputPath];
    const p = spawn('ffprobe', args);
    let out = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.on('close', () => {
      try {
        const json = JSON.parse(out);
        resolve(Array.isArray(json.streams) ? json.streams : []);
      } catch {
        resolve([]);
      }
    });
    p.on('error', () => resolve([]));
  });
}

async function isCompliant720pVp9Opus(inputPath: string): Promise<boolean> {
  const streams = await probeStreams(inputPath);
  const v = streams.find((s) => s.codec_type === 'video');
  const a = streams.find((s) => s.codec_type === 'audio');
  const videoOk = v && v.codec_name === 'vp9' && v.width === 1280 && v.height === 720;
  const audioOk = a && a.codec_name === 'opus';
  return Boolean(videoOk && audioOk);
}

const color = {
  reset: '\u001b[0m',
  dim: '\u001b[2m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  red: '\u001b[31m',
  cyan: '\u001b[36m',
  gray: '\u001b[90m',
};

function formatBytes(bytes: number): string {
  if (!isFinite(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function clearLine() {
  process.stdout.write('\u001b[2K\r');
}

function writeLine(text: string) {
  clearLine();
  process.stdout.write(text);
}

function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!VIDEO_EXTS.includes(ext as VideoExt)) return false;
  const base = path.basename(filePath);
  // skip macOS resource fork files
  if (base.startsWith('._')) return false;
  return true;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function findVideos(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const sub = await findVideos(full);
      out.push(...sub);
    } else if (e.isFile() && isVideoFile(full)) {
      out.push(full);
    }
  }
  return out;
}

function toOutputPath(inputPath: string): string {
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));
  return path.join(dir, `${base}_720p.webm`);
}

async function convertToWebm720p(
  inputPath: string,
  outputPath: string,
  durationSec: number | null,
  prefix: string,
  threads: number,
  addHwAccel: boolean,
  quietProgress: boolean
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const vf =
      'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black';

    const args: string[] = [
      '-hide_banner',
      '-nostats',
      '-loglevel',
      'error',
      '-progress',
      'pipe:1',
      '-y',
      '-i',
      inputPath,
      '-vf',
      vf,
      // Video: VP9, constant quality
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '0',
      '-crf',
      '32',
      // Improve utilization; no quality sacrifice
      '-row-mt',
      '1',
      '-tile-columns',
      '2',
      '-tile-rows',
      '1',
      '-frame-parallel',
      '1',
      '-threads',
      String(Math.max(1, threads)),
      '-speed',
      '1',
      // Audio: Opus
      '-c:a',
      'libopus',
      '-b:a',
      '96k',
      outputPath,
    ];

    // Optional hardware-accelerated decode (macOS tested)
    if (addHwAccel) {
      const platform = process.platform;
      if (platform === 'darwin') {
        args.unshift('-hwaccel', 'videotoolbox');
      }
      // Linux/Windows variants could be added after validation:
      // else if (platform === 'linux') args.unshift('-hwaccel', 'vaapi');
      // else if (platform === 'win32') args.unshift('-hwaccel', 'dxva2');
    }

    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let errBuf = '';
    proc.stderr.on('data', (d) => (errBuf += d.toString()));

    const rl = readline.createInterface({ input: proc.stdout });
    let outMs = 0;
    let speedX = 0;
    let totalMs = durationSec ? durationSec * 1000 : 0;

    rl.on('line', (line) => {
      const [k, v] = line.split('=');
      if (!k) return;
      if (k === 'out_time_ms') {
        const n = parseInt(v, 10);
        if (!isNaN(n)) outMs = n / 1000; // convert to ms units consistent with totalMs
      } else if (k === 'out_time') {
        // fallback parse HH:MM:SS.xx
        if (!outMs && v) {
          const parts = v.split(':');
          if (parts.length === 3) {
            const sec = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
            outMs = sec * 1000;
          }
        }
      } else if (k === 'speed') {
        const m = v?.match(/([0-9]*\.?[0-9]+)x/);
        if (m) speedX = parseFloat(m[1]);
      } else if (k === 'progress' && v === 'continue') {
        if (!quietProgress) {
          const pct = totalMs ? Math.min(99, Math.max(0, (outMs / totalMs) * 100)) : 0;
          const etaSec = speedX > 0 && totalMs
            ? Math.max(0, ((totalMs - outMs) / 1000) / speedX)
            : 0;
          const eta = etaSec
            ? `${Math.floor(etaSec / 60)}m ${Math.floor(etaSec % 60)}s`
            : '--';
          writeLine(
            `${color.cyan}${prefix}${color.reset} ${pct.toFixed(0).padStart(3, ' ')}%  speed ${
              speedX ? speedX.toFixed(2) + 'x' : '--'
            }  ETA ${eta}`
          );
        }
      }
    });

    proc.on('close', (code) => {
      rl.close();
      clearLine();
      if (code === 0) resolve();
      else reject(new Error(errBuf || `ffmpeg exited with code ${code}`));
    });

    proc.on('error', (e) => {
      rl.close();
      clearLine();
      reject(e);
    });
  });
}

async function processQueue(files: string[]): Promise<void> {
  const total = files.length;
  let processed = 0;

  type OverwriteMode = 'ask' | 'all' | 'skip';
  let overwriteMode: OverwriteMode = globalCliOptions.overwriteAll
    ? 'all'
    : globalCliOptions.skipAllExisting
    ? 'skip'
    : 'ask';

  const summary = {
    converted: 0,
    overwritten: 0,
    skipped: 0,
    failed: 0,
  };

  async function askOverwritePrompt(outPath: string): Promise<'yes' | 'no' | 'all' | 'skipAll' | 'quit'> {
    if (!process.stdin.isTTY) return 'no';
    return await new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const q = `${color.yellow}File exists${color.reset} ${path.basename(
        outPath
      )}. Overwrite? [y]es/[n]o/[a]ll/[s]kip all/[q]uit: `;
      clearLine();

      let finished = false;
      const timeoutMs = Number.parseInt(process.env.FILEOPT_PROMPT_TIMEOUT || '30000', 10) || 30000;
      const timer = setTimeout(() => {
        if (finished) return;
        finished = true;
        // Auto-skip this file on timeout
        rl.write('\n');
        rl.close();
        console.log(`${color.gray}No response in ${Math.floor(timeoutMs / 1000)}s — skipping this file${color.reset}`);
        resolve('no');
      }, timeoutMs);

      rl.question(q, (answer) => {
        if (finished) return; // already timed out
        finished = true;
        clearTimeout(timer);
        rl.close();
        const a = (answer || '').trim().toLowerCase();
        if (a === 'y' || a === 'yes') return resolve('yes');
        if (a === 'n' || a === 'no') return resolve('no');
        if (a === 'a' || a === 'all') return resolve('all');
        if (a === 's' || a === 'skip') return resolve('skipAll');
        if (a === 'q' || a === 'quit') return resolve('quit');
        return resolve('no');
      });
    });
  }

  // Pre-probe durations and compliance (limited parallelism)
  const limit = (n: number) => {
    let active = 0;
    const queue: Array<() => void> = [];
    return async function <T>(fn: () => Promise<T>): Promise<T> {
      if (active >= n) await new Promise<void>((r) => queue.push(r));
      active++;
      try {
        return await fn();
      } finally {
        active--;
        const next = queue.shift();
        if (next) next();
      }
    };
  };

  const probeLimit = limit(8);

  type Task = {
    file: string;
    out: string;
    duration: number | null;
    compliant: boolean;
    existed: boolean;
  };

  const tasks: Task[] = [];
  for (const file of files) {
    processed += 1;
    const out = toOutputPath(file);
    const [duration, compliant, existed] = await Promise.all([
      probeLimit(() => probeDurationSec(file)),
      globalCliOptions.skipCompliant ? probeLimit(() => isCompliant720pVp9Opus(file)) : Promise.resolve(false),
      pathExists(out),
    ]);
    tasks.push({ file, out, duration, compliant, existed });
  }

  // Sort longest first
  tasks.sort((a, b) => (b.duration || 0) - (a.duration || 0));

  // Prepare overwrite decisions and skip compliant items before workers
  const runnable: Task[] = [];
  let idxPrepare = 0;
  for (const t of tasks) {
    idxPrepare += 1;
    if (globalCliOptions.skipCompliant && t.compliant) {
      console.log(`${color.dim}[${idxPrepare}/${tasks.length}] Skipping (compliant): ${t.file}${color.reset}`);
      summary.skipped += 1;
      continue;
    }

    if (t.existed) {
      if (overwriteMode === 'skip') {
        console.log(`${color.dim}[${idxPrepare}/${tasks.length}] Skipping (exists): ${t.out}${color.reset}`);
        summary.skipped += 1;
        continue;
      }

      if (overwriteMode === 'ask') {
        const decision = await askOverwritePrompt(t.out);
        if (decision === 'quit') {
          console.log(`${color.red}Aborted by user.${color.reset}`);
          break;
        } else if (decision === 'all') {
          overwriteMode = 'all';
        } else if (decision === 'skipAll') {
          overwriteMode = 'skip';
          console.log(`${color.dim}[${idxPrepare}/${tasks.length}] Skipping (exists): ${t.out}${color.reset}`);
          summary.skipped += 1;
          continue;
        } else if (decision === 'no') {
          console.log(`${color.dim}[${idxPrepare}/${tasks.length}] Skipping (exists): ${t.out}${color.reset}`);
          summary.skipped += 1;
          continue;
        }
        // 'yes' falls through to overwrite
      }

      console.log(`${color.yellow}[${idxPrepare}/${tasks.length}] Overwriting:${color.reset} ${t.out}`);
    }

    runnable.push(t);
  }

  // Determine concurrency and per-job threads
  const cores = Math.max(1, os.cpus()?.length || 1);
  const concurrency = Math.max(1, globalCliOptions.concurrency ?? Math.floor(Math.max(1, cores / 4)));
  const perThreads = Math.max(1, globalCliOptions.threads ?? Math.floor(cores / concurrency));
  const quietProgress = concurrency > 1; // avoid noisy interleaving
  const addHwAccel = Boolean(globalCliOptions.hwdecode);

  console.log(
    `${color.gray}Workers:${color.reset} ${concurrency}  ${color.gray}Threads/job:${color.reset} ${perThreads}`
  );

  // Worker pool
  let i = 0;
  async function worker(id: number) {
    while (true) {
      const current = i++;
      if (current >= runnable.length) return;
      const t = runnable[current];
      const prefix = `[${current + 1}/${runnable.length}] ${path.basename(t.file)} -> ${path.basename(t.out)}`;
      console.log(`${color.gray}${prefix}${color.reset} Preparing...`);
      try {
        await convertToWebm720p(
          t.file,
          t.out,
          t.duration,
          prefix,
          perThreads,
          addHwAccel,
          quietProgress
        );
        const inSize = statSync(t.file).size;
        const outSize = statSync(t.out).size;
        const ratio = inSize > 0 ? (outSize / inSize) * 100 : 0;
        console.log(
          `${color.green}✔${color.reset} ${path.basename(t.out)}  ${formatBytes(outSize)}  (${ratio.toFixed(1)}% of ${formatBytes(
            inSize
          )})`
        );
        if (t.existed) summary.overwritten += 1;
        else summary.converted += 1;
      } catch (err) {
        console.error(`${color.red}✖ Failed:${color.reset} ${t.file}`);
        if (err instanceof Error) {
          console.error(`${color.red}${err.message}${color.reset}`);
        } else {
          console.error(err);
        }
        summary.failed += 1;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, id) => worker(id));
  await Promise.all(workers);

  console.log(
    `${color.cyan}Summary${color.reset}: ` +
      `${color.green}${summary.converted} converted${color.reset}, ` +
      `${color.yellow}${summary.overwritten} overwritten${color.reset}, ` +
      `${color.dim}${summary.skipped} skipped${color.reset}, ` +
      `${color.red}${summary.failed} failed${color.reset}`
  );
}

type CliOptions = {
  folder?: string;
  overwriteAll: boolean;
  skipAllExisting: boolean;
  skipCompliant: boolean;
  concurrency?: number;
  threads?: number;
  hwdecode: boolean;
};

function parseCli(): CliOptions {
  const args = process.argv.slice(2);
  let folder: string | undefined;
  const flags = new Set<string>();
  const kv: Record<string, string> = {};
  for (const a of args) {
    if (a.startsWith('--')) {
      const [k, v] = a.split('=');
      if (v !== undefined) kv[k] = v;
      else flags.add(a);
    } else if (a.startsWith('-')) {
      flags.add(a);
    } else if (!folder) folder = a;
  }
  return {
    folder,
    overwriteAll: flags.has('--overwrite') || flags.has('--yes') || flags.has('-y'),
    skipAllExisting: flags.has('--skip-existing') || flags.has('--no') || flags.has('-n'),
    skipCompliant: flags.has('--skip-compliant'),
    concurrency: kv['--concurrency'] ? Math.max(1, parseInt(kv['--concurrency'], 10) || 1) : undefined,
    threads: kv['--threads'] ? Math.max(1, parseInt(kv['--threads'], 10) || 1) : undefined,
    hwdecode: flags.has('--hwdecode'),
  };
}

const globalCliOptions = parseCli();

async function main(): Promise<void> {
  const folder = globalCliOptions.folder;
  if (!folder) {
    console.error(
      'Usage: ts-node fileoptimizer.ts <folder> [--overwrite|-y] [--skip-existing|-n] [--skip-compliant] [--concurrency=N] [--threads=N] [--hwdecode]'
    );
    process.exit(1);
  }

  const abs = path.resolve(folder);
  const s = await stat(abs).catch(() => null);
  if (!s || !s.isDirectory()) {
    console.error(`Not a directory: ${abs}`);
    process.exit(1);
  }

  try {
    await ensureFfmpeg();
  } catch (e) {
    console.error('ffmpeg is required but not found in PATH.');
    console.error('Install ffmpeg and try again.');
    process.exit(1);
  }

  const files = await findVideos(abs);
  if (files.length === 0) {
    console.log('No video files found.');
    return;
  }

  console.log(`Found ${files.length} video(s). Starting conversion...`);
  await processQueue(files);
  console.log('All done.');
}

// Run if executed directly
const isMain = (() => {
  try {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
})();

if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
