import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('../pages/MenuInformation.tsx', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../services/mockService.ts', import.meta.url), 'utf8');

test('Data Nilai Gizi gives every portion its own image, menu name, and nutrition inputs', () => {
  for (const label of [
    'Menu Porsi Besar',
    'Menu Porsi Kecil',
    'Menu Balita',
    'Menu Bumil dan Busui',
    'Nama Menu',
    'Karbohidrat',
    'Protein',
    'Serat',
    'Energi',
    'Lemak',
  ]) {
    assert.match(pageSource, new RegExp(label));
  }
  assert.match(pageSource, /portions\.map/);
  assert.match(pageSource, /type="file"/);
});

test('Data Nilai Gizi keeps production and deadline shared, with a deadline time input', () => {
  assert.match(pageSource, /Hari dan Tanggal Produksi/);
  assert.match(pageSource, /Batas Dikonsumsi/);
  assert.match(pageSource, /type="date"/);
  assert.match(pageSource, /type="time"/);
});

test('Data Nilai Gizi saves records through the application API and compresses portion images', () => {
  assert.match(pageSource, /api\.saveNilaiGizi/);
  assert.match(serviceSource, /saveNilaiGizi/);
  assert.match(serviceSource, /subscribeNilaiGizi/);
  assert.match(serviceSource, /porsiMenus/);
});

test('Data Nilai Gizi provides draft saving without requiring publication', () => {
  assert.match(pageSource, /Simpan sebagai Draft/);
  assert.match(pageSource, /handleSaveDraft/);
  assert.match(pageSource, /saveMenu\('DRAFT', false\)/);
  assert.match(pageSource, /saveMenu\('PUBLISHED', true\)/);
  assert.match(serviceSource, /pruneNilaiGiziArchive/);
});

test('Arsip Menu Harian edits records directly without returning to the input menu', () => {
  assert.match(pageSource, /editingArchive/);
  assert.match(pageSource, /Simpan Perubahan Arsip/);
  assert.match(pageSource, /handleSaveArchiveEdit/);
  assert.doesNotMatch(pageSource, /window\.location\.href = `\/informasi-menu\/nilai-gizi\?edit=/);
});

test('Arsip Menu Harian provides a confirmed delete action', () => {
  assert.match(pageSource, /Hapus Menu/);
  assert.match(pageSource, /api\.deleteNilaiGizi/);
  assert.match(pageSource, /window\.confirm/);
});

test('Arsip Menu Harian can enlarge menu images', () => {
  assert.match(pageSource, /archiveSelectedImage/);
  assert.match(pageSource, /Perbesar gambar menu/);
  assert.match(pageSource, /fixed inset-0 z-50/);
});
