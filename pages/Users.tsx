
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, Toolbar, Table, Modal, Input, Select, Button, ConfirmationModal, useToast } from '../components/UIComponents';
import { api } from '../services/mockService';
import { User, Role } from '../types';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const UsersPage: React.FC = () => {
  // Get current user to check role for access control
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();

  const { showToast } = useToast();

  // Only SUPERADMIN can access this page
  if (!currentUser || currentUser.jabatan !== 'SUPERADMIN') {
    return <Navigate to="/" replace />;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Realtime subscription to users list
    const unsubscribe = api.subscribeUsers((data) => {
      if (!search) {
        setUsers(data);
      } else {
        const lowerQ = search.toLowerCase();
        setUsers(data.filter(i => i.nama.toLowerCase().includes(lowerQ) || i.username.toLowerCase().includes(lowerQ)));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [search]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.nama || !formData.email || !formData.username || !formData.password || !formData.jabatan) {
      showToast("Gagal menyimpan! Mohon lengkapi semua data user dan revisi kembali.", "error");
      return;
    }
    setLoading(true);
    await api.saveUser(formData as User);
    setLoading(false);
    setIsModalOpen(false);
    showToast(`User ${formData.nama} berhasil disimpan!`, "success");
    // No need to call loadData(), subscription handles it
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoading(true);
    try {
      await api.deleteUser(deleteItem.id);
      showToast("User berhasil dihapus!", "success");
      setDeleteItem(null);
    } catch (e) {
      showToast("Gagal menghapus user.", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setFormData({ nama: '', email: '', username: '', password: '', jabatan: 'PETUGAS', status: 'AKTIF', jabatanDivisi: '' });
    setIsModalOpen(true);
  };

  const openEdit = (u: User) => {
    setFormData({ ...u }); 
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const dataToExport = users.map(u => ({
      'Nama Lengkap': u.nama,
      'Email': u.email,
      'Username': u.username,
      'Role': u.jabatan,
      'Jabatan Divisi': u.jabatanDivisi || '-',
      'Status': u.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "Data_Users_SIMANDA.xlsx");
  };

  const roleOptions: { value: Role; label: string }[] = [
    { value: 'SUPERADMIN', label: 'Superadmin' },
    { value: 'KSPPG', label: 'KSPPG (Kepala SPPG)' },
    { value: 'ADMINSPPG', label: 'Admin SPPG' },
    { value: 'PETUGAS', label: 'Petugas' },
    { value: 'KOORDINATORDIVISI', label: 'Koordinator Divisi' },
  ];

  const divisionOptions = [
    { value: '', label: '-- Tidak Ada --' },
    { value: 'Asisten Lapangan', label: 'Asisten Lapangan' },
    { value: 'Persiapan', label: 'Persiapan' },
    { value: 'Produksi (Masak)', label: 'Produksi (Masak)' },
    { value: 'Pemorsian', label: 'Pemorsian' },
    { value: 'Distribusi', label: 'Distribusi' },
    { value: 'Kebersihan', label: 'Kebersihan' },
    { value: 'Keamanan', label: 'Keamanan' },
    { value: 'Pencucian Alat', label: 'Pencucian Alat' },
  ];

  return (
    <div>
      <Toolbar 
        title="User Management" 
        onSearch={setSearch} 
        onAdd={openAdd} 
        onExport={handleExport} 
        searchPlaceholder="Search users..." 
      />
      
      <Card>
        <Table<User> 
          isLoading={loading}
          data={users}
          columns={[
            { header: 'Nama', accessor: 'nama' },
            { header: 'Username', accessor: 'username' },
            { header: 'Email', accessor: 'email' },
            { 
                header: 'Role', 
                accessor: (u) => (
                    <div className="flex flex-col">
                        <span className={`px-2 py-1 rounded text-xs font-bold w-fit ${u.jabatan === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                            {u.jabatan}
                        </span>
                        {u.jabatan === 'KOORDINATORDIVISI' && u.jabatanDivisi && (
                            <span className="text-xs text-gray-500 mt-1">Div: {u.jabatanDivisi}</span>
                        )}
                    </div>
                ) 
            },
            { header: 'Status', accessor: (u) => <span className={`px-2 py-1 rounded text-xs font-bold ${u.status === 'AKTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span> },
          ]}
          onEdit={openEdit}
          onDelete={setDeleteItem}
        />
      </Card>

      <ConfirmationModal 
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Hapus User"
        message={`Apakah anda yakin ingin menghapus user ${deleteItem?.nama}?`}
        isLoading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit User" : "Add User"}>
        <div className="space-y-4">
          <div>
            <Input label="Nama Lengkap" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
          </div>
          <div>
            <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <Input label="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div>
            <Input label="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Role" value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value as any})} options={roleOptions} />
            </div>
            <div>
              <Select label="Status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} options={[
                { value: 'AKTIF', label: 'Aktif' },
                { value: 'TIDAK AKTIF', label: 'Tidak Aktif' },
              ]} />
            </div>
          </div>

          {/* Show Jabatan Divisi dropdown only if Role is KOORDINATORDIVISI */}
          {formData.jabatan === 'KOORDINATORDIVISI' && (
             <div>
               <Select 
                 label="Jabatan Divisi (Khusus Koordinator)" 
                 value={formData.jabatanDivisi || ''} 
                 onChange={e => setFormData({...formData, jabatanDivisi: e.target.value})} 
                 options={divisionOptions} 
               />
               <p className="text-xs text-gray-500 mt-1">Wajib diisi untuk Koordinator Divisi agar dapat mengakses absensi divisi terkait.</p>
             </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={loading}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
