import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const archiveSource = readFileSync(new URL('../pages/MenuInformation.tsx', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../services/mockService.ts', import.meta.url), 'utf8');

test('Arsip Menu Harian filters records by production date', () => {
  assert.match(archiveSource, /Filter Tanggal Produksi/);
  assert.match(archiveSource, /tanggalFilter/);
  assert.match(archiveSource, /item\.tanggalProduksi === tanggalFilter/);
  assert.match(archiveSource, /Tidak ada menu untuk tanggal produksi ini/);
});

test('nutrition archive retains only 20 newest records and deletes the oldest excess records', () => {
  assert.match(serviceSource, /MAX_NILAI_GIZI_RECORDS = 20/);
  assert.match(serviceSource, /sort\(\(a, b\) => a\.tanggalProduksi\.localeCompare\(b\.tanggalProduksi\)\)/);
  assert.match(serviceSource, /recordsToDelete/);
  assert.match(serviceSource, /await Promise\.all\(recordsToDelete\.map/);
  assert.match(serviceSource, /deleteDoc\(doc\(db, 'nilai_gizi_menu', record\.id\)\)/);
});
