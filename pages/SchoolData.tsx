
import React, { useEffect, useState, useMemo } from 'react';
import { Card, Toolbar, Table, Modal, Input, Select, Button, ConfirmationModal, FormHelperText, useToast, ExportModal, LoadingSpinner } from '../components/UIComponents';
import { api } from '../services/mockService';
import { PMSekolah, User, Role } from '../types';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const SchoolPage: React.FC = () => {
  const [data, setData] = useState<PMSekolah[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<PMSekolah | null>(null);
  const [formData, setFormData] = useState<Partial<PMSekolah>>({});
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
  
  const canAdd = role !== 'KOORDINATORDIVISI'; 
  const hideActions = role === 'PETUGAS'; 
  const canImport = ['SUPERADMIN', 'KSPPG', 'ADMINSPPG'].includes(role);

  // Realtime Subscriptions
  useEffect(() => {
    setLoading(true);
    const unsubscribe = api.subscribePMs((items) => {
        if (search) {
            const lower = search.toLowerCase();
            setData(items.filter(i => i.nama.toLowerCase().includes(lower) || i.npsn.includes(lower)));
        } else {
            setData(items);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [search]);

  // Calculations for Auto-Fields
  useEffect(() => {
     // Auto Calculate Totals whenever breakdown fields change
     const lBesar = parseInt(String(formData.jmlLakiBesar || 0));
     const lKecil = parseInt(String(formData.jmlLakiKecil || 0));
     const pBesar = parseInt(String(formData.jmlPerempuanBesar || 0));
     const pKecil = parseInt(String(formData.jmlPerempuanKecil || 0));

     const totalLaki = lBesar + lKecil;
     const totalPerempuan = pBesar + pKecil;
     const totalBesar = lBesar + pBesar;
     const totalKecil = lKecil + pKecil;
     const grandTotal = totalBesar + totalKecil;

     setFormData(prev => {
        // Only update if changed to avoid loop
        if (
            prev.jmlLaki !== totalLaki || 
            prev.jmlPerempuan !== totalPerempuan ||
            prev.pmBesar !== totalBesar ||
            prev.pmKecil !== totalKecil ||
            prev.jmlsiswa !== grandTotal
        ) {
            return {
                ...prev,
                jmlLaki: totalLaki,
                jmlPerempuan: totalPerempuan,
                pmBesar: totalBesar,
                pmKecil: totalKecil,
                jmlsiswa: grandTotal
            };
        }
        return prev;
     });
  }, [formData.jmlLakiBesar, formData.jmlLakiKecil, formData.jmlPerempuanBesar, formData.jmlPerempuanKecil]);

  const handleSubmit = async () => {
    if (!formData.nama || !formData.npsn || !formData.jenis || !formData.desa) {
      showToast("Gagal menyimpan! Nama, NPSN, Jenis, dan Desa wajib diisi.", "error");
      return;
    }

    setLoading(true);
    await api.savePM(formData as PMSekolah);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`Data Sekolah ${formData.nama} berhasil disimpan!`, "success");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deletePM(deleteItem.id);
      showToast("Data sekolah berhasil dihapus!", "success");
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
      npsn: '', 
      desa: 'Tales', // Default
      jenis: 'SD/MI', 
      jmlsiswa: 0,
      jmlLaki: 0, jmlPerempuan: 0,
      pmBesar: 0, pmKecil: 0,
      jmlLakiBesar: 0, jmlLakiKecil: 0, 
      jmlPerempuanBesar: 0, jmlPerempuanKecil: 0,
      jmlguru: 0,
      narahubung: '',
      hp: '',
      statusProposal: 'BELUM',
      hariMasuk: "Senin - Jum'at",
      jamPulang: ''
    });
    setIsModalOpen(true);
  };

  const handleImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          showToast("File Excel kosong!", "error");
          return;
        }

        if (confirm(`Ditemukan ${jsonData.length} data sekolah. Lanjutkan impor?`)) {
          setLoading(true);
          let successCount = 0;
          
          for (const row of jsonData as any[]) {
            const npsn = String(row['NPSN'] || '');
            const nama = row['Nama Sekolah'] || '';
            if (!nama) continue;

            const newItem: PMSekolah = {
              id: '',
              nama: nama,
              npsn: npsn,
              desa: row['Desa'] || 'Tales',
              jenis: row['Jenis'] || 'SD/MI',
              jmlsiswa: parseInt(row['Jumlah Siswa'] || '0'),
              jmlLaki: 0, 
              jmlPerempuan: 0,
              pmBesar: 0, 
              pmKecil: 0,
              jmlLakiBesar: 0, jmlLakiKecil: 0,
              jmlPerempuanBesar: 0, jmlPerempuanKecil: 0,
              jmlguru: parseInt(row['Jumlah Guru'] || '0'),
              narahubung: row['Narahubung'] || '',
              hp: row['HP'] || row['No HP'] || '',
              statusProposal: 'BELUM',
              hariMasuk: row['Hari Masuk'] || "Senin - Jum'at",
              jamPulang: row['Jam Pulang'] ? String(row['Jam Pulang']).replace(' WIB', '') : ''
            };
            
            await api.savePM(newItem);
            successCount++;
          }
          setLoading(false);
          showToast(`Berhasil mengimpor ${successCount} data sekolah.`, "success");
        }
      } catch (err) {
        console.error(err);
        showToast("Gagal membaca file Excel.", "error");
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    const dataToExport = data.map(item => {
      // Calculate Status Text for Excel (since we can't use colors easily in raw excel export)
      let statusJam = '';
      if (item.jamPulang) {
          const [h, m] = item.jamPulang.split(':').map(Number);
          const timeVal = h + (m || 0) / 60;
          if (timeVal <= 10.0) statusJam = ' [PULANG AWAL]';
          else if (timeVal <= 12.0) statusJam = ' [PULANG NORMAL]';
          else statusJam = ' [PULANG SIANG]';
      }

      return {
        'Status Proposal': item.statusProposal === 'SUDAH' ? 'Sudah Masuk' : 'Belum Masuk',
        'NPSN': item.npsn,
        'Nama Sekolah': item.nama,
        'Desa': item.desa,
        'Jenis': item.jenis,
        'Hari Masuk': item.hariMasuk || '-',
        'Jam Pulang': item.jamPulang ? `${item.jamPulang} WIB${statusJam}` : '-',
        'Total Siswa': item.jmlsiswa,
        'PM Besar': item.pmBesar,
        'PM Kecil': item.pmKecil,
        'Laki Besar': item.jmlLakiBesar,
        'Laki Kecil': item.jmlLakiKecil,
        'Perem Besar': item.jmlPerempuanBesar,
        'Perem Kecil': item.jmlPerempuanKecil,
        'Guru': item.jmlguru,
        'Narahubung': item.narahubung,
        'HP': item.hp,
        'Catatan': item.catatan || '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Sekolah");
    XLSX.writeFile(wb, "Data_PM_Sekolah.xlsx");
  };

  const desaOptions = [
    "Tales", "Branggahan", "Slumbung", "Seketi", "Ngadiluwih", 
    "Banggle", "Purwokerto", "Badal Pandean", "Badal", "Wonorejo", 
    "Dawung", "Rembang", "Rembang Kepuh", "Banjarejo", "Mangunrejo", "Dukuh"
  ].sort().map(d => ({ value: d, label: d }));

  // Helper for styling
  const getJamPulangStyle = (jam: string) => {
     if (!jam) return 'bg-gray-100 text-gray-500 border-gray-200';
     
     // Parse HH:MM to decimal hour
     const [h, m] = jam.split(':').map(Number);
     const timeVal = h + (m || 0) / 60;

     if (timeVal <= 10.0) return 'bg-emerald-100 text-emerald-700 border-emerald-200'; // Hijau (<= 10:00)
     if (timeVal <= 12.0) return 'bg-blue-100 text-blue-700 border-blue-200'; // Biru (10:01 - 12:00)
     return 'bg-orange-100 text-orange-700 border-orange-200'; // Oranye (> 12:00)
  };
  
  const fmt = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  // Summary Calculation for Footer
  const summaryData = useMemo(() => {
      const sum = {
          jmlsiswa: 0,
          jmlLakiBesar: 0, jmlLakiKecil: 0,
          jmlPerempuanBesar: 0, jmlPerempuanKecil: 0,
          pmBesar: 0, pmKecil: 0,
          jmlguru: 0
      };
      data.forEach(d => {
          sum.jmlsiswa += (d.jmlsiswa || 0);
          sum.jmlLakiBesar += (d.jmlLakiBesar || 0);
          sum.jmlLakiKecil += (d.jmlLakiKecil || 0);
          sum.jmlPerempuanBesar += (d.jmlPerempuanBesar || 0);
          sum.jmlPerempuanKecil += (d.jmlPerempuanKecil || 0);
          sum.pmBesar += (d.pmBesar || 0);
          sum.pmKecil += (d.pmKecil || 0);
          sum.jmlguru += (d.jmlguru || 0);
      });
      
      // Convert to string formatted for display
      return {
          'Siswa': fmt(sum.jmlsiswa),
          'L Besar': fmt(sum.jmlLakiBesar),
          'L Kecil': fmt(sum.jmlLakiKecil),
          'P Besar': fmt(sum.jmlPerempuanBesar),
          'P Kecil': fmt(sum.jmlPerempuanKecil),
          'PM Besar': fmt(sum.pmBesar),
          'PM Kecil': fmt(sum.pmKecil),
          'Guru': fmt(sum.jmlguru)
      };
  }, [data]);

  return (
    <div>
      <Toolbar 
        title="Data PM Sekolah" 
        onSearch={setSearch} 
        onAdd={canAdd ? openAdd : undefined} 
        onExport={() => setIsExportModalOpen(true)}
        onImport={canImport ? handleImport : undefined}
        searchPlaceholder="Cari Nama Sekolah..."
      />
      
      {loading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <Table<PMSekolah> 
            isLoading={loading}
            data={data}
            hideActions={hideActions}
            columns={[
              { header: 'NPSN', accessor: 'npsn' },
              { header: 'Nama Sekolah', accessor: 'nama' },
              { header: 'Desa', accessor: 'desa' },
              { header: 'Total Siswa', accessor: (i) => fmt(i.jmlsiswa) },
              { header: 'PM Besar', accessor: (i) => fmt(i.pmBesar) },
              { header: 'PM Kecil', accessor: (i) => fmt(i.pmKecil) },
              { header: 'Guru', accessor: (i) => fmt(i.jmlguru) },
              { 
                header: 'Status Proposal', 
                accessor: (i) => (
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        i.statusProposal === 'SUDAH' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                        {i.statusProposal || 'BELUM'}
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
        title="DATA PM SEKOLAH"
        data={data}
        hideLogo={true}
        summaryData={summaryData}
        columns={[
            { header: 'Status Proposal', accessor: (i) => i.statusProposal === 'SUDAH' ? 'Sudah Masuk' : 'Belum Masuk' },
            { header: 'NPSN', accessor: 'npsn' },
            { header: 'Nama Sekolah', accessor: 'nama' },
            { header: 'Desa', accessor: 'desa' },
            { header: 'Jenis', accessor: 'jenis' },
            { header: 'Hari Masuk', accessor: (i) => i.hariMasuk || '-' },
            { 
              header: 'Jam Pulang', 
              accessor: (i) => i.jamPulang ? (
                <div className="flex justify-center">
                  <span className={`px-2 py-0.5 rounded font-bold border text-[10px] whitespace-nowrap ${getJamPulangStyle(i.jamPulang)}`}>
                    {i.jamPulang} WIB
                  </span>
                </div>
              ) : '-' 
            },
            { header: 'Siswa', accessor: (i) => fmt(i.jmlsiswa), className: 'text-center' },
            // Colored Columns
            { header: 'L Besar', accessor: (i) => fmt(i.jmlLakiBesar), className: 'col-blue text-center' },
            { header: 'L Kecil', accessor: (i) => fmt(i.jmlLakiKecil), className: 'col-pink text-center' },
            { header: 'P Besar', accessor: (i) => fmt(i.jmlPerempuanBesar), className: 'col-blue text-center' },
            { header: 'P Kecil', accessor: (i) => fmt(i.jmlPerempuanKecil), className: 'col-pink text-center' },
            
            { header: 'PM Besar', accessor: (i) => fmt(i.pmBesar), className: 'col-blue text-center' },
            { header: 'PM Kecil', accessor: (i) => fmt(i.pmKecil), className: 'col-pink text-center' },
            { header: 'Guru', accessor: (i) => fmt(i.jmlguru), className: 'col-guru text-center' },
            
            { header: 'Narahubung', accessor: 'narahubung' },
            { header: 'No HP', accessor: 'hp' },
            { header: 'Catatan', accessor: (i) => i.catatan || '-' }
        ]}
        onExportExcel={handleExportExcel}
      />

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus Data Sekolah"
        message={`Apakah anda yakin ingin menghapus data sekolah ${deleteItem?.nama}?`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Data Sekolah" : "Tambah Data Sekolah"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <Input label="NPSN" value={formData.npsn} onChange={e => setFormData({...formData, npsn: e.target.value})} />
              </div>
              <div>
                  <Input label="Nama Sekolah" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <Select 
                    label="Desa" 
                    value={formData.desa} 
                    onChange={e => setFormData({...formData, desa: e.target.value})} 
                    options={desaOptions}
                  />
              </div>
              <div>
                  <Select 
                    label="Jenjang Pendidikan" 
                    value={formData.jenis} 
                    onChange={e => setFormData({...formData, jenis: e.target.value as any})} 
                    options={[
                        {value: 'KB/PAUD', label: 'KB/PAUD'},
                        {value: 'TK', label: 'TK'},
                        {value: 'SD/MI', label: 'SD/MI'},
                        {value: 'SMP/MTS', label: 'SMP/MTS'},
                        {value: 'SMA/MA', label: 'SMA/MA'},
                    ]}
                  />
              </div>
          </div>

          <div className="border-t border-b border-gray-100 py-4">
              <h4 className="font-bold text-gray-700 text-sm mb-3">Rincian Siswa</h4>
              
              <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="bg-blue-50 p-2 rounded-lg">
                      <p className="text-[10px] uppercase font-bold text-blue-800 mb-2 text-center">Laki-Laki</p>
                      <div className="flex gap-2">
                          <Input 
                            label="Besar" 
                            type="number" 
                            value={formData.jmlLakiBesar ?? ''} 
                            onChange={e => setFormData({...formData, jmlLakiBesar: parseInt(e.target.value) || 0})} 
                            className="text-center"
                          />
                          <Input 
                            label="Kecil" 
                            type="number" 
                            value={formData.jmlLakiKecil ?? ''} 
                            onChange={e => setFormData({...formData, jmlLakiKecil: parseInt(e.target.value) || 0})} 
                            className="text-center"
                          />
                      </div>
                  </div>
                  <div className="bg-pink-50 p-2 rounded-lg">
                      <p className="text-[10px] uppercase font-bold text-pink-800 mb-2 text-center">Perempuan</p>
                      <div className="flex gap-2">
                          <Input 
                            label="Besar" 
                            type="number" 
                            value={formData.jmlPerempuanBesar ?? ''} 
                            onChange={e => setFormData({...formData, jmlPerempuanBesar: parseInt(e.target.value) || 0})} 
                            className="text-center"
                          />
                          <Input 
                            label="Kecil" 
                            type="number" 
                            value={formData.jmlPerempuanKecil ?? ''} 
                            onChange={e => setFormData({...formData, jmlPerempuanKecil: parseInt(e.target.value) || 0})} 
                            className="text-center"
                          />
                      </div>
                  </div>
              </div>
              
              <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg text-xs font-bold text-gray-600">
                   <span>Total PM Besar: {formData.pmBesar}</span>
                   <span>Total PM Kecil: {formData.pmKecil}</span>
                   <span className="text-primary text-sm">TOTAL SISWA: {formData.jmlsiswa}</span>
              </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
              <div>
                  <Input label="Jumlah Guru" type="number" value={formData.jmlguru ?? ''} onChange={e => setFormData({...formData, jmlguru: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                  <Input label="Narahubung" value={formData.narahubung} onChange={e => setFormData({...formData, narahubung: e.target.value})} />
              </div>
              <div>
                  <Input label="No HP" value={formData.hp} onChange={e => setFormData({...formData, hp: e.target.value})} />
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <Input label="Hari Masuk" value={formData.hariMasuk || ''} onChange={e => setFormData({...formData, hariMasuk: e.target.value})} placeholder="Contoh: Senin - Sabtu" />
              </div>
              <div>
                  <Input label="Jam Pulang (WIB)" type="time" value={formData.jamPulang || ''} onChange={e => setFormData({...formData, jamPulang: e.target.value})} />
              </div>
          </div>

          <div>
             <label className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                    type="checkbox" 
                    className="w-4 h-4 text-primary rounded"
                    checked={formData.statusProposal === 'SUDAH'}
                    onChange={(e) => setFormData({...formData, statusProposal: e.target.checked ? 'SUDAH' : 'BELUM'})}
                />
                Proposal Sudah Diterima
             </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
            <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                value={formData.catatan || ''}
                onChange={e => setFormData({...formData, catatan: e.target.value})}
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
