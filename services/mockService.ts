

import { User, Karyawan, PMSekolah, PMB3, PICSekolah, KaderB3, DashboardStats, Periode, AbsensiRecord, HonorariumRow, AbsensiDetail, AlergiSiswa, Supplier, BahanMasuk, StokOpname, MasterBarang, StokSummary } from '../types';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, onSnapshot, query, where, updateDoc } from "firebase/firestore";

// ==========================================
// CONFIGURATION FOR HOSTING / REALTIME
// ==========================================
const firebaseConfig = {
  // --- GANTI DENGAN CONFIG FIREBASE ASLI ANDA ---
  apiKey: "AIzaSyDSEqsEyNK_PTecikuQ7VbD8MCvW_l1C_g",
  authDomain: "simanda-project.firebaseapp.com",
  projectId: "simanda-project",
  storageBucket: "simanda-project.firebasestorage.app",
  messagingSenderId: "1061662287994",
  appId: "1:1061662287994:web:de4e734af8b144c23b73c3",
  // -----------------------------------------
};

// Toggle this to TRUE to enable Cloud Sync
const USE_FIREBASE = true; 

// Initialize Firebase (Conditional)
let db: any;
if (USE_FIREBASE) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase init error (check config):", e);
  }
}

// ==========================================
// MOCK DATA & LOCAL STORAGE HELPERS
// ==========================================
const MOCK_SCAN_FILE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const INITIAL_USERS: User[] = [
  { id: '1', nama: 'Super Admin', email: 'super@simanda.com', username: 'superadmin', password: '123', jabatan: 'SUPERADMIN', status: 'AKTIF' },
  { id: '2', nama: 'Kepala SPPG', email: 'ksppg@simanda.com', username: 'ksppg', password: '123', jabatan: 'KSPPG', status: 'AKTIF' },
  { id: '3', nama: 'Admin SPPG', email: 'admin@simanda.com', username: 'admin', password: '123', jabatan: 'ADMINSPPG', status: 'AKTIF' },
  { id: '4', nama: 'Petugas Input', email: 'petugas@simanda.com', username: 'petugas', password: '123', jabatan: 'PETUGAS', status: 'AKTIF' },
  { id: '5', nama: 'Koor Lapangan', email: 'koor@simanda.com', username: 'koor', password: '123', jabatan: 'KOORDINATORDIVISI', jabatanDivisi: 'Asisten Lapangan', status: 'AKTIF' },
];

const INITIAL_KARYAWAN: Karyawan[] = [
  { id: '1', nik: '2023001', nama: 'Budi Santoso', divisi: 'Asisten Lapangan', hp: '081234567890', honorHarian: 150000, noBpjs: '00012345678', bank: 'BANK BRI', rekening: '1234567890', sertifikat: MOCK_SCAN_FILE },
  { id: '2', nik: '2023002', nama: 'Siti Aminah', divisi: 'Produksi (Masak)', hp: '089876543210', honorHarian: 175000, noBpjs: '00087654321', bank: 'BANK MANDIRI', rekening: '0987654321' }
];

const INITIAL_PM_SEKOLAH: PMSekolah[] = [
  { id: '1', nama: 'TK Harapan Bangsa', npsn: '1010101', desa: 'Ngadiluwih', jenis: 'TK', jmlsiswa: 45, pmBesar: 45, pmKecil: 0, jmlguru: 5, narahubung: 'Ibu Ratna', hp: '08123456789' },
  { id: '2', nama: 'SD Negeri 1 Pertiwi', npsn: '2022022', desa: 'Tales', jenis: 'SD/MI', jmlsiswa: 150, pmBesar: 100, pmKecil: 50, jmlguru: 12, narahubung: 'Pak Joko', hp: '08129876543', buktiScan: MOCK_SCAN_FILE }
];

