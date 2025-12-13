
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Button, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, Select } from '../../components/UIComponents';
import { api } from '../../services/mockService';
import { BahanKeluar, StokSummary } from '../../types';
import { Package, Hash, Scale, FileText, CalendarDays, ArrowUpFromLine } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const LaporanBahanKeluarPage: React.FC = () => {
  const [data, setData] = useState<BahanKeluar[]>([]);
  const [stokData, setStokData] = useState<StokSummary[]>([]);
  
  // Aggregated Stock list for Dropdown (Grouped by Name)
  const [availableItems, setAvailableItems] = useState<{name: string, total: number, unit: string}[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<BahanKeluar | null>(null);
  const [formData, setFormData] = useState<Partial<BahanKeluar>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);

    // 1. Subscribe to Bahan Keluar List
    const unsubBahan = api.subscribeBahanKeluar((items) => {
        // Sort Descending (Terbaru paling atas)
        const sortedItems = items.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

        if (search) {
            const lower = search.toLowerCase();
            setData(sortedItems.filter(i => 
              i.namaBahan.toLowerCase().includes(lower)
            ));
        } else {
            setData(sortedItems);
        }
        setLoading(false);
    });

    // 2. Subscribe to Stok Summary (for Dropdown & Validation)
    const unsubStok = api.subscribeStokSummary((items) => {
        setStokData(items);
        
        // Aggregate items by Name (since user selects Name, not Supplier)
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
        setAvailableItems(list);
    });

    return () => {
        unsubBahan();
        unsubStok();
    };
  }, [search]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.tanggal || !formData.namaBahan || !formData.jumlah) {
      showToast("Harap lengkapi Tanggal, Nama Bahan, dan Jumlah.", "error");
      return;
    }

    // Check availability (Realtime check)
    const selectedItem = availableItems.find(i => i.name === formData.namaBahan);
    const maxStock = selectedItem ? selectedItem.total : 0;
    
    // Logic: If editing, we ignore the check against current stock because it was already deducted? 
    // Simplified: For now, assuming new entry mostly. 
    // If new entry: check if amount > current stock.
    if (!formData.id && (formData.jumlah || 0) > maxStock) {
        showToast(`Stok tidak mencukupi! Stok ${formData.namaBahan} saat ini hanya ${maxStock} ${formData.satuan}.`, "error");
        return;
    }

    setLoading(true);
    await api.saveBahanKeluar(formData as BahanKeluar);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Laporan keluar ${formData.namaBahan} berhasil disimpan!`, "success");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteBahanKeluar(deleteItem.id);
      showToast("Data berhasil dihapus!", "success");
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
        jumlah: undefined, 
        satuan: '', 
        keterangan: '' 
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const name = e.target.value;
      const item = availableItems.find(i => i.name === name);
      setFormData(prev => ({
          ...prev,
          namaBahan: name,
          satuan: item ? item.unit : ''
      }));
  };

  const handleExport = () => {
    const dataToExport = data.map(item => ({
      'Tanggal': item.tanggal,
      'Nama Bahan': item.namaBahan,
      'Jumlah': item.jumlah,
      'Satuan': item.satuan,
      'Keterangan': item.keterangan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bahan Keluar");
    XLSX.writeFile(wb, "Laporan_Bahan_Keluar.xlsx");
  };

  return (
    <div>
      <Toolbar 
        title="Laporan Bahan Keluar" 
        onSearch={setSearch} 
        onAdd={openAdd} 
        onExport={handleExport}
        searchPlaceholder="Cari Nama Bahan..."
      />
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <Table<BahanKeluar> 
            isLoading={loading}
            data={data}
            columns={[
              { header: 'Tanggal', accessor: 'tanggal' },
              { header: 'Nama Bahan', accessor: 'namaBahan' },
              { 
                  header: 'Jumlah Keluar', 
                  accessor: (i) => (
                      <span className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                          {i.jumlah} {i.satuan}
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

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Laporan Keluar"
        message={`Apakah anda yakin ingin menghapus data keluar ${deleteItem?.namaBahan}? Stok akan dikembalikan.`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Bahan Keluar" : "Catat Bahan Keluar"}>
        <div className="space-y-6">
           {/* Date Selection */}
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4 shadow-sm">
                <div className="bg-white p-2.5 rounded-lg text-red-600 shadow-sm">
                <CalendarDays size={20} />
                </div>
                <div className="flex-1">
                <label className="block text-xs font-bold text-red-800 uppercase tracking-wide mb-1">Tanggal Keluar</label>
                <input 
                    type="date" 
                    className="bg-transparent font-bold text-gray-800 outline-none w-full cursor-pointer text-lg"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                   <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                       <Package size={16} className="text-primary"/> Pilih Nama Bahan (Stok Tersedia)
                   </label>
                   <select 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm bg-white"
                      value={formData.namaBahan}
                      onChange={handleNameChange}
                   >
                      <option value="">-- Pilih Bahan --</option>
                      {availableItems.map((item, idx) => (
                          <option key={idx} value={item.name}>
                              {item.name} (Tersedia: {item.total} {item.unit})
                          </option>
                      ))}
                   </select>
                   <p className="text-[10px] text-gray-500 mt-1 ml-1">
                      *Menampilkan total stok akumulasi dari semua suplayer.
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                            <Hash size={16} className="text-primary"/> Jumlah Keluar
                        </label>
                        <input 
                            type="number"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none font-bold text-lg"
                            value={formData.jumlah ?? ''}
                            onChange={(e) => setFormData({...formData, jumlah: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                            <Scale size={16} className="text-primary"/> Satuan
                        </label>
                        <input 
                            type="text"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 font-medium"
                            value={formData.satuan || ''}
                            disabled
                        />
                    </div>
                </div>

                <div>
                   <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                       <FileText size={16} className="text-primary"/> Keterangan
                   </label>
                   <textarea 
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none uppercase"
                      value={formData.keterangan || ''}
                      onChange={(e) => setFormData({...formData, keterangan: e.target.value.toUpperCase()})}
                      placeholder="KEPERLUAN, DLL..."
                   />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button onClick={handleSubmit} isLoading={loading} className="shadow-lg shadow-red-200 bg-red-600 hover:bg-red-700 border-transparent text-white">
                    <ArrowUpFromLine size={18} className="mr-2"/> Simpan Pengeluaran
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};
