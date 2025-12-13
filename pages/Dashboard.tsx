
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/mockService';
import { DashboardStats, User, Role } from '../types';
import { 
  Users, School, Activity, Calendar, 
  ArrowRight, CheckSquare, 
  Package, UserCog, Bell, 
  TrendingUp, Zap, PieChart as PieIcon,
  Layers
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ 
    karyawan: 0, 
    pmsekolah: 0, 
    pmb3: 0,
    pmKecil: 0,
    pmBesar: 0,
    guru: 0,
    balita: 0,
    ibuHamil: 0,
    ibuMenyusui: 0
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Get current user for Role-based Quick Access
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();
  const role = currentUser?.jabatan as Role;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const unsubscribe = api.subscribeStats(setStats);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // --- DATA PREPARATION ---
  
  // 1. Data Komposisi PM B3 (Donut Chart)
  const pieDataB3 = [
    { name: 'Balita', value: stats.balita, color: '#3B82F6' },      // Blue
    { name: 'Ibu Hamil', value: stats.ibuHamil, color: '#EC4899' }, // Pink
    { name: 'Ibu Menyusui', value: stats.ibuMenyusui, color: '#10B981' }, // Emerald
  ].filter(d => d.value > 0);

  // 2. Data Statistik Sekolah (Area/Bar Chart)
  const chartDataSekolah = [
    { name: 'Guru', value: stats.guru, fill: '#8B5CF6' }, // Violet
    { name: 'PM Kecil', value: stats.pmKecil, fill: '#F59E0B' }, // Amber
    { name: 'PM Besar', value: stats.pmBesar, fill: '#0EA5E9' }, // Sky
  ];

  // Total Penerima Manfaat
  const totalPMSekolah = (stats.pmKecil || 0) + (stats.pmBesar || 0);
  const totalPM = totalPMSekolah + stats.pmb3;
  
  // Percentages for Progress Bars
  const pctSekolah = totalPM > 0 ? Math.round((totalPMSekolah / totalPM) * 100) : 0;
  const pctB3 = totalPM > 0 ? Math.round((stats.pmb3 / totalPM) * 100) : 0;

  // Mock Recent Activity
  const recentActivities = [
    { id: 1, text: "Absensi hari ini telah di-update", time: "10 menit lalu", type: 'success' },
    { id: 2, text: "Stok Beras IR 64 masuk (100kg)", time: "1 jam lalu", type: 'info' },
    { id: 3, text: "Data PM Sekolah disinkronisasi", time: "3 jam lalu", type: 'warning' },
  ];

  // --- COMPONENTS ---

  const QuickActionCard = ({ icon, label, sub, onClick, colorClass, bgClass }: any) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group w-full h-full min-h-[140px]"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${bgClass} ${colorClass} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
        {icon}
      </div>
      <h4 className="font-bold text-gray-700 text-sm text-center group-hover:text-primary transition-colors">{label}</h4>
      <p className="text-[10px] text-gray-400 text-center mt-1">{sub}</p>
    </button>
  );

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* === HEADER SECTION === */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
         <div>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
               <Calendar size={14} /> 
               <span className="text-xs font-semibold uppercase tracking-wider">{dateStr}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
               Dashboard <span className="text-primary">Overview</span>
            </h1>
         </div>
         <div className="flex items-center gap-4">
            <div className="bg-white px-5 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-3">
               <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-lg font-mono font-bold text-gray-700">{timeStr}</span>
            </div>
         </div>
      </div>

      {/* === HERO & KEY METRICS GRID === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* 1. HERO CARD: TOTAL IMPACT (Spans 2 columns) */}
         <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden flex flex-col justify-between min-h-[280px]">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
            
            <div className="relative z-10">
               <div className="flex items-center gap-2 text-blue-100 mb-2">
                  <Activity size={18} />
                  <span className="text-sm font-bold uppercase tracking-wide">Total Penerima Manfaat</span>
               </div>
               <div className="flex items-baseline gap-2">
                  <h2 className="text-6xl font-extrabold tracking-tight">{new Intl.NumberFormat('id-ID').format(totalPM)}</h2>
                  <span className="text-xl font-medium text-blue-200">Jiwa</span>
               </div>
               <p className="text-blue-100 mt-2 max-w-md text-sm leading-relaxed">
                  Akumulasi total penerima manfaat program Gizi dari sektor Sekolah (Siswa) dan B3 (Balita, Ibu Hamil/Menyusui).
               </p>
            </div>

            {/* Breakdown Visualizer */}
            <div className="relative z-10 mt-8">
               <div className="flex justify-between text-xs font-semibold mb-2 text-blue-100">
                  <span>PM Sekolah ({pctSekolah}%)</span>
                  <span>PM B3 ({pctB3}%)</span>
               </div>
               <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden flex">
                  <div style={{ width: `${pctSekolah}%` }} className="h-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  <div style={{ width: `${pctB3}%` }} className="h-full bg-yellow-400/90"></div>
               </div>
               <div className="flex justify-between mt-2 text-sm font-bold">
                  <div className="flex items-center gap-2">
                     <span className="w-3 h-3 rounded-full bg-white"></span> {new Intl.NumberFormat('id-ID').format(totalPMSekolah)}
                  </div>
                  <div className="flex items-center gap-2">
                     {new Intl.NumberFormat('id-ID').format(stats.pmb3)} <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                  </div>
               </div>
            </div>
         </div>

         {/* 2. OPERATIONAL METRICS (Vertical Stack) */}
         <div className="space-y-6 flex flex-col">
            {/* Card Karyawan */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
               <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-full"></div>
               <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Karyawan</p>
                  <h3 className="text-3xl font-extrabold text-gray-800">{stats.karyawan}</h3>
                  <button onClick={() => navigate('/karyawan')} className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1 hover:underline">
                     Kelola Data <ArrowRight size={12} />
                  </button>
               </div>
               <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Users size={28} />
               </div>
            </div>

            {/* Card Sekolah */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
               <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-full"></div>
               <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Sekolah</p>
                  <h3 className="text-3xl font-extrabold text-gray-800">{stats.pmsekolah}</h3>
                  <button onClick={() => navigate('/sekolah')} className="text-xs text-indigo-600 font-bold mt-2 flex items-center gap-1 hover:underline">
                     Lihat Detail <ArrowRight size={12} />
                  </button>
               </div>
               <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <School size={28} />
               </div>
            </div>
         </div>
      </div>

      {/* === CHARTS SECTION (Bento Grid) === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* CHART 1: SEKOLAH BREAKDOWN (Bar Chart Style) */}
         <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                     <TrendingUp size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-gray-800">Statistik Sekolah</h3>
                     <p className="text-xs text-gray-400">Komposisi Guru, PM Kecil, dan PM Besar</p>
                  </div>
               </div>
            </div>
            
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataSekolah} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 600}} width={80} />
                     <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                     />
                     <Bar dataKey="value" barSize={30} radius={[0, 6, 6, 0]}>
                        {chartDataSekolah.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* CHART 2: B3 DEMOGRAPHICS (Donut) */}
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                     <PieIcon size={20} />
                  </div>
                  <div>
                     <h3 className="font-bold text-gray-800">Demografi B3</h3>
                     <p className="text-xs text-gray-400">Kategori Penerima</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 relative min-h-[220px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={pieDataB3}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={6}
                     >
                        {pieDataB3.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{fontSize: '11px'}} />
                  </PieChart>
               </ResponsiveContainer>
               {/* Center Text */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-extrabold text-gray-700">{stats.pmb3}</span>
                  <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Total B3</span>
               </div>
            </div>
         </div>
      </div>

      {/* === BOTTOM SECTION: ACTIONS & ACTIVITY === */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         
         {/* APP DOCK (Quick Actions) - Spans 3 columns */}
         <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 ml-1 flex items-center gap-2">
               <Zap size={16} /> Akses Cepat Aplikasi
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <QuickActionCard 
                  icon={<CheckSquare size={24} />} 
                  label="Input Absensi" 
                  sub="Harian Pegawai"
                  colorClass="text-white"
                  bgClass="bg-gradient-to-br from-blue-400 to-blue-600"
                  onClick={() => navigate('/absensi')}
               />
               
               {['SUPERADMIN', 'KSPPG', 'ADMINSPPG'].includes(role) && (
                  <QuickActionCard 
                     icon={<Package size={24} />} 
                     label="Stok Gudang" 
                     sub="Cek Persediaan"
                     colorClass="text-white"
                     bgClass="bg-gradient-to-br from-orange-400 to-orange-600"
                     onClick={() => navigate('/inventory/stok-saat-ini')}
                  />
               )}

               {['SUPERADMIN', 'KSPPG', 'ADMINSPPG'].includes(role) && (
                  <QuickActionCard 
                     icon={<UserCog size={24} />} 
                     label="Karyawan" 
                     sub="Database Pegawai"
                     colorClass="text-white"
                     bgClass="bg-gradient-to-br from-purple-400 to-purple-600"
                     onClick={() => navigate('/karyawan')}
                  />
               )}

               <QuickActionCard 
                  icon={<Layers size={24} />} 
                  label="Laporan" 
                  sub="Export Data"
                  colorClass="text-white"
                  bgClass="bg-gradient-to-br from-emerald-400 to-emerald-600"
                  onClick={() => { /* Open Report/Export Modal if exist, or route */ }}
               />
            </div>
         </div>

         {/* ACTIVITY FEED - Spans 1 column */}
         <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <Bell size={16} className="text-gray-400" /> Aktivitas
               </h3>
            </div>
            
            <div className="flex-1 space-y-4 relative">
               <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100 rounded-full"></div>
               {recentActivities.map((act) => (
                  <div key={act.id} className="relative pl-6">
                     <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 
                        ${act.type === 'success' ? 'bg-green-500' : act.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}
                     `}></div>
                     <p className="text-xs font-semibold text-gray-700 leading-tight">{act.text}</p>
                     <p className="text-[10px] text-gray-400 mt-0.5">{act.time}</p>
                  </div>
               ))}
            </div>
            <button className="w-full mt-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
               Lihat Semua Log
            </button>
         </div>

      </div>
    </div>
  );
};

