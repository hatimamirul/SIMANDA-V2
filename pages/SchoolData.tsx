
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Select, Button, PreviewModal, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, ExportModal } from '../components/UIComponents';
import { api } from '../services/mockService';
import { PMSekolah, User, Role, AlergiSiswa } from '../types';
import { FileText, Download, Eye, AlertTriangle, Filter, School, Phone, Pencil, Trash2, MapPin, ShieldAlert, FileCheck, FileClock, History, Calculator, GraduationCap } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const SchoolPage: React.FC = () => {
  const [data, setData] = useState<PMSekolah[]>([]);
  const [allergies, setAllergies] = useState<AlergiSiswa[]>([]); // State for Allergy Data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<PMSekolah | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PMSekolah>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // NEW: State for current edit session note
  const [tempNote, setTempNote] = useState('');

  // Filtering States
  const [filterDesa, setFilterDesa] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterProposal, setFilterProposal] = useState(''); // New Filter

  // Layout State
  const [layout, setLayout] = useState<'table' | 'grid'>('table');
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { showToast } = useToast();

  // List of Desa (Same as B3Page)
  const desaOptionsRaw = [
    "Tales", "Branggahan", "Slumbung", "Seketi", "Ngadiluwih", 
    "Banggle", "Purwokerto", "Badal Pandean", "Badal", "Wonorejo", 
    "Dawung", "Rembang", "Rembang Kepuh", "Banjarejo", "Mangunrejo", "Dukuh"
  ].sort();
  
  const desaOptions = desaOptionsRaw.map(d => ({ value: d, label: d }));

  // List of Jenis Sekolah
  const jenisOptionsRaw = ['KB/PAUD', 'TK', 'SD/MI', 'SMP/MTS', 'SMA/MA'];

  // Get current user to check role
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();
  const role = currentUser?.jabatan as Role;

  const canAdd = role !== 'KOORDINATORDIVISI'; 
  const canEdit = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG';
  const canDelete = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG';
  const hideActions = role === 'PETUGAS'; 
  
  // Define roles allowed to import
  const canImport = ['SUPERADMIN', 'KSPPG', 'ADMINSPPG'].includes(role);

  // Realtime Subscription with Integrated Filtering
  useEffect(() => {
    setLoading(true);
    
    // 1. Subscribe to Schools
    const unsubscribePM = api.subscribePMs((items) => {
      let filtered = items;
      
      // Filter by Search
      if (search) {
        const lower = search.toLowerCase();
        filtered = filtered.filter(i => i.nama.toLowerCase().includes(lower) || i.npsn.includes(lower));
      }

      // Filter by Desa
      if (filterDesa) {
        filtered = filtered.filter(i => i.desa === filterDesa);
      }

      // Filter by Jenis
      if (filterJenis) {
        filtered = filtered.filter(i => i.jenis === filterJenis);
      }

      // Filter by Proposal Status
      if (filterProposal) {
        filtered = filtered.filter(i => (i.statusProposal || 'BELUM') === filterProposal);
      }

      setData(filtered);
      setLoading(false);
    });

    // 2. Subscribe to Allergies (to show indicators)
    const unsubscribeAlergi = api.subscribeAlergi((items) => {
      setAllergies(items);
    });

    return () => {
      unsubscribePM();
      unsubscribeAlergi();
    };
  }, [search, filterDesa, filterJenis, filterProposal]);

  // Handle detailed input changes and auto-calculate totals
  const handleDetailChange = (field: keyof PMSekolah, value: string) => {
      const numVal = parseInt(value) || 0;
      
      // Update specific field
      const newFormData = { ...formData, [field]: numVal };

      // Calculate Derived Totals
      const lakiBesar = field === 'jmlLakiBesar' ? numVal : (newFormData.jmlLakiBesar || 0);
      const lakiKecil = field === 'jmlLakiKecil' ? numVal : (newFormData.jmlLakiKecil || 0);
      const peremBesar = field === 'jmlPerempuanBesar' ? numVal : (newFormData.jmlPerempuanBesar || 0);
      const peremKecil = field === 'jmlPerempuanKecil' ? numVal : (newFormData.jmlPerempuanKecil || 0);

      newFormData.jmlLaki = lakiBesar + lakiKecil;
      newFormData.jmlPerempuan = peremBesar + peremKecil;
      newFormData.pmBesar = lakiBesar + peremBesar;
      newFormData.pmKecil = lakiKecil + peremKecil;
      newFormData.jmlsiswa = newFormData.jmlLaki + newFormData.jmlPerempuan;

      setFormData(newFormData);
  };

  // Logic to handle Class Breakdown change for SD/MI
  const handleSDDetailChange = (kelas: string, gender: 'L' | 'P', value: string) => {
      const numVal = parseInt(value) || 0;
      const currentRincian = formData.rincianSD || {
          "1": { L: 0, P: 0 }, "2": { L: 0, P: 0 }, "3": { L: 0, P: 0 },
          "4": { L: 0, P: 0 }, "5": { L: 0, P: 0 }, "6": { L: 0, P: 0 }
      };

      const updatedRincian = {
          ...currentRincian,
          [kelas]: {
              ...currentRincian[kelas],
              [gender]: numVal
          }
      };

      setFormData({ ...formData, rincianSD: updatedRincian });
  };

  const validate = (): boolean => {
    if (
      !formData.nama || 
      !formData.npsn || 
      !formData.desa || 
      !formData.jenis || 
      formData.jmlsiswa === undefined || 
      formData.jmlguru === undefined || 
      !formData.narahubung || 
      !formData.hp
    ) {
      showToast("Gagal menyimpan! Mohon lengkapi semua data sekolah.", "error");
      return false;
    }
    
    if ((formData.jmlsiswa || 0) < 0) {
        showToast("Jumlah siswa tidak boleh negatif.", "error");
        return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);

    // --- NOTE LOGIC ---
    let finalNote = formData.catatan || '';
    if (tempNote.trim()) {
        const timestamp = new Date().toLocaleString('id-ID', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
        const newEntry = `[${timestamp}] ${tempNote.trim()}`;
        finalNote = finalNote ? `${newEntry}\n${finalNote}` : newEntry;
    }

    await api.savePM({ ...formData, catatan: finalNote } as PMSekolah);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Data Sekolah ${formData.nama} berhasil disimpan!`, "success");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deletePM(deleteItem.id);
      showToast("Data sekolah berhasil dihapus!", "success");
      setDeleteItem(null);
    } catch (e) {
      showToast('Gagal menghapus data.', "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({ 
      nama: '', 
      npsn: '', 
      desa: desaOptionsRaw[0],
      jenis: 'TK', 
      
      // Init Details
      jmlLakiBesar: 0,
      jmlLakiKecil: 0,
      jmlPerempuanBesar: 0,
      jmlPerempuanKecil: 0,

      // Init Totals
      jmlsiswa: 0, 
      jmlLaki: 0,
      jmlPerempuan: 0,
      pmBesar: 0, 
      pmKecil: 0, 
      
      jmlguru: undefined, 
      narahubung: '', 
      hp: '', 
      buktiScan: '',
      statusProposal: 'BELUM',
      catatan: '',
      
      // NEW FIELDS
      hariMasuk: "Senin - Jum'at",
      jamPulang: '',

      // SD/MI Breakdown Init
      rincianSD: {
          "1": { L: 0, P: 0 }, "2": { L: 0, P: 0 }, "3": { L: 0, P: 0 },
          "4": { L: 0, P: 0 }, "5": { L: 0, P: 0 }, "6": { L: 0, P: 0 }
      }
    });
    setTempNote('');
    setIsModalOpen(true);
  };

  const handlePreview = (src: string) => {
    setPreviewSrc(src);
    setIsPreviewOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, buktiScan: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper for 0 -> -
  const fmt = (val?: number) => (val === 0 || !val) ? '-' : val;

  const handleExportExcel = () => {
    const dataToExport = data.map(item => {
      const baseData: any = {
        'Status Proposal': item.statusProposal === 'SUDAH' ? 'Sudah Masuk' : 'Belum Masuk',
        'NPSN': item.npsn,
        'Nama Sekolah': item.nama,
        'Desa': item.desa,
        'Jenis': item.jenis,
        'Hari Masuk': item.hariMasuk || '-',
        'Jam Pulang': item.jamPulang ? `${item.jamPulang} WIB` : '-',
        'Total Siswa': fmt(item.jmlsiswa),
        // Detailed Breakdown
        'L Besar': fmt(item.jmlLakiBesar),
        'L Kecil': fmt(item.jmlLakiKecil),
        'P Besar': fmt(item.jmlPerempuanBesar),
        'P Kecil': fmt(item.jmlPerempuanKecil),
        'PM Besar': fmt(item.pmBesar),
        'PM Kecil': fmt(item.pmKecil),
        'Jumlah Guru': fmt(item.jmlguru),
        'Narahubung': item.narahubung,
        'No HP': item.hp,
        'Catatan': item.catatan || '-'
      };

      // Add SD Detail Columns if exists
      if (item.jenis === 'SD/MI' && item.rincianSD) {
          for (let i = 1; i <= 6; i++) {
              const k = String(i);
              baseData[`K${i} L`] = item.rincianSD[k]?.L || 0;
              baseData[`K${i} P`] = item.rincianSD[k]?.P || 0;
          }
      }

      return baseData;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PM Sekolah");
    XLSX.writeFile(wb, "Data_PM_Sekolah.xlsx");
  };

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          showToast("File Excel kosong!", "error");
          return;
        }

        if (confirm(`Ditemukan ${jsonData.length} data sekolah. Apakah anda ingin mengimpornya?`)) {
          setLoading(true);
          let successCount = 0;
          
          for (const row of jsonData as any[]) {
            // Basic validation: Name and NPSN are required
            if (!row['Nama Sekolah'] || !row['NPSN']) continue;

            const lBesar = parseInt(row['L Besar'] || '0');
            const lKecil = parseInt(row['L Kecil'] || '0');
            const pBesar = parseInt(row['P Besar'] || '0');
            const pKecil = parseInt(row['P Kecil'] || '0');

            // Parse Rincian SD if available in Excel columns like "K1 L", "K1 P"
            const rincianSDImport: any = {};
            if (row['Jenis'] === 'SD/MI') {
                for (let i = 1; i <= 6; i++) {
                    const k = String(i);
                    rincianSDImport[k] = {
                        L: parseInt(row[`K${i} L`] || '0'),
                        P: parseInt(row[`K${i} P`] || '0')
                    };
                }
            }

            const newItem: PMSekolah = {
              id: '', // New ID generated by savePM
              npsn: String(row['NPSN']),
              nama: row['Nama Sekolah'],
              desa: row['Desa'] || desaOptionsRaw[0],
              jenis: row['Jenis'] || 'TK',
              
              // Breakdown
              jmlLakiBesar: lBesar,
              jmlLakiKecil: lKecil,
              jmlPerempuanBesar: pBesar,
              jmlPerempuanKecil: pKecil,

              // Totals (Calculated from Breakdown)
              jmlLaki: lBesar + lKecil,
              jmlPerempuan: pBesar + pKecil,
              pmBesar: lBesar + pBesar,
              pmKecil: lKecil + pKecil,
              jmlsiswa: lBesar + lKecil + pBesar + pKecil,

              jmlguru: parseInt(row['Jumlah Guru'] || '0'),
              narahubung: row['Narahubung'] || '',
              hp: String(row['No HP'] || ''),
              buktiScan: '', 
              statusProposal: 'BELUM',
              catatan: row['Catatan'] || '',
              
              // NEW FIELDS IMPORT
              hariMasuk: row['Hari Masuk'] || "Senin - Jum'at",
              jamPulang: row['Jam Pulang'] ? String(row['Jam Pulang']).replace(' WIB', '') : '',
              
              // SD Detail Import
              rincianSD: Object.keys(rincianSDImport).length > 0 ? rincianSDImport : undefined
            };

            await api.savePM(newItem);
            successCount++;
          }
          
          setLoading(false);
          showToast(`Berhasil mengimpor ${successCount} data Sekolah.`, "success");
        }
      } catch (err) {
        console.error(err);
        showToast("Gagal membaca file Excel. Pastikan format benar.", "error");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Helper to count allergies
  const getAllergyCount = (sekolahId: string) => {
    return allergies.filter(a => a.sekolahId === sekolahId).length;
  };

  // Helper for Status UI
  const getStatusBadge = (status?: 'SUDAH' | 'BELUM') => {
     if (status === 'SUDAH') {
         return (
             <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded border border-emerald-200">
                 <FileCheck size={12} /> Sudah Masuk Proposal
             </span>
         );
     }
     return (
         <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded border border-amber-200">
             <FileClock size={12} /> Belum Masuk Proposal
         </span>
     );
  };

  // Calculate Totals for Footer (PM Besar, PM Kecil, Guru)
  const calculateTotals = () => {
      const totals = {
          'PM Besar': 0,
          'PM Kecil': 0,
          'Guru': 0
      };
      data.forEach(item => {
          totals['PM Besar'] += (item.pmBesar || 0);
          totals['PM Kecil'] += (item.pmKecil || 0);
          totals['Guru'] += (item.jmlguru || 0);
      });
      return totals;
  };

  const summaryData = calculateTotals();

  // Define Columns for Export (Dynamic)
  const getExportColumns = () => {
      const cols = [
        { header: 'Status Proposal', accessor: (i: PMSekolah) => i.statusProposal === 'SUDAH' ? 'Sudah Masuk' : 'Belum Masuk' },
        { header: 'NPSN', accessor: 'npsn' as keyof PMSekolah },
        { header: 'Nama Sekolah', accessor: 'nama' as keyof PMSekolah },
        { header: 'Desa', accessor: 'desa' as keyof PMSekolah },
        { header: 'Jenis', accessor: 'jenis' as keyof PMSekolah },
        { header: 'Hari Masuk', accessor: (i: PMSekolah) => i.hariMasuk || '-' },
        { header: 'Jam Pulang', accessor: (i: PMSekolah) => i.jamPulang ? `${i.jamPulang} WIB` : '-' },
        { header: 'Siswa', accessor: (i: PMSekolah) => fmt(i.jmlsiswa), className: 'text-center' },
        // Detailed Breakdown
        { header: 'L Besar', accessor: (i: PMSekolah) => fmt(i.jmlLakiBesar), className: 'col-blue text-center' },
        { header: 'L Kecil', accessor: (i: PMSekolah) => fmt(i.jmlLakiKecil), className: 'col-pink text-center' },
        { header: 'P Besar', accessor: (i: PMSekolah) => fmt(i.jmlPerempuanBesar), className: 'col-blue text-center' },
        { header: 'P Kecil', accessor: (i: PMSekolah) => fmt(i.jmlPerempuanKecil), className: 'col-pink text-center' },
        
        { header: 'PM Besar', accessor: (i: PMSekolah) => fmt(i.pmBesar), className: 'col-blue text-center' },
        { header: 'PM Kecil', accessor: (i: PMSekolah) => fmt(i.pmKecil), className: 'col-pink text-center' },
        { header: 'Guru', accessor: (i: PMSekolah) => fmt(i.jmlguru), className: 'col-guru text-center' },
        
        { header: 'Narahubung', accessor: 'narahubung' as keyof PMSekolah },
        { header: 'No HP', accessor: 'hp' as keyof PMSekolah },
        { header: 'Catatan', accessor: (i: PMSekolah) => i.catatan || '-' }
      ];

      // Dynamically Add SD Detail Columns if any visible row is SD/MI
      const hasSD = data.some(d => d.jenis === 'SD/MI');
      if (hasSD) {
          for (let i = 1; i <= 6; i++) {
              cols.push({ header: `K${i} L`, accessor: (item: PMSekolah) => item.rincianSD ? item.rincianSD[String(i)]?.L || 0 : '-', className: 'text-center bg-gray-50' });
              cols.push({ header: `K${i} P`, accessor: (item: PMSekolah) => item.rincianSD ? item.rincianSD[String(i)]?.P || 0 : '-', className: 'text-center bg-gray-50' });
          }
      }

      return cols;
  };

  // Grid Renderer
  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {data.map(item => {
         const allergyCount = getAllergyCount(item.id);
         return (
         <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5 flex flex-col group relative">
            
            {/* Status Flag Top Right */}
            <div className="absolute top-4 right-4">
                {getStatusBadge(item.statusProposal)}
            </div>

            <div className="flex justify-between items-start mb-4 mt-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <School size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-800 line-clamp-1 text-sm pr-20">{item.nama}</h3>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase border border-gray-200">
                        {item.jenis}
                      </span>
                      {allergyCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                          <ShieldAlert size={10} /> {allergyCount} Alergi
                        </span>
                      )}
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 mb-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
               <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-red-400" /> 
                  <span>Desa {item.desa || '-'}</span>
                  <span className="text-gray-300">|</span>
                  <span>NPSN: {item.npsn}</span>
               </div>
               <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-200">
                  <FileClock size={14} className="text-blue-400" /> 
                  <span>{item.hariMasuk || '-'}</span>
                  {item.jamPulang && (
                      <span className="font-bold text-blue-600 ml-auto">Pulang: {item.jamPulang}</span>
                  )}
               </div>
            </div>

            {/* MAIN STATS */}
            <div className="grid grid-cols-3 gap-2 mb-2">
               <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                  <span className="block text-xl font-bold text-emerald-700">{item.jmlsiswa}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Total</span>
               </div>
               <div className="bg-indigo-50 rounded-lg p-2 text-center border border-indigo-100">
                  <span className="block text-xl font-bold text-indigo-700">{item.pmBesar}</span>
                  <span className="text-[10px] text-indigo-600 font-medium">PM Besar</span>
               </div>
               <div className="bg-pink-50 rounded-lg p-2 text-center border border-pink-100">
                  <span className="block text-xl font-bold text-pink-700">{item.pmKecil}</span>
                  <span className="text-[10px] text-pink-600 font-medium">PM Kecil</span>
               </div>
            </div>

            {/* DETAILED BREAKDOWN */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-4 text-xs">
               <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b border-gray-200">
                  <span className="font-bold text-blue-600 uppercase">Laki-laki</span>
                  <span className="font-bold">{item.jmlLaki || 0}</span>
               </div>
               <div className="flex justify-between text-gray-500 mb-3 pl-2">
                  <span>Besar: {item.jmlLakiBesar || 0}</span>
                  <span>Kecil: {item.jmlLakiKecil || 0}</span>
               </div>
               
               <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b border-gray-200">
                  <span className="font-bold text-purple-600 uppercase">Perempuan</span>
                  <span className="font-bold">{item.jmlPerempuan || 0}</span>
               </div>
               <div className="flex justify-between text-gray-500 pl-2">
                  <span>Besar: {item.jmlPerempuanBesar || 0}</span>
                  <span>Kecil: {item.jmlPerempuanKecil || 0}</span>
               </div>
            </div>

            {/* SD Detail Preview (if available) */}
            {item.jenis === 'SD/MI' && item.rincianSD && (
               <div className="bg-blue-50/50 rounded-lg p-2 mb-4 border border-blue-100 text-[10px]">
                  <p className="font-bold text-blue-800 mb-1 text-center border-b border-blue-200 pb-1">Detail Kelas</p>
                  <div className="grid grid-cols-6 gap-1 text-center">
                     {[1,2,3,4,5,6].map(k => (
                        <div key={k} className="flex flex-col">
                           <span className="font-bold text-gray-600">K{k}</span>
                           <span className="text-blue-600">{item.rincianSD?.[String(k)]?.L || 0}</span>
                           <span className="text-purple-600">{item.rincianSD?.[String(k)]?.P || 0}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
               <Phone size={14} /> {item.narahubung} ({item.hp})
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
               <div className="text-xs text-gray-400 font-medium">
                  Guru: {item.jmlguru}
               </div>
               {!hideActions && (
                <div className="flex gap-2">
                  {item.buktiScan && (
                      <button onClick={() => handlePreview(item.buktiScan!)} className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors" title="Lihat Scan">
                        <Eye size={16} />
                      </button>
                  )}
                  <button onClick={() => { setFormData(item); setTempNote(''); setIsModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit">
                      <Pencil size={16} />
                  </button>
                  {canDelete && (
                    <button onClick={() => setDeleteItem(item)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Hapus">
                        <Trash2 size={16} />
                    </button>
                  )}
                </div>
               )}
            </div>
         </div>
       )})}
    </div>
  );

  return (
    <div>
      <Toolbar 
        title="Data PM Sekolah" 
        onSearch={setSearch} 
        onAdd={canAdd ? openAdd : undefined} 
        onExport={() => setIsExportModalOpen(true)}
        onImport={canImport ? handleImport : undefined}
        layoutMode={layout}
        onLayoutChange={setLayout}
      />

      {/* Filter Control */}
      <div className="mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
         <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold shrink-0">
            <Filter size={16} /> Filter:
         </div>
         
         <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-wrap">
             {/* Filter Desa */}
             <select 
                value={filterDesa} 
                onChange={(e) => setFilterDesa(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
             >
                <option value="">-- Semua Desa --</option>
                {desaOptionsRaw.map(desa => (
                   <option key={desa} value={desa}>{desa}</option>
                ))}
             </select>

             {/* Filter Jenis */}
             <select 
                value={filterJenis} 
                onChange={(e) => setFilterJenis(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
             >
                <option value="">-- Semua Jenjang --</option>
                {jenisOptionsRaw.map(jenis => (
                   <option key={jenis} value={jenis}>{jenis}</option>
                ))}
             </select>

             {/* Filter Proposal */}
             <select 
                value={filterProposal} 
                onChange={(e) => setFilterProposal(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
             >
                <option value="">-- Status Proposal --</option>
                <option value="SUDAH">Sudah Masuk</option>
                <option value="BELUM">Belum Masuk</option>
             </select>
         </div>

         {(filterDesa || filterJenis || filterProposal) && (
           <div className="flex flex-wrap gap-2 md:ml-auto">
             {filterDesa && (
                <span className="text-xs text-primary font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                  Desa: {filterDesa}
                </span>
             )}
             {filterJenis && (
                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                  Jenjang: {filterJenis}
                </span>
             )}
             {filterProposal && (
                <span className={`text-xs font-medium px-2 py-1 rounded-md border ${filterProposal === 'SUDAH' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                  Prop: {filterProposal}
                </span>
             )}
             <button 
                onClick={() => { setFilterDesa(''); setFilterJenis(''); setFilterProposal(''); }}
                className="text-xs text-gray-500 hover:text-red-500 underline"
             >
                Reset
             </button>
           </div>
         )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : layout === 'table' ? (
        <Card>
          <Table<PMSekolah> 
            isLoading={loading}
            data={data}
            hideActions={hideActions} 
            columns={[
              { 
                header: 'Status Proposal', 
                accessor: (i) => getStatusBadge(i.statusProposal)
              },
              { header: 'NPSN', accessor: 'npsn' },
              { 
                header: 'Nama Sekolah', 
                accessor: (i) => {
                  const allergyCount = getAllergyCount(i.id);
                  return (
                    <div className="flex flex-col">
                       <span className="font-semibold text-gray-700">{i.nama}</span>
                       {allergyCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 w-fit" title={`${allergyCount} Siswa memiliki alergi`}>
                            <ShieldAlert size={10} /> Ada Alergi
                          </span>
                       )}
                    </div>
                  );
                }
              },
              { 
                header: 'Desa', 
                accessor: (i) => (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                    {i.desa || '-'}
                  </span>
                )
              },
              { header: 'Jenis', accessor: 'jenis' },
              { header: 'Hari Masuk', accessor: (i) => i.hariMasuk || '-' },
              { header: 'Jam Pulang', accessor: (i) => i.jamPulang ? `${i.jamPulang} WIB` : '-' },
              { header: 'Total', accessor: 'jmlsiswa' },
              { 
                  header: 'Laki-laki (B/K)', 
                  accessor: (i) => (
                      <span className="text-xs text-blue-700 font-mono">
                          {i.jmlLaki} ({i.jmlLakiBesar}/{i.jmlLakiKecil})
                      </span>
                  ) 
              },
              { 
                  header: 'Perempuan (B/K)', 
                  accessor: (i) => (
                      <span className="text-xs text-purple-700 font-mono">
                          {i.jmlPerempuan} ({i.jmlPerempuanBesar}/{i.jmlPerempuanKecil})
                      </span>
                  ) 
              },
              { header: 'PM Besar', accessor: 'pmBesar' },
              { header: 'PM Kecil', accessor: 'pmKecil' },
              { header: 'Guru', accessor: 'jmlguru' },
              { header: 'Narahubung', accessor: 'narahubung' },
              { 
                header: 'Catatan', 
                accessor: (i) => (
                  <span className="text-xs text-gray-500 truncate max-w-[150px] inline-block" title={i.catatan}>
                    {i.catatan ? i.catatan.split('\n')[0] : '-'}
                  </span>
                ) 
              },
              { 
                header: 'BUKTI SCAN', 
                accessor: (i) => i.buktiScan ? (
                  <button 
                    type="button"
                    onClick={() => handlePreview(i.buktiScan!)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={12} /> Lihat
                  </button>
                ) : <span className="text-gray-400 text-xs italic">Tidak ada</span>
              },
            ]}
            onEdit={(i) => { setFormData(i); setTempNote(''); setIsModalOpen(true); }}
            onDelete={setDeleteItem}
          />
        </Card>
      ) : (
        renderGrid()
      )}

      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="DATA PM SEKOLAH"
        data={data}
        hideLogo={true}
        summaryData={summaryData}
        columns={getExportColumns()}
        onExportExcel={handleExportExcel}
      />

      {canDelete && (
        <ConfirmationModal 
          isOpen={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          title="Hapus Data Sekolah"
          message={`Apakah anda yakin ingin menghapus data sekolah ${deleteItem?.nama}?`}
          isLoading={loading}
        />
      )}

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} src={previewSrc} title="Preview Bukti Scan" />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit PM Sekolah" : "Tambah PM Sekolah"}>
        <div className="space-y-4">
          <div>
            <Input label="Nama Sekolah" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          <div>
            <Input label="NPSN" value={formData.npsn} onChange={e => setFormData({...formData, npsn: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select 
                 label="Desa" 
                 value={formData.desa} 
                 onChange={e => setFormData({...formData, desa: e.target.value})} 
                 options={desaOptions} 
              />
              {!formData.id && <FormHelperText />}
            </div>
            <div>
              <Select label="Jenis" value={formData.jenis} onChange={e => setFormData({...formData, jenis: e.target.value as any})} 
                options={['KB/PAUD', 'TK', 'SD/MI', 'SMP/MTS', 'SMA/MA'].map(v => ({value: v, label: v}))} 
              />
              {!formData.id && <FormHelperText />}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
             <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Status Proposal</h4>
                <div className="w-1/2">
                    <Select 
                        value={formData.statusProposal || 'BELUM'} 
                        onChange={e => setFormData({...formData, statusProposal: e.target.value as any})} 
                        options={[
                            {value: 'BELUM', label: 'Belum Masuk Proposal'},
                            {value: 'SUDAH', label: 'Sudah Masuk Proposal'}
                        ]}
                        className={formData.statusProposal === 'SUDAH' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-800'}
                    />
                </div>
             </div>
          </div>
          
          {/* DATA DETAIL: GENDER & PORSI (AUTO CALCULATE TOTALS) */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4 relative">
             <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Calculator size={16} /> Detail Alokasi Porsi
             </h4>
             <p className="text-[10px] text-gray-500 -mt-2">Isi kolom di bawah, total akan dihitung otomatis oleh sistem.</p>
             
             {/* MATRIX INPUT GRID */}
             <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                
                {/* LAKI-LAKI GROUP */}
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <div className="text-xs font-bold text-blue-700 mb-2 uppercase text-center border-b border-blue-200 pb-1">Laki-laki</div>
                    <div className="space-y-2">
                        <div>
                            <label className="text-[10px] text-blue-600 font-semibold mb-0.5 block">Porsi Besar</label>
                            <input 
                                type="number" 
                                className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none font-bold text-blue-800 text-right"
                                placeholder="0"
                                value={formData.jmlLakiBesar ?? ''}
                                onChange={(e) => handleDetailChange('jmlLakiBesar', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-blue-600 font-semibold mb-0.5 block">Porsi Kecil</label>
                            <input 
                                type="number" 
                                className="w-full px-2 py-1.5 border border-blue-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none font-bold text-blue-800 text-right"
                                placeholder="0"
                                value={formData.jmlLakiKecil ?? ''}
                                onChange={(e) => handleDetailChange('jmlLakiKecil', e.target.value)}
                            />
                        </div>
                        <div className="pt-2 border-t border-blue-200 flex justify-between items-center text-xs">
                            <span className="text-blue-500">Total Laki:</span>
                            <span className="font-black text-blue-700">{formData.jmlLaki || 0}</span>
                        </div>
                    </div>
                </div>

                {/* PEREMPUAN GROUP */}
                <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                    <div className="text-xs font-bold text-purple-700 mb-2 uppercase text-center border-b border-purple-200 pb-1">Perempuan</div>
                    <div className="space-y-2">
                        <div>
                            <label className="text-[10px] text-purple-600 font-semibold mb-0.5 block">Porsi Besar</label>
                            <input 
                                type="number" 
                                className="w-full px-2 py-1.5 border border-purple-200 rounded text-sm focus:ring-1 focus:ring-purple-500 outline-none font-bold text-purple-800 text-right"
                                placeholder="0"
                                value={formData.jmlPerempuanBesar ?? ''}
                                onChange={(e) => handleDetailChange('jmlPerempuanBesar', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-purple-600 font-semibold mb-0.5 block">Porsi Kecil</label>
                            <input 
                                type="number" 
                                className="w-full px-2 py-1.5 border border-purple-200 rounded text-sm focus:ring-1 focus:ring-purple-500 outline-none font-bold text-purple-800 text-right"
                                placeholder="0"
                                value={formData.jmlPerempuanKecil ?? ''}
                                onChange={(e) => handleDetailChange('jmlPerempuanKecil', e.target.value)}
                            />
                        </div>
                        <div className="pt-2 border-t border-purple-200 flex justify-between items-center text-xs">
                            <span className="text-purple-500">Total Pr:</span>
                            <span className="font-black text-purple-700">{formData.jmlPerempuan || 0}</span>
                        </div>
                    </div>
                </div>
             </div>

             {/* GRAND TOTALS PREVIEW (READ ONLY) */}
             <div className="grid grid-cols-3 gap-2 pt-2">
                 <div className="bg-gray-100 rounded p-2 text-center">
                    <span className="block text-[9px] text-gray-500 font-bold uppercase">Total Besar</span>
                    <span className="block font-bold text-indigo-600">{formData.pmBesar || 0}</span>
                 </div>
                 <div className="bg-gray-100 rounded p-2 text-center">
                    <span className="block text-[9px] text-gray-500 font-bold uppercase">Total Kecil</span>
                    <span className="block font-bold text-pink-600">{formData.pmKecil || 0}</span>
                 </div>
                 <div className="bg-gray-800 rounded p-2 text-center text-white">
                    <span className="block text-[9px] text-gray-400 font-bold uppercase">Total Siswa</span>
                    <span className="block font-bold text-yellow-400 text-lg">{formData.jmlsiswa || 0}</span>
                 </div>
             </div>
          </div>

          {/* NEW: RINCIAN KELAS KHUSUS SD/MI */}
          {formData.jenis === 'SD/MI' && (
             <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 relative">
                <h4 className="text-sm font-bold text-orange-800 flex items-center gap-2 mb-3">
                   <GraduationCap size={16} /> Rincian Kelas 1 - 6
                </h4>
                <div className="space-y-2">
                   {[1, 2, 3, 4, 5, 6].map(kelas => (
                      <div key={kelas} className="grid grid-cols-12 gap-2 items-center text-xs">
                         <div className="col-span-2 font-bold text-gray-600">Kelas {kelas}</div>
                         <div className="col-span-5 flex items-center gap-1">
                            <span className="w-4 text-blue-600 font-bold">L:</span>
                            <input 
                               type="number"
                               className="w-full px-2 py-1 border border-blue-200 rounded text-center focus:ring-1 focus:ring-blue-500 outline-none"
                               placeholder="0"
                               value={formData.rincianSD?.[String(kelas)]?.L ?? ''}
                               onChange={(e) => handleSDDetailChange(String(kelas), 'L', e.target.value)}
                            />
                         </div>
                         <div className="col-span-5 flex items-center gap-1">
                            <span className="w-4 text-purple-600 font-bold">P:</span>
                            <input 
                               type="number"
                               className="w-full px-2 py-1 border border-purple-200 rounded text-center focus:ring-1 focus:ring-purple-500 outline-none"
                               placeholder="0"
                               value={formData.rincianSD?.[String(kelas)]?.P ?? ''}
                               onChange={(e) => handleSDDetailChange(String(kelas), 'P', e.target.value)}
                            />
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          <div>
            <Input 
              label="Jumlah Guru & Staff" 
              type="number" 
              value={formData.jmlguru ?? ''} 
              onChange={e => setFormData({...formData, jmlguru: e.target.value ? parseInt(e.target.value) : undefined})} 
            />
            {!formData.id && <FormHelperText />}
          </div>
          <div>
            <Input label="Narahubung" value={formData.narahubung} onChange={e => setFormData({...formData, narahubung: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          <div>
            <Input label="No HP Narahubung" value={formData.hp} onChange={e => setFormData({...formData, hp: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <Input label="Hari Masuk" value={formData.hariMasuk || ''} onChange={e => setFormData({...formData, hariMasuk: e.target.value})} placeholder="Contoh: Senin - Sabtu" />
              </div>
              <div>
                  <Input label="Jam Pulang (WIB)" type="time" value={formData.jamPulang || ''} onChange={e => setFormData({...formData, jamPulang: e.target.value})} />
              </div>
          </div>

          {/* NOTE SECTION */}
          <div className="border-t border-gray-200 pt-4">
             <div className="flex items-center gap-2 mb-2">
                <History size={16} className="text-gray-500" />
                <label className="text-sm font-semibold text-gray-700">Catatan & Riwayat</label>
             </div>
             
             {/* History Display */}
             {formData.catatan && (
                 <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-xs text-gray-600 mb-3 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                    {formData.catatan}
                 </div>
             )}

             {/* New Note Input */}
             <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Tambah catatan baru di sini (Opsional)..."
                rows={3}
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
             />
             <p className="text-[10px] text-gray-400 mt-1 italic">*Catatan baru akan otomatis diberi tanggal dan waktu saat disimpan.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Bukti Scan</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
               <div className="space-y-1 text-center">
                {formData.buktiScan ? (
                  <div className="flex flex-col items-center">
                    <FileText className="mx-auto h-12 w-12 text-green-500" />
                    <p className="text-sm text-green-600 font-medium">File dipilih</p>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, buktiScan: ''})}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <>
                    <Download className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload-sekolah" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload-sekolah" name="file-upload-sekolah" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} isLoading={loading}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
