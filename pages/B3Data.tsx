
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Select, Button, PreviewModal, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, ExportModal } from '../components/UIComponents';
import { api } from '../services/mockService';
import { PMB3, User, Role } from '../types';
import { FileText, Download, Eye, Filter, Baby, Phone, MapPin, Pencil, Trash2 } from 'lucide-react';

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
    await api.saveB3(formData as PMB3);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Data PM B3 ${formData.nama} berhasil disimpan!`, "success");
    // loadData handled by subscription
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
      buktiScan: '' 
    });
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
      'No HP': item.hp
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
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-gray-100">
                    <Baby size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-800 line-clamp-1">{item.nama}</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{item.jenis}</p>
                 </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-100 space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400" /> 
                  <span className="truncate">RT {item.rt} / RW {item.rw}, {item.desa}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400" /> {item.hp}
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 mt-auto">
               <span className="text-xs text-gray-400">Kec. {item.kecamatan}</span>
               
               {!hideActions && (
                 <div className="flex gap-2">
                   {item.buktiScan && (
                       <button onClick={() => handlePreview(item.buktiScan!)} className="p-1.5 bg-white hover:bg-green-50 text-green-600 rounded-lg transition-colors shadow-sm border border-gray-100" title="Lihat Scan">
                         <Eye size={16} />
                       </button>
                   )}
                   <button onClick={() => { setFormData(item); setIsModalOpen(true); }} className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 rounded-lg transition-colors shadow-sm border border-gray-100" title="Edit">
                       <Pencil size={16} />
                   </button>
                   <button onClick={() => setDeleteItem(item)} className="p-1.5 bg-white hover:bg-red-50 text-red-600 rounded-lg transition-colors shadow-sm border border-gray-100" title="Hapus">
                       <Trash2 size={16} />
                   </button>
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
                <option value="">-- Semua Jenis --</option>
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
                  Jenis: {filterJenis}
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
              { header: 'Nama', accessor: 'nama' },
              { 
                header: 'Jenis', 
                accessor: (i) => (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getJenisColor(i.jenis)}`}>
                    {i.jenis}
                  </span>
                ) 
              },
              { header: 'Desa', accessor: 'desa' },
              { header: 'RT/RW', accessor: (i) => `RT ${i.rt} / RW ${i.rw}` },
              { header: 'Kecamatan', accessor: 'kecamatan' },
              { header: 'No HP', accessor: 'hp' },
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
            onEdit={(i) => { setFormData(i); setIsModalOpen(true); }}
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
            { header: 'No HP', accessor: 'hp' }
        ]}
        onExportExcel={handleExportExcel}
      />

      {/* Confirmation Modal logic needs conditional rendering based on hideActions or check inside */}
      {!hideActions && (
        <ConfirmationModal 
          isOpen={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          title="Hapus Data B3"
          message={`Apakah anda yakin ingin menghapus data B3 atas nama ${deleteItem?.nama}?`}
          isLoading={loading}
        />
      )}

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} src={previewSrc} title="Preview Bukti Scan" />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit PM B3" : "Tambah PM B3"}>
        <div className="space-y-4">
          <div>
            <Input label="Nama PM" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          <div>
            <Select label="Jenis" value={formData.jenis} onChange={e => setFormData({...formData, jenis: e.target.value as any})} 
              options={['BALITA', 'IBU HAMIL', 'IBU MENYUSUI'].map(v => ({value: v, label: v}))} 
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="RT" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} />
              {!formData.id && <FormHelperText />}
            </div>
            <div>
              <Input label="RW" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} />
              {!formData.id && <FormHelperText />}
            </div>
          </div>
          
          <div>
            <Select 
              label="Kecamatan" 
              value={formData.kecamatan} 
              onChange={e => setFormData({...formData, kecamatan: e.target.value})} 
              options={[{ value: 'Ngadiluwih', label: 'Ngadiluwih' }]}
            />
            {!formData.id && <FormHelperText />}
          </div>
          
          <div>
            <Input label="No HP" value={formData.hp} onChange={e => setFormData({...formData, hp: e.target.value})} />
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
