
export type Role = 'SUPERADMIN' | 'KSPPG' | 'ADMINSPPG' | 'PETUGAS' | 'KOORDINATORDIVISI';

export interface User {
  id: string;
  nama: string;
  email: string;
  username: string;
  password?: string; // Optional for display
  jabatan: Role;
  jabatanDivisi?: string; // Optional, used for KOORDINATORDIVISI to match Karyawan Division
  status: 'AKTIF' | 'TIDAK AKTIF';
  sessionId?: string; // New: Unique ID to track active login session
}

export interface Karyawan {
  id: string;
  nik: string;
  nama: string;
  divisi: string;
  hp?: string;
  honorHarian?: number;
  noBpjs?: string;
  bank?: 'BANK BRI' | 'BANK MANDIRI' | 'BANK BNI';
  rekening?: string;
  sertifikat?: string; // Base64 string for file upload
}

export interface PMSekolah {
  id: string;
  nama: string;
  npsn: string;
  desa?: string; // Added Desa field
  jenis: 'KB/PAUD' | 'TK' | 'SD/MI' | 'SMP/MTS' | 'SMA/MA';
  jmlsiswa: number;
  pmBesar: number;
  pmKecil: number;
  jmlguru: number;
  narahubung: string;
  hp: string;
  buktiScan?: string;
  statusProposal?: 'SUDAH' | 'BELUM'; // New Field for Flagging
}

export interface AlergiSiswa {
  id: string;
  sekolahId: string; // Link to PMSekolah
  namaSekolah: string; // Denormalized for display
  namaSiswa: string;
  keterangan: string;
}

export interface PMB3 {
  id: string;
  nama: string;
  jenis: 'BALITA' | 'IBU HAMIL' | 'IBU MENYUSUI';
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  hp: string;
  buktiScan?: string;
}

export interface KaderB3 {
  id: string;
  nik: string;
  nama: string;
  alamat: string;
  desa: string;
  jumlahPaket: number; // Auto-calculated from PMB3 count in the same Desa
  honorHarian: number;
}

export interface PICSekolah {
  id: string;
  sekolahId: string; // Reference to PMSekolah ID
  namaSekolah: string; // Denormalized for easier display/export
  namaPic: string;
  jabatan: 'ASN/P3K' | 'NON ASN/P3K';
  jmlSiswa: number; // Auto-fetched from PMSekolah
  honorHarian: number;
}

export interface Periode {
  id: string;
  nama: string; // e.g., "Januari 2025 - Periode 1"
  tanggalMulai: string;
  status: 'OPEN' | 'CLOSED';
}

// === NEW: Detailed Attendance Data (Foto & Jam) ===
export interface AbsensiDetail {
  jamMasuk?: string;  // "07:30"
  jamPulang?: string; // "16:00"
  fotoMasuk?: string; // Base64 Thumbnail
  fotoPulang?: string; // Base64 Thumbnail
  lokasi?: string;    // Optional: Lat,Long
}

export interface AbsensiRecord {
  id: string;
  periodeId: string;
  karyawanId: string;
  namaKaryawan: string;
  divisi: string;
  // Legacy boolean map (Mencegah error sistem lama)
  hari: { [key: number]: boolean };
  // New detailed map (Menyimpan Foto & Jam)
  detailHari?: { [key: number]: AbsensiDetail }; 
  totalHadir: number;
}

export interface HonorariumRow {
  id: string;
  karyawanId: string;
  nama: string;
  divisi: string;
  bank: string;
  rekening: string;
  totalHadir: number;
  honorHarian: number;
  totalTerima: number;
}

export interface DashboardStats {
  karyawan: number;
  pmsekolah: number;
  pmb3: number;
  pmKecil: number;
  pmBesar: number;
  guru: number;
  balita: number;
  ibuHamil: number;
  ibuMenyusui: number;
}

// === NEW: INVENTORY MANAGEMENT TYPES ===
export interface Supplier {
  id: string;
  nama: string;
  alamat: string;
  hp: string;
  keterangan?: string;
}

// Master Barang for Autocomplete (Role Model)
export interface MasterBarang {
  id: string;
  namaBarang: string; // Unique Key
  satuanDefault?: string;
}

export interface BahanMasuk {
  id: string;
  tanggal: string;
  supplierId: string;
  namaSupplier: string; // Denormalized
  namaBahan: string;
  jumlah: number;
  satuan: string; // kg, liter, pcs, ikat, dll
  hargaTotal?: number; // Optional now
  keterangan?: string;
  buktiFoto?: string;
}

// NEW: Bahan Keluar
export interface BahanKeluar {
  id: string;
  tanggal: string;
  namaBahan: string;
  jumlah: number;
  satuan: string;
  keterangan?: string;
}

// Type for Aggregated Stock View
export interface StokSummary {
  id: string; // composite key: namaBahan_namaSupplier
  namaBahan: string;
  namaSupplier: string;
  totalStok: number;
  satuan: string;
  lastUpdated: string;
}

export interface StokOpname {
  id: string;
  tanggal: string;
  namaBahan: string;
  stokFisik: number;
  satuan: string;
  kondisi: 'BAIK' | 'RUSAK' | 'KADALUARSA';
  keterangan?: string;
  petugas?: string;
}
