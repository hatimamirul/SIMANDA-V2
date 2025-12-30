
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Select, Button, ConfirmationModal, FormHelperText, useToast, ExportModal, LoadingSpinner } from '../components/UIComponents';
import { api } from '../services/mockService';
import { AlergiSiswa, PMSekolah, User, Role } from '../types';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const AlergiPage: React.FC = () => {
  const [data, setData] = useState<AlergiSiswa[]>([]);
  const [schools, setSchools] = useState<PMSekolah[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<AlergiSiswa | null>(null);
  const [formData, setFormData] = useState<Partial<AlergiSiswa>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { showToast } = useToast();

  // Get current user to check role
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();
  const role = currentUser?.jabatan as Role;
  
  // Reuse permissions from School Data
  const canAdd = role !== 'KOORDINATORDIVISI'; 
  const hideActions = role === 'PETUGAS'; 
  const canImport = ['SUPERADMIN', 'KSPPG', 'ADMINSPPG'].includes(role);

  // Realtime Subscriptions
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to Alergi Data
    const unsubAlergi = api.subscribeAlergi((items) => {
        if (search) {
            const lower = search.toLowerCase();
            setData(items.filter(i => 
              i.namaSiswa.toLowerCase().includes(lower) || 
              i.namaSekolah.toLowerCase().includes(lower)
            ));
        } else {
            setData(items);
        }
    });

    // Subscribe to Schools (for dropdown)
    const unsubSchools = api.subscribePMs((items) => {
        setSchools(items);
    });

    setLoading(false);

    return () => {
        unsubAlergi();
        unsubSchools();
    };
  }, [search]);

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.sekolahId || 
      !formData.namaSiswa || 
      !formData.keterangan
    ) {
      showToast("Gagal menyimpan! Harap isi semua kolom dengan lengkap.", "error");
      return;
    }

    setLoading(true);
    await api.saveAlergi(formData as AlergiSiswa);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Data Alergi ${formData.namaSiswa} berhasil disimpan!`, "success");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteAlergi(deleteItem.id);
      showToast("Data alergi berhasil dihapus!", "success");
      setDeleteItem(null);
    } catch (e) {
      showToast('Gagal menghapus data.', "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({ 
      sekolahId: '',
      namaSekolah: '',
      namaSiswa: '',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  // Handle School selection to auto-populate School Name
  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedSchool = schools.find(s => s.id === selectedId);
    
    if (selectedSchool) {
      setFormData(prev => ({
        ...prev,
        sekolahId: selectedSchool.id,
        namaSekolah: selectedSchool.nama
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sekolahId: '',
        namaSekolah: ''
      }));
    }
  };

  const handleExportExcel = () => {
    const dataToExport = data.map(item => ({
      'Nama Sekolah': item.namaSekolah,
      'Nama Siswa': item.namaSiswa,
      'Keterangan Alergi': item.keterangan
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Alergi");
    XLSX.writeFile(wb, "Data_Alergi_Siswa.xlsx");
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
            const schoolName = row['Nama Sekolah'] || '';
            // Try to find matching school in DB
            const matchedSchool = schools.find(s => s.nama.toLowerCase() === schoolName.toLowerCase());

            // If school not found, we skip or mark as unknown. 
            // Better to skip to maintain integrity or default to first school if strictly required.
            // Here we only import if school is found to ensure link.
            if (!matchedSchool) continue;

            const newItem: AlergiSiswa = {
              id: '',
              sekolahId: matchedSchool.id,
              namaSekolah: matchedSchool.nama,
              namaSiswa: row['Nama Siswa'] || '',
              keterangan: row['Keterangan Alergi'] || row['Keterangan'] || ''
            };

            if (newItem.namaSiswa && newItem.keterangan) {
              await api.saveAlergi(newItem);
              successCount++;
            }
          }
          
          setLoading(false);
          showToast(`Berhasil mengimpor ${successCount} data Alergi.`, "success");
        }
      } catch (err) {
        console.error(err);
        showToast("Gagal membaca file Excel. Pastikan format benar.", "error");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const schoolOptions = [
    { value: '', label: '-- Pilih Sekolah --' },
    ...schools.map(s => ({ value: s.id, label: s.nama }))
  ];

  return (
    <div>
      <Toolbar 
        title="Data Alergi Siswa" 
        onSearch={setSearch} 
        onAdd={canAdd ? openAdd : undefined} 
        onExport={() => setIsExportModalOpen(true)}
        onImport={canImport ? handleImport : undefined}
        searchPlaceholder="Cari Sekolah atau Siswa..."
      />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <Table<AlergiSiswa> 
            isLoading={loading}
            data={data}
            hideActions={hideActions}
            columns={[
              { header: 'Nama Sekolah', accessor: 'namaSekolah' },
              { header: 'Nama Siswa', accessor: 'namaSiswa' },
              { 
                header: 'Keterangan Alergi', 
                accessor: (i) => (
                  <span className="text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full border border-red-100 text-xs">
                    {i.keterangan}
                  </span>
                ) 
              },
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
        title="Data Alergi Siswa"
        data={data}
        columns={[
            { header: 'Nama Sekolah', accessor: 'namaSekolah' },
            { header: 'Nama Siswa', accessor: 'namaSiswa' },
            { header: 'Keterangan Alergi', accessor: 'keterangan' }
        ]}
        onExportExcel={handleExportExcel}
      />

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Data Alergi"
        message={`Apakah anda yakin ingin menghapus data alergi untuk siswa ${deleteItem?.namaSiswa}?`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Data Alergi" : "Tambah Data Alergi"}>
        <div className="space-y-4">
          <div>
            <Select 
              label="Nama Sekolah" 
              value={formData.sekolahId} 
              onChange={handleSchoolChange} 
              options={schoolOptions}
            />
            {!formData.id && <FormHelperText />}
          </div>
          
          <div>
            <Input label="Nama Siswa" value={formData.namaSiswa} onChange={e => setFormData({...formData, namaSiswa: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Alergi</label>
             <textarea 
               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none min-h-[100px]"
               value={formData.keterangan || ''}
               onChange={e => setFormData({...formData, keterangan: e.target.value})}
               placeholder="Contoh: Alergi Kacang, Alergi Udang, Tidak boleh pedas..."
             />
             {!formData.id && <FormHelperText />}
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

