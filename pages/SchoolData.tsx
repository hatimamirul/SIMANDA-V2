

import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Select, Button, PreviewModal, ConfirmationModal, FormHelperText, useToast, LoadingSpinner } from '../components/UIComponents';
import { api } from '../services/mockService';
import { PMSekolah, User, Role } from '../types';
import { FileText, Download, Eye, AlertTriangle, Filter, School, Users, Phone, Pencil, Trash2, MapPin } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const SchoolPage: React.FC = () => {
  const [data, setData] = useState<PMSekolah[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<PMSekolah | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PMSekolah>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Filtering States
  const [filterDesa, setFilterDesa] = useState('');
  const [filterJenis, setFilterJenis] = useState('');

  // Layout State
  const [layout, setLayout] = useState<'table' | 'grid'>('table');

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
    const unsubscribe = api.subscribePMs((items) => {
      let filtered = items;
      
      // 1. Filter by Search
      if (search) {
        const lower = search.toLowerCase();
        filtered = filtered.filter(i => i.nama.toLowerCase().includes(lower) || i.npsn.includes(lower));
      }

      // 2. Filter by Desa
      if (filterDesa) {
        filtered = filtered.filter(i => i.desa === filterDesa);
      }

      // 3. Filter by Jenis
      if (filterJenis) {
        filtered = filtered.filter(i => i.jenis === filterJenis);
      }

      setData(filtered);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [search, filterDesa, filterJenis]);

  const validate = (): boolean => {
    if (
      !formData.nama || 
      !formData.npsn || 
      !formData.desa || 
      !formData.jenis || 
      formData.jmlsiswa === undefined || 
      formData.pmBesar === undefined || 
      formData.pmKecil === undefined || 
      formData.jmlguru === undefined || 
      !formData.narahubung || 
      !formData.hp
    ) {
      showToast("Gagal menyimpan! Mohon lengkapi semua data sekolah (termasuk Desa) dan revisi kembali.", "error");
      return false;
    }

    const siswa = formData.jmlsiswa || 0;
    const besar = formData.pmBesar || 0;
    const kecil = formData.pmKecil || 0;

    if ((besar + kecil) !== siswa) {
      setValidationError(`Data tidak valid! Harap perbaiki: Jumlah PM Besar (${besar}) + PM Kecil (${kecil}) = ${besar + kecil}. Harus sama dengan Jumlah Siswa (${siswa}).`);
      showToast("Data jumlah siswa dan PM tidak valid.", "error");
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLoading(true);
    await api.savePM(formData as PMSekolah);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Data Sekolah ${formData.nama} berhasil disimpan!`, "success");
    // loadData handled by subscription
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
    // Set default Desa if available
    setFormData({ 
      nama: '', 
      npsn: '', 
      desa: desaOptionsRaw[0],
      jenis: 'TK', 
      jmlsiswa: undefined, 
      pmBesar: undefined, 
      pmKecil: undefined, 
      jmlguru: undefined, 
      narahubung: '', 
      hp: '', 
      buktiScan: '' 
    });
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

  const handleExport = () => {
    const dataToExport = data.map(item => ({
      'NPSN': item.npsn,
      'Nama Sekolah': item.nama,
      'Desa': item.desa,
      'Jenis': item.jenis,
      'Jumlah Siswa': item.jmlsiswa,
      'PM Besar': item.pmBesar,
      'PM Kecil': item.pmKecil,
      'Jumlah Guru': item.jmlguru,
      'Narahubung': item.narahubung,
      'No HP': item.hp
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
              pmBesar: parseInt(row['PM Besar'] || '0'),
              pmKecil: parseInt(row['PM Kecil'] || '0'),
              jmlguru: parseInt(row['Jumlah Guru'] || '0'),
              narahubung: row['Narahubung'] || '',
              hp: String(row['No HP'] || ''),
              buktiScan: '' // Cannot import files via excel
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

  // Grid Renderer
  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {data.map(item => (
         <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5 flex flex-col group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <School size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-800 line-clamp-1 text-sm">{item.nama}</h3>
                    <p className="text-xs text-gray-500">NPSN: {item.npsn}</p>
                 </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase border border-gray-200">
                {item.jenis}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
               <MapPin size={14} className="text-red-400" /> Desa {item.desa || '-'}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
               <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                  <span className="block text-xl font-bold text-blue-700">{item.jmlsiswa}</span>
                  <span className="text-[10px] text-blue-600 font-medium">Siswa</span>
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
                  <button onClick={() => { setFormData(item); setValidationError(''); setIsModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit">
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
       ))}
    </div>
  );

  return (
    <div>
      <Toolbar 
        title="Data PM Sekolah" 
        onSearch={setSearch} 
        onAdd={canAdd ? openAdd : undefined} 
        onExport={handleExport}
        onImport={canImport ? handleImport : undefined}
        layoutMode={layout}
        onLayoutChange={setLayout}
      />

      {/* Filter Control */}
      <div className="mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
         <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold shrink-0">
            <Filter size={16} /> Filter:
         </div>
         
         <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
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
         </div>

         {(filterDesa || filterJenis) && (
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
             <button 
                onClick={() => { setFilterDesa(''); setFilterJenis(''); }}
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
              { header: 'NPSN', accessor: 'npsn' },
              { header: 'Nama Sekolah', accessor: 'nama' },
              { 
                header: 'Desa', 
                accessor: (i) => (
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border border-gray-200">
                    {i.desa || '-'}
                  </span>
                )
              },
              { header: 'Jenis', accessor: 'jenis' },
              { header: 'Siswa', accessor: 'jmlsiswa' },
              { 
                header: 'PM Besar', 
                accessor: (i) => (
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200">
                    {i.pmBesar || 0}
                  </span>
                )
              },
              { 
                header: 'PM Kecil', 
                accessor: (i) => (
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-red-100 text-red-700 font-bold text-xs border border-red-200">
                    {i.pmKecil || 0}
                  </span>
                )
              },
              { header: 'Guru', accessor: 'jmlguru' },
              { header: 'Narahubung', accessor: 'narahubung' },
              { header: 'No HP Narahubung', accessor: 'hp' },
              { 
                header: 'BUKTI SCAN PENDATAAN', 
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
            onEdit={(i) => { setFormData(i); setValidationError(''); setIsModalOpen(true); }}
            onDelete={setDeleteItem}
          />
        </Card>
      ) : (
        renderGrid()
      )}

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
             <h4 className="text-sm font-semibold text-gray-700">Data Kuantitatif</h4>
             <div className="grid grid-cols-3 gap-3">
                <div>
                  <Input 
                    label="Jml Siswa" 
                    type="number" 
                    value={formData.jmlsiswa ?? ''} 
                    placeholder="Total"
                    onChange={e => setFormData({...formData, jmlsiswa: e.target.value ? parseInt(e.target.value) : undefined})} 
                  />
                  {!formData.id && <FormHelperText />}
                </div>
                <div>
                  <Input 
                    label="PM Besar" 
                    type="number" 
                    value={formData.pmBesar ?? ''} 
                    placeholder="Besar"
                    onChange={e => setFormData({...formData, pmBesar: e.target.value ? parseInt(e.target.value) : undefined})} 
                  />
                  {!formData.id && <FormHelperText />}
                </div>
                <div>
                  <Input 
                    label="PM Kecil" 
                    type="number" 
                    value={formData.pmKecil ?? ''} 
                    placeholder="Kecil"
                    onChange={e => setFormData({...formData, pmKecil: e.target.value ? parseInt(e.target.value) : undefined})} 
                  />
                  {!formData.id && <FormHelperText />}
                </div>
             </div>
             {validationError && (
               <div className="text-sm text-red-700 flex items-start bg-red-50 p-3 rounded border border-red-200 animate-pulse">
                 <AlertTriangle size={18} className="mr-2 mt-0.5 shrink-0" /> 
                 <span className="font-medium">{validationError}</span>
               </div>
             )}
          </div>

          <div>
            <Input 
              label="Jumlah Guru" 
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