const INITIAL_PM_B3: PMB3[] = [
  { id: '1', nama: 'Ani Lestari', jenis: 'IBU HAMIL', rt: '01', rw: '02', desa: 'Sukamaju', kecamatan: 'Cibadak', hp: '08567890123' },
  { id: '2', nama: 'Rina Wati', jenis: 'BALITA', rt: '05', rw: '03', desa: 'Cibadak Kota', kecamatan: 'Cibadak', hp: '08134567890', buktiScan: MOCK_SCAN_FILE }
];

const INITIAL_PIC_SEKOLAH: PICSekolah[] = [
  { id: '1', sekolahId: '1', namaSekolah: 'TK Harapan Bangsa', namaPic: 'Ibu Ratna', jabatan: 'ASN/P3K', jmlSiswa: 45, honorHarian: 50000 },
  { id: '2', sekolahId: '2', namaSekolah: 'SD Negeri 1 Pertiwi', namaPic: 'Pak Joko', jabatan: 'NON ASN/P3K', jmlSiswa: 150, honorHarian: 75000 }
];

const INITIAL_KADER_B3: KaderB3[] = [
  { id: '1', nik: '350101010101', nama: 'Bu Ani Kader', alamat: 'Jl. Melati No 5', desa: 'Sukamaju', jumlahPaket: 1, honorHarian: 50000 }
];

const INITIAL_ALERGI: AlergiSiswa[] = [
  { id: '1', sekolahId: '1', namaSekolah: 'TK Harapan Bangsa', namaSiswa: 'Doni', keterangan: 'Alergi Telur' },
  { id: '2', sekolahId: '2', namaSekolah: 'SD Negeri 1 Pertiwi', namaSiswa: 'Sari', keterangan: 'Alergi Kacang' }
];

// Mock Inventory Data
const INITIAL_SUPPLIERS: Supplier[] = [
  { id: '1', nama: 'Toko Sayur Segar Jaya', alamat: 'Pasar Ngadiluwih Blok A', hp: '081233344455', keterangan: 'Langganan Sayur' },
  { id: '2', nama: 'UD. Beras Makmur', alamat: 'Jl. Raya Kediri No 10', hp: '085677788899', keterangan: 'Suplayer Beras Premium' }
];

const INITIAL_MASTER_BARANG: MasterBarang[] = [
    { id: '1', namaBarang: 'Beras IR 64', satuanDefault: 'kg' },
    { id: '2', namaBarang: 'Telur Ayam', satuanDefault: 'kg' },
    { id: '3', namaBarang: 'Wortel', satuanDefault: 'kg' },
    { id: '4', namaBarang: 'Minyak Goreng', satuanDefault: 'liter' },
];

const INITIAL_BAHAN_MASUK: BahanMasuk[] = [
  { id: '1', tanggal: '2025-01-20', supplierId: '1', namaSupplier: 'Toko Sayur Segar Jaya', namaBahan: 'Wortel', jumlah: 50, satuan: 'kg', hargaTotal: 500000, keterangan: 'Kualitas Bagus' },
  { id: '2', tanggal: '2025-01-21', supplierId: '2', namaSupplier: 'UD. Beras Makmur', namaBahan: 'Beras IR 64', jumlah: 100, satuan: 'kg', hargaTotal: 1200000 }
];

const INITIAL_STOK_OPNAME: StokOpname[] = [
  { id: '1', tanggal: '2025-01-25', namaBahan: 'Beras IR 64', stokFisik: 85, satuan: 'kg', kondisi: 'BAIK', keterangan: 'Sisa stok gudang', petugas: 'Admin' }
];

