import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const publicPageSource = readFileSync(new URL('../pages/PublicDailyMenu.tsx', import.meta.url), 'utf8');
const landingSource = readFileSync(new URL('../pages/PublicLanding.tsx', import.meta.url), 'utf8');

test('registers a public route for today menu without ProtectedRoute', () => {
  assert.match(appSource, /path="\/menu-hari-ini" element={<PublicDailyMenu \/>}\s*\/>/);
  const routeBlock = appSource.match(/<Route path="\/menu-hari-ini"[\s\S]*?\/>/);
  assert.ok(routeBlock);
  assert.doesNotMatch(routeBlock[0], /ProtectedRoute/);
});

test('public daily menu listens to nutrition data in real time and filters today', () => {
  assert.match(publicPageSource, /api\.subscribeNilaiGizi/);
  assert.match(publicPageSource, /item\.tanggalProduksi === today/);
  assert.match(publicPageSource, /Menu Hari Ini/);
  assert.match(publicPageSource, /Data belum di-share oleh SPPG/);
});

test('public page includes a real-time clock and clearly separated important dates', () => {
  assert.match(publicPageSource, /setInterval/);
  assert.match(publicPageSource, /Waktu saat ini/);
  assert.match(publicPageSource, /Tanggal Hari Produksi/);
  assert.match(publicPageSource, /Batas Waktu Dikonsumsi/);
  assert.doesNotMatch(publicPageSource, /Beranda/);
});

test('public menu images can be enlarged in a read-only modal', () => {
  assert.match(publicPageSource, /selectedImage/);
  assert.match(publicPageSource, /Perbesar Gambar/);
  assert.match(publicPageSource, /Lihat Foto Penuh/);
});

test('landing page exposes the public daily-menu link', () => {
  assert.match(landingSource, /href="\/menu-hari-ini"/);
  assert.match(landingSource, /Menu Hari Ini/);
});
