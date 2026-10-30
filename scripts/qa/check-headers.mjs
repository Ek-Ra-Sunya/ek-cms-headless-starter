// Security headers and CSP are set in next.config.ts or proxy.ts. Static check of the source
// (the build does not emit them). "required" must be present; "gaps" are known-missing today and
// only warn, remove each from baseline.json once added. A CSP, when present, must name default-src
// or script-src.
// Adapted from SOZO-Creations-LABS/swadeshnaiswarga check-csp.js
import { baseline, read, finish } from './lib.mjs';
import fs from 'node:fs';

const src = ['next.config.ts', 'next.config.mjs', 'next.config.js', 'proxy.ts', 'middleware.ts']
  .filter((f) => fs.existsSync(f)).map(read).join('\n').toLowerCase();
const has = (h) => src.includes(h.toLowerCase());
// "frame" stands for either X-Frame-Options or CSP frame-ancestors.
const present = (h) => (h === 'frame' ? has('x-frame-options') || has('frame-ancestors') : has(h));

const fails = [];
const notes = [];
for (const h of baseline.headers.required) if (!present(h)) fails.push(`missing header ${h}`);
for (const g of baseline.headers.gaps) {
  if (present(g)) notes.push(`${g} is now set, remove it from baseline.headers.gaps`);
  else notes.push(`known gap: ${g}`);
}
if (has('content-security-policy') && !/default-src|script-src/.test(src)) fails.push('CSP set without default-src or script-src');
finish('headers', `${baseline.headers.required.length} required headers`, fails, notes);
