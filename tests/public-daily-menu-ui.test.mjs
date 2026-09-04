import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('../pages/PublicDailyMenu.tsx', import.meta.url), 'utf8');

test('public menu uses a simplified mobile-first experience', () => {
  assert.match(pageSource, /Geser untuk melihat semua porsi/);
  assert.match(pageSource, /snap-x/);
  assert.match(pageSource, /Informasi Penting/);
  assert.match(pageSource, /Live/);
});

test('public menu presents important schedule information in distinct visual cards', () => {
  assert.match(pageSource, /Tanggal Hari Produksi/);
  assert.match(pageSource, /Batas Waktu Dikonsumsi/);
  assert.match(pageSource, /Waktu saat ini/);
});
