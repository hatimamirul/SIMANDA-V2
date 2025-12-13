
import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Select, Button, ConfirmationModal, FormHelperText, useToast, ExportModal } from '../components/UIComponents';
import { api } from '../services/mockService';
import { PICSekolah, PMSekolah, User } from '../types';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const PICSekolahPage: React.FC = () => {
  const [data, setData] = useState<PICSekolah[]>([]);
  const [schools, setSchools] = useState<PMSekolah[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<PICSekolah | null>(null);
  const [formData, setFormData] = useState<Partial<PICSekolah>>({});
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
  const isPetugas = currentUser?.jabatan === 'PETUGAS';

  // Realtime Subscriptions
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to PICs
    const unsubPIC = api.subscribePICSekolah((items) => {
        if (search) {
            const lower = search.toLowerCase();
            setData(items.filter(i => i.namaPic.toLowerCase().includes(lower) || i.namaSekolah.toLowerCase().includes(lower)));
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
        unsubPIC();
        unsubSchools();
    };
  }, [search]);

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.sekolahId || 
      !formData.namaPic || 
      !formData.jabatan || 
      formData.jmlSiswa === undefined || 
      formData.honorHarian === undefined
    ) {
      showToast("Gagal menyimpan! Harap isi semua kolom dengan lengkap.", "error");
      return;
    }

    setLoading(true);
    await api.savePICSekolah(formData as PICSekolah);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`PIC Sekolah ${formData.namaPic} berhasil disimpan!`, "success");
    // loadData handled by subscription
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deletePICSekolah(deleteItem.id);
      showToast("Data PIC berhasil dihapus!", "success");
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
      namaPic: '',
      jabatan: 'ASN/P3K',
      jmlSiswa: 0,
      honorHarian: undefined
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Handle School selection to auto-populate Student Count and School Name
  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedSchool = schools.find(s => s.id === selectedId);
    
    if (selectedSchool) {
      setFormData(prev => ({
        ...prev,
        sekolahId: selectedSchool.id,
        namaSekolah: selectedSchool.nama,
        jmlSiswa: selectedSchool.jmlsiswa
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sekolahId: '',
        namaSekolah: '',
        jmlSiswa: 0
      }));
    }
  };

  const handleExportExcel = () => {
    const dataToExport = data.map(item => ({
      'Nama Sekolah': item.namaSekolah,
      'PIC Sekolah': item.namaPic,
      'Jabatan': item.jabatan,
      'Jumlah Siswa': item.jmlSiswa,
      'Honor/Hari': item.honorHarian
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PIC Sekolah");
    XLSX.writeFile(wb, "Data_PIC_Sekolah.xlsx");
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

            const newItem: PICSekolah = {
              id: '',
              sekolahId: matchedSchool ? matchedSchool.id : 'unknown',
              namaSekolah: schoolName,
              namaPic: row['PIC Sekolah'] || '',
              jabatan: row['Jabatan'] || 'ASN/P3K',
              jmlSiswa: parseInt(row['Jumlah Siswa'] || '0'),
              honorHarian: parseInt(row['Honor/Hari'] || '0')
            };

            if (newItem.namaSekolah && newItem.namaPic) {
              await api.savePICSekolah(newItem);
              successCount++;
            }
          }
          
          setLoading(false);
          showToast(`Berhasil mengimpor ${successCount} data PIC Sekolah.`, "success");
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
        title="Data PIC Sekolah" 
        onSearch={setSearch} 
        onAdd={openAdd} 
        onExport={() => setIsExportModalOpen(true)}
        onImport={isPetugas ? undefined : handleImport}
        searchPlaceholder="Cari Sekolah atau PIC..."
      />
      <Card>
        <Table<PICSekolah> 
          isLoading={loading}
          data={data}
          hideActions={isPetugas}
          columns={[
            { header: 'Nama Sekolah', accessor: 'namaSekolah' },
            { header: 'PIC Sekolah', accessor: 'namaPic' },
            { 
              header: 'Jabatan', 
              accessor: (i) => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${i.jabatan === 'ASN/P3K' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                  {i.jabatan}
                </span>
              ) 
            },
            { header: 'Jumlah Siswa', accessor: 'jmlSiswa' },
            { header: 'Honor/Hari', accessor: (i) => formatCurrency(i.honorHarian) },
          ]}
          onEdit={(i) => { setFormData(i); setIsModalOpen(true); }}
          onDelete={setDeleteItem}
        />
      </Card>

      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Data PIC Sekolah"
        data={data}
        columns={[
            { header: 'Nama Sekolah', accessor: 'namaSekolah' },
            { header: 'PIC Sekolah', accessor: 'namaPic' },
            { header: 'Jabatan', accessor: 'jabatan' },
            { header: 'Jumlah Siswa', accessor: 'jmlSiswa' },
            { header: 'Honor/Hari', accessor: (i) => formatCurrency(i.honorHarian) }
        ]}
        onExportExcel={handleExportExcel}
      />

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Data PIC"
        message={`Apakah anda yakin ingin menghapus PIC ${deleteItem?.namaPic} dari ${deleteItem?.namaSekolah}?`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit PIC Sekolah" : "Tambah PIC Sekolah"}>
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
            <Input label="Nama PIC Sekolah" value={formData.namaPic} onChange={e => setFormData({...formData, namaPic: e.target.value})} />
            {!formData.id && <FormHelperText />}
          </div>

          <div>
            <Select 
              label="Jabatan" 
              value={formData.jabatan} 
              onChange={e => setFormData({...formData, jabatan: e.target.value as any})} 
              options={[
                { value: 'ASN/P3K', label: 'ASN/P3K' },
                { value: 'NON ASN/P3K', label: 'NON ASN/P3K' }
              ]} 
            />
            {!formData.id && <FormHelperText />}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input 
                label="Jumlah Siswa" 
                type="number" 
                value={formData.jmlSiswa ?? ''} 
                disabled
                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                title="Otomatis dari Data PM Sekolah"
              />
              {!formData.id && <FormHelperText />}
            </div>
            <div>
              <Input 
                label="Honor/Hari (Rp)" 
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
