import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../pages/PublicDailyMenu.tsx', import.meta.url), 'utf8');

test('consumption deadline separates date and time clearly', () => {
  assert.match(source, /Tanggal Batas/);
  assert.match(source, /Jam Batas/);
  assert.match(source, /record\.batasDikonsumsi\.split\('T'\)/);
  assert.match(source, /h-10 w-px bg-amber-300/);
});
