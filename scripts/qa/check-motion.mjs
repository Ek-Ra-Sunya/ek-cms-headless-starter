// Motion respects prefers-reduced-motion: a file that animates must also handle it. Files that
// predate the gate are listed in baseline.json "motion"; any other file that animates without
// handling it fails.
// Adapted from SOZO-Creations-LABS/swadeshnaiswarga check-tokens.js (motion section)
import { baseline, sourceFiles, read, finish } from './lib.mjs';

const MOTION = /@keyframes|\banimate-[\w[]|\b(?:transition|animation)\s*:|(?:^|[\s"'`{])transition(?:-(?:all|colors|opacity|transform|shadow))?(?=[\s"'`}])|framer-motion|motion\/react/m;
const HANDLED = /prefers-reduced-motion|motion-reduce:|motion-safe:|useReducedMotion|reducedMotion/;

const fails = [];
const notes = [];
const known = new Set(baseline.motion);
let animating = 0;
for (const f of sourceFiles(['.css', '.tsx'])) {
  const src = read(f);
  if (!MOTION.test(src)) continue;
  animating++;
  const handled = HANDLED.test(src);
  if (!handled && !known.has(f)) fails.push(`${f}: animates without prefers-reduced-motion handling`);
  if (handled && known.has(f)) notes.push(`${f}: now handles reduced motion, remove it from baseline.json`);
}
finish('motion', `${animating} files animate, ${known.size} known gaps`, fails, notes);
