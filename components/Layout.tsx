
import React, { useState, useEffect } from 'react';
import { useLocation } from '../components/UIComponents'; // Import useLocation for manual active check
import { 
  LayoutDashboard, 
  Users, 
  Contact, 
  School, 
  Baby, 
  Activity, 
  Menu, 
  LogOut,
  ChevronLeft,
  UserCog,
  Stethoscope,
  Wallet,
  ChevronDown,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Heart,
  CalendarCheck,
  ShieldAlert,
  Package, // Icon for Inventory
  Truck, // Icon for Supplier
  ArrowDownToLine, // Icon for Incoming
  ArrowUpFromLine, // Icon for Outgoing
  ClipboardList, // Icon for Stock Opname
  Layers, // Icon for Stock Current
  Settings, // New Icon for System
  BookOpen // New Icon for School Group
} from 'lucide-react';
import { User, Role } from '../types';
import { Logo } from './UIComponents';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

// MODIFIED: SidebarItem now uses native anchor behavior with forced reload for fresh data
const SidebarItem: React.FC<{ to: string; icon?: React.ReactNode; label: string; onClick?: () => void; isSubItem?: boolean }> = ({ to, icon, label, onClick, isSubItem }) => {
  // Manual Active State Check
  const isActive = window.location.pathname === to || (to !== '/' && window.location.pathname.startsWith(to));

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default SPA router behavior
    
    if (onClick) onClick();

    // FORCE REFRESH: Navigate using window.location to trigger a full page reload
    // This ensures data is 100% fresh and re-initializes real-time connections
    if (window.location.pathname === to) {
        window.location.reload(); // If same page, just reload
    } else {
        window.location.href = to; // If different page, navigate (which causes load)
    }
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
        isActive 
          ? 'bg-gradient-to-r from-primary to-[#3482ad] text-white shadow-md' 
          : 'text-gray-600 hover:bg-white hover:text-primary'
      } ${isSubItem ? 'pl-11 py-2.5 text-sm' : ''}`}
    >
      {icon && <span className="group-hover:scale-110 transition-transform">{icon}</span>}
      {!icon && isSubItem && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>}
      <span className="font-medium">{label}</span>
    </a>
  );
};

const SidebarDropdown: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  isOpen: boolean; 
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}> = ({ icon, label, isOpen, children, sidebarOpen, setSidebarOpen }) => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  // Auto-expand if a child route is active
  useEffect(() => {
    const isChildActive = React.Children.toArray(children).some((child: any) => {
      return child.props.to && location.pathname.startsWith(child.props.to);
    });
    if (isChildActive) {
      setExpanded(true);
    }
  }, [location, children]);

  const toggleExpand = () => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      setExpanded(true);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <div className="mb-1">
      <button
        onClick={toggleExpand}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-gray-600 hover:bg-white hover:text-primary group ${expanded ? 'bg-white/50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <span className="group-hover:scale-110 transition-transform">{icon}</span>
          {sidebarOpen && <span className="font-medium text-left">{label}</span>}
        </div>
        {sidebarOpen && (
          <span className="text-gray-400">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </button>
      
      {/* Sub-menu items container */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen && expanded ? 'max-h-96 opacity-100 mt-1 space-y-1' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
      else setIsOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [location, isMobile]);

  const role: Role = user?.jabatan || 'PETUGAS';

  // Permission Logic
  const canSeeUsers = role === 'SUPERADMIN';
  const canSeeKaryawan = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG';
  const canSeeAbsensi = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG' || role === 'KOORDINATORDIVISI';
  
  // Sekolah Data Permissions
  const canSeeSekolah = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG' || role === 'PETUGAS';
  const canSeePICSekolah = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG'; // Petugas excluded
  
  // B3 Data Permissions
  const canSeeB3 = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG' || role === 'PETUGAS';
  const canSeeKaderB3 = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG'; // Petugas excluded

  // Finance
  const canSeeFinance = role === 'SUPERADMIN' || role === 'KSPPG';
  
  // Inventory (Stok Bahan Baku) Permissions
  const canSeeInventory = role === 'SUPERADMIN' || role === 'KSPPG' || role === 'ADMINSPPG';

  const canSeeLogs = role === 'SUPERADMIN';

  // Group Permissions
  const showKepegawaian = canSeeKaryawan || canSeeAbsensi;
  const showSekolahGroup = canSeeSekolah || canSeePICSekolah;
  const showB3Group = canSeeB3 || canSeeKaderB3;
  const showSystemGroup = canSeeUsers || canSeeLogs;

  return (
    <div className="flex h-screen bg-[#F4F8FF] overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:relative z-30 h-full bg-[#f8fbff] border-r border-white/50 shadow-xl transition-all duration-300 ease-in-out flex flex-col left-0
          ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full w-64 lg:w-20 lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className={`h-28 flex items-center ${isOpen ? 'justify-between px-6' : 'justify-center'} border-b border-gray-100 transition-all duration-300`}>
          {isOpen ? (
            <div className="flex items-center gap-4 w-full">
              <Logo className="w-16 h-16 shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-gray-800 leading-tight whitespace-nowrap text-lg">SIMANDA</h1>
                <p className="text-xs text-primary font-semibold tracking-wide mt-0.5 whitespace-nowrap">SPPG Data</p>
              </div>
            </div>
          ) : (
             <div className="w-full flex justify-center py-2">
               <Logo className="w-14 h-14 shrink-0" />
             </div>
          )}
          {isOpen && isMobile && (
             <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
               <ChevronLeft size={24} />
             </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* 1. Dashboard */}
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label={isOpen ? "Dashboard" : ""} />
          
          {/* 2. Kepegawaian (HR) */}
          {showKepegawaian && (
             <SidebarDropdown 
               icon={<Users size={20} />} 
               label="Kepegawaian" 
               isOpen={isOpen}
               sidebarOpen={isOpen}
               setSidebarOpen={setIsOpen}
             >
               {canSeeKaryawan && <SidebarItem to="/karyawan" icon={<Contact size={18} />} label="Data Karyawan" isSubItem />}
               {canSeeAbsensi && <SidebarItem to="/absensi" icon={<CalendarCheck size={18} />} label="Absensi SPPG" isSubItem />}
             </SidebarDropdown>
          )}

          {/* 3. Manajemen Sekolah */}
          {showSekolahGroup && (
             <SidebarDropdown 
               icon={<School size={20} />} 
               label="Manajemen Sekolah" 
               isOpen={isOpen}
               sidebarOpen={isOpen}
               setSidebarOpen={setIsOpen}
             >
               {canSeeSekolah && <SidebarItem to="/sekolah" icon={<BookOpen size={18} />} label="Data PM Sekolah" isSubItem />}
               {canSeeSekolah && <SidebarItem to="/alergi" icon={<ShieldAlert size={18} />} label="Data Alergi" isSubItem />}
               {canSeePICSekolah && <SidebarItem to="/pic-sekolah" icon={<UserCog size={18} />} label="Data PIC Sekolah" isSubItem />}
             </SidebarDropdown>
          )}

          {/* 4. Manajemen B3 */}
          {showB3Group && (
             <SidebarDropdown 
               icon={<Baby size={20} />} 
               label="Manajemen B3" 
               isOpen={isOpen}
               sidebarOpen={isOpen}
               setSidebarOpen={setIsOpen}
             >
               {canSeeB3 && <SidebarItem to="/b3" icon={<Heart size={18} />} label="Data PM B3" isSubItem />}
               {canSeeKaderB3 && <SidebarItem to="/kader-b3" icon={<Stethoscope size={18} />} label="Data Kader B3" isSubItem />}
             </SidebarDropdown>
          )}

          {/* 5. Gudang / Inventory */}
          {canSeeInventory && (
             <SidebarDropdown 
               icon={<Package size={20} />} 
               label="Logistik & Gudang" 
               isOpen={isOpen}
               sidebarOpen={isOpen}
               setSidebarOpen={setIsOpen}
             >
               <SidebarItem to="/inventory/stok-saat-ini" icon={<Layers size={18} />} label="Stok Saat Ini" isSubItem />
               <SidebarItem to="/inventory/bahan-masuk" icon={<ArrowDownToLine size={18} />} label="Bahan Masuk" isSubItem />
               <SidebarItem to="/inventory/bahan-keluar" icon={<ArrowUpFromLine size={18} />} label="Bahan Keluar" isSubItem />
               <SidebarItem to="/inventory/stok-opname" icon={<ClipboardList size={18} />} label="Stok Opname" isSubItem />
               <SidebarItem to="/inventory/supplier" icon={<Truck size={18} />} label="Data Suplayer" isSubItem />
             </SidebarDropdown>
          )}
          
          {/* 6. Keuangan */}
          {canSeeFinance && (
            <SidebarDropdown 
              icon={<Wallet size={20} />} 
              label="Keuangan & Gaji" 
              isOpen={isOpen}
              sidebarOpen={isOpen}
              setSidebarOpen={setIsOpen}
            >
              <SidebarItem to="/honor-karyawan" icon={<Briefcase size={18} />} label="Honor Karyawan" isSubItem />
              <SidebarItem to="/honor-pic" icon={<GraduationCap size={18} />} label="Honor PIC Sekolah" isSubItem />
              <SidebarItem to="/honor-kader" icon={<Heart size={18} />} label="Honor Kader B3" isSubItem />
            </SidebarDropdown>
          )}

          {/* 7. System Admin */}
          {showSystemGroup && (
             <SidebarDropdown 
               icon={<Settings size={20} />} 
               label="Sistem & Admin" 
               isOpen={isOpen}
               sidebarOpen={isOpen}
               setSidebarOpen={setIsOpen}
             >
               {canSeeUsers && <SidebarItem to="/users" icon={<UserCog size={18} />} label="Manajemen User" isSubItem />}
               {canSeeLogs && <SidebarItem to="/logs" icon={<Activity size={18} />} label="Log Aktivitas" isSubItem />}
             </SidebarDropdown>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className={`flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-50 ${!isOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
              {user?.nama?.charAt(0) || 'U'}
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{user?.nama}</p>
                <p className="text-xs text-gray-500 truncate">{user?.jabatan}</p>
              </div>
            )}
            {isOpen && (
              <button 
                onClick={onLogout}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Navbar for Mobile */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:hidden z-10 sticky top-0">
           <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-gray-600">
             <Menu />
           </button>
           <div className="flex flex-col items-center">
             <span className="font-bold text-gray-700 text-sm">SIMANDA SPPG</span>
           </div>
           <div className="w-8"></div> {/* Spacer */}
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
           <div className="max-w-7xl mx-auto">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
};

