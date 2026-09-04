import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../pages/PublicDailyMenu.tsx', import.meta.url), 'utf8');

test('public daily menu shows SPPG identity and consumption guidance', () => {
  assert.match(source, /SPPG KEDIRI NGADILUWIH TALES/);
  assert.match(source, /DILARANG MEMBAWA PULANG MAKANAN/);
  assert.match(source, /HARAP SEGERA DIKONSUMSI SETELAH DITERIMA/);
  assert.match(source, /Perhatian untuk Penerima Manfaat/);
});

test('public daily menu has a clear visual guidance panel', () => {
  assert.match(source, /AlertTriangle/);
  assert.match(source, /ShieldCheck/);
  assert.match(source, /bg-amber-50/);
});
