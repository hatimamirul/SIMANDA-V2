import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../pages/PublicDailyMenu.tsx', import.meta.url), 'utf8');

test('deadline time receives a high-contrast consumption accent', () => {
  assert.match(source, /Jam Batas/);
  assert.match(source, /bg-rose-100/);
  assert.match(source, /text-rose-700/);
  assert.match(source, /border-rose-200/);
});
