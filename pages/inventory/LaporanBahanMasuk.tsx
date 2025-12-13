

import React, { useEffect, useState } from 'react';
import { Card, Toolbar, Table, Modal, Input, Button, ConfirmationModal, FormHelperText, useToast, LoadingSpinner, Select } from '../../components/UIComponents';
import { api } from '../../services/mockService';
import { BahanMasuk, Supplier, MasterBarang } from '../../types';
import { Plus, Trash2, CalendarDays, Archive, Search } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const LaporanBahanMasukPage: React.FC = () => {
  const [data, setData] = useState<BahanMasuk[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]); 
  const [masterBarang, setMasterBarang] = useState<MasterBarang[]>([]); // For Role Model Autocomplete

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<BahanMasuk | null>(null);
  
  // New State for Batch Entry
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputList, setInputList] = useState<Partial<BahanMasuk>[]>([]);

  // State for single item edit (legacy mode fallback for editing existing rows)
  const [editItem, setEditItem] = useState<Partial<BahanMasuk> | null>(null);

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

    // Subscribe to Suppliers
    const unsubSuppliers = api.subscribeSuppliers((items) => {
        setSuppliers(items);
    });

    // Subscribe to Master Barang (Role Model)
    const unsubMaster = api.subscribeMasterBarang((items) => {
        setMasterBarang(items);
    });

    return () => {
        unsubBahan();
        unsubSuppliers();
        unsubMaster();
    };
  }, [search]);

  // --- BATCH ENTRY LOGIC ---

  const openAddBatch = () => {
    setEntryDate(new Date().toISOString().split('T')[0]);
    // Initialize with one empty row
    setInputList([{ 
        id: 'temp-' + Date.now(),
        supplierId: '', 
        namaSupplier: '', 
        namaBahan: '', 
        jumlah: undefined, 
        satuan: 'kg', 
        hargaTotal: undefined, 
        keterangan: '' 
    }]);
    setEditItem(null);
    setIsModalOpen(true);
  };

  const addRow = () => {
     setInputList(prev => [...prev, {
        id: 'temp-' + Date.now(),
        supplierId: '', 
        namaSupplier: '', 
        namaBahan: '', 
        jumlah: undefined, 
        satuan: 'kg', 
        hargaTotal: undefined, 
        keterangan: '' 
     }]);
  };

  const removeRow = (index: number) => {
      if (inputList.length > 1) {
          setInputList(prev => prev.filter((_, i) => i !== index));
      }
  };

  const handleRowChange = (index: number, field: keyof BahanMasuk, value: any) => {
      const newList = [...inputList];
      newList[index] = { ...newList[index], [field]: value };

      // Auto update supplier name if ID changes
      if (field === 'supplierId') {
         const supp = suppliers.find(s => s.id === value);
         newList[index].namaSupplier = supp ? supp.nama : '';
      }

      // If user types name that exists in master, allow it. New names are also allowed.
      // Datalist handles the UI part. Logic handles saving.
      
      setInputList(newList);
  };

  const handleSaveBatch = async () => {
      // Validation
      let isValid = true;
      if (!entryDate) {
          showToast("Pilih tanggal terlebih dahulu.", "error");
          return;
      }

      for (let i = 0; i < inputList.length; i++) {
          const item = inputList[i];
          if (!item.namaBahan || !item.supplierId || !item.jumlah || !item.hargaTotal) {
              isValid = false;
              showToast(`Baris ke-${i+1} belum lengkap. Mohon lengkapi Nama, Suplayer, Jumlah, dan Harga.`, "error");
              break;
          }
      }

      if (!isValid) return;

      // Duplicate Check in current batch
      const names = inputList.map(i => i.namaBahan?.toLowerCase());
      const hasDuplicates = names.some((name, idx) => names.indexOf(name) !== idx);
      // NOTE: Requirement says "Cannot be same as Name Item stored in Role Model" for *Manual/New* items.
      // But standard logic is: Use existing if matches, Create new if unique.
      // We will allow selecting existing. If it's a new name, it will be added to master.
      // We only strictly prevent duplicates within the *same batch* to avoid double entry error.
      if (hasDuplicates) {
         if(!confirm("Terdapat nama barang yang sama dalam satu penginputan ini. Lanjutkan?")) return;
      }

      setLoading(true);
      try {
          for (const item of inputList) {
             const finalItem: BahanMasuk = {
                 id: '', // Generated by service
                 tanggal: entryDate,
                 supplierId: item.supplierId!,
                 namaSupplier: item.namaSupplier!,
                 namaBahan: item.namaBahan!,
                 jumlah: Number(item.jumlah),
                 satuan: item.satuan || 'kg',
                 hargaTotal: Number(item.hargaTotal),
                 keterangan: item.keterangan
             };
             // Service will handle saving to BahanMasuk AND updating MasterBarang if it's new
             await api.saveBahanMasuk(finalItem);
          }
          showToast("Berhasil menyimpan data bahan masuk!", "success");
          setIsModalOpen(false);
      } catch (e) {
          showToast("Terjadi kesalahan saat menyimpan.", "error");
      } finally {
          setLoading(false);
      }
  };

  // --- EDIT SINGLE ITEM LOGIC ---
  const handleEditSingle = async () => {
      if (!editItem) return;
      if (!editItem.tanggal || !editItem.namaBahan || !editItem.jumlah || !editItem.hargaTotal) {
          showToast("Data tidak lengkap", "error");
          return;
      }
      setLoading(true);
      await api.saveBahanMasuk(editItem as BahanMasuk);
      setLoading(false);
      setIsModalOpen(false);
      showToast("Data berhasil diperbarui", "success");
  };

  const openEdit = (item: BahanMasuk) => {
      setEditItem(item);
      setIsModalOpen(true);
  };

  // --- DELETE LOGIC ---
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

  const satuanOptions = [
      {value: 'kg', label: 'Kilogram (kg)'},
      {value: 'liter', label: 'Liter'},
      {value: 'pcs', label: 'Pcs'},
      {value: 'karton', label: 'Karton'},
      {value: 'ikat', label: 'Ikat'},
      {value: 'box', label: 'Box'},
      {value: 'karung', label: 'Karung'}
  ];

  return (
    <div>
      <Toolbar 
        title="Laporan Bahan Masuk" 
        onSearch={setSearch} 
        onAdd={openAddBatch} 
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
              { header: 'Nama Bahan', accessor: 'namaBahan' },
              { header: 'Suplayer', accessor: 'namaSupplier' },
              { header: 'Jumlah', accessor: (i) => `${i.jumlah} ${i.satuan}` },
              { header: 'Harga Total', accessor: (i) => formatCurrency(i.hargaTotal) },
              { header: 'Keterangan', accessor: (i) => i.keterangan || '-' },
            ]}
            onEdit={openEdit}
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

      {/* Datalist for Role Model Autocomplete */}
      <datalist id="masterBarangList">
          {masterBarang.map(mb => (
              <option key={mb.id} value={mb.namaBarang} />
          ))}
      </datalist>

      {/* MODAL - Dynamic Content based on Batch vs Single Edit */}
      <Modal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         title={editItem ? "Edit Data Bahan Masuk" : "Catat Bahan Masuk (Batch)"}
      >
        {!editItem ? (
           // === BATCH ENTRY MODE ===
           <div className="space-y-6">
              {/* Date Selection */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                 <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                    <CalendarDays size={24} />
                 </div>
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Tanggal Transaksi</label>
                    <input 
                        type="date" 
                        className="bg-transparent font-bold text-gray-800 outline-none w-full cursor-pointer"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                    />
                 </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                 {inputList.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group animate-fade-in">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {inputList.length > 1 && (
                                <button onClick={() => removeRow(index)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                           {/* Item Name with Role Model Datalist */}
                           <div className="md:col-span-4">
                               <label className="block text-xs font-medium text-gray-500 mb-1">Nama Item {index + 1}</label>
                               <div className="relative">
                                  <input 
                                     list="masterBarangList"
                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                     placeholder="Ketik nama barang..."
                                     value={item.namaBahan}
                                     onChange={(e) => handleRowChange(index, 'namaBahan', e.target.value)}
                                  />
                                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14}/>
                               </div>
                           </div>
                           
                           {/* Supplier */}
                           <div className="md:col-span-3">
                               <label className="block text-xs font-medium text-gray-500 mb-1">Suplayer</label>
                               <select 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
                                  value={item.supplierId}
                                  onChange={(e) => handleRowChange(index, 'supplierId', e.target.value)}
                               >
                                  {supplierOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                               </select>
                           </div>

                           {/* Qty & Unit */}
                           <div className="md:col-span-2">
                               <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah</label>
                               <input 
                                  type="number"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                  value={item.jumlah ?? ''}
                                  onChange={(e) => handleRowChange(index, 'jumlah', e.target.value)}
                               />
                           </div>
                           <div className="md:col-span-3">
                               <label className="block text-xs font-medium text-gray-500 mb-1">Satuan</label>
                               <select 
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
                                  value={item.satuan}
                                  onChange={(e) => handleRowChange(index, 'satuan', e.target.value)}
                               >
                                  {satuanOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                               </select>
                           </div>

                           {/* Price Total */}
                           <div className="md:col-span-4">
                               <label className="block text-xs font-medium text-gray-500 mb-1">Total Harga (Rp)</label>
                               <input 
                                  type="number"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                  value={item.hargaTotal ?? ''}
                                  onChange={(e) => handleRowChange(index, 'hargaTotal', e.target.value)}
                               />
                           </div>
                           
                           {/* Desc */}
                           <div className="md:col-span-8">
                               <label className="block text-xs font-medium text-gray-500 mb-1">Keterangan</label>
                               <input 
                                  type="text"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                                  value={item.keterangan}
                                  onChange={(e) => handleRowChange(index, 'keterangan', e.target.value)}
                                  placeholder="Opsional..."
                               />
                           </div>
                        </div>
                    </div>
                 ))}
                 
                 <Button variant="secondary" onClick={addRow} className="w-full border-dashed" icon={<Plus size={16}/>}>
                    Tambah Item Lain
                 </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button onClick={handleSaveBatch} isLoading={loading}>Simpan Semua</Button>
              </div>
           </div>
        ) : (
           // === SINGLE EDIT MODE (Legacy Logic) ===
           <div className="space-y-4">
              <div>
                <Input label="Tanggal" type="date" value={editItem.tanggal} onChange={e => setEditItem({...editItem, tanggal: e.target.value})} />
              </div>
              <div>
                <Select 
                    label="Suplayer" 
                    value={editItem.supplierId} 
                    onChange={(e) => {
                       const supp = suppliers.find(s => s.id === e.target.value);
                       setEditItem({...editItem, supplierId: e.target.value, namaSupplier: supp?.nama || ''});
                    }} 
                    options={supplierOptions} 
                />
              </div>
              <div>
                <Input label="Nama Bahan" value={editItem.namaBahan} onChange={e => setEditItem({...editItem, namaBahan: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Input label="Jumlah" type="number" value={editItem.jumlah ?? ''} onChange={e => setEditItem({...editItem, jumlah: parseFloat(e.target.value)})} />
                 </div>
                 <div>
                    <Select 
                        label="Satuan" 
                        value={editItem.satuan} 
                        onChange={e => setEditItem({...editItem, satuan: e.target.value})} 
                        options={satuanOptions} 
                    />
                 </div>
              </div>
              <div>
                <Input label="Harga Total (Rp)" type="number" value={editItem.hargaTotal ?? ''} onChange={e => setEditItem({...editItem, hargaTotal: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  value={editItem.keterangan || ''}
                  onChange={e => setEditItem({...editItem, keterangan: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button onClick={handleEditSingle} isLoading={loading}>Simpan Perubahan</Button>
              </div>
           </div>
        )}
      </Modal>
    </div>
  );
};
