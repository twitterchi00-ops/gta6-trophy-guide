// main.ts — entrypoint. Builds the submission dossier for gta6-trophy-guide-01.
// Usage:  MAKEFUN_OUTPUT_DIR=out node main.ts        (local)
//         node main.ts                               (grader: writes to /output)
// What it does:
//   1. Copies app/ and screenshots/ from this repo into the output directory.
//   2. Calls buildDossier from the kit's vendor library (vendor/makefun-frontend.ts)
//      with the bounty gate's caps, and writes the returned bytes to dossier.json.
//   3. Prints the dossier's size and SHA-256 so the run can be verified.
// Deterministic: the same repo content always produces the same dossier.json,
// because buildDossier reads the output directory in code-unit path order.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)));
const OUTPUT = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// The bounty gate's caps (competition.yaml): app/ within 993 files and
// directories and 48 MiB, every path within 1,000 bytes; 3-4 screenshots at
// most 256 KiB; dossier text at most 163,840 bytes.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) n += countFiles(p);
    else if (entry.isFile()) n++;
  }
  return n;
}

function main(): void {
  const appDir = join(REPO, 'app');
  const shotsDir = join(REPO, 'screenshots');
  if (!existsSync(appDir)) throw new Error(`main: app/ not found under ${REPO}`);
  if (!existsSync(shotsDir)) throw new Error(`main: screenshots/ not found under ${REPO}`);

  mkdirSync(OUTPUT, { recursive: true });
  // Fresh copy each run: remove any stale output of a previous run first.
  const outApp = join(OUTPUT, 'app');
  const outShots = join(OUTPUT, 'screenshots');
  const outDossier = join(OUTPUT, 'dossier.json');
  for (const p of [outApp, outShots]) {
    if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  }
  cpSync(appDir, outApp, { recursive: true });
  cpSync(shotsDir, outShots, { recursive: true });

  const dossier = buildDossier(OUTPUT, CAPS);
  writeFileSync(outDossier, dossier);

  const appFiles = countFiles(outApp);
  const shotFiles = readdirSync(outShots).filter((f) => statSync(join(outShots, f)).isFile());
  const dossierBytes = readFileSync(outDossier);
  console.log(`main: output ${OUTPUT}`);
  console.log(`main: app/ files ${appFiles}, screenshots ${shotFiles.length} (${shotFiles.join(', ')})`);
  console.log(`main: dossier.json ${dossierBytes.length} bytes, sha256 ${sha256Hex(dossierBytes)}`);
}

main();
