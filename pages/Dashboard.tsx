
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Card } from '../components/UIComponents';
import { api } from '../services/mockService';
import { DashboardStats, User, Role } from '../types';
import { 
  Users, School, Baby, Activity, Calendar, Clock, 
  TrendingUp, ArrowRight, CheckSquare, FileText,
  GraduationCap, Package, UserCog, Bell, ChevronRight,
  ArrowUpRight, ShieldCheck, Zap, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';

export const Dashboard: React.FC = () => {
  const history = useHistory();
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
    // Clock Timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Stats Subscription
    const unsubscribe = api.subscribeStats(setStats);
    
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  // Time & Greeting Logic
  const hour = currentTime.getHours();
  let greeting = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
  else if (hour >= 18) greeting = 'Selamat Malam';

  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // --- DATA PREPARATION ---

  // 1. Donut Chart: Komposisi PM B3
  const pieDataB3 = [
    { name: 'Balita', value: stats.balita, color: '#F59E0B' },      // Amber 500
    { name: 'Ibu Hamil', value: stats.ibuHamil, color: '#EC4899' }, // Pink 500
    { name: 'Ibu Menyusui', value: stats.ibuMenyusui, color: '#10B981' }, // Emerald 500
  ].filter(d => d.value > 0);

  // 2. Bar Chart: Statistik Sekolah
  const barDataSekolah = [
    { name: 'Guru', value: stats.guru, color: '#3B82F6' }, // Blue 500
    { name: 'PM Kecil', value: stats.pmKecil, color: '#6366F1' }, // Indigo 500
    { name: 'PM Besar', value: stats.pmBesar, color: '#8B5CF6' }, // Violet 500
  ];

  // Total Penerima Manfaat (Sekolah + B3)
  const totalPM = (stats.pmKecil || 0) + (stats.pmBesar || 0) + stats.pmb3;

  // Mock Recent Activity
  const recentActivities = [
    { id: 1, text: "Data Absensi Harian diperbarui", time: "10 menit lalu", icon: <CheckSquare size={14} />, color: "bg-green-100 text-green-600" },
    { id: 2, text: "Stok Bahan Baku (Beras) masuk", time: "1 jam lalu", icon: <Package size={14} />, color: "bg-blue-100 text-blue-600" },
    { id: 3, text: "Laporan PM Sekolah diverifikasi", time: "3 jam lalu", icon: <School size={14} />, color: "bg-purple-100 text-purple-600" },
  ];

  // --- COMPONENTS ---

  const StatCard = ({ title, count, icon, colorClass, bgClass, trend }: { title: string, count: number, icon: React.ReactNode, colorClass: string, bgClass: string, trend?: string }) => (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass} ${colorClass} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {trend && (
           <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
             <TrendingUp size={12} /> {trend}
           </div>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{new Intl.NumberFormat('id-ID').format(count)}</h3>
        <p className="text-gray-500 text-sm font-medium mt-1">{title}</p>
      </div>
      
      {/* Decorative Background Icon */}
      <div className={`absolute -right-6 -bottom-6 opacity-5 transform rotate-12 group-hover:scale-125 transition-transform duration-500 ${colorClass}`}>
         {React.cloneElement(icon as React.ReactElement<any>, { size: 100 })}
      </div>
    </div>
  );

  const QuickActionBtn = ({ label, desc, icon, onClick, color, bg }: { label: string, desc: string, icon: React.ReactNode, onClick: () => void, color: string, bg: string }) => (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-xl border border-transparent ${bg} hover:shadow-md transition-all duration-200 text-left group w-full relative overflow-hidden`}
    >
      <div className={`p-3 rounded-lg bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 ${color}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <h4 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{label}</h4>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{desc}</p>
      </div>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
        <ArrowRight size={16} />
      </div>
    </button>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* === HERO SECTION === */}
      <div className="relative bg-gradient-to-br from-[#1e40af] via-[#0284c7] to-[#38bdf8] rounded-3xl p-8 text-white shadow-xl shadow-blue-900/10 overflow-hidden">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-100 font-medium text-xs backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full w-fit border border-white/10">
               <Calendar size={12} /> {dateStr}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {greeting}, <span className="text-yellow-300 underline decoration-yellow-300/30 underline-offset-4">{currentUser?.nama?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-blue-100 max-w-lg text-sm leading-relaxed opacity-90">
              Selamat datang di Dashboard SIMANDA SPPG. Pantau kinerja dan data penerima manfaat secara real-time.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
             <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-center min-w-[140px] shadow-lg">
                <span className="text-[10px] text-blue-200 uppercase tracking-widest font-bold block mb-1">Waktu Server</span>
                <span className="text-3xl font-mono font-bold tracking-widest text-white drop-shadow-sm">{timeStr}</span>
             </div>
             <div className="flex items-center gap-2 text-xs text-blue-100 bg-blue-900/30 px-3 py-1 rounded-full border border-blue-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                System Operational
             </div>
          </div>
        </div>
      </div>

      {/* === KEY METRICS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Karyawan" 
          count={stats.karyawan} 
          icon={<Users size={22} />} 
          bgClass="bg-blue-50"
          colorClass="text-blue-600"
          trend="+2 Baru"
        />
        <StatCard 
          title="Total Sekolah" 
          count={stats.pmsekolah} 
          icon={<School size={22} />} 
          bgClass="bg-indigo-50"
          colorClass="text-indigo-600"
        />
        <StatCard 
          title="PM B3 (Balita/Ibu)" 
          count={stats.pmb3} 
          icon={<Baby size={22} />} 
          bgClass="bg-pink-50"
          colorClass="text-pink-600"
          trend="Stabil"
        />
        <StatCard 
          title="Penerima Manfaat" 
          count={totalPM} 
          icon={<Activity size={22} />} 
          bgClass="bg-emerald-50"
          colorClass="text-emerald-600"
          trend="Aktif"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* === LEFT COLUMN: CHARTS (8/12 width) === */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <School size={20} className="text-blue-500"/> Statistik Sekolah
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Distribusi Guru, Siswa (PM Besar/Kecil)</p>
                </div>
             </div>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barDataSekolah} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGuru" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorKecil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6B7280', fontSize: 12, fontWeight: 500}} 
                      dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} />
                    <Tooltip 
                      cursor={{fill: '#F9FAFB'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                      {barDataSekolah.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Pie Chart Card */}
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <Baby size={20} className="text-pink-500"/> Komposisi PM B3
                   </h3>
                </div>
                <div className="flex-1 w-full relative min-h-[250px]">
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
                      >
                        {pieDataB3.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                     <span className="text-3xl font-bold text-gray-700">{stats.pmb3}</span>
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</span>
                  </div>
                </div>
             </div>

             {/* System Health Widget */}
             <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between">
                <div>
                   <div className="flex items-center gap-2 mb-4 text-emerald-400">
                      <ShieldCheck size={24} />
                      <span className="font-bold tracking-wide uppercase text-xs">Security Status</span>
                   </div>
                   <h3 className="text-2xl font-bold mb-2">Semua Sistem Aman</h3>
                   <p className="text-gray-400 text-sm">Database terenkripsi dan backup otomatis aktif setiap hari pukul 00:00.</p>
                </div>
                
                <div className="mt-6 space-y-3">
                   <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Server Load</span>
                      <span>12%</span>
                   </div>
                   <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full w-[12%]"></div>
                   </div>
                   
                   <div className="flex justify-between text-xs text-gray-400 mb-1 mt-2">
                      <span>Storage Usage</span>
                      <span>45%</span>
                   </div>
                   <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full w-[45%]"></div>
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* === RIGHT COLUMN: ACTIONS & ACTIVITY (4/12 width) === */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions Grid */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
               <Zap size={20} className="text-yellow-500" /> Akses Cepat
            </h3>
            
            <div className="space-y-3">
              <QuickActionBtn 
                label="Input Absensi" 
                desc="Isi kehadiran harian"
                icon={<CheckSquare size={18} />} 
                onClick={() => history.push('/absensi')}
                color="text-blue-600"
                bg="bg-blue-50/50 hover:bg-blue-50"
              />

              {['SUPERADMIN', 'KSPPG', 'ADMINSPPG'].includes(role) && (
                <QuickActionBtn 
                  label="Data Karyawan" 
                  desc="Kelola database pegawai"
                  icon={<UserCog size={18} />} 
                  onClick={() => history.push('/karyawan')}
                  color="text-indigo-600"
                  bg="bg-indigo-50/50 hover:bg-indigo-50"
                />
              )}

              {['SUPERADMIN', 'KSPPG', 'ADMINSPPG'].includes(role) && (
                <QuickActionBtn 
                  label="Stok Bahan Baku" 
                  desc="Cek ketersediaan gudang"
                  icon={<Layers size={18} />} 
                  onClick={() => history.push('/inventory/stok-saat-ini')}
                  color="text-orange-600"
                  bg="bg-orange-50/50 hover:bg-orange-50"
                />
              )}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[300px]">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                   <Bell size={20} className="text-gray-400" /> Aktivitas
                </h3>
                <span className="text-xs text-primary cursor-pointer hover:underline">Lihat Semua</span>
             </div>
             
             <div className="space-y-0 relative pl-2">
                {/* Timeline Vertical Line */}
                <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-gray-100 rounded-full"></div>

                {recentActivities.map((act, idx) => (
                   <div key={act.id} className="flex gap-4 relative py-3 group">
                      <div className={`w-10 h-10 rounded-full ${act.color} flex items-center justify-center border-4 border-white shadow-sm shrink-0 z-10`}>
                         {act.icon}
                      </div>
                      <div className="pt-1">
                         <p className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors cursor-pointer leading-tight">
                            {act.text}
                         </p>
                         <p className="text-[11px] text-gray-400 mt-1 font-medium">{act.time}</p>
                      </div>
                   </div>
                ))}
             </div>
             
             <div className="mt-4 p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">Tidak ada aktivitas baru lainnya.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
