// JS and CSS bundle budget from the build output (.next/static). Sizes are gzipped bytes; the
// budgets in baseline.json sit just above today's build, so only growth fails. Run after `pnpm build`.
// Adapted from SOZO-Creations-LABS/swadeshnaiswarga check-budget.js
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { baseline, ROOT, finish } from './lib.mjs';

const dir = path.join(ROOT, '.next/static');
if (!fs.existsSync(dir)) {
  console.log('bundle: FAIL  no .next/static, run the build first');
  process.exit(1);
}
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|css)$/.test(e.name)) files.push({ p, ext: path.extname(e.name).slice(1), gz: zlib.gzipSync(fs.readFileSync(p)).length });
  }
})(dir);

const sum = (ext) => files.filter((f) => f.ext === ext).reduce((n, f) => n + f.gz, 0);
const biggest = files.reduce((a, b) => (b.gz > a.gz ? b : a));
const m = { jsGz: sum('js'), cssGz: sum('css'), maxChunkGz: biggest.gz };
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

const fails = [];
for (const [k, v] of Object.entries(m)) {
  console.log(`  ${k}: ${kb(v)} (budget ${kb(baseline.bundle[k])})`);
  if (v > baseline.bundle[k]) fails.push(`${k} ${kb(v)} is over the ${kb(baseline.bundle[k])} budget${k === 'maxChunkGz' ? ` (${path.relative(ROOT, biggest.p)})` : ''}`);
}
finish('bundle', `${files.length} files`, fails);
