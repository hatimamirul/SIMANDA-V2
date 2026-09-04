import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../pages/PublicDailyMenu.tsx', import.meta.url), 'utf8');

test('deadline date receives its own contrasting visual accent', () => {
  assert.match(source, /Tanggal Batas/);
  assert.match(source, /border-blue-200/);
  assert.match(source, /bg-blue-100/);
  assert.match(source, /text-blue-700/);
});
