import { User, Karyawan, PMSekolah, PMB3, PICSekolah, KaderB3, DashboardStats, Periode, AbsensiRecord, HonorariumRow, AbsensiDetail, AlergiSiswa, Supplier, BahanMasuk, BahanKeluar, StokOpname, MasterBarang, StokSummary } from '../types';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, onSnapshot, query, where, updateDoc } from "firebase/firestore";
// Storage import is kept optional, we will fallback if it fails
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// ==========================================
// CONFIGURATION FOR HOSTING / REALTIME
// ==========================================
const firebaseConfig = {
  // --- GANTI DENGAN CONFIG DARI FIREBASE CONSOLE ANDA ---
  apiKey: "AIzaSyDSEqsEyNK_PTecikuQ7VbD8MCvW_l1C_g",
  authDomain: "simanda-project.firebaseapp.com",
  projectId: "simanda-project",
  storageBucket: "simanda-project.firebasestorage.app", 
  messagingSenderId: "1061662287994",
  appId: "1:1061662287994:web:de4e734af8b144c23b73c3",
};

// Toggle this to TRUE to enable Cloud Sync
const USE_FIREBASE = true; 

// Initialize Firebase (Conditional)
let db: any;
let storage: any;

if (USE_FIREBASE) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    // Kita coba init storage, tapi jika gagal/belum aktif, tidak apa-apa.
    try {
        storage = getStorage(app);
    } catch (e) {
        console.warn("Firebase Storage tidak aktif (Mode Hemat Database aktif).");
        storage = null;
    }
    console.log("Firebase initialized successfully.");
  } catch (e) {
    console.error("Firebase init error (check config):", e);
  }
}

// ==========================================
// IMAGE COMPRESSION HELPER (SOLUSI GRATIS)
// ==========================================
// Fungsi ini mengecilkan gambar agar muat disimpan di Database (Firestore)
// Tanpa perlu Firebase Storage yang berbayar.
const compressImage = (base64Str: string, maxWidth = 500, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    // Jika bukan gambar base64 valid, kembalikan aslinya
    if (!base64Str || !base64Str.startsWith('data:image')) {
        resolve(base64Str);
        return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Hitung rasio aspek baru
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Kompres ke JPEG kualitas rendah tapi cukup jelas untuk web
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          // Cek ukuran hasil
          console.log(`Kompresi Gambar: Asli ${base64Str.length} chars -> Kompres ${compressedDataUrl.length} chars`);
          resolve(compressedDataUrl);
      } else {
          resolve(base64Str);
      }
    };
    img.onerror = () => {
        resolve(base64Str); // Jika gagal load, kembalikan asli
    };
  });
};

// ==========================================
// MOCK DATA & LOCAL STORAGE HELPERS
// ==========================================
const INITIAL_USERS: User[] = [
  { id: '1', nama: 'Super Admin', email: 'super@simanda.com', username: 'superadmin', password: '123', jabatan: 'SUPERADMIN', status: 'AKTIF' },
  { id: '2', nama: 'Kepala SPPG', email: 'ksppg@simanda.com', username: 'ksppg', password: '123', jabatan: 'KSPPG', status: 'AKTIF' },
  { id: '3', nama: 'Admin SPPG', email: 'admin@simanda.com', username: 'admin', password: '123', jabatan: 'ADMINSPPG', status: 'AKTIF' },
  { id: '4', nama: 'Petugas Input', email: 'petugas@simanda.com', username: 'petugas', password: '123', jabatan: 'PETUGAS', status: 'AKTIF' },
  { id: '5', nama: 'Koor Lapangan', email: 'koor@simanda.com', username: 'koor', password: '123', jabatan: 'KOORDINATORDIVISI', jabatanDivisi: 'Asisten Lapangan', status: 'AKTIF' },
];

