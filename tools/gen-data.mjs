// gen-data.mjs — embed the trophy data as a classic script so the app works from file://.
// Reads app/data/trophies.json and writes app/data.js as `window.LEONIDA_TROPHIES = {...};`.
// Deterministic: the same input file always produces the same output bytes.
// Run: node tools/gen-data.mjs   (from the repo root)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'app', 'data', 'trophies.json');
const dst = join(root, 'app', 'data.js');

const data = JSON.parse(readFileSync(src, 'utf8'));
if (!Array.isArray(data.trophies) || data.trophies.length !== 55) {
  throw new Error(`gen-data: expected 55 trophies in ${src}, got ${data.trophies?.length}`);
}
const ids = new Set(data.trophies.map((t) => t.id));
if (ids.size !== 55) throw new Error('gen-data: trophy ids are not unique');

const out = `// Generated from app/data/trophies.json by tools/gen-data.mjs. Do not edit by hand.\n// A classic script (no modules) so the app works from file:// as well as http://.\nwindow.LEONIDA_TROPHIES = ${JSON.stringify(data, null, 2)};\n`;
writeFileSync(dst, out, 'utf8');
console.log(`gen-data: ${data.trophies.length} trophies -> ${dst} (${out.length} bytes)`);
