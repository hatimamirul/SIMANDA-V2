
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, Toolbar, Table, Modal, Input, Select, Button, ConfirmationModal, PreviewModal, useToast } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Karyawan, User, Role } from '../types';
import { Eye, FileText, Download } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const KaryawanPage: React.FC = () => {
  // Get current user to check role for access control
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();
  
  const role = currentUser?.jabatan as Role;
  const { showToast } = useToast();

  // Permission Logic
  const canAdd = role === 'SUPERADMIN' || role === 'KSPPG';
  const canDelete = role === 'SUPERADMIN' || role === 'KSPPG';
  const canEditHonor = role === 'SUPERADMIN' || role === 'KSPPG';
  
  if (role === 'PETUGAS' || role === 'KOORDINATORDIVISI') {
    return <Navigate to="/" replace />;
  }

  const [data, setData] = useState<Karyawan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Karyawan | null>(null);
  const [formData, setFormData] = useState<Partial<Karyawan>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // Switch to Realtime Subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = api.subscribeKaryawan((items) => {
      if (search) {
        const lower = search.toLowerCase();
        setData(items.filter(i => i.nama.toLowerCase().includes(lower) || i.nik.includes(lower)));
      } else {
        setData(items);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [search]);

  const handleSubmit = async () => {
    if (
      !formData.nik || 
      !formData.nama || 
      !formData.divisi || 
      !formData.hp || 
      formData.honorHarian === undefined || 
      !formData.noBpjs || 
      !formData.bank || 
      !formData.rekening
    ) {
      showToast("Gagal menyimpan! Mohon lengkapi semua data karyawan dan revisi kembali.", "error");
      return;
    }

    setLoading(true);
    await api.saveKaryawan(formData as Karyawan);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Data Karyawan ${formData.nama} berhasil disimpan!`, "success");
    // No need to loadData, subscription handles it
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteKaryawan(deleteItem.id);
      showToast("Data karyawan berhasil dihapus!", "success");
      setDeleteItem(null);
    } catch (e) {
      showToast("Gagal menghapus data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({ 
      nik: '', 
      nama: '', 
      divisi: 'Asisten Lapangan',
      hp: '',
      honorHarian: undefined,
      noBpjs: '',
      bank: 'BANK BRI',
      rekening: '',
      sertifikat: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: Karyawan) => {
    setFormData(item);
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
        setFormData(prev => ({ ...prev, sertifikat: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const handleExport = () => {
    const dataToExport = data.map(item => ({
      'NIK': item.nik,
      'Nama Karyawan': item.nama,
      'Divisi': item.divisi,
      'No HP': item.hp,
      'Honor/Hari': item.honorHarian,
      'No BPJS': item.noBpjs,
      'Bank': item.bank,
      'No Rekening': item.rekening
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Karyawan");
    XLSX.writeFile(wb, "Data_Karyawan.xlsx");
  };

  const divisionOptions = [
    { value: 'Asisten Lapangan', label: 'Asisten Lapangan' },
    { value: 'Persiapan', label: 'Persiapan' },
    { value: 'Produksi (Masak)', label: 'Produksi (Masak)' },
    { value: 'Pemorsian', label: 'Pemorsian' },
    { value: 'Distribusi', label: 'Distribusi' },
    { value: 'Kebersihan', label: 'Kebersihan' },
    { value: 'Keamanan', label: 'Keamanan' },
  ];

  const bankOptions = [
    { value: 'BANK BRI', label: 'BANK BRI' },
    { value: 'BANK MANDIRI', label: 'BANK MANDIRI' },
    { value: 'BANK BNI', label: 'BANK BNI' },
  ];

  return (
    <div>
      <Toolbar 
        title="Data Karyawan" 
        onSearch={setSearch} 
        onAdd={canAdd ? openAdd : undefined} 
        onExport={handleExport}
      />
      <Card>
        <Table<Karyawan> 
          isLoading={loading}
          data={data}
          hideActions={false}
          columns={[
            { header: 'NIK', accessor: 'nik' },
            { header: 'Nama', accessor: 'nama' },
            { header: 'Divisi', accessor: (i) => <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-medium">{i.divisi}</span> },
            { header: 'No HP', accessor: 'hp' },
            { header: 'Honor/Hari', accessor: (i) => formatCurrency(i.honorHarian) },
            { header: 'BPJS', accessor: 'noBpjs' },
            { header: 'Bank', accessor: 'bank' },
            { header: 'Rekening', accessor: 'rekening' },
            { 
              header: 'SERTIFIKAT PENUNJANG', 
              accessor: (i) => i.sertifikat ? (
                <button 
                  type="button"
                  onClick={() => handlePreview(i.sertifikat!)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium hover:bg-green-100 transition-colors"
                >
                  <Eye size={12} /> Lihat
                </button>
              ) : <span className="text-gray-400 text-xs italic">Tidak ada</span>
            },
          ]}
          onEdit={openEdit}
          onDelete={canDelete ? setDeleteItem : (() => {})} 
        />
      </Card>

      {canDelete && (
        <ConfirmationModal 
          isOpen={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          title="Hapus Karyawan"
          message={`Apakah anda yakin ingin menghapus data karyawan ${deleteItem?.nama}?`}
          isLoading={loading}
        />
      )}

      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} src={previewSrc} title="Preview Sertifikat" />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Karyawan" : "Tambah Karyawan"}>
        <div className="space-y-4">
          <div>
            <Input label="NIK" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
          </div>
          <div>
            <Input label="Nama" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select 
                label="Divisi / Role Model"
                value={formData.divisi}
                onChange={e => setFormData({...formData, divisi: e.target.value})}
                options={divisionOptions}
              />
            </div>
            <div>
              <Input label="No HP" value={formData.hp} onChange={e => setFormData({...formData, hp: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input 
                label="Honor/Hari (Rp)" 
                type="number" 
                value={formData.honorHarian ?? ''} 
                onChange={e => setFormData({...formData, honorHarian: e.target.value ? parseInt(e.target.value) : undefined})} 
                disabled={!canEditHonor} // Restricted
                className={!canEditHonor ? 'bg-gray-100 cursor-not-allowed' : ''}
              />
            </div>
            <div>
              <Input label="No BPJS" value={formData.noBpjs} onChange={e => setFormData({...formData, noBpjs: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select 
                label="Bank"
                value={formData.bank}
                onChange={e => setFormData({...formData, bank: e.target.value as any})}
                options={bankOptions}
              />
            </div>
            <div>
              <Input label="No Rekening" value={formData.rekening} onChange={e => setFormData({...formData, rekening: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sertifikat Penunjang</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
               <div className="space-y-1 text-center">
                {formData.sertifikat ? (
                  <div className="flex flex-col items-center">
                    <FileText className="mx-auto h-12 w-12 text-green-500" />
                    <p className="text-sm text-green-600 font-medium">File dipilih</p>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, sertifikat: ''})}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <>
                    <Download className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload-sertif" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                        <span>Upload file</span>
                        <input id="file-upload-sertif" name="file-upload-sertif" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf" />
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>
             <p className="text-xs text-amber-600 mt-2 italic">
              apabila sertifikat lebih dari satu, silahkan jadikan satu file pdf terlebih dahulu
            </p>
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
