
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
  jenis: 'KB/PAUD' | 'TK' | 'SD/MI' | 'SMP/MTS' | 'SMA/MA';
  jmlsiswa: number;
  pmBesar: number;
  pmKecil: number;
  jmlguru: number;
  narahubung: string;
  hp: string;
  buktiScan?: string;
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

export interface AbsensiRecord {
  id: string;
  periodeId: string;
  karyawanId: string;
  namaKaryawan: string;
  divisi: string;
  // Map of day index (1-12) to presence status (true = hadir, false = tidak)
  hari: { [key: number]: boolean };
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