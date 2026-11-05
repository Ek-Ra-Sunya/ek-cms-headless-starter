// No hard-coded hex colours in .tsx or .css: define a token (--name: #hex) once, use var(--name). Counts per file may not
// exceed scripts/qa/baseline.json "hex"; a new file starts at zero.
// Adapted from SOZO-Creations-LABS/swadeshnaiswarga check-tokens.js
import { baseline, sourceFiles, read, finish } from './lib.mjs';

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l) && !l.includes('qa-allow-hex') && !/^\s*--[\w-]+\s*:/.test(l)).join('\n');

const fails = [];
const notes = [];
let total = 0;
for (const f of sourceFiles(['.tsx', '.css'])) {
  const n = (strip(read(f)).match(HEX) || []).length;
  total += n;
  const allowed = baseline.hex[f] ?? 0;
  if (n > allowed) fails.push(`${f}: ${n} hex colour(s), allowed ${allowed}. Use a theme token.`);
  else if (n < allowed) notes.push(`${f}: down to ${n} (baseline ${allowed}), lower it in baseline.json`);
}
finish('tokens', `${total} hex literals in app code`, fails, notes);
