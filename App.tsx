
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, LoadingSpinner } from './components/UIComponents';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/UIComponents';
import { User, Role } from './types';
import { api } from './services/mockService';

const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const PublicLanding = lazy(() => import('./pages/PublicLanding').then(module => ({ default: module.PublicLanding })));
const UsersPage = lazy(() => import('./pages/Users').then(module => ({ default: module.UsersPage })));
const KaryawanPage = lazy(() => import('./pages/Karyawan').then(module => ({ default: module.KaryawanPage })));
const SchoolPage = lazy(() => import('./pages/SchoolData').then(module => ({ default: module.SchoolPage })));
const PICSekolahPage = lazy(() => import('./pages/PICSekolah').then(module => ({ default: module.PICSekolahPage })));
const AlergiPage = lazy(() => import('./pages/AlergiPage').then(module => ({ default: module.AlergiPage })));
const B3Page = lazy(() => import('./pages/B3Data').then(module => ({ default: module.B3Page })));
const KaderB3Page = lazy(() => import('./pages/KaderB3').then(module => ({ default: module.KaderB3Page })));
const HonorKaryawanPage = lazy(() => import('./pages/HonorKaryawan').then(module => ({ default: module.HonorKaryawanPage })));
const HonorPICSekolahPage = lazy(() => import('./pages/HonorPICSekolah').then(module => ({ default: module.HonorPICSekolahPage })));
const HonorKaderB3Page = lazy(() => import('./pages/HonorKaderB3').then(module => ({ default: module.HonorKaderB3Page })));
const AbsensiPage = lazy(() => import('./pages/Absensi').then(module => ({ default: module.AbsensiPage })));
const DataSupplierPage = lazy(() => import('./pages/inventory/DataSupplier').then(module => ({ default: module.DataSupplierPage })));
const LaporanBahanMasukPage = lazy(() => import('./pages/inventory/LaporanBahanMasuk').then(module => ({ default: module.LaporanBahanMasukPage })));
const LaporanBahanKeluarPage = lazy(() => import('./pages/inventory/LaporanBahanKeluar').then(module => ({ default: module.LaporanBahanKeluarPage })));
const LaporanStokOpnamePage = lazy(() => import('./pages/inventory/LaporanStokOpname').then(module => ({ default: module.LaporanStokOpnamePage })));
const StokSaatIniPage = lazy(() => import('./pages/inventory/StokSaatIni').then(module => ({ default: module.StokSaatIniPage })));
const DocumentGeneratorPage = lazy(() => import('./pages/DocumentGenerator').then(module => ({ default: module.DocumentGeneratorPage })));

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
  token: string | null;
  onLogout: () => void;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, user, token, onLogout, allowedRoles }) => {
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.jabatan)) {
     return <Navigate to="/dashboard" replace />;
  }
  return (
    <Layout user={user} onLogout={onLogout}>
      {children}
    </Layout>
  );
};

const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

const MainApp = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('simanda_token'));
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('simanda_user');
    return u ? JSON.parse(u) : null;
  });
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  
  useEffect(() => {
    if (!user || !token) return;
    const unsubscribe = api.subscribeUser(user.id, (updatedUser) => {
      const currentUser = userRef.current;
      if (!updatedUser) {
        alert("Akun anda telah dihapus. Sesi berakhir.");
        handleLogout();
        return;
      }
      if (updatedUser.status !== 'AKTIF') {
        alert("Akun anda telah dinonaktifkan oleh Admin.");
        handleLogout();
        return;
      }
      if (currentUser && currentUser.password && updatedUser.password && updatedUser.password !== currentUser.password) {
        alert("Password anda telah diubah di perangkat lain. Silahkan login kembali.");
        handleLogout();
        return;
      }
      if (currentUser && updatedUser.sessionId && updatedUser.sessionId !== currentUser.sessionId) {
          alert("Akun anda telah digunakan login di perangkat lain. Sesi ini akan berakhir otomatis.");
          handleLogout();
          return;
      }
      if (currentUser && (
          updatedUser.nama !== currentUser.nama || 
          updatedUser.jabatan !== currentUser.jabatan || 
          updatedUser.jabatanDivisi !== currentUser.jabatanDivisi ||
          (!currentUser.sessionId && updatedUser.sessionId)
      )) {
         const mergedUser = { ...updatedUser, password: currentUser.password, sessionId: updatedUser.sessionId };
         setUser(mergedUser);
         localStorage.setItem('simanda_user', JSON.stringify(mergedUser));
      }
    });
    return () => unsubscribe();
  }, [user?.id, token]); 

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('simanda_token', newToken);
    localStorage.setItem('simanda_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('simanda_token');
    localStorage.removeItem('simanda_user');
  };

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>}>
        <Routes>
          <Route path="/" element={<PublicLanding />} />
          <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout}><Dashboard /></ProtectedRoute>} />
          <Route path="/dokumen" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout}><DocumentGeneratorPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN']}><UsersPage /></ProtectedRoute>} />
          <Route path="/karyawan" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}><KaryawanPage /></ProtectedRoute>} />
          <Route path="/absensi" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG', 'KOORDINATORDIVISI']}><AbsensiPage /></ProtectedRoute>} />
          <Route path="/sekolah" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG', 'PETUGAS']}><SchoolPage /></ProtectedRoute>} />
          <Route path="/alergi" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG', 'PETUGAS']}><AlergiPage /></ProtectedRoute>} />
          <Route path="/pic-sekolah" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}><PICSekolahPage /></ProtectedRoute>} />
          <Route path="/b3" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG', 'PETUGAS']}><B3Page /></ProtectedRoute>} />
          <Route path="/kader-b3" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}><KaderB3Page /></ProtectedRoute>} />
          <Route path="/inventory/supplier" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}><DataSupplierPage /></ProtectedRoute>} />
          <Route path="/inventory/bahan-masuk" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}><LaporanBahanMasukPage /></ProtectedRoute>} />
          <Route path="/inventory/bahan-keluar" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}><LaporanBahanKeluarPage /></ProtectedRoute>} />
          <Route path="/inventory/stok-saat-ini" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}><StokSaatIniPage /></ProtectedRoute>} />
          <Route path="/inventory/stok-opname" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}><LaporanStokOpnamePage /></ProtectedRoute>} />
          <Route path="/honor-karyawan" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG']}><HonorKaryawanPage /></ProtectedRoute>} />
          <Route path="/honor-pic" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG']}><HonorPICSekolahPage /></ProtectedRoute>} />
          <Route path="/honor-kader" element={<ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG']}><HonorKaderB3Page /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}

export default App;
