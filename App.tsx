import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { KaryawanPage } from './pages/Karyawan';
import { SchoolPage } from './pages/SchoolData';
import { PICSekolahPage } from './pages/PICSekolah';
import { AlergiPage } from './pages/AlergiPage';
import { B3Page } from './pages/B3Data';
import { KaderB3Page } from './pages/KaderB3';
import { HonorKaryawanPage } from './pages/HonorKaryawan';
import { HonorPICSekolahPage } from './pages/HonorPICSekolah';
import { HonorKaderB3Page } from './pages/HonorKaderB3';
import { AbsensiPage } from './pages/Absensi'; 
import { Layout } from './components/Layout';
import { ToastProvider, useToast } from './components/UIComponents';
import { User, Role } from './types';
import { api } from './services/mockService';

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
     return <Navigate to="/" replace />;
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      {children}
    </Layout>
  );
};

// Auto Logout Time (30 Minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Inner App Component to use Toast Hook properly
const MainApp = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('simanda_token'));
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('simanda_user');
    return u ? JSON.parse(u) : null;
  });
  
  // Realtime User Sync (Security & State Update)
  useEffect(() => {
    if (!user || !token) return;

    // Subscribe to this specific user's data in the database
    const unsubscribe = api.subscribeUser(user.id, (updatedUser) => {
      if (!updatedUser) {
        // User deleted from DB
        alert("Akun anda telah dihapus. Sesi berakhir.");
        handleLogout();
        return;
      }

      // Check for account status (Deactivated)
      if (updatedUser.status !== 'AKTIF') {
        alert("Akun anda telah dinonaktifkan oleh Admin.");
        handleLogout();
        return;
      }

      // Check for password change (Sync across devices)
      if (user.password && updatedUser.password && updatedUser.password !== user.password) {
        alert("Password anda telah diubah di perangkat lain. Silahkan login kembali.");
        handleLogout();
        return;
      }

      // Update local user state for non-critical changes (name, role, division)
      if (updatedUser.nama !== user.nama || updatedUser.jabatan !== user.jabatan || updatedUser.jabatanDivisi !== user.jabatanDivisi) {
         const mergedUser = { ...updatedUser, password: user.password };
         setUser(mergedUser);
         localStorage.setItem('simanda_user', JSON.stringify(mergedUser));
      }
    });

    return () => unsubscribe();
  }, [user?.id, token]); 

  // === AUTO LOGOUT LOGIC ===
  useEffect(() => {
    if (!user || !token) return;

    let timeoutId: any;

    const handleInactivity = () => {
      alert("Sesi anda telah berakhir karena tidak ada aktivitas selama 30 menit. Silahkan login kembali.");
      handleLogout();
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivity, INACTIVITY_TIMEOUT);
    };

    // Events to detect activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Attach listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start initial timer
    resetTimer();

    // Cleanup listeners on unmount or logout
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, token]);

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
    <Router>
        <Routes>
          <Route path="/login" element={!token ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/karyawan" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}>
                <KaryawanPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/absensi" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG', 'KOORDINATORDIVISI']}>
                <AbsensiPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/sekolah" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG', 'PETUGAS']}>
                <SchoolPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alergi" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG', 'PETUGAS']}>
                <AlergiPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pic-sekolah" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}>
                <PICSekolahPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/b3" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG', 'PETUGAS']}>
                <B3Page />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kader-b3" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG', 'ADMINSPPG']}>
                <KaderB3Page />
              </ProtectedRoute>
            } 
          />
          
          {/* Finance Routes - Restricted to SUPERADMIN and KSPPG */}
          <Route 
            path="/honor-karyawan" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG']}>
                <HonorKaryawanPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/honor-pic" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG']}>
                <HonorPICSekolahPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/honor-kader" 
            element={
              <ProtectedRoute user={user} token={token} onLogout={handleLogout} allowedRoles={['SUPERADMIN', 'KSPPG']}>
                <HonorKaderB3Page />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </Router>
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
