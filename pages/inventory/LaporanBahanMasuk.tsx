
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Button, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, Select } from '../../components/UIComponents';
import { api } from '../../services/mockService';
import { BahanMasuk, Supplier } from '../../types';
import { ArrowDownToLine } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const LaporanBahanMasukPage: React.FC = () => {
  const [data, setData] = useState<BahanMasuk[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]); // For dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<BahanMasuk | null>(null);
  const [formData, setFormData] = useState<Partial<BahanMasuk>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to Bahan Masuk
    const unsubBahan = api.subscribeBahanMasuk((items) => {
        if (search) {
            const lower = search.toLowerCase();
            setData(items.filter(i => 
              i.namaBahan.toLowerCase().includes(lower) || 
              i.namaSupplier.toLowerCase().includes(lower)
            ));
        } else {
            setData(items);
        }
        setLoading(false);
    });

    // Subscribe to Suppliers (Realtime integration for Dropdown)
    const unsubSuppliers = api.subscribeSuppliers((items) => {
        setSuppliers(items);
    });

    return () => {
        unsubBahan();
        unsubSuppliers();
    };
  }, [search]);

  const handleSubmit = async () => {
    if (!formData.tanggal || !formData.supplierId || !formData.namaBahan || !formData.jumlah || !formData.hargaTotal) {
      showToast("Harap lengkapi Tanggal, Suplayer, Nama Bahan, Jumlah, dan Harga Total.", "error");
      return;
    }

    setLoading(true);
    await api.saveBahanMasuk(formData as BahanMasuk);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Bahan Masuk ${formData.namaBahan} berhasil dicatat!`, "success");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteBahanMasuk(deleteItem.id);
      showToast("Laporan bahan masuk berhasil dihapus!", "success");
      setDeleteItem(null);
    } catch (e) {
      showToast('Gagal menghapus data.', "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setFormData({ 
        tanggal: today, 
        supplierId: '', 
        namaSupplier: '', 
        namaBahan: '', 
        jumlah: 0, 
        satuan: 'kg', 
        hargaTotal: 0, 
        keterangan: '' 
    });
    setIsModalOpen(true);
  };

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      const supplier = suppliers.find(s => s.id === id);
      setFormData(prev => ({
          ...prev,
          supplierId: id,
          namaSupplier: supplier ? supplier.nama : ''
      }));
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const handleExport = () => {
    const dataToExport = data.map(item => ({
      'Tanggal': item.tanggal,
      'Suplayer': item.namaSupplier,
      'Nama Bahan': item.namaBahan,
      'Jumlah': item.jumlah,
      'Satuan': item.satuan,
      'Harga Total': item.hargaTotal,
      'Keterangan': item.keterangan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bahan Masuk");
    XLSX.writeFile(wb, "Laporan_Bahan_Masuk.xlsx");
  };

  const supplierOptions = [
      { value: '', label: '-- Pilih Suplayer --' },
      ...suppliers.map(s => ({ value: s.id, label: s.nama }))
  ];

  return (
    <div>
      <Toolbar 
        title="Laporan Bahan Masuk" 
        onSearch={setSearch} 
        onAdd={openAdd} 
        onExport={handleExport}
        searchPlaceholder="Cari Bahan atau Suplayer..."
      />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <Table<BahanMasuk> 
            isLoading={loading}
            data={data}
            columns={[
              { header: 'Tanggal', accessor: 'tanggal' },
              { header: 'Suplayer', accessor: 'namaSupplier' },
              { header: 'Nama Bahan', accessor: 'namaBahan' },
              { header: 'Jumlah', accessor: (i) => `${i.jumlah} ${i.satuan}` },
              { header: 'Harga Total', accessor: (i) => formatCurrency(i.hargaTotal) },
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
        title="Hapus Laporan Bahan Masuk"
        message={`Apakah anda yakin ingin menghapus laporan masuk ${deleteItem?.namaBahan}?`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Bahan Masuk" : "Catat Bahan Masuk"}>
        <div className="space-y-4">
          <div>
            <Input label="Tanggal" type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          
          <div>
            <Select 
                label="Suplayer" 
                value={formData.supplierId} 
                onChange={handleSupplierChange} 
                options={supplierOptions} 
            />
            {!formData.id && <FormHelperText />}
          </div>

          <div>
            <Input label="Nama Bahan Baku" value={formData.namaBahan} onChange={e => setFormData({...formData, namaBahan: e.target.value})} placeholder="Contoh: Beras, Telur, Wortel..." />
            {!formData.id && <FormHelperText />}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <Input label="Jumlah" type="number" value={formData.jumlah ?? ''} onChange={e => setFormData({...formData, jumlah: e.target.value ? parseFloat(e.target.value) : undefined})} />
                {!formData.id && <FormHelperText />}
             </div>
             <div>
                <Select 
                    label="Satuan" 
                    value={formData.satuan} 
                    onChange={e => setFormData({...formData, satuan: e.target.value})} 
                    options={[
                        {value: 'kg', label: 'Kilogram (kg)'},
                        {value: 'liter', label: 'Liter'},
                        {value: 'pcs', label: 'Pcs'},
                        {value: 'ikat', label: 'Ikat'},
                        {value: 'box', label: 'Box'},
                        {value: 'karung', label: 'Karung'}
                    ]} 
                />
             </div>
          </div>

          <div>
            <Input label="Harga Total (Rp)" type="number" value={formData.hargaTotal ?? ''} onChange={e => setFormData({...formData, hargaTotal: e.target.value ? parseFloat(e.target.value) : undefined})} />
            {!formData.id && <FormHelperText />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={formData.keterangan || ''}
              onChange={e => setFormData({...formData, keterangan: e.target.value})}
              placeholder="Contoh: Kualitas super, Pembayaran tunai"
            />
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
