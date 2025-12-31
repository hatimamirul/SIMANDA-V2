import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Select, Button, PreviewModal, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, ExportModal } from '../components/UIComponents';
import { api } from '../services/mockService';
import { PMB3, User, Role } from '../types';
import { FileText, Download, Eye, Filter, Baby, Phone, MapPin, Pencil, Trash2, History } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const B3Page: React.FC = () => {
  const [data, setData] = useState<PMB3[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<PMB3 | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PMB3>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // NEW: State for current edit session note
  const [tempNote, setTempNote] = useState('');

  // Filtering States
  const [filterDesa, setFilterDesa] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  
  // Layout State
  const [layout, setLayout] = useState<'table' | 'grid'>('table');
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { showToast } = useToast();

  // List of Desa sorted alphabetically
  const desaOptionsRaw = [
    "Tales", "Branggahan", "Slumbung", "Seketi", "Ngadiluwih", 
    "Banggle", "Purwokerto", "Badal Pandean", "Badal", "Wonorejo", 
    "Dawung", "Rembang", "Rembang Kepuh", "Banjarejo", "Mangunrejo", "Dukuh"
  ].sort();

  const desaOptions = desaOptionsRaw.map(d => ({ value: d, label: d }));

  // List of Jenis B3
  const jenisOptionsRaw = ['BALITA', 'IBU HAMIL', 'IBU MENYUSUI'];

  // Get current user to check role
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();
  const role = currentUser?.jabatan as Role;
  
  const canAdd = role !== 'KOORDINATORDIVISI';
  const hideActions = role === 'PETUGAS';

  // Realtime Subscription with Integrated Filtering
  useEffect(() => {
    setLoading(true);
    const unsubscribe = api.subscribeB3s((items) => {
      let filtered = items;
      
      // Filter by Search
      if (search) {
        const lower = search.toLowerCase();
        filtered = filtered.filter(i => i.nama.toLowerCase().includes(lower) || i.desa.toLowerCase().includes(lower));
      }

      // Filter by Desa
      if (filterDesa) {
        filtered = filtered.filter(i => i.desa === filterDesa);
      }

      // Filter by Jenis
      if (filterJenis) {
        filtered = filtered.filter(i => i.jenis === filterJenis);
      }

      setData(filtered);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [search, filterDesa, filterJenis]);

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.nama || 
      !formData.jenis || 
      !formData.desa || 
      !formData.rt || 
      !formData.rw || 
      !formData.kecamatan || 
      !formData.hp
    ) {
      showToast("Gagal menyimpan! Harap isi semua kolom yang tersedia (kecuali upload scan) dan revisi kembali.", "error");
      return;
    }

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

    await api.saveB3({ ...formData, catatan: finalNote } as PMB3);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Data PM B3 ${formData.nama} berhasil disimpan!`, "success");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteB3(deleteItem.id);
      showToast("Data PM B3 berhasil dihapus!", "success");
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
      jenis: 'BALITA', 
      rt: '', 
      rw: '', 
      desa: desaOptionsRaw[0], 
      kecamatan: 'Ngadiluwih', 
      hp: '', 
      buktiScan: '',
      catatan: ''
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

  const handleExportExcel = () => {
    const dataToExport = data.map(item => ({
      'Nama PM': item.nama,
      'Jenis': item.jenis,
      'Desa': item.desa,
      'RT': item.rt,
      'RW': item.rw,
      'Kecamatan': item.kecamatan,
      'No HP': item.hp,
      'Catatan': item.catatan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PM B3");
    XLSX.writeFile(wb, "Data_PM_B3.xlsx");
  };

  const getJenisColor = (jenis: string) => {
    switch (jenis) {
      case 'BALITA': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IBU HAMIL': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'IBU MENYUSUI': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getJenisBadgeColor = (jenis: string) => {
     switch (jenis) {
      case 'BALITA': return 'border-blue-200 bg-blue-50';
      case 'IBU HAMIL': return 'border-pink-200 bg-pink-50';
      case 'IBU MENYUSUI': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
     }
  };

  // Grid Renderer
  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       {data.map(item => (
         <div key={item.id} className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5 flex flex-col group ${getJenisBadgeColor(item.jenis)}`}>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white text-gray-700 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <Baby size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-800 line-clamp-1 text-sm">{item.nama}</h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase mt-1 inline-block ${getJenisColor(item.jenis)}`}>
                      {item.jenis}
                    </span>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 bg-white/60 p-2 rounded-lg border border-gray-100">
               <MapPin size={14} className="text-red-400" /> 
               <span>{item.desa}, RT {item.rt}/RW {item.rw}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 px-1">
               <Phone size={14} /> {item.hp}
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200/50 mt-auto">
                {!hideActions && (
                  <>
                    {item.buktiScan && (
                        <button onClick={() => handlePreview(item.buktiScan!)} className="p-1.5 bg-white hover:bg-green-50 text-green-600 rounded-lg transition-colors border border-gray-200 shadow-sm" title="Lihat Scan">
                          <Eye size={16} />
                        </button>
                    )}
                    <button onClick={() => { setFormData(item); setTempNote(''); setIsModalOpen(true); }} className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 rounded-lg transition-colors border border-gray-200 shadow-sm" title="Edit">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => setDeleteItem(item)} className="p-1.5 bg-white hover:bg-red-50 text-red-600 rounded-lg transition-colors border border-gray-200 shadow-sm" title="Hapus">
                        <Trash2 size={16} />
                    </button>
                  </>
                )}
            </div>
         </div>
       ))}
    </div>
  );

  return (
    <div>
      <Toolbar 
        title="Data PM B3" 
        onSearch={setSearch} 
        onAdd={canAdd ? openAdd : undefined} 
        onExport={() => setIsExportModalOpen(true)}
        searchPlaceholder="Cari Nama atau Desa..."
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
                <option value="">-- Semua Kategori --</option>
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
                  Kat: {filterJenis}
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
          <Table<PMB3> 
            isLoading={loading}
            data={data}
            hideActions={hideActions}
            columns={[
              { header: 'Nama PM', accessor: 'nama' },
              { 
                header: 'Jenis', 
                accessor: (i) => (
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getJenisColor(i.jenis)}`}>
                    {i.jenis}
                  </span>
                ) 
              },
              { header: 'Desa', accessor: 'desa' },
              { header: 'RT/RW', accessor: (i) => `${i.rt}/${i.rw}` },
              { header: 'Kecamatan', accessor: 'kecamatan' },
              { header: 'No HP', accessor: 'hp' },
              { 
                header: 'Catatan', 
                accessor: (i) => (
                  <span className="text-xs text-gray-500 truncate max-w-[150px] inline-block" title={i.catatan}>
                    {i.catatan ? i.catatan.split('\n')[0] : '-'}
                  </span>
                ) 
              },
              { header: 'Bukti Scan', accessor: (i) => i.buktiScan ? (
                <button 
                  type="button"
                  onClick={() => handlePreview(i.buktiScan!)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <Eye size={12} /> Lihat
                </button>
              ) : <span className="text-gray-400 text-xs italic">Tidak ada</span> },
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
        title="Data PM B3"
        data={data}
        columns={[
            { header: 'Nama PM', accessor: 'nama' },
            { header: 'Jenis', accessor: 'jenis' },
            { header: 'Desa', accessor: 'desa' },
            { header: 'RT', accessor: 'rt' },
            { header: 'RW', accessor: 'rw' },
            { header: 'Kecamatan', accessor: 'kecamatan' },
            { header: 'No HP', accessor: 'hp' },
            { header: 'Catatan', accessor: 'catatan' }
        ]}
        onExportExcel={handleExportExcel}
      />

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Data PM B3"
        message={`Apakah anda yakin ingin menghapus data ${deleteItem?.nama}?`}
        isLoading={loading}
      />

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} src={previewSrc} title="Preview Bukti Scan" />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit PM B3" : "Tambah PM B3"}>
        <div className="space-y-4">
          <div>
            <Input label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Kategori" value={formData.jenis} onChange={e => setFormData({...formData, jenis: e.target.value as any})} 
                options={jenisOptionsRaw.map(v => ({value: v, label: v}))} 
              />
              {!formData.id && <FormHelperText />}
            </div>
            <div>
              <Select 
                label="Desa" 
                value={formData.desa} 
                onChange={e => setFormData({...formData, desa: e.target.value})} 
                options={desaOptions}
              />
              {!formData.id && <FormHelperText />}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input label="RT" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} />
              {!formData.id && <FormHelperText />}
            </div>
            <div>
              <Input label="RW" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} />
              {!formData.id && <FormHelperText />}
            </div>
            <div>
              <Input label="Kecamatan" value={formData.kecamatan} onChange={e => setFormData({...formData, kecamatan: e.target.value})} />
              {!formData.id && <FormHelperText />}
            </div>
          </div>

          <div>
            <Input label="No HP (WA)" value={formData.hp} onChange={e => setFormData({...formData, hp: e.target.value})} />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Bukti Scan (KK/KTP)</label>
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
                      <label htmlFor="file-upload-b3" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input id="file-upload-b3" name="file-upload-b3" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
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
