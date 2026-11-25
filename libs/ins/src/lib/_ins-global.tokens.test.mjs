// Regression test for the Performance (ins) module's missing --plat-* design
// tokens. 30 ported feature files reference --plat-border, --plat-muted,
// --plat-surface, --plat-shadow-sm/md, --plat-navy, --plat-blue and
// --plat-blue-100 (125 call sites total) without a CSS fallback - if this
// file stops defining them, those borders/shadows/muted text/surfaces go
// invisible again across Performance's cards, tables and dialogs.
//
// There is no Jest/Karma test runner configured anywhere in this repo (no
// jest.config.*, no karma.conf.*, no test runner in package.json), so this
// is a plain Node script using the `sass` package already present in
// node_modules (a transitive dependency of the Angular build tooling) -
// no network access or new dependency required.
//
// Run with: node libs/ins/src/lib/_ins-global.tokens.test.mjs
import { compile } from 'sass';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const result = compile(join(here, '_ins-global.scss'));
const css = result.css;

const expected = {
  '--plat-navy': '#1F3A5B',
  '--plat-blue': '#2563eb',
  '--plat-blue-100': '#e0e7ff',
  '--plat-surface': '#ffffff',
  '--plat-border': '#cbd5e1',
  '--plat-muted': '#64748b',
  '--plat-shadow-sm': '0 1px 2px rgba(15, 23, 42, 0.05)',
  '--plat-shadow-md': '0 2px 8px rgba(15, 23, 42, 0.08)',
};

let failures = 0;
for (const [name, value] of Object.entries(expected)) {
  const re = new RegExp(`${name}:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
  if (!re.test(css)) {
    console.error(`FAIL: ${name} is not defined as ${value} in compiled _ins-global.scss`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} of ${Object.keys(expected).length} --plat-* tokens missing or wrong.`);
  process.exit(1);
}

console.log(`OK: all ${Object.keys(expected).length} --plat-* tokens are defined correctly.`);