const INITIAL_KARYAWAN: Karyawan[] = [];
const INITIAL_PM_SEKOLAH: PMSekolah[] = [];
const INITIAL_PM_B3: PMB3[] = [];
const INITIAL_PIC_SEKOLAH: PICSekolah[] = [];
const INITIAL_KADER_B3: KaderB3[] = [];
const INITIAL_ALERGI: AlergiSiswa[] = [];
const INITIAL_SUPPLIERS: Supplier[] = [];
const INITIAL_MASTER_BARANG: MasterBarang[] = [];
const INITIAL_BAHAN_MASUK: BahanMasuk[] = [];
const INITIAL_BAHAN_KELUAR: BahanKeluar[] = [];
const INITIAL_STOK_OPNAME: StokOpname[] = [];

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
  SUPPLIER: 'simanda_supplier_v1',
  MASTER_BARANG: 'simanda_master_barang_v1',
  BAHAN_MASUK: 'simanda_bahan_masuk_v1',
  BAHAN_KELUAR: 'simanda_bahan_keluar_v1',
  STOK_OPNAME: 'simanda_stok_opname_v1'
};

const channel = new BroadcastChannel('simanda_sync_channel');
let isLocalStorageFull = false;

const localDb = {
  get: <T>(key: string, initial: T): T => {
    if (isLocalStorageFull) return initial; 
    try {
      const s = localStorage.getItem(key);
      if (!s) return initial;
      return JSON.parse(s);
    } catch (e) { return initial; }
  },
  set: <T>(key: string, data: T) => {
    if (isLocalStorageFull) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
      channel.postMessage({ key, type: 'update' }); 
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
         console.warn(`[STORAGE FULL] LocalStorage penuh. Beralih ke mode CLOUD-ONLY.`);
         isLocalStorageFull = true;
      } else {
         console.error("Local Storage Error:", e);
      }
    }
  }
};

// ==========================================
// UPLOAD / PROCESS HELPER
// ==========================================
const processImageUpload = async (base64String: string, folder: string): Promise<string> => {
  // 1. Coba Kompres dulu agar ringan
  const compressed = await compressImage(base64String);

  // 2. Jika Firebase Storage Aktif (dan user sudah bayar), upload ke sana
  if (USE_FIREBASE && storage) {
    try {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const storageRef = ref(storage, `${folder}/${fileName}`);
        await uploadString(storageRef, compressed, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);
        console.log(`Uploaded to Storage (${folder}):`, downloadURL);
        return downloadURL;
    } catch (error: any) {
        console.warn(`Gagal upload ke Storage (mungkin belum aktif/berbayar). Menyimpan ke Database sebagai text.`, error.code);
        // Fallback: Kembalikan string yang sudah dikompres
        return compressed;
    }
  }

  // 3. Jika Storage Tidak Aktif, Kembalikan Compressed String (Simpan di DB)
  return compressed;
};

const processDataForUpload = async (item: any, collectionName: string) => {
  const newItem = { ...item };
  
  // 1. Process Standard Fields
  const imageFields = ['sertifikat', 'buktiScan', 'buktiFoto'];
  for (const field of imageFields) {
    if (newItem[field] && typeof newItem[field] === 'string' && newItem[field].startsWith('data:image')) {
       newItem[field] = await processImageUpload(newItem[field], collectionName);
    }
  }

  // 2. Process Nested Absensi Details
  if (newItem.detailHari) {
    const newDetailHari = { ...newItem.detailHari };
    for (const key in newDetailHari) {
       const detail = { ...newDetailHari[key] };
       
       if (detail.fotoMasuk && detail.fotoMasuk.startsWith('data:image')) {
          detail.fotoMasuk = await processImageUpload(detail.fotoMasuk, 'absensi/masuk');
       }
       if (detail.fotoPulang && detail.fotoPulang.startsWith('data:image')) {
          detail.fotoPulang = await processImageUpload(detail.fotoPulang, 'absensi/pulang');
       }
       newDetailHari[key] = detail;
    }
    newItem.detailHari = newDetailHari;
  }

  return newItem;
};

// ==========================================
// UNIFIED API SERVICE
// ==========================================

