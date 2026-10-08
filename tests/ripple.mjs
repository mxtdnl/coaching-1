/* ============================================================================
   Ripple - test harness. Node built-ins only, no dependencies.

     node tests/ripple.mjs

   It reads ../microleadership.html, pulls out the model between the
   MODEL START / MODEL END markers and evaluates it in a vm context, so the
   tests always run against the shipped file.
   ========================================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'microleadership.html'), 'utf8');
const match = html.match(/\/\* MODEL START \*\/([\s\S]*?)\/\* MODEL END \*\//);
if (!match) { console.error('could not find the MODEL START / MODEL END block'); process.exit(1); }

const context = vm.createContext({ console });
vm.runInContext(match[1] + '\n;globalThis.__RP = RP;', context, { filename: 'microleadership.html#model' });
const RP = context.__RP;

let passed = 0, failed = 0;
function check(name, fn) {
  try { const d = fn(); passed++; console.log('  pass  ' + name + (d ? '  [' + d + ']' : '')); }
  catch (e) { failed++; console.log('  FAIL  ' + name + '  ' + e.message); }
}
function assert(c, msg) { if (!c) throw new Error(msg); }
const run = id => RP.simulate(RP.POLICIES.find(p => p.id === id).pick);

console.log('\nripple - content\n');
check('five days, three spots each, valid answers', () => {
  assert(RP.DAYS.length === 5, 'expected 5 days');
  RP.DAYS.forEach(d => {
    assert(d.spots.length === 3, d.name + ' has ' + d.spots.length + ' spots');
    d.spots.forEach(s => assert(['ml', 'mm', 'none'].includes(s.answer), 'bad answer ' + s.answer));
  });
});
check('every moment has a free option and only known types', () => {
  RP.DAYS.forEach(d => d.moments.forEach(m => {
    assert(m.options.some(o => o.cost === 0), m.head + ' has no free option');
    assert(m.options.length <= 4, m.head + ' has more than 4 options (keys 1-4)');
    m.options.forEach(o => assert(RP.TYPES[o.type], m.head + ': unknown type ' + o.type));
  }));
});
check('effects only name real teammates', () => {
  const ok = new Set(['prog', 'flag', 'tired', ...RP.TEAM.map(t => t.id)]);
  RP.DAYS.forEach(d => d.moments.forEach(m => m.options.forEach(o =>
    Object.keys(o.fx).forEach(k => assert(ok.has(k), m.head + ': unknown effect ' + k)))));
});

console.log('\nripple - calibration\n');
check('always micro-lead gets funded', () => { const s = run('ml'); assert(s.prog >= RP.TARGET, 'readiness ' + s.prog); return 'readiness ' + s.prog; });
check('always take control is not funded', () => { const s = run('mm'); assert(s.prog < RP.TARGET, 'readiness ' + s.prog); return 'readiness ' + s.prog; });
check('always wait is not funded', () => { const s = run('wait'); assert(s.prog < RP.TARGET, 'readiness ' + s.prog); return 'readiness ' + s.prog; });
check('control leads on Monday, micro-leadership overtakes by Wednesday', () => {
  const ml = run('ml').progByDay, mm = run('mm').progByDay;
  assert(mm[1] > ml[1], 'control should lead Monday: ' + mm[1] + ' vs ' + ml[1]);
  assert(ml[3] > mm[3], 'micro-leadership should lead Wednesday: ' + ml[3] + ' vs ' + mm[3]);
  return 'Mon ' + mm[1] + ' vs ' + ml[1] + ', Wed ' + mm[3] + ' vs ' + ml[3];
});
check('score order: micro-lead > control > wait', () => {
  const a = run('ml').score, b = run('mm').score, c = run('wait').score;
  assert(a > b && b > c, a + ', ' + b + ', ' + c);
  return a + ' > ' + b + ' > ' + c;
});
check('MAX_SCORE matches a wide beam search', () => {
  const best = RP.bestScore(2000);
  assert(best === RP.MAX_SCORE, 'beam found ' + best + ', MAX_SCORE is ' + RP.MAX_SCORE);
  return String(best);
});
check('the simulation is deterministic', () => {
  assert(JSON.stringify(run('ml')) === JSON.stringify(run('ml')), 'two runs differ');
});

console.log('\nfile level checks\n');
check('the model contains no DOM access', () => {
  const hit = ['document.', 'window.', 'localStorage', 'navigator.'].filter(b => match[1].includes(b));
  assert(!hit.length, 'model touches ' + hit.join(', '));
});
check('charset is declared before any content', () => {
  assert(/^<!doctype html>\s*<html[^>]*>\s*<head>\s*<meta charset="utf-8">/i.test(html), 'meta charset not first');
});
check('one script tag, no external resources', () => {
  assert((html.match(/<script/g) || []).length === 1, 'expected exactly one <script>');
  assert(!/(src|href)=["']https?:/i.test(html), 'external src or href found');
  assert(!/fetch\(|XMLHttpRequest|@import/.test(html), 'network call found');
});
check('no smart quotes in the script', () => {
  const js = html.slice(html.indexOf('<script>'));
  const m = js.match(/[‘’“”]/);
  assert(!m, 'smart quote found: ' + (m && m[0]));
});

console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed ? 1 : 0);