// Keys
const KEYS = {
  USERS: 'simanda_users_v3',
  KARYAWAN: 'simanda_karyawan_v2',
  PM_SEKOLAH: 'simanda_pm_sekolah_v2',
  PM_B3: 'simanda_pm_b3_v2',
  PIC_SEKOLAH: 'simanda_pic_sekolah_v1',
  KADER_B3: 'simanda_kader_b3_v1',
  ALERGI: 'simanda_alergi_v1',
  PERIODE: 'simanda_periode_v1',
  ABSENSI: 'simanda_absensi_v2',
  // New Inventory Keys
  SUPPLIER: 'simanda_supplier_v1',
  MASTER_BARANG: 'simanda_master_barang_v1',
  BAHAN_MASUK: 'simanda_bahan_masuk_v1',
  STOK_OPNAME: 'simanda_stok_opname_v1'
};

// Realtime Broadcast Channel for Local Sync (Fallback)
const channel = new BroadcastChannel('simanda_sync_channel');

const localDb = {
  get: <T>(key: string, initial: T): T => {
    try {
      const s = localStorage.getItem(key);
      if (!s) {
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(s);
    } catch (e) { return initial; }
  },
  set: <T>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
    channel.postMessage({ key, type: 'update' }); // Notify other tabs
  }
};

// ==========================================
// UNIFIED API SERVICE
// ==========================================

// Helper to handle subscriptions based on mode
const createSubscriber = <T>(
  collectionName: string, 
  localKey: string, 
  initialData: T[], 
  callback: (data: T[]) => void,
  customQuery?: any
) => {
  if (USE_FIREBASE && db) {
    // FIREBASE MODE
    try {
      const q = customQuery || collection(db, collectionName);
      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const items = snapshot.docs.map((doc: any) => ({ ...(doc.data() as any), id: doc.id }));
        // Also update local storage for offline backup
        localDb.set(localKey, items); 
        callback(items);
      }, (error: any) => {
        console.error(`Firebase error on ${collectionName}:`, error);
        // Fallback to local if Firebase fails
        callback(localDb.get(localKey, initialData));
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Firebase connection failed, falling back to local.");
    }
  } 
  
  // LOCAL STORAGE POLLING / EVENT LISTENER
  const notify = () => {
    const data = localDb.get<T[]>(localKey, initialData);
    callback(data);
  };
  
  // Initial call
  notify();

  // Listen to changes from this tab or others
  const msgHandler = (e: MessageEvent) => { if (e.data.key === localKey) notify(); };
  channel.addEventListener('message', msgHandler);
  
  return () => channel.removeEventListener('message', msgHandler);
};

const saveData = async (collectionName: string, localKey: string, item: any, isDelete = false) => {
  // ALWAYS save to local as backup/hybrid
  let data = localDb.get<any[]>(localKey, []);
  if (isDelete) {
    data = data.filter(x => x.id !== item.id);
  } else {
    if (item.id) {
      const idx = data.findIndex(x => x.id === item.id);
      if (idx > -1) data[idx] = { ...(data[idx] as any), ...item };
      else data.push(item);
    } else {
      item.id = Date.now().toString();
      data.push(item);
    }
  }
  localDb.set(localKey, data);

  // IF FIREBASE ENABLED, SYNC TO CLOUD
  if (USE_FIREBASE && db) {
    try {
      if (isDelete) {
        await deleteDoc(doc(db, collectionName, item.id));
      } else {
        await setDoc(doc(db, collectionName, item.id), item, { merge: true });
      }
    } catch (e) {
      console.error("Firebase save error:", e);
      throw e;
    }
  }
};