const createSubscriber = <T>(
  collectionName: string, 
  localKey: string, 
  initialData: T[], 
  callback: (data: T[]) => void,
  customQuery?: any
) => {
  if (USE_FIREBASE && db) {
    try {
      const q = customQuery || collection(db, collectionName);
      const unsubscribe = onSnapshot(q, (snapshot: any) => {
        const items = snapshot.docs.map((doc: any) => ({ ...(doc.data() as any), id: doc.id }));
        localDb.set(localKey, items); 
        callback(items);
      }, (error: any) => {
        console.error(`Firebase error on ${collectionName}:`, error);
        callback(localDb.get(localKey, initialData));
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Firebase connection failed, falling back to local.");
    }
  } 
  
  const notify = () => {
    const data = localDb.get<T[]>(localKey, initialData);
    callback(data);
  };
  
  notify();
  const msgHandler = (e: MessageEvent) => { if (e.data.key === localKey) notify(); };
  channel.addEventListener('message', msgHandler);
  
  return () => channel.removeEventListener('message', msgHandler);
};

const saveData = async (collectionName: string, localKey: string, item: any, isDelete = false) => {
  // 1. PRE-PROCESS: Compress Images or Upload
  let itemToSave = { ...item };
  if (!isDelete && USE_FIREBASE) {
     itemToSave = await processDataForUpload(item, collectionName);
  }

  // 2. GENERATE ID LOCALLY IF MISSING
  if (!isDelete && (!itemToSave.id || itemToSave.id.startsWith('temp-'))) {
      itemToSave.id = `doc_${Date.now()}_${Math.random().toString(36).substr(2,5)}`;
  }

  // 3. UPDATE LOCAL STATE
  try {
    let data = localDb.get<any[]>(localKey, []);
    if (isDelete) {
      data = data.filter(x => x.id !== item.id);
    } else {
      const idx = data.findIndex(x => x.id === itemToSave.id);
      if (idx > -1) data[idx] = { ...(data[idx] as any), ...itemToSave };
      else data.push(itemToSave);
    }
    localDb.set(localKey, data);
  } catch (e) {
    // Ignore local errors
  }

  // 4. SYNC TO FIREBASE FIRESTORE
  if (USE_FIREBASE && db) {
    try {
      if (isDelete) {
        await deleteDoc(doc(db, collectionName, item.id));
      } else {
        await setDoc(doc(db, collectionName, itemToSave.id), itemToSave, { merge: true });
      }
    } catch (e: any) {
      console.error("Firebase save error:", e);
      if (e.code === 'resource-exhausted') {
         alert("Database Firestore Penuh. Hubungi Admin.");
      } else if (e.code === 'permission-denied') {
         alert("Izin Ditolak. Pastikan Rules Firestore diatur 'allow read, write: if true;'");
      }
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
        const newSessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const userWithSession = { ...user, sessionId: newSessionId };
        await saveData('users', KEYS.USERS, userWithSession);
        return { status: 'success', token: 'mock-jwt-' + Date.now(), user: userWithSession };
      }
      return { status: 'error', message: 'Akun Tidak Aktif' };
    }
    return { status: 'error', message: 'Username atau password salah' };
  },

  subscribeUser: (userId: string, callback: (user: User | null) => void) => {
    if (USE_FIREBASE && db) {
      return onSnapshot(doc(db, 'users', userId), (doc) => {
        if (doc.exists()) callback({ ...doc.data(), id: doc.id } as User);
        else callback(null);
      });
    } else {
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
  subscribeSuppliers: (cb: (data: Supplier[]) => void) => createSubscriber('suppliers', KEYS.SUPPLIER, INITIAL_SUPPLIERS, cb),
  saveSupplier: (item: Supplier) => saveData('suppliers', KEYS.SUPPLIER, item),
  deleteSupplier: (id: string) => saveData('suppliers', KEYS.SUPPLIER, { id }, true),

  subscribeMasterBarang: (cb: (data: MasterBarang[]) => void) => createSubscriber('master_barang', KEYS.MASTER_BARANG, INITIAL_MASTER_BARANG, cb),
  saveMasterBarang: (item: MasterBarang) => saveData('master_barang', KEYS.MASTER_BARANG, item),

  subscribeBahanMasuk: (cb: (data: BahanMasuk[]) => void) => createSubscriber('bahan_masuk', KEYS.BAHAN_MASUK, INITIAL_BAHAN_MASUK, cb),
  saveBahanMasuk: async (item: BahanMasuk) => {
    await saveData('bahan_masuk', KEYS.BAHAN_MASUK, item);
    // Auto-update master barang
    let masters = localDb.get<MasterBarang[]>(KEYS.MASTER_BARANG, INITIAL_MASTER_BARANG);
    if (USE_FIREBASE && db) {
        const snap = await getDocs(collection(db, 'master_barang'));
        masters = snap.docs.map(d => ({...d.data(), id: d.id} as MasterBarang));
    }
    const exists = masters.some(m => m.namaBarang.toLowerCase() === item.namaBahan.toLowerCase());
    if (!exists) {
        const newMaster: MasterBarang = {
            id: 'mb-' + Date.now(),
            namaBarang: item.namaBahan, 
            satuanDefault: item.satuan
        };
        await saveData('master_barang', KEYS.MASTER_BARANG, newMaster);
    }
  },
  deleteBahanMasuk: (id: string) => saveData('bahan_masuk', KEYS.BAHAN_MASUK, { id }, true),

  subscribeBahanKeluar: (cb: (data: BahanKeluar[]) => void) => createSubscriber('bahan_keluar', KEYS.BAHAN_KELUAR, INITIAL_BAHAN_KELUAR, cb),
  saveBahanKeluar: (item: BahanKeluar) => saveData('bahan_keluar', KEYS.BAHAN_KELUAR, item),
  deleteBahanKeluar: (id: string) => saveData('bahan_keluar', KEYS.BAHAN_KELUAR, { id }, true),

  subscribeStokSummary: (cb: (data: StokSummary[]) => void) => {
      let bahanMasuk: BahanMasuk[] = [];
      let bahanKeluar: BahanKeluar[] = [];

      const compute = () => {
          const totalKeluarMap = new Map<string, number>();
          bahanKeluar.forEach(bk => {
              const key = bk.namaBahan.toLowerCase();
              totalKeluarMap.set(key, (totalKeluarMap.get(key) || 0) + bk.jumlah);
          });

          const map = new Map<string, StokSummary>();
          bahanMasuk.forEach(item => {
              const key = `${item.namaBahan.toLowerCase()}_${item.namaSupplier.toLowerCase()}`;
              if (map.has(key)) {
                  const existing = map.get(key)!;
                  existing.totalStok += item.jumlah;
                  if (item.tanggal > existing.lastUpdated) existing.lastUpdated = item.tanggal;
              } else {
                  map.set(key, {
                      id: key,
                      namaBahan: item.namaBahan,
                      namaSupplier: item.namaSupplier,
                      totalStok: item.jumlah,
                      satuan: item.satuan,
                      lastUpdated: item.tanggal
                  });
              }
          });

          const summaryList = Array.from(map.values());
          const groupedByName = new Map<string, StokSummary[]>();
          summaryList.forEach(s => {
              const nameKey = s.namaBahan.toLowerCase();
              if(!groupedByName.has(nameKey)) groupedByName.set(nameKey, []);
              groupedByName.get(nameKey)!.push(s);
          });

          groupedByName.forEach((items, nameKey) => {
              let amountToDeduct = totalKeluarMap.get(nameKey) || 0;
              for (const stockItem of items) {
                  if (amountToDeduct <= 0) break;
                  if (stockItem.totalStok >= amountToDeduct) {
                      stockItem.totalStok -= amountToDeduct;
                      amountToDeduct = 0;
                  } else {
                      amountToDeduct -= stockItem.totalStok;
                      stockItem.totalStok = 0;
                  }
              }
          });
          
          cb(summaryList.filter(s => s.totalStok > 0)); 
      };

      const unsubMasuk = api.subscribeBahanMasuk((data) => { bahanMasuk = data; compute(); });
      const unsubKeluar = api.subscribeBahanKeluar((data) => { bahanKeluar = data; compute(); });
      return () => { unsubMasuk(); unsubKeluar(); };
  },

  subscribeStokOpname: (cb: (data: StokOpname[]) => void) => createSubscriber('stok_opname', KEYS.STOK_OPNAME, INITIAL_STOK_OPNAME, cb),
  saveStokOpname: (item: StokOpname) => saveData('stok_opname', KEYS.STOK_OPNAME, item),
  deleteStokOpname: (id: string) => saveData('stok_opname', KEYS.STOK_OPNAME, { id }, true),

  // === ABSENSI & PERIODE ===
  getPeriode: async () => Promise.resolve(localDb.get(KEYS.PERIODE, [])),
  subscribePeriode: (cb: (data: Periode[]) => void) => createSubscriber('periode', KEYS.PERIODE, [], cb),
  savePeriode: (item: Periode) => saveData('periode', KEYS.PERIODE, item),
  updatePeriode: (item: Periode) => saveData('periode', KEYS.PERIODE, item),
  
  // UPDATED: Delete Periode now cascades to Absensi records to free up space
  deletePeriode: async (id: string) => {
    // 1. Clean up Firestore Data (Images & Records)
    if (USE_FIREBASE && db) {
      try {
        const q = query(collection(db, 'absensi'), where('periodeId', '==', id));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
            console.log(`[CLEANUP] Berhasil menghapus ${deletePromises.length} data absensi & foto dari database.`);
        }
      } catch (e) {
        console.error("Gagal membersihkan data absensi lama:", e);
      }
    }

    // 2. Clean up Local Storage
    try {
        const localAbsensi = localDb.get<AbsensiRecord[]>(KEYS.ABSENSI, []);
        const filtered = localAbsensi.filter(a => a.periodeId !== id);
        if (localAbsensi.length !== filtered.length) {
            localDb.set(KEYS.ABSENSI, filtered);
        }
    } catch(e) { /* ignore */ }

    // 3. Delete the Periode Document
    return saveData('periode', KEYS.PERIODE, { id }, true);
  },

  subscribeAbsensi: (periodeId: string, cb: (data: AbsensiRecord[]) => void) => {
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
       const rawAbsensi = allAbsensi.filter(a => a.periodeId === periodeId);
       const absensiMap = new Map(rawAbsensi.map(r => [r.karyawanId, r]));

       const syncedRecords = allKaryawan.map(karyawan => {
          const record = absensiMap.get(karyawan.id);
          if (record) {
             return { ...record, namaKaryawan: karyawan.nama, divisi: karyawan.divisi };
          } else {
             const { days, details } = createEmptyDays();
             return {
                id: `auto-${periodeId}-${karyawan.id}`, 
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

    const absensiQuery = (USE_FIREBASE && db) 
        ? query(collection(db, 'absensi'), where('periodeId', '==', periodeId)) 
        : undefined;

    const unsubA = createSubscriber('absensi', KEYS.ABSENSI, [], (data) => { allAbsensi = data; processData(); }, absensiQuery);
    const unsubK = createSubscriber('karyawan', KEYS.KARYAWAN, INITIAL_KARYAWAN, (data) => { allKaryawan = data; processData(); });

    return () => { unsubA(); unsubK(); };
  },

  saveAbsensiRecord: async (record: AbsensiRecord) => {
     if (!record.id || record.id.startsWith('auto-')) {
         record.id = `abs-${record.periodeId}-${record.karyawanId}`;
     }
     await saveData('absensi', KEYS.ABSENSI, record);
  },

  subscribeHonorariumKaryawan: (periodeId: string, cb: (data: HonorariumRow[]) => void) => {
      let absensiRecords: AbsensiRecord[] = [];
      let karyawanData: Karyawan[] = [];
      
      const update = () => {
           if (!periodeId) { cb([]); return; }
           const rows = absensiRecords.map(abs => {
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

      const unsubAbsensi = api.subscribeAbsensi(periodeId, (data) => { absensiRecords = data; update(); });
      const unsubKaryawan = createSubscriber('karyawan', KEYS.KARYAWAN, INITIAL_KARYAWAN, (data) => { karyawanData = data; update(); });
      return () => { unsubAbsensi(); unsubKaryawan(); };
  }
};
