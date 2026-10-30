// Shared helpers for the QA gates. Adapted from SOZO-Creations-LABS/swadeshnaiswarga check-*.js
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/qa/baseline.json'), 'utf8'));

const SKIP_DIR = new Set(['node_modules', '.next', 'generated', 'coverage']);
const TEST_FILE = /\.(test|spec)\.[tj]sx?$/;

/** Source files under app/ and lib/ with one of the given extensions, tests excluded, as repo-relative posix paths. */
export function sourceFiles(exts) {
  const out = [];
  for (const top of ['app', 'lib']) (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIR.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (exts.some((x) => e.name.endsWith(x)) && !TEST_FILE.test(e.name)) {
        out.push(path.relative(ROOT, p).split(path.sep).join('/'));
      }
    }
  })(path.join(ROOT, top));
  return out.sort();
}

export const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

/** Prints the result and exits non-zero when anything failed. */
export function finish(name, summary, fails, notes = []) {
  console.log(`${name}: ${fails.length ? 'FAIL' : 'PASS'}  ${summary}`);
  fails.forEach((f) => console.log(`  FAIL ${f}`));
  notes.forEach((n) => console.log(`  note ${n}`));
  process.exit(fails.length ? 1 : 0);
}
