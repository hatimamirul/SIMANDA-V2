
import { User, Karyawan, PMSekolah, PMB3, PICSekolah, KaderB3, DashboardStats, Periode, AbsensiRecord, HonorariumRow } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';

// ==========================================
// CONFIGURATION FOR HOSTING / REALTIME
// ==========================================
// 1. Buka console.firebase.google.com, buat project baru (Gratis).
// 2. Buat database Firestore (Start in Test Mode).
// 3. Masuk ke Project Settings > General > Your Apps > Web App.
// 4. Copy config di bawah ini.
// ==========================================

const firebaseConfig = {
  // --- GANTI DENGAN CONFIG FIREBASE ANDA ---
  apiKey: "AIzaSyDSEqsEyNK_PTecikuQ7VbD8MCvW_l1C_g",
  authDomain: "simanda-project.firebaseapp.com",
  projectId: "simanda-project",
  storageBucket: "simanda-project.firebasestorage.app",
  messagingSenderId: "1061662287994",
  appId: "1061662287994:web:de4e734af8b144c23b73c3"
  // -----------------------------------------
};

// AKTIFKAN MODE REALTIME (FIREBASE)
export const USE_FIREBASE = true; 

// Initialize Firebase only if enabled
let dbFirestore: any;
if (USE_FIREBASE) {
  try {
    // Check if config is still placeholder
    if (firebaseConfig.apiKey.includes("GANTI")) {
        console.warn("⚠️ PERHATIAN: Config Firebase belum diisi di services/mockService.ts. Aplikasi berjalan dalam mode Hybrid/Offline.");
    } else {
        const app = initializeApp(firebaseConfig);
        dbFirestore = getFirestore(app);
        console.log("✅ Firebase Initialized - Realtime Mode Active");
    }
  } catch (e) {
    console.error("Firebase Init Failed (Check Config):", e);
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
  { id: '1', nama: 'TK Harapan Bangsa', npsn: '1010101', jenis: 'TK', jmlsiswa: 45, pmBesar: 45, pmKecil: 0, jmlguru: 5, narahubung: 'Ibu Ratna', hp: '08123456789' },
  { id: '2', nama: 'SD Negeri 1 Pertiwi', npsn: '2022022', jenis: 'SD/MI', jmlsiswa: 150, pmBesar: 100, pmKecil: 50, jmlguru: 12, narahubung: 'Pak Joko', hp: '08129876543', buktiScan: MOCK_SCAN_FILE }
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

// Keys
const KEYS = {
  USERS: 'simanda_users_v3',
  KARYAWAN: 'simanda_karyawan_v2',
  PM_SEKOLAH: 'simanda_pm_sekolah_v2',
  PM_B3: 'simanda_pm_b3_v2',
  PIC_SEKOLAH: 'simanda_pic_sekolah_v1',
  KADER_B3: 'simanda_kader_b3_v1',
  PERIODE: 'simanda_periode_v1',
  ABSENSI: 'simanda_absensi_v2' 
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
  if (USE_FIREBASE && dbFirestore) {
    // FIREBASE REALTIME LISTENER
    const q = customQuery ? customQuery : query(collection(dbFirestore, collectionName));
    return onSnapshot(q, (snapshot: any) => {
      const items: T[] = [];
      snapshot.forEach((doc: any) => items.push({ ...doc.data(), id: doc.id } as T));
      callback(items);
    }, (error: any) => {
        console.error(`Firebase Error (${collectionName}):`, error);
        // Fallback to local if Firebase fails
        const data = localDb.get<T[]>(localKey, initialData);
        callback(data);
    });
  } else {
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
  }
};

const saveData = async (collectionName: string, localKey: string, item: any, isDelete = false) => {
  if (USE_FIREBASE && dbFirestore) {
    try {
      if (isDelete) {
        await deleteDoc(doc(dbFirestore, collectionName, item.id));
      } else {
        // If new, generate ID if not present
        if (!item.id) item.id = doc(collection(dbFirestore, collectionName)).id;
        // Convert undefined fields to null or delete them, Firestore doesn't like undefined
        const cleanItem = JSON.parse(JSON.stringify(item));
        await setDoc(doc(dbFirestore, collectionName, item.id), cleanItem, { merge: true });
      }
    } catch (err) {
      console.error(`Firebase Save Error (${collectionName}):`, err);
    }
  } 
  
  // ALWAYS save to local as backup/hybrid
  let data = localDb.get<any[]>(localKey, []);
  if (isDelete) {
    data = data.filter(x => x.id !== item.id);
  } else {
    if (item.id) {
      const idx = data.findIndex(x => x.id === item.id);
      if (idx > -1) data[idx] = { ...data[idx], ...item };
      else data.push(item);
    } else {
      item.id = Date.now().toString();
      data.push(item);
    }
  }
  localDb.set(localKey, data);
};

export const api = {
  // === AUTH & USER SYNC ===
  login: async (u: string, p: string) => {
    let users: User[] = [];
    if (USE_FIREBASE && dbFirestore) {
      try {
        const snap = await getDocs(collection(dbFirestore, 'users'));
        snap.forEach(d => users.push({ ...d.data(), id: d.id } as User));
        if (users.length === 0) {
            // Seed initial users if DB is empty
            for(const user of INITIAL_USERS) {
                 await setDoc(doc(dbFirestore, 'users', user.id), user);
            }
            users = INITIAL_USERS;
        }
      } catch (e) {
        console.warn("Firebase offline/error, falling back to local users", e);
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
    if (USE_FIREBASE && dbFirestore) {
      return onSnapshot(doc(dbFirestore, 'users', userId), (doc) => {
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

  // === ABSENSI & PERIODE ===
  getPeriode: async () => Promise.resolve(localDb.get(KEYS.PERIODE, [])),
  subscribePeriode: (cb: (data: Periode[]) => void) => createSubscriber('periode', KEYS.PERIODE, [], cb),
  savePeriode: (item: Periode) => saveData('periode', KEYS.PERIODE, item),
  updatePeriode: (item: Periode) => saveData('periode', KEYS.PERIODE, item),

  getAbsensiByPeriode: async (periodeId: string) => { 
    return localDb.get<AbsensiRecord[]>(KEYS.ABSENSI, []).filter(a => a.periodeId === periodeId);
  },

  // REALTIME ABSENSI (Optimized for performance)
  subscribeAbsensi: (periodeId: string, cb: (data: AbsensiRecord[]) => void) => {
    // Helper to init empty records
    const createEmptyDays = () => {
      const days: { [key: number]: boolean } = {};
      for (let i = 1; i <= 14; i++) days[i] = false;
      return days;
    };

    let allAbsensi: AbsensiRecord[] = [];
    let allKaryawan: Karyawan[] = [];

    const processData = () => {
       if (!periodeId) return;
       // 1. Existing records for this period (already filtered if using Firebase)
       let records = allAbsensi.filter(a => a.periodeId === periodeId);
       
       // 2. Check for new employees
       const existingKaryawanIds = new Set(records.map(r => r.karyawanId));
       const newKaryawan = allKaryawan.filter(k => !existingKaryawanIds.has(k.id));

       if (newKaryawan.length > 0) {
          const newRecords = newKaryawan.map(k => ({
            id: `abs-${periodeId}-${k.id}`,
            periodeId: periodeId,
            karyawanId: k.id,
            namaKaryawan: k.nama,
            divisi: k.divisi,
            hari: createEmptyDays(),
            totalHadir: 0
          }));
          // Merge virtual new records
          records = [...records, ...newRecords];
       }
       cb(records);
    };

    // Firebase Optimization: Only subscribe to records for this specific period
    const absensiQuery = (USE_FIREBASE && dbFirestore) 
        ? query(collection(dbFirestore, 'absensi'), where('periodeId', '==', periodeId))
        : undefined;

    const unsubA = createSubscriber('absensi', KEYS.ABSENSI, [], (data) => { allAbsensi = data; processData(); }, absensiQuery);
    const unsubK = createSubscriber('karyawan', KEYS.KARYAWAN, INITIAL_KARYAWAN, (data) => { allKaryawan = data; processData(); });

    return () => { unsubA(); unsubK(); };
  },

  // Updated to support saving single record (Auto-Save on checkbox)
  saveAbsensiRecord: async (record: AbsensiRecord) => {
     await saveData('absensi', KEYS.ABSENSI, record);
  },

  saveAbsensi: async (records: AbsensiRecord[]) => {
    for (const rec of records) {
      await saveData('absensi', KEYS.ABSENSI, rec);
    }
  },

  // === HONORARIUM ===
  getHonorariumKaryawan: async (periodeId: string): Promise<HonorariumRow[]> => {
    let allAbsensi: AbsensiRecord[] = [];
    let allKaryawan: Karyawan[] = [];
    
    if (USE_FIREBASE && dbFirestore) {
      // Fetch only for this period
      const q = query(collection(dbFirestore, 'absensi'), where('periodeId', '==', periodeId));
      const s1 = await getDocs(q);
      s1.forEach(d => allAbsensi.push(d.data() as AbsensiRecord));
      
      const s2 = await getDocs(collection(dbFirestore, 'karyawan'));
      s2.forEach(d => allKaryawan.push(d.data() as Karyawan));
    } else {
      allAbsensi = localDb.get(KEYS.ABSENSI, []).filter(a => a.periodeId === periodeId);
      allKaryawan = localDb.get(KEYS.KARYAWAN, INITIAL_KARYAWAN);
    }
    
    return allAbsensi.map(abs => {
      const karyawan = allKaryawan.find(k => k.id === abs.karyawanId);
      const honorHarian = karyawan?.honorHarian || 0;
      const totalHadir = abs.totalHadir || 0;
      
      return {
        id: `honor-${abs.id}`,
        karyawanId: abs.karyawanId,
        nama: abs.namaKaryawan,
        divisi: abs.divisi,
        bank: karyawan?.bank || '-',
        rekening: karyawan?.rekening || '-',
        totalHadir: totalHadir,
        honorHarian: honorHarian,
        totalTerima: totalHadir * honorHarian
      };
    });
  }
};
