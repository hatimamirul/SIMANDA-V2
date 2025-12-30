
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Button, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, ExportModal } from '../../components/UIComponents';
import { api } from '../../services/mockService';
import { Supplier } from '../../types';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const DataSupplierPage: React.FC = () => {
  const [data, setData] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = api.subscribeSuppliers((items) => {
        if (search) {
            const lower = search.toLowerCase();
            setData(items.filter(i => i.nama.toLowerCase().includes(lower)));
        } else {
            setData(items);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [search]);

  const handleSubmit = async () => {
    if (!formData.nama || !formData.alamat || !formData.hp) {
      showToast("Harap isi Nama, Alamat, dan No HP Suplayer.", "error");
      return;
    }

    setLoading(true);
    await api.saveSupplier(formData as Supplier);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Data Suplayer ${formData.nama} berhasil disimpan!`, "success");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteSupplier(deleteItem.id);
      showToast("Data Suplayer berhasil dihapus!", "success");
      setDeleteItem(null);
    } catch (e) {
      showToast('Gagal menghapus data.', "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({ nama: '', alamat: '', hp: '', keterangan: '' });
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    const dataToExport = data.map(item => ({
      'Nama Suplayer': item.nama,
      'Alamat': item.alamat,
      'No HP': item.hp,
      'Keterangan': item.keterangan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Suplayer");
    XLSX.writeFile(wb, "Data_Suplayer.xlsx");
  };

  return (
    <div>
      <Toolbar 
        title="Data Suplayer" 
        onSearch={setSearch} 
        onAdd={openAdd} 
        onExport={() => setIsExportModalOpen(true)}
        searchPlaceholder="Cari Nama Suplayer..."
      />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <Table<Supplier> 
            isLoading={loading}
            data={data}
            columns={[
              { header: 'Nama Suplayer', accessor: 'nama' },
              { header: 'Alamat', accessor: 'alamat' },
              { header: 'No HP', accessor: 'hp' },
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
        title="Data Suplayer"
        data={data}
        columns={[
            { header: 'Nama Suplayer', accessor: 'nama' },
            { header: 'Alamat', accessor: 'alamat' },
            { header: 'No HP', accessor: 'hp' },
            { header: 'Keterangan', accessor: (i) => i.keterangan || '-' }
        ]}
        onExportExcel={handleExportExcel}
      />

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Data Suplayer"
        message={`Apakah anda yakin ingin menghapus suplayer ${deleteItem?.nama}?`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Suplayer" : "Tambah Suplayer"}>
        <div className="space-y-4">
          <div>
            <Input label="Nama Suplayer" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          <div>
            <Input label="Alamat" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          <div>
            <Input label="No HP" value={formData.hp} onChange={e => setFormData({...formData, hp: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
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
