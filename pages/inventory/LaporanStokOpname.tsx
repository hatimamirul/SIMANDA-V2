
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Button, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, Select } from '../../components/UIComponents';
import { api } from '../../services/mockService';
import { StokOpname } from '../../types';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const LaporanStokOpnamePage: React.FC = () => {
  const [data, setData] = useState<StokOpname[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<StokOpname | null>(null);
  const [formData, setFormData] = useState<Partial<StokOpname>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = api.subscribeStokOpname((items) => {
        if (search) {
            const lower = search.toLowerCase();
            setData(items.filter(i => i.namaBahan.toLowerCase().includes(lower)));
        } else {
            setData(items);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [search]);

  const handleSubmit = async () => {
    if (!formData.tanggal || !formData.namaBahan || !formData.stokFisik) {
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
        satuan: 'kg', 
        kondisi: 'BAIK', 
        keterangan: '',
        petugas: 'Admin' // Should ideally take logged in user name
    });
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const dataToExport = data.map(item => ({
      'Tanggal': item.tanggal,
      'Nama Bahan': item.namaBahan,
      'Stok Fisik': `${item.stokFisik} ${item.satuan}`,
      'Kondisi': item.kondisi,
      'Keterangan': item.keterangan || '-',
      'Petugas': item.petugas || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok Opname");
    XLSX.writeFile(wb, "Laporan_Stok_Opname.xlsx");
  };

  return (
    <div>
      <Toolbar 
        title="Laporan Stok Opname" 
        onSearch={setSearch} 
        onAdd={openAdd} 
        onExport={handleExport}
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
              { header: 'Nama Bahan', accessor: 'namaBahan' },
              { header: 'Stok Fisik', accessor: (i) => <span className="font-bold">{i.stokFisik} {i.satuan}</span> },
              { 
                  header: 'Kondisi', 
                  accessor: (i) => (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        i.kondisi === 'BAIK' ? 'bg-green-100 text-green-700' : 
                        i.kondisi === 'RUSAK' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
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

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Laporan Stok Opname"
        message={`Apakah anda yakin ingin menghapus data stok opname ${deleteItem?.namaBahan}?`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Stok Opname" : "Catat Stok Opname"}>
        <div className="space-y-4">
          <div>
            <Input label="Tanggal Cek" type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          
          <div>
            <Input label="Nama Bahan" value={formData.namaBahan} onChange={e => setFormData({...formData, namaBahan: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <Input label="Stok Fisik" type="number" value={formData.stokFisik ?? ''} onChange={e => setFormData({...formData, stokFisik: e.target.value ? parseFloat(e.target.value) : undefined})} />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Catatan</label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              value={formData.keterangan || ''}
              onChange={e => setFormData({...formData, keterangan: e.target.value})}
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
