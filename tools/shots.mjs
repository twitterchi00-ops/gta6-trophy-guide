// shots.mjs — take the 4 graded screenshots (1280x720 JPEG) with Playwright.
// Reads shots.json, starts serve.ts, seeds localStorage progress per shot,
// navigates to the shot's URL, applies any UI actions, and saves the JPEG.
// Usage: node tools/shots.mjs   (from the repo root)
// Output: screenshots/1-checklist.jpg … 4-missable.jpg (each <= 256 KiB).

import { spawn } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = JSON.parse(readFileSync(join(ROOT, 'shots.json'), 'utf8'));
const PORT = 8123;
const BASE = `http://localhost:${PORT}`;
const STORE_KEY = 'leonida-trophy-guide-earned-v1';
const MAX_BYTES = 262144;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitForHealth() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await sleep(200);
  }
  throw new Error('shots: serve.ts did not answer /health');
}

async function main() {
  const server = spawn(process.execPath, ['serve.ts', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  try {
    await waitForHealth();
    const browser = await chromium.launch();
    try {
      for (const shot of SHOTS.shots) {
        const page = await browser.newPage({ viewport: SHOTS.viewport });
        if (shot.seed && shot.seed.length > 0) {
          await page.addInitScript(
            ({ key, ids }) => localStorage.setItem(key, JSON.stringify(ids)),
            { key: STORE_KEY, ids: shot.seed },
          );
        }
        await page.goto(BASE + shot.url, { waitUntil: 'networkidle' });
        await page.waitForSelector(shot.waitFor || '.list', { timeout: 10000 });
        if (shot.check) await page.check(shot.check);
        if (shot.waitMs) await sleep(shot.waitMs);
        const out = join(ROOT, 'screenshots', shot.file);
        await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
        await page.close();
        const size = statSync(out).size;
        const ok = size <= MAX_BYTES ? 'ok' : 'OVER 256 KiB';
        console.log(`shots: ${shot.file} ${size} bytes (${ok})`);
        if (size > MAX_BYTES) throw new Error(`shots: ${shot.file} is ${size} bytes, over the 256 KiB cap`);
      }
    } finally {
      await browser.close();
    }
  } finally {
    server.kill();
  }
  console.log('shots: done');
}

main().catch((err) => { console.error(err.message); process.exit(1); });
