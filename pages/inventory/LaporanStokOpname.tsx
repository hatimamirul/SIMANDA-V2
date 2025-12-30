
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Button, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, Select, ExportModal } from '../../components/UIComponents';
import { api } from '../../services/mockService';
import { StokOpname, StokSummary } from '../../types';
import { Calculator, ClipboardCheck, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const LaporanStokOpnamePage: React.FC = () => {
  const [data, setData] = useState<StokOpname[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<StokOpname | null>(null);
  const [formData, setFormData] = useState<Partial<StokOpname>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Data Stok Terkini untuk Dropdown & Kalkulasi
  const [availableItems, setAvailableItems] = useState<{name: string, total: number, unit: string}[]>([]);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    
    // 1. Subscribe Stok Opname Data
    const unsubscribeOpname = api.subscribeStokOpname((items) => {
        // Sort descending by Date
        const sorted = items.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
        
        if (search) {
            const lower = search.toLowerCase();
            setData(sorted.filter(i => i.namaBahan.toLowerCase().includes(lower)));
        } else {
            setData(sorted);
        }
        setLoading(false);
    });

    // 2. Subscribe Stok Saat Ini (Untuk Pilihan Dropdown & Data Pembanding)
    const unsubscribeStok = api.subscribeStokSummary((items) => {
        // Agregasi stok berdasarkan Nama Bahan (menggabungkan suplayer berbeda)
        const aggregated = new Map<string, {total: number, unit: string}>();
        
        items.forEach(item => {
            const key = item.namaBahan.toUpperCase();
            if(aggregated.has(key)) {
                const curr = aggregated.get(key)!;
                curr.total += item.totalStok;
            } else {
                aggregated.set(key, { total: item.totalStok, unit: item.satuan });
            }
        });

        const list = Array.from(aggregated.entries()).map(([name, val]) => ({
            name: name,
            total: val.total,
            unit: val.unit
        }));
        
        // Filter hanya yang stoknya positif untuk ditampilkan di dropdown (opsional, bisa semua)
        setAvailableItems(list.sort((a, b) => a.name.localeCompare(b.name)));
    });

    return () => {
        unsubscribeOpname();
        unsubscribeStok();
    };
  }, [search]);

  const handleSubmit = async () => {
    if (!formData.tanggal || !formData.namaBahan || formData.stokFisik === undefined) {
      showToast("Harap isi Tanggal, Nama Bahan, dan Stok Fisik.", "error");
      return;
    }

    setLoading(true);
    await api.saveStokOpname(formData as StokOpname);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Stok Opname ${formData.namaBahan} berhasil dicatat!`, "success");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteStokOpname(deleteItem.id);
      showToast("Laporan stok opname berhasil dihapus!", "success");
      setDeleteItem(null);
    } catch (e) {
      showToast('Gagal menghapus data.', "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ 
        tanggal: today, 
        namaBahan: '', 
        stokFisik: 0, 
        stokSistem: 0,
        selisih: 0,
        satuan: '', 
        kondisi: 'BAIK', 
        keterangan: '',
        petugas: 'Admin' // Should ideally take logged in user name
    });
    setIsModalOpen(true);
  };

  // Handler saat memilih bahan dari dropdown
  const handleBahanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedName = e.target.value;
      const item = availableItems.find(i => i.name === selectedName);
      
      if (item) {
          const fis = formData.stokFisik || 0;
          const sys = item.total;
          setFormData(prev => ({
              ...prev,
              namaBahan: item.name,
              stokSistem: sys,
              satuan: item.unit,
              selisih: fis - sys
          }));
      } else {
          setFormData(prev => ({ ...prev, namaBahan: '', stokSistem: 0, satuan: '' }));
      }
  };

  // Handler saat input stok fisik
  const handleFisikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value) || 0;
      const sys = formData.stokSistem || 0;
      setFormData(prev => ({
          ...prev,
          stokFisik: val,
          selisih: val - sys
      }));
  };

  const handleExportExcel = () => {
    const dataToExport = data.map(item => ({
      'Tanggal': item.tanggal,
      'Nama Bahan': item.namaBahan,
      'Stok Sistem': item.stokSistem,
      'Stok Fisik': item.stokFisik,
      'Selisih': item.selisih,
      'Satuan': item.satuan,
      'Kondisi': item.kondisi,
      'Keterangan': item.keterangan || '-',
      'Petugas': item.petugas || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok Opname");
    XLSX.writeFile(wb, "Laporan_Stok_Opname.xlsx");
  };

  // Helper untuk warna selisih
  const getSelisihColor = (val: number) => {
      if (val === 0) return 'text-green-600 bg-green-50 border-green-200';
      if (val < 0) return 'text-red-600 bg-red-50 border-red-200';
      return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  return (
    <div>
      <Toolbar 
        title="Laporan Stok Opname" 
        onSearch={setSearch} 
        onAdd={openAdd} 
        onExport={() => setIsExportModalOpen(true)}
        searchPlaceholder="Cari Nama Bahan..."
      />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <Table<StokOpname> 
            isLoading={loading}
            data={data}
            columns={[
              { header: 'Tanggal', accessor: 'tanggal' },
              { header: 'Nama Bahan', accessor: (i) => <span className="font-semibold text-gray-700">{i.namaBahan}</span> },
              { 
                  header: 'Stok Sistem', 
                  accessor: (i) => <span className="text-gray-500">{i.stokSistem} {i.satuan}</span> 
              },
              { 
                  header: 'Stok Fisik', 
                  accessor: (i) => <span className="font-bold text-gray-800">{i.stokFisik} {i.satuan}</span> 
              },
              { 
                  header: 'Selisih', 
                  accessor: (i) => (
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getSelisihColor(i.selisih)}`}>
                        {i.selisih > 0 ? '+' : ''}{i.selisih} {i.satuan}
                    </span>
                  ) 
              },
              { 
                  header: 'Kondisi', 
                  accessor: (i) => (
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        i.kondisi === 'BAIK' ? 'bg-emerald-100 text-emerald-700' : 
                        i.kondisi === 'RUSAK' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                        {i.kondisi}
                    </span>
                  ) 
              },
              { header: 'Keterangan', accessor: (i) => i.keterangan || '-' },
            ]}
            onEdit={(i) => { setFormData(i); setIsModalOpen(true); }}
            onDelete={setDeleteItem}
          />
        </Card>
      )}

      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Laporan Stok Opname"
        data={data}
        columns={[
            { header: 'Tanggal', accessor: 'tanggal' },
            { header: 'Nama Bahan', accessor: 'namaBahan' },
            { header: 'Stok Sistem', accessor: (i) => `${i.stokSistem} ${i.satuan}` },
            { header: 'Stok Fisik', accessor: (i) => `${i.stokFisik} ${i.satuan}` },
            { header: 'Selisih', accessor: (i) => `${i.selisih} ${i.satuan}` },
            { header: 'Kondisi', accessor: 'kondisi' },
            { header: 'Keterangan', accessor: (i) => i.keterangan || '-' },
            { header: 'Petugas', accessor: (i) => i.petugas || '-' }
        ]}
        onExportExcel={handleExportExcel}
      />

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Laporan Stok Opname"
        message={`Apakah anda yakin ingin menghapus data stok opname ${deleteItem?.namaBahan}?`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Stok Opname" : "Catat Stok Opname"}>
        <div className="space-y-5">
          {/* Header Info */}
          <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
             <ClipboardCheck className="text-blue-600 mt-1" size={20} />
             <div className="text-sm text-blue-800">
                <p className="font-bold">Formulir Pengecekan Stok</p>
                <p className="text-xs mt-1 text-blue-600">
                   Pilih bahan baku dari stok sistem, lalu masukkan jumlah fisik yang dihitung di gudang. Sistem akan otomatis menghitung selisihnya.
                </p>
             </div>
          </div>

          <div>
            <Input 
                label="Tanggal Pengecekan" 
                type="date" 
                value={formData.tanggal} 
                onChange={e => setFormData({...formData, tanggal: e.target.value})} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Bahan Baku (Dari Stok Sistem)</label>
            <select 
               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
               value={formData.namaBahan}
               onChange={handleBahanChange}
               disabled={!!formData.id} // Disable changing item when editing to prevent confusion
            >
               <option value="">-- Pilih Bahan --</option>
               {availableItems.map((item, idx) => (
                   <option key={idx} value={item.name}>
                       {item.name} (Sistem: {item.total} {item.unit})
                   </option>
               ))}
            </select>
            {!formData.id && <FormHelperText />}
          </div>

          {/* Calculation Area */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calculator size={14}/> Kalkulasi Selisih
             </h4>
             <div className="grid grid-cols-3 gap-2 items-center">
                
                {/* Stok Sistem (Read Only) */}
                <div className="text-center">
                   <label className="block text-[10px] text-gray-500 mb-1">Stok Sistem</label>
                   <div className="bg-white border border-gray-200 py-2 px-1 rounded-lg font-bold text-gray-600">
                      {formData.stokSistem ?? 0}
                   </div>
                </div>

                {/* Operator */}
                <div className="flex justify-center text-gray-400">
                   <ArrowRight size={20} />
                </div>

                {/* Stok Fisik (Input) */}
                <div>
                   <label className="block text-[10px] text-primary font-bold mb-1 text-center">Stok Fisik (Input)</label>
                   <input 
                      type="number" 
                      className="w-full text-center py-2 px-1 border-2 border-primary/30 rounded-lg focus:border-primary outline-none font-bold text-lg text-primary bg-white"
                      value={formData.stokFisik ?? ''}
                      onChange={handleFisikChange}
                      placeholder="0"
                   />
                </div>
             </div>

             {/* Result: Selisih */}
             <div className={`mt-4 p-3 rounded-lg border flex justify-between items-center ${
                 (formData.selisih || 0) === 0 ? 'bg-green-50 border-green-200 text-green-700' :
                 (formData.selisih || 0) < 0 ? 'bg-red-50 border-red-200 text-red-700' :
                 'bg-blue-50 border-blue-200 text-blue-700'
             }`}>
                 <span className="text-sm font-medium">Selisih:</span>
                 <span className="text-lg font-bold">
                    {(formData.selisih || 0) > 0 ? '+' : ''}{formData.selisih ?? 0} {formData.satuan}
                 </span>
             </div>
             {(formData.selisih || 0) !== 0 && (
                 <p className="text-[10px] mt-1 text-right text-gray-500 italic">
                    {(formData.selisih || 0) < 0 ? '*Barang hilang atau penyusutan' : '*Barang berlebih'}
                 </p>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <Select 
                    label="Kondisi Fisik" 
                    value={formData.kondisi} 
                    onChange={e => setFormData({...formData, kondisi: e.target.value as any})} 
                    options={[
                        {value: 'BAIK', label: 'Baik'},
                        {value: 'RUSAK', label: 'Rusak / Busuk'},
                        {value: 'KADALUARSA', label: 'Kadaluarsa'}
                    ]} 
                />
             </div>
             <div>
                <Input 
                    label="Satuan" 
                    value={formData.satuan || ''} 
                    disabled 
                    className="bg-gray-100 text-gray-500"
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Catatan</label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none uppercase"
              value={formData.keterangan || ''}
              onChange={e => setFormData({...formData, keterangan: e.target.value.toUpperCase()})}
              placeholder="CONTOH: PACKING RUSAK, DLL"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSubmit} isLoading={loading}>Simpan Laporan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