export const api = {
  // === AUTH & USER SYNC ===
  login: async (u: string, p: string) => {
    let users: User[] = [];
    if (USE_FIREBASE && db) {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        users = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User));
      } catch (e) {
        users = localDb.get<User[]>(KEYS.USERS, INITIAL_USERS);
      }
    } else {
      users = localDb.get<User[]>(KEYS.USERS, INITIAL_USERS);
    }

    const user = users.find(user => user.username === u && user.password === p);
    if (user) {
      if (user.status === 'AKTIF') {
        // Return full user including password so App.tsx can compare for sync
        return { status: 'success', token: 'mock-jwt-' + Date.now(), user: user };
      }
      return { status: 'error', message: 'Akun Tidak Aktif' };
    }
    return { status: 'error', message: 'Username atau password salah' };
  },

  // Monitor Single User (For Auto-Logout/Profile Sync)
  subscribeUser: (userId: string, callback: (user: User | null) => void) => {
    if (USE_FIREBASE && db) {
      return onSnapshot(doc(db, 'users', userId), (doc) => {
        if (doc.exists()) callback({ ...doc.data(), id: doc.id } as User);
        else callback(null);
      });
    } else {
      // Polling for local storage changes
      const check = () => {
        const users = localDb.get<User[]>(KEYS.USERS, INITIAL_USERS);
        const u = users.find(x => x.id === userId) || null;
        callback(u);
      };
      check();
      const msgHandler = (e: MessageEvent) => { if (e.data.key === KEYS.USERS) check(); };
      channel.addEventListener('message', msgHandler);
      return () => channel.removeEventListener('message', msgHandler);
    }
  },

  // === DASHBOARD STATS (REALTIME) ===
  subscribeStats: (callback: (stats: DashboardStats) => void) => {
    let k: Karyawan[] = [], s: PMSekolah[] = [], b: PMB3[] = [];
    
    const update = () => {
       const pmKecil = s.reduce((acc, curr) => acc + (curr.pmKecil || 0), 0);
       const pmBesar = s.reduce((acc, curr) => acc + (curr.pmBesar || 0), 0);
       const guru = s.reduce((acc, curr) => acc + (curr.jmlguru || 0), 0);
       const balita = b.filter(i => i.jenis === 'BALITA').length;
       const ibuHamil = b.filter(i => i.jenis === 'IBU HAMIL').length;
       const ibuMenyusui = b.filter(i => i.jenis === 'IBU MENYUSUI').length;

       callback({
        karyawan: k.length,
        pmsekolah: s.length,
        pmb3: b.length,
        pmKecil, pmBesar, guru, balita, ibuHamil, ibuMenyusui
      });
    };

    const unsubK = createSubscriber('karyawan', KEYS.KARYAWAN, INITIAL_KARYAWAN, (data) => { k = data; update(); });
    const unsubS = createSubscriber('pm_sekolah', KEYS.PM_SEKOLAH, INITIAL_PM_SEKOLAH, (data) => { s = data; update(); });
    const unsubB = createSubscriber('pm_b3', KEYS.PM_B3, INITIAL_PM_B3, (data) => { b = data; update(); });

    return () => { unsubK(); unsubS(); unsubB(); };
  },
  
  // === GENERIC REALTIME CRUD ===
  // Users
  getUsers: (q: string = '') => { return Promise.resolve(localDb.get(KEYS.USERS, INITIAL_USERS)); }, 
  subscribeUsers: (cb: (data: User[]) => void) => createSubscriber('users', KEYS.USERS, INITIAL_USERS, cb),
  saveUser: (item: User) => saveData('users', KEYS.USERS, item),
  deleteUser: (id: string) => saveData('users', KEYS.USERS, { id }, true),

  // Karyawan
  getKaryawan: (q: string = '') => Promise.resolve(localDb.get(KEYS.KARYAWAN, INITIAL_KARYAWAN)),
  subscribeKaryawan: (cb: (data: Karyawan[]) => void) => createSubscriber('karyawan', KEYS.KARYAWAN, INITIAL_KARYAWAN, cb),
  saveKaryawan: (item: Karyawan) => saveData('karyawan', KEYS.KARYAWAN, item),
  deleteKaryawan: (id: string) => saveData('karyawan', KEYS.KARYAWAN, { id }, true),

  // PM Sekolah
  getPMs: (q: string = '') => Promise.resolve(localDb.get(KEYS.PM_SEKOLAH, INITIAL_PM_SEKOLAH)),
  subscribePMs: (cb: (data: PMSekolah[]) => void) => createSubscriber('pm_sekolah', KEYS.PM_SEKOLAH, INITIAL_PM_SEKOLAH, cb),
  savePM: (item: PMSekolah) => saveData('pm_sekolah', KEYS.PM_SEKOLAH, item),
  deletePM: (id: string) => saveData('pm_sekolah', KEYS.PM_SEKOLAH, { id }, true),

  // PM B3
  getB3s: (q: string = '') => Promise.resolve(localDb.get(KEYS.PM_B3, INITIAL_PM_B3)),
  subscribeB3s: (cb: (data: PMB3[]) => void) => createSubscriber('pm_b3', KEYS.PM_B3, INITIAL_PM_B3, cb),
  saveB3: (item: PMB3) => saveData('pm_b3', KEYS.PM_B3, item),
  deleteB3: (id: string) => saveData('pm_b3', KEYS.PM_B3, { id }, true),

  // PIC Sekolah
  getPICSekolah: (q: string = '') => Promise.resolve(localDb.get(KEYS.PIC_SEKOLAH, INITIAL_PIC_SEKOLAH)),
  subscribePICSekolah: (cb: (data: PICSekolah[]) => void) => createSubscriber('pic_sekolah', KEYS.PIC_SEKOLAH, INITIAL_PIC_SEKOLAH, cb),
  savePICSekolah: (item: PICSekolah) => saveData('pic_sekolah', KEYS.PIC_SEKOLAH, item),
  deletePICSekolah: (id: string) => saveData('pic_sekolah', KEYS.PIC_SEKOLAH, { id }, true),

  // Kader B3
  getKaderB3: (q: string = '') => Promise.resolve(localDb.get(KEYS.KADER_B3, INITIAL_KADER_B3)),
  subscribeKaderB3: (cb: (data: KaderB3[]) => void) => createSubscriber('kader_b3', KEYS.KADER_B3, INITIAL_KADER_B3, cb),
  saveKaderB3: (item: KaderB3) => saveData('kader_b3', KEYS.KADER_B3, item),
  deleteKaderB3: (id: string) => saveData('kader_b3', KEYS.KADER_B3, { id }, true),

  // Alergi Siswa
  getAlergi: (q: string = '') => Promise.resolve(localDb.get(KEYS.ALERGI, INITIAL_ALERGI)),
  subscribeAlergi: (cb: (data: AlergiSiswa[]) => void) => createSubscriber('alergi_siswa', KEYS.ALERGI, INITIAL_ALERGI, cb),
  saveAlergi: (item: AlergiSiswa) => saveData('alergi_siswa', KEYS.ALERGI, item),
  deleteAlergi: (id: string) => saveData('alergi_siswa', KEYS.ALERGI, { id }, true),

  // === INVENTORY MANAGEMENT (NEW) ===
  // Supplier
  subscribeSuppliers: (cb: (data: Supplier[]) => void) => createSubscriber('suppliers', KEYS.SUPPLIER, INITIAL_SUPPLIERS, cb),
  saveSupplier: (item: Supplier) => saveData('suppliers', KEYS.SUPPLIER, item),
  deleteSupplier: (id: string) => saveData('suppliers', KEYS.SUPPLIER, { id }, true),

  // Master Barang (Role Model)
  subscribeMasterBarang: (cb: (data: MasterBarang[]) => void) => createSubscriber('master_barang', KEYS.MASTER_BARANG, INITIAL_MASTER_BARANG, cb),
  saveMasterBarang: (item: MasterBarang) => saveData('master_barang', KEYS.MASTER_BARANG, item),

  // Bahan Masuk
  subscribeBahanMasuk: (cb: (data: BahanMasuk[]) => void) => createSubscriber('bahan_masuk', KEYS.BAHAN_MASUK, INITIAL_BAHAN_MASUK, cb),
  
  // Updated saveBahanMasuk with Auto-Add to Master Logic
  saveBahanMasuk: async (item: BahanMasuk) => {
    await saveData('bahan_masuk', KEYS.BAHAN_MASUK, item);
    
    // Check if this item exists in MasterBarang, if not add it (Role Model)
    let masters = localDb.get<MasterBarang[]>(KEYS.MASTER_BARANG, INITIAL_MASTER_BARANG);
    
    // Check uniqueness case-insensitive
    const exists = masters.some(m => m.namaBarang.toLowerCase() === item.namaBahan.toLowerCase());
    
    if (!exists) {
        // Auto create new Role Model
        const newMaster: MasterBarang = {
            id: 'mb-' + Date.now() + Math.random().toString(36).substr(2, 5),
            namaBarang: item.namaBahan,
            satuanDefault: item.satuan
        };
        await saveData('master_barang', KEYS.MASTER_BARANG, newMaster);
    }
  },
  
  deleteBahanMasuk: (id: string) => saveData('bahan_masuk', KEYS.BAHAN_MASUK, { id }, true),

  // Stok Summary (Aggregated View)
  subscribeStokSummary: (cb: (data: StokSummary[]) => void) => {
      // Re-use subscribeBahanMasuk to compute aggregation in realtime
      return api.subscribeBahanMasuk((bahanMasuk) => {
          const map = new Map<string, StokSummary>();

          bahanMasuk.forEach(item => {
              // Create unique key based on Name + Supplier (lowercase to normalize)
              const key = `${item.namaBahan.toLowerCase()}_${item.namaSupplier.toLowerCase()}`;
              
              if (map.has(key)) {
                  const existing = map.get(key)!;
                  existing.totalStok += item.jumlah;
                  // Update last updated date if current item is newer
                  if (item.tanggal > existing.lastUpdated) {
                      existing.lastUpdated = item.tanggal;
                  }
              } else {
                  map.set(key, {
                      id: key,
                      namaBahan: item.namaBahan, // Keep original casing of first entry
                      namaSupplier: item.namaSupplier,
                      totalStok: item.jumlah,
                      satuan: item.satuan,
                      lastUpdated: item.tanggal
                  });
              }
          });

          // Convert map to array
          cb(Array.from(map.values()));
      });
  },

  // Stok Opname
  subscribeStokOpname: (cb: (data: StokOpname[]) => void) => createSubscriber('stok_opname', KEYS.STOK_OPNAME, INITIAL_STOK_OPNAME, cb),
  saveStokOpname: (item: StokOpname) => saveData('stok_opname', KEYS.STOK_OPNAME, item),
  deleteStokOpname: (id: string) => saveData('stok_opname', KEYS.STOK_OPNAME, { id }, true),

  // === ABSENSI & PERIODE ===
  getPeriode: async () => Promise.resolve(localDb.get(KEYS.PERIODE, [])),
  subscribePeriode: (cb: (data: Periode[]) => void) => createSubscriber('periode', KEYS.PERIODE, [], cb),
  savePeriode: (item: Periode) => saveData('periode', KEYS.PERIODE, item),
  updatePeriode: (item: Periode) => saveData('periode', KEYS.PERIODE, item),
  deletePeriode: (id: string) => saveData('periode', KEYS.PERIODE, { id }, true),

  // REALTIME ABSENSI (Synced with Master Karyawan)
  subscribeAbsensi: (periodeId: string, cb: (data: AbsensiRecord[]) => void) => {
    // Helper to init empty days and details
    const createEmptyDays = () => {
      const days: { [key: number]: boolean } = {};
      const details: { [key: number]: AbsensiDetail } = {};
      for (let i = 1; i <= 14; i++) {
          days[i] = false;
          details[i] = {};
      }
      return { days, details };
    };

    let allAbsensi: AbsensiRecord[] = [];
    let allKaryawan: Karyawan[] = [];

    const processData = () => {
       if (!periodeId) return;
       
       // 1. Filter Absensi by this Period (from DB/Storage)
       const rawAbsensi = allAbsensi.filter(a => a.periodeId === periodeId);
       
       // 2. Map existing records by Karyawan ID for O(1) lookup
       const absensiMap = new Map(rawAbsensi.map(r => [r.karyawanId, r]));

       // 3. Build the final list based STRICTLY on active Karyawan (Left Join)
       // This handles Adding (new Karyawan appears) and Deleting (deleted Karyawan disappears)
       const syncedRecords = allKaryawan.map(karyawan => {
          const record = absensiMap.get(karyawan.id);

          if (record) {
             // Return existing record (update name/divisi from master to ensure sync)
             return {
                ...record,
                namaKaryawan: karyawan.nama,
                divisi: karyawan.divisi
             };
          } else {
             // New Karyawan found! Create virtual empty record
             const { days, details } = createEmptyDays();
             return {
                id: `auto-${periodeId}-${karyawan.id}`, // Temporary/Virtual ID until saved
                periodeId: periodeId,
                karyawanId: karyawan.id,
                namaKaryawan: karyawan.nama,
                divisi: karyawan.divisi,
                hari: days,
                detailHari: details,
                totalHadir: 0
             } as AbsensiRecord;
          }
       });

       cb(syncedRecords);
    };

    // If Firebase, use query to be efficient
    const absensiQuery = (USE_FIREBASE && db) 
        ? query(collection(db, 'absensi'), where('periodeId', '==', periodeId)) 
        : undefined;

    const unsubA = createSubscriber('absensi', KEYS.ABSENSI, [], (data) => { allAbsensi = data; processData(); }, absensiQuery);
    const unsubK = createSubscriber('karyawan', KEYS.KARYAWAN, INITIAL_KARYAWAN, (data) => { allKaryawan = data; processData(); });

    return () => { unsubA(); unsubK(); };
  },

  // Updated to support saving single record (Auto-Save on checkbox)
  saveAbsensiRecord: async (record: AbsensiRecord) => {
     // Ensure ID is set (if it was virtual 'auto-...')
     if (!record.id || record.id.startsWith('auto-')) {
         record.id = `abs-${record.periodeId}-${record.karyawanId}`;
     }
     await saveData('absensi', KEYS.ABSENSI, record);
  },

  // === HONORARIUM (REALTIME JOIN) ===
  // This combines Absensi Data and Karyawan Data (for Bank info/Honor rate) in Realtime
  subscribeHonorariumKaryawan: (periodeId: string, cb: (data: HonorariumRow[]) => void) => {
      let absensiRecords: AbsensiRecord[] = [];
      let karyawanData: Karyawan[] = [];
      
      const update = () => {
           if (!periodeId) { cb([]); return; }
           
           const rows = absensiRecords.map(abs => {
               // Find matching Karyawan to get current Honor Rate and Bank Info
               const k = karyawanData.find(x => x.id === abs.karyawanId);
               const honorHarian = k?.honorHarian || 0;
               
               return {
                  id: `honor-${abs.id}`,
                  karyawanId: abs.karyawanId,
                  nama: abs.namaKaryawan,
                  divisi: abs.divisi,
                  bank: k?.bank || '-',
                  rekening: k?.rekening || '-',
                  totalHadir: abs.totalHadir || 0,
                  honorHarian: honorHarian,
                  totalTerima: (abs.totalHadir || 0) * honorHarian
               };
           });
           cb(rows);
      };

      // Reuse subscribeAbsensi to get virtual records + attendance counts
      const unsubAbsensi = api.subscribeAbsensi(periodeId, (data) => {
          absensiRecords = data;
          update();
      });
      
      // Subscribe to Karyawan to get realtime Bank/Honor Rate updates
      const unsubKaryawan = createSubscriber('karyawan', KEYS.KARYAWAN, INITIAL_KARYAWAN, (data) => {
          karyawanData = data;
          update();
      });

      return () => { unsubAbsensi(); unsubKaryawan(); };
  }
};
