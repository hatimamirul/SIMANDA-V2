
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Select, Button, ConfirmationModal, FormHelperText, useToast } from '../components/UIComponents';
import { api } from '../services/mockService';
import { KaderB3, PMB3, User } from '../types';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const KaderB3Page: React.FC = () => {
  const [data, setData] = useState<KaderB3[]>([]);
  const [pmB3Data, setPmB3Data] = useState<PMB3[]>([]); // Store all PM B3 data to calculate counts
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<KaderB3 | null>(null);
  const [formData, setFormData] = useState<Partial<KaderB3>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();

  // List of Desa sorted alphabetically (Same as B3Page)
  const desaOptionsRaw = [
    "Tales", "Branggahan", "Slumbung", "Seketi", "Ngadiluwih", 
    "Banggle", "Purwokerto", "Badal Pandean", "Badal", "Wonorejo", 
    "Dawung", "Rembang", "Rembang Kepuh", "Banjarejo", "Mangunrejo", "Dukuh"
  ].sort();

  const desaOptions = desaOptionsRaw.map(d => ({ value: d, label: d }));

  // Get current user to check role
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();
  const isPetugas = currentUser?.jabatan === 'PETUGAS';

  // Realtime Subscriptions
  useEffect(() => {
    setLoading(true);
    
    // Subscribe Kader
    const unsubKader = api.subscribeKaderB3((items) => {
        if (search) {
            const lower = search.toLowerCase();
            setData(items.filter(i => i.nama.toLowerCase().includes(lower) || i.nik.includes(lower)));
        } else {
            setData(items);
        }
    });

    // Subscribe B3 (for auto count)
    const unsubB3 = api.subscribeB3s((items) => {
        setPmB3Data(items);
    });

    setLoading(false);

    return () => {
        unsubKader();
        unsubB3();
    };
  }, [search]);

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.nik ||
      !formData.nama ||
      !formData.alamat ||
      !formData.desa ||
      formData.jumlahPaket === undefined ||
      formData.honorHarian === undefined
    ) {
      showToast("Gagal menyimpan! Harap isi semua kolom dengan lengkap.", "error");
      return;
    }

    setLoading(true);
    await api.saveKaderB3(formData as KaderB3);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Kader B3 ${formData.nama} berhasil disimpan!`, "success");
    // loadData handled by subscription
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteKaderB3(deleteItem.id);
      showToast("Data Kader berhasil dihapus!", "success");
      setDeleteItem(null);
    } catch (e) {
      showToast('Gagal menghapus data.', "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    // Default Desa
    const defaultDesa = desaOptionsRaw[0];
    // Calculate packet count for default desa
    const packetCount = pmB3Data.filter(p => p.desa === defaultDesa).length;

    setFormData({ 
      nik: '',
      nama: '',
      alamat: '',
      desa: defaultDesa,
      jumlahPaket: packetCount,
      honorHarian: undefined
    });
    setIsModalOpen(true);
  };

  const handleDesaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDesa = e.target.value;
    // Auto calculate count based on selected desa
    const packetCount = pmB3Data.filter(p => p.desa === selectedDesa).length;
    
    setFormData(prev => ({
      ...prev,
      desa: selectedDesa,
      jumlahPaket: packetCount
    }));
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const handleExport = () => {
    const dataToExport = data.map(item => ({
      'NIK': item.nik,
      'Nama Kader': item.nama,
      'Alamat': item.alamat,
      'Desa': item.desa,
      'Jumlah Paket': item.jumlahPaket,
      'Honor/Paket': item.honorHarian
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Kader B3");
    XLSX.writeFile(wb, "Data_Kader_B3.xlsx");
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

        if (confirm(`Ditemukan ${jsonData.length} data. Apakah anda ingin mengimpornya?`)) {
          setLoading(true);
          let successCount = 0;
          
          for (const row of jsonData as any[]) {
            const desa = row['Desa'] || '';
            const packetCount = pmB3Data.filter(p => p.desa === desa).length;

            const newItem: KaderB3 = {
              id: '',
              nik: String(row['NIK'] || ''),
              nama: row['Nama Kader'] || row['Nama'] || '',
              alamat: row['Alamat'] || '',
              desa: desa,
              jumlahPaket: packetCount,
              honorHarian: parseInt(row['Honor/Paket'] || row['Honor/Hari'] || '0')
            };

            if (newItem.nik && newItem.nama) {
              await api.saveKaderB3(newItem);
              successCount++;
            }
          }
          
          setLoading(false);
          showToast(`Berhasil mengimpor ${successCount} data Kader B3.`, "success");
        }
      } catch (err) {
        console.error(err);
        showToast("Gagal membaca file Excel. Pastikan format benar.", "error");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <Toolbar 
        title="Data Kader B3" 
        onSearch={setSearch} 
        onAdd={openAdd} 
        onExport={handleExport}
        onImport={isPetugas ? undefined : handleImport}
        searchPlaceholder="Cari Nama atau NIK..."
      />
      <Card>
        <Table<KaderB3> 
          isLoading={loading}
          data={data}
          hideActions={isPetugas}
          columns={[
            { header: 'NIK', accessor: 'nik' },
            { header: 'Nama Kader B3', accessor: 'nama' },
            { header: 'Alamat', accessor: 'alamat' },
            { header: 'Desa', accessor: 'desa' },
            { header: 'Jumlah Paket', accessor: 'jumlahPaket' },
            { header: 'Honor/Paket', accessor: (i) => formatCurrency(i.honorHarian) },
          ]}
          onEdit={(i) => { 
            // When editing, re-calculate packet count to ensure it's up to date
            const currentCount = pmB3Data.filter(p => p.desa === i.desa).length;
            setFormData({ ...i, jumlahPaket: currentCount }); 
            setIsModalOpen(true); 
          }}
          onDelete={setDeleteItem}
        />
      </Card>

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Data Kader"
        message={`Apakah anda yakin ingin menghapus Kader ${deleteItem?.nama}?`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Kader B3" : "Tambah Kader B3"}>
        <div className="space-y-4">
          <div>
            <Input label="NIK" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          <div>
            <Input label="Nama Kader B3" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          <div>
            <Input label="Alamat" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>
          
          <div>
            <Select 
              label="Desa" 
              value={formData.desa} 
              onChange={handleDesaChange} 
              options={desaOptions}
            />
            {!formData.id && <FormHelperText />}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input 
                label="Jumlah Paket" 
                type="number" 
                value={formData.jumlahPaket ?? ''} 
                disabled
                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                title="Otomatis dihitung dari jumlah PM di Desa yang sama"
              />
              {!formData.id && <FormHelperText />}
            </div>
            <div>
              <Input 
                label="Honor/Paket (Rp)" 
                type="number" 
                value={formData.honorHarian ?? ''} 
                onChange={e => setFormData({...formData, honorHarian: e.target.value ? parseInt(e.target.value) : undefined})} 
              />
              {!formData.id && <FormHelperText />}
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
