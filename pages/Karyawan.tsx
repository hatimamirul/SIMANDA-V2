
import React, { useEffect, useState, useMemo } from 'react';
import { Navigate } from '../components/UIComponents';
import { Card, Toolbar, Table, Modal, Input, Select, Button, ConfirmationModal, PreviewModal, useToast, LoadingSpinner, ExportModal } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Karyawan, User, Role } from '../types';
import { Eye, FileText, Download, Phone, CreditCard, Activity, Pencil, Trash2, Edit, SortAsc, CheckCircle2, AlertTriangle } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const KaryawanPage: React.FC = () => {
  // Get current user to check role for access control
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();
  
  const role = currentUser?.jabatan as Role;
  const { showToast } = useToast();

  // Permission Logic
  const canAdd = role === 'SUPERADMIN' || role === 'KSPPG';
  const canDelete = role === 'SUPERADMIN' || role === 'KSPPG';
  const canBulkEdit = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG';
  const canImport = role === 'SUPERADMIN' || role === 'KSPPG';
  
  if (role === 'PETUGAS' || role === 'KOORDINATORDIVISI') {
    return <Navigate to="/" replace />;
  }

  const [data, setData] = useState<Karyawan[]>([]);
  const [allOriginalData, setAllOriginalData] = useState<Karyawan[]>([]); // To help with UPSERT logic
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false); // Bulk Edit Modal
  const [deleteItem, setDeleteItem] = useState<Karyawan | null>(null);
  const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false); // Bulk Delete Confirmation
  const [formData, setFormData] = useState<Partial<Karyawan>>({});
  const [bulkData, setBulkData] = useState<Karyawan[]>([]); // Data for bulk editing
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Sorting State
  const [sortBy, setSortBy] = useState<'nama' | 'divisi' | 'nik'>('nama');
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Layout State
  const [layout, setLayout] = useState<'table' | 'grid'>('table');
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Switch to Realtime Subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = api.subscribeKaryawan((items) => {
      setAllOriginalData(items);
      let processed = [...items];
      
      // Apply Search
      if (search) {
        const lower = search.toLowerCase();
        processed = processed.filter(i => i.nama.toLowerCase().includes(lower) || i.nik.includes(lower));
      }

      // Apply Advanced Sorting
      processed.sort((a, b) => {
        if (sortBy === 'divisi') {
          return a.divisi.localeCompare(b.divisi);
        } else if (sortBy === 'nik') {
          return a.nik.localeCompare(b.nik);
        } else {
          return a.nama.localeCompare(b.nama);
        }
      });

      setData(processed);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [search, sortBy]);

  const handleSubmit = async () => {
    if (
      !formData.nik || 
      !formData.nama || 
      !formData.divisi || 
      !formData.hp || 
      formData.honorHarian === undefined || 
      !formData.noBpjs || 
      !formData.bank || 
      !formData.rekening
    ) {
      showToast("Gagal menyimpan! Mohon lengkapi semua data karyawan.", "error");
      return;
    }

    setLoading(true);
    await api.saveKaryawan(formData as Karyawan);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Data Karyawan ${formData.nama} berhasil disimpan!`, "success");
  };

  // --- BULK EDIT & DELETE ALL LOGIC ---
  const openBulkEdit = () => {
    setBulkData(JSON.parse(JSON.stringify(data))); // Deep copy current filtered data
    setIsBulkModalOpen(true);
  };

  const handleBulkChange = (index: number, field: keyof Karyawan, value: any) => {
    const updated = [...bulkData];
    updated[index] = { ...updated[index], [field]: value };
    setBulkData(updated);
  };

  const handleSaveBulk = async () => {
    setLoading(true);
    try {
      for (const item of bulkData) {
        await api.saveKaryawan(item);
      }
      showToast(`Berhasil memperbarui ${bulkData.length} data karyawan secara masal!`, "success");
      setIsBulkModalOpen(false);
    } catch (e) {
      showToast("Terjadi kesalahan saat menyimpan data masal.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    try {
      // Loop through bulkData (which represents currently filtered/displayed items) and delete them
      for (const item of bulkData) {
        await api.deleteKaryawan(item.id);
      }
      showToast(`Berhasil menghapus ${bulkData.length} data karyawan.`, "success");
      setIsDeleteAllConfirmOpen(false);
      setIsBulkModalOpen(false);
    } catch (e) {
      showToast("Gagal menghapus data masal.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteKaryawan(deleteItem.id);
      showToast("Data karyawan berhasil dihapus!", "success");
      setDeleteItem(null);
    } catch (e) {
      showToast("Gagal menghapus data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({ 
      nik: '', 
      nama: '', 
      divisi: 'Asisten Lapangan',
      hp: '',
      honorHarian: undefined,
      noBpjs: '',
      bank: 'BANK BRI',
      rekening: '',
      sertifikat: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: Karyawan) => {
    setFormData(item);
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
        setFormData(prev => ({ ...prev, sertifikat: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const handleExportExcel = () => {
    const dataToExport = data.map(item => ({
      'NIK': item.nik,
      'Nama Karyawan': item.nama,
      'Divisi': item.divisi,
      'No HP': item.hp,
      'Honor/Hari': item.honorHarian,
      'No BPJS': item.noBpjs,
      'Bank': item.bank,
      'No Rekening': item.rekening
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Karyawan");
    XLSX.writeFile(wb, "Data_Karyawan.xlsx");
  };

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          showToast("File Excel kosong!", "error");
          return;
        }

        if (confirm(`Ditemukan ${jsonData.length} data karyawan. Sistem akan memperbarui data jika NIK sudah ada, atau menambah data baru jika NIK belum ada. Lanjutkan?`)) {
          setLoading(true);
          let successCount = 0;
          
          for (const row of jsonData as any[]) {
            const nik = String(row['NIK'] || '');
            const nama = row['Nama Karyawan'] || row['Nama'] || ''; 
            if (!nik || !nama) continue;

            // SMART UPSERT LOGIC: Check if NIK already exists in Database
            const existingKaryawan = allOriginalData.find(k => k.nik === nik);

            const newItem: Karyawan = {
              id: existingKaryawan ? existingKaryawan.id : '', // Maintain ID if updating
              nik: nik,
              nama: nama,
              divisi: row['Divisi'] || 'Asisten Lapangan',
              hp: String(row['No HP'] || row['HP'] || ''),
              honorHarian: parseInt(row['Honor/Hari'] || row['Honor'] || '0'),
              noBpjs: String(row['No BPJS'] || row['BPJS'] || '-'),
              bank: (row['Bank'] as any) || 'BANK BRI',
              rekening: String(row['No Rekening'] || row['Rekening'] || ''),
              sertifikat: existingKaryawan ? existingKaryawan.sertifikat : '' 
            };

            await api.saveKaryawan(newItem);
            successCount++;
          }
          
          setLoading(false);
          showToast(`Berhasil memproses ${successCount} data Karyawan (Update/Insert).`, "success");
        }
      } catch (err) {
        console.error(err);
        showToast("Gagal membaca file Excel.", "error");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const divisionOptions = [
    { value: 'Asisten Lapangan', label: 'Asisten Lapangan' },
    { value: 'Persiapan', label: 'Persiapan' },
    { value: 'Produksi (Masak)', label: 'Produksi (Masak)' },
    { value: 'Pemorsian', label: 'Pemorsian' },
    { value: 'Distribusi', label: 'Distribusi' },
    { value: 'Kebersihan', label: 'Kebersihan' },
    { value: 'Keamanan', label: 'Keamanan' },
    { value: 'Pencucian Alat', label: 'Pencucian Alat' },
  ];

  const bankOptions = [
    { value: 'BANK BRI', label: 'BANK BRI' },
    { value: 'BANK MANDIRI', label: 'BANK MANDIRI' },
    { value: 'BANK BNI', label: 'BANK BNI' },
  ];

  const getDivisiColor = (divisi: string) => {
    switch (divisi) {
      case 'Asisten Lapangan': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Persiapan': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Produksi (Masak)': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Pemorsian': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Distribusi': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Kebersihan': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Keamanan': return 'bg-red-100 text-red-800 border-red-200';
      case 'Pencucian Alat': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {data.map(item => (
         <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5 flex flex-col relative group">
            <div className="flex items-start justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {item.nama.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 line-clamp-1">{item.nama}</h3>
                    <p className="text-xs text-gray-500">NIK: {item.nik}</p>
                  </div>
               </div>
               <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${getDivisiColor(item.divisi)}`}>
                  {item.divisi.split(' ')[0]}
               </span>
            </div>

            <div className="space-y-2 mb-6 flex-1">
               <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400" /> {item.hp || '-'}
               </div>
               <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard size={14} className="text-gray-400" /> {item.bank} - {item.rekening}
               </div>
               <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity size={14} className="text-gray-400" /> BPJS: {item.noBpjs || '-'}
               </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
               <div className="text-xs text-gray-400">
                  Honor: <span className="font-semibold text-gray-600">{formatCurrency(item.honorHarian)}</span>
               </div>
               <div className="flex gap-2">
                 {item.sertifikat && (
                    <button onClick={() => handlePreview(item.sertifikat!)} className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors" title="Lihat Sertifikat">
                       <Eye size={16} />
                    </button>
                 )}
                 <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit">
                    <Pencil size={16} />
                 </button>
                 {canDelete && (
                    <button onClick={() => setDeleteItem(item)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Hapus">
                       <Trash2 size={16} />
                    </button>
                 )}
               </div>
            </div>
         </div>
       ))}
    </div>
  );

  return (
    <div>
      <Toolbar 
        title="Data Karyawan" 
        onSearch={setSearch} 
        onAdd={canAdd ? openAdd : undefined} 
        onExport={() => setIsExportModalOpen(true)}
        onImport={canImport ? handleImport : undefined}
        searchPlaceholder="Cari Nama atau NIK..."
        layoutMode={layout}
        onLayoutChange={setLayout}
      />
      
      {/* --- SUB TOOLBAR FOR SORTING AND BULK EDIT --- */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                  <SortAsc size={16} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Urutkan:</span>
                  <select 
                     value={sortBy} 
                     onChange={(e) => setSortBy(e.target.value as any)}
                     className="bg-transparent text-sm font-bold text-primary outline-none cursor-pointer"
                  >
                     <option value="nama">Nama (A-Z)</option>
                     <option value="divisi">Divisi</option>
                     <option value="nik">NIK</option>
                  </select>
              </div>
          </div>

          <div className="flex items-center gap-2">
              {canBulkEdit && (
                <button 
                    onClick={openBulkEdit}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm"
                >
                    <Edit size={16} />
                    Edit Masal / Hapus Semua
                </button>
              )}
          </div>
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : layout === 'table' ? (
        <Card>
          <Table<Karyawan> 
            isLoading={loading}
            data={data}
            columns={[
              { header: 'NIK', accessor: 'nik' },
              { header: 'Nama', accessor: 'nama' },
              { 
                header: 'Divisi', 
                accessor: (i) => (
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${getDivisiColor(i.divisi)}`}>
                    {i.divisi}
                  </span>
                ) 
              },
              { header: 'No HP', accessor: 'hp' },
              { header: 'Honor/Hari', accessor: (i) => formatCurrency(i.honorHarian) },
              { header: 'No BPJS', accessor: 'noBpjs' },
              { header: 'Bank', accessor: 'bank' },
              { header: 'No Rekening', accessor: 'rekening' },
              { header: 'Sertifikat', accessor: (i) => i.sertifikat ? (
                <button 
                  type="button"
                  onClick={() => handlePreview(i.sertifikat!)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium hover:bg-green-100 transition-colors"
                >
                  <Eye size={12} /> Lihat
                </button>
              ) : <span className="text-gray-400 text-xs italic">Tidak ada</span> },
            ]}
            onEdit={openEdit}
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
        title="Data Karyawan"
        data={data}
        columns={[
            { header: 'NIK', accessor: 'nik' },
            { header: 'Nama Karyawan', accessor: 'nama' },
            { header: 'Divisi', accessor: 'divisi' },
            { header: 'No HP', accessor: 'hp' },
            { header: 'Honor/Hari', accessor: (i) => formatCurrency(i.honorHarian) },
            { header: 'No BPJS', accessor: 'noBpjs' },
            { header: 'Bank', accessor: 'bank' },
            { header: 'No Rekening', accessor: 'rekening' }
        ]}
        onExportExcel={handleExportExcel}
      />

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Karyawan"
        message={`Apakah anda yakin ingin menghapus data karyawan ${deleteItem?.nama}?`}
        isLoading={loading}
      />

      {/* BULK DELETE CONFIRMATION */}
      <ConfirmationModal 
        isOpen={isDeleteAllConfirmOpen}
        onClose={() => setIsDeleteAllConfirmOpen(false)}
        onConfirm={handleDeleteAll}
        title="Hapus Semua Data Terpilih"
        message={`PERINGATAN: Tindakan ini akan menghapus permanen ${bulkData.length} data karyawan yang saat ini tampil di layar. Anda yakin ingin melanjutkan?`}
        isLoading={loading}
      />

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} src={previewSrc} title="Preview Sertifikat" />

      {/* --- BULK EDIT MODAL --- */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Edit Masal / Hapus Masal Data Karyawan">
         <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex gap-3 items-start">
               <Activity className="text-amber-600 shrink-0 mt-1" size={18} />
               <div className="text-xs text-amber-800">
                  <p className="font-bold">Mode Pengolahan Masal</p>
                  <p className="mt-1">Anda sedang mengolah {bulkData.length} data karyawan yang tampil. Anda bisa mengubah data secara cepat atau menghapus semua data yang tampil sekaligus.</p>
               </div>
            </div>

            <div className="flex justify-start">
               <button 
                  onClick={() => setIsDeleteAllConfirmOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100 transition-all"
               >
                  <Trash2 size={14} /> Hapus Semua Data Tampil
               </button>
            </div>

            <div className="max-h-[50vh] overflow-auto border rounded-xl shadow-inner bg-gray-50">
               <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                     <tr>
                        <th className="p-3 font-bold text-gray-600 border-b">Nama Karyawan</th>
                        <th className="p-3 font-bold text-gray-600 border-b">Divisi</th>
                        <th className="p-3 font-bold text-gray-600 border-b">Honor Harian</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                     {bulkData.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                           <td className="p-3">
                              <input 
                                 type="text" 
                                 className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none py-1 font-medium" 
                                 value={item.nama}
                                 onChange={(e) => handleBulkChange(idx, 'nama', e.target.value)}
                              />
                           </td>
                           <td className="p-3">
                              <select 
                                 className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary text-xs"
                                 value={item.divisi}
                                 onChange={(e) => handleBulkChange(idx, 'divisi', e.target.value)}
                              >
                                 {divisionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                           </td>
                           <td className="p-3">
                              <input 
                                 type="number" 
                                 className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none py-1 font-mono font-bold text-blue-700 text-right" 
                                 value={item.honorHarian ?? ''}
                                 onChange={(e) => handleBulkChange(idx, 'honorHarian', parseInt(e.target.value) || 0)}
                              />
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
               <Button variant="secondary" onClick={() => setIsBulkModalOpen(false)}>Batal</Button>
               <Button onClick={handleSaveBulk} isLoading={loading} icon={<CheckCircle2 size={18} />}>
                  Simpan Perubahan
               </Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Karyawan" : "Tambah Karyawan"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="NIK" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
            </div>
            <div>
              <Input label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Divisi" value={formData.divisi} onChange={e => setFormData({...formData, divisi: e.target.value})} options={divisionOptions} />
            </div>
            <div>
              <Input label="No HP (WA)" value={formData.hp} onChange={e => setFormData({...formData, hp: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input 
                label="Honor Harian (Rp)" 
                type="number" 
                value={formData.honorHarian ?? ''} 
                onChange={e => setFormData({...formData, honorHarian: e.target.value ? parseInt(e.target.value) : undefined})} 
              />
            </div>
            <div>
              <Input label="No BPJS Ketenagakerjaan" value={formData.noBpjs} onChange={e => setFormData({...formData, noBpjs: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Bank" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value as any})} options={bankOptions} />
            </div>
            <div>
              <Input label="No Rekening" value={formData.rekening} onChange={e => setFormData({...formData, rekening: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Sertifikat Pelatihan</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
              <div className="space-y-1 text-center">
                {formData.sertifikat ? (
                  <div className="flex flex-col items-center">
                    <FileText className="mx-auto h-12 w-12 text-green-500" />
                    <p className="text-sm text-green-600 font-medium">File dipilih</p>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, sertifikat: ''})}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <>
                    <Download className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
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
