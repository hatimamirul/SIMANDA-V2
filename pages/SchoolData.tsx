import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Select, Button, PreviewModal, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, ExportModal } from '../components/UIComponents';
import { api } from '../services/mockService';
import { PMSekolah, User, Role, AlergiSiswa } from '../types';
import { FileText, Download, Eye, AlertTriangle, Filter, School, Phone, Pencil, Trash2, MapPin, ShieldAlert, FileCheck, FileClock, History } from 'lucide-react';

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
  const [validationError, setValidationError] = useState('');
  
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

  const validate = (): boolean => {
    if (
      !formData.nama || 
      !formData.npsn || 
      !formData.desa || 
      !formData.jenis || 
      formData.jmlsiswa === undefined || 
      formData.jmlLaki === undefined || 
      formData.jmlPerempuan === undefined || 
      formData.pmBesar === undefined || 
      formData.pmKecil === undefined || 
      formData.jmlguru === undefined || 
      !formData.narahubung || 
      !formData.hp
    ) {
      showToast("Gagal menyimpan! Mohon lengkapi semua data sekolah (termasuk Desa, Laki-laki & Perempuan) dan revisi kembali.", "error");
      return false;
    }

    const siswa = formData.jmlsiswa || 0;
    const besar = formData.pmBesar || 0;
    const kecil = formData.pmKecil || 0;
    const laki = formData.jmlLaki || 0;
    const perempuan = formData.jmlPerempuan || 0;

    // Validasi Paket Gizi
    if ((besar + kecil) !== siswa) {
      setValidationError(`Data Paket Tidak Valid! PM Besar (${besar}) + PM Kecil (${kecil}) = ${besar + kecil}. Harus sama dengan Total Siswa (${siswa}).`);
      showToast("Data jumlah siswa dan paket PM tidak sinkron.", "error");
      return false;
    }

    // Validasi Gender
    if ((laki + perempuan) !== siswa) {
      setValidationError(`Data Gender Tidak Valid! Laki-laki (${laki}) + Perempuan (${perempuan}) = ${laki + perempuan}. Harus sama dengan Total Siswa (${siswa}).`);
      showToast("Data jumlah Laki-laki dan Perempuan tidak sinkron dengan total siswa.", "error");
      return false;
    }

    setValidationError('');
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
        // Prepend new note with timestamp
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
      jmlsiswa: undefined, 
      jmlLaki: undefined,
      jmlPerempuan: undefined,
      pmBesar: undefined, 
      pmKecil: undefined, 
      jmlguru: undefined, 
      narahubung: '', 
      hp: '', 
      buktiScan: '',
      statusProposal: 'BELUM',
      catatan: ''
    });
    setTempNote('');
    setValidationError('');
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

  const handleExportExcel = () => {
    const dataToExport = data.map(item => ({
      'NPSN': item.npsn,
      'Nama Sekolah': item.nama,
      'Desa': item.desa,
      'Jenis': item.jenis,
      'Status Proposal': item.statusProposal === 'SUDAH' ? 'Sudah Masuk' : 'Belum Masuk',
      'Jumlah Siswa': item.jmlsiswa,
      'Laki-laki': item.jmlLaki || 0,
      'Perempuan': item.jmlPerempuan || 0,
      'PM Besar': item.pmBesar,
      'PM Kecil': item.pmKecil,
      'Jumlah Guru': item.jmlguru,
      'Narahubung': item.narahubung,
      'No HP': item.hp,
      'Catatan': item.catatan || '-'
    }));

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

            const newItem: PMSekolah = {
              id: '', // New ID generated by savePM
              npsn: String(row['NPSN']),
              nama: row['Nama Sekolah'],
              desa: row['Desa'] || desaOptionsRaw[0],
              jenis: row['Jenis'] || 'TK',
              jmlsiswa: parseInt(row['Jumlah Siswa'] || '0'),
              jmlLaki: parseInt(row['Laki-laki'] || '0'),
              jmlPerempuan: parseInt(row['Perempuan'] || '0'),
              pmBesar: parseInt(row['PM Besar'] || '0'),
              pmKecil: parseInt(row['PM Kecil'] || '0'),
              jmlguru: parseInt(row['Jumlah Guru'] || '0'),
              narahubung: row['Narahubung'] || '',
              hp: String(row['No HP'] || ''),
              buktiScan: '', // Cannot import files via excel
              statusProposal: 'BELUM',
              catatan: row['Catatan'] || ''
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
            
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
               <MapPin size={14} className="text-red-400" /> 
               <span>Desa {item.desa || '-'}</span>
               <span className="text-gray-300">|</span>
               <span>NPSN: {item.npsn}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
               <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                  <span className="block text-xl font-bold text-emerald-700">{item.jmlsiswa}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Siswa</span>
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

            <div className="grid grid-cols-2 gap-2 mb-4">
               <div className="bg-blue-50/50 rounded-lg p-1.5 text-center border border-blue-100">
                  <span className="text-[10px] text-blue-500 font-bold uppercase">Laki-laki</span>
                  <span className="block text-sm font-bold text-blue-700">{item.jmlLaki || 0}</span>
               </div>
               <div className="bg-purple-50/50 rounded-lg p-1.5 text-center border border-purple-100">
                  <span className="text-[10px] text-purple-500 font-bold uppercase">Perempuan</span>
                  <span className="block text-sm font-bold text-purple-700">{item.jmlPerempuan || 0}</span>
               </div>
            </div>

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
                  <button onClick={() => { setFormData(item); setTempNote(''); setValidationError(''); setIsModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit">
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
              { header: 'Total Siswa', accessor: 'jmlsiswa' },
              { header: 'Laki-laki', accessor: (i) => i.jmlLaki || 0 },
              { header: 'Perempuan', accessor: (i) => i.jmlPerempuan || 0 },
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
            onEdit={(i) => { setFormData(i); setTempNote(''); setValidationError(''); setIsModalOpen(true); }}
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
        title="Data PM Sekolah"
        data={data}
        columns={[
            { header: 'Status Proposal', accessor: (i) => i.statusProposal === 'SUDAH' ? 'Sudah Masuk' : 'Belum Masuk' },
            { header: 'NPSN', accessor: 'npsn' },
            { header: 'Nama Sekolah', accessor: 'nama' },
            { header: 'Desa', accessor: 'desa' },
            { header: 'Jenis', accessor: 'jenis' },
            { header: 'Siswa', accessor: 'jmlsiswa' },
            { header: 'Laki-laki', accessor: (i) => i.jmlLaki || 0 },
            { header: 'Perempuan', accessor: (i) => i.jmlPerempuan || 0 },
            { header: 'PM Besar', accessor: 'pmBesar' },
            { header: 'PM Kecil', accessor: 'pmKecil' },
            { header: 'Guru', accessor: 'jmlguru' },
            { header: 'Narahubung', accessor: 'narahubung' },
            { header: 'No HP', accessor: 'hp' },
            { header: 'Catatan', accessor: 'catatan' }
        ]}
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
          
          {/* DATA KUANTITATIF (PM + GENDER) */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
             <h4 className="text-sm font-semibold text-gray-700">Data Kuantitatif Siswa</h4>
             
             {/* Total */}
             <div>
                <Input 
                  label="Total Jumlah Siswa" 
                  type="number" 
                  value={formData.jmlsiswa ?? ''} 
                  placeholder="Total Keseluruhan"
                  onChange={e => setFormData({...formData, jmlsiswa: e.target.value ? parseInt(e.target.value) : undefined})} 
                />
                {!formData.id && <FormHelperText />}
             </div>

             {/* Split PM */}
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input 
                    label="PM Besar (Porsi)" 
                    type="number" 
                    value={formData.pmBesar ?? ''} 
                    placeholder="Besar"
                    onChange={e => setFormData({...formData, pmBesar: e.target.value ? parseInt(e.target.value) : undefined})} 
                  />
                </div>
                <div>
                  <Input 
                    label="PM Kecil (Porsi)" 
                    type="number" 
                    value={formData.pmKecil ?? ''} 
                    placeholder="Kecil"
                    onChange={e => setFormData({...formData, pmKecil: e.target.value ? parseInt(e.target.value) : undefined})} 
                  />
                </div>
             </div>

             {/* Split Gender (NEW) */}
             <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                <div>
                  <Input 
                    label="Laki-laki" 
                    type="number" 
                    value={formData.jmlLaki ?? ''} 
                    placeholder="Jml Laki-laki"
                    onChange={e => setFormData({...formData, jmlLaki: e.target.value ? parseInt(e.target.value) : undefined})} 
                  />
                </div>
                <div>
                  <Input 
                    label="Perempuan" 
                    type="number" 
                    value={formData.jmlPerempuan ?? ''} 
                    placeholder="Jml Perempuan"
                    onChange={e => setFormData({...formData, jmlPerempuan: e.target.value ? parseInt(e.target.value) : undefined})} 
                  />
                </div>
             </div>

             {validationError && (
               <div className="text-xs text-red-700 flex items-start bg-red-50 p-2 rounded border border-red-200 animate-pulse">
                 <AlertTriangle size={14} className="mr-2 mt-0.5 shrink-0" /> 
                 <span className="font-medium leading-tight">{validationError}</span>
               </div>
             )}
          </div>

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
