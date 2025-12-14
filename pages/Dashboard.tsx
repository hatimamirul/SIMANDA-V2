
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from '../components/UIComponents';
import { Card } from '../components/UIComponents';
import { api } from '../services/mockService';
import { DashboardStats, User, Role } from '../types';
import { 
  Users, School, Baby, Activity, Calendar, 
  TrendingUp, ArrowRight, CheckSquare,
  Package, UserCog, Bell,
  ArrowUpRight, Database, AlertCircle, CheckCircle2,
  FileCheck, FileClock, GraduationCap, FileText, PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend
} from 'recharts';

// --- SUB-COMPONENTS (Defined OUTSIDE to prevent re-mounting/flickering) ---

const StatCard = React.memo(({ title, count, icon, colorClass, bgClass, trend }: { title: string, count: number, icon: React.ReactNode, colorClass: string, bgClass: string, trend?: string }) => (
  <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgClass} ${colorClass} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      {trend && (
         <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
           <TrendingUp size={10} /> {trend}
         </div>
      )}
    </div>
    <div className="relative z-10">
      <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{new Intl.NumberFormat('id-ID').format(count)}</h3>
      <p className="text-gray-500 text-sm font-medium mt-1">{title}</p>
    </div>
    
    {/* Decorative Background Icon */}
    <div className={`absolute -right-4 -bottom-4 opacity-5 transform rotate-12 group-hover:scale-125 transition-transform duration-500 ${colorClass}`}>
       {React.cloneElement(icon as React.ReactElement<any>, { size: 80 })}
    </div>
  </div>
));

const ProposalStatusWidget = React.memo(({ title, subtitle, icon, total, sudah, belum, type }: { title: string, subtitle: string, icon: any, total: number, sudah: number, belum: number, type: 'siswa' | 'guru' }) => {
   const percentSudah = total > 0 ? Math.round((sudah / total) * 100) : 0;
   
   // Color Themes & Gradients
   const isSiswa = type === 'siswa';
   const lightBg = isSiswa ? 'bg-blue-50' : 'bg-purple-50';
   const iconColor = isSiswa ? 'text-blue-600' : 'text-purple-600';
   const gradientId = isSiswa ? 'gradSiswa' : 'gradGuru';
   const startColor = isSiswa ? '#3B82F6' : '#8B5CF6'; // Blue-500 / Violet-500
   const endColor = isSiswa ? '#0EA5E9' : '#D946EF';   // Sky-500 / Fuchsia-500

   // Chart Setup: Gauge Shape (Start 220, Sweep 260)
   const startAngle = 220;
   const maxAngleSpan = 260;
   const endAngleTrack = startAngle - maxAngleSpan;
   const endAngleValue = startAngle - ((percentSudah / 100) * maxAngleSpan);

   // Stable data for Recharts to prevent unnecessary processing
   const trackData = useMemo(() => [{ value: 1 }], []);

   return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${lightBg} ${iconColor} shadow-inner`}>
                  {icon}
              </div>
              <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{subtitle}</p>
                  <h4 className="font-bold text-gray-800 text-lg leading-tight">{title}</h4>
              </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Static Radial Chart */}
              <div className="relative w-40 h-40 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <defs>
                              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor={startColor} />
                                  <stop offset="100%" stopColor={endColor} />
                              </linearGradient>
                          </defs>
                          
                          {/* Track Layer (Grey) */}
                          <Pie
                              data={trackData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={72}
                              startAngle={startAngle}
                              endAngle={endAngleTrack}
                              dataKey="value"
                              stroke="none"
                              fill="#F3F4F6"
                              cornerRadius={10}
                              isAnimationActive={false} 
                          />
                          
                          {/* Value Layer (Gradient) */}
                          {percentSudah > 0 && (
                              <Pie
                                  data={trackData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={72}
                                  startAngle={startAngle}
                                  endAngle={endAngleValue}
                                  dataKey="value"
                                  stroke="none"
                                  cornerRadius={10}
                                  fill={`url(#${gradientId})`}
                                  isAnimationActive={false} 
                              />
                          )}
                      </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Centered Percentage */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-2">
                      <span className={`text-4xl font-extrabold ${iconColor} drop-shadow-sm`}>{percentSudah}%</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Selesai</span>
                  </div>
              </div>

              {/* Stats Info */}
              <div className="flex-1 w-full space-y-5">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Total</p>
                      <p className="text-2xl font-bold text-gray-800">{total.toLocaleString()}</p>
                  </div>

                  <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                              <span className="text-gray-600 font-medium">Sudah</span>
                          </div>
                          <span className="font-bold text-gray-800">{sudah.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                              <span className="text-gray-600 font-medium">Belum</span>
                          </div>
                          <span className="font-bold text-gray-400">{belum.toLocaleString()}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
   );
});

const QuickActionBtn = React.memo(({ label, desc, icon, onClick, color }: { label: string, desc: string, icon: React.ReactNode, onClick: () => void, color: string }) => (
  <button 
    onClick={onClick}
    className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md hover:bg-blue-50/30 transition-all duration-200 text-left group w-full"
  >
    <div className={`p-3 rounded-xl text-white shadow-md group-hover:scale-110 transition-transform duration-300 ${color}`}>
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">{label}</h4>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
    </div>
    <div className="ml-auto self-center opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
      <ArrowRight size={16} />
    </div>
  </button>
));

// --- MAIN DASHBOARD COMPONENT ---

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ 
    karyawan: 0, pmsekolah: 0, pmb3: 0, pmKecil: 0, pmBesar: 0, guru: 0,
    balita: 0, ibuHamil: 0, ibuMenyusui: 0,
    siswaSudahProposal: 0, siswaBelumProposal: 0, guruSudahProposal: 0, guruBelumProposal: 0
  });

  const [storageStats, setStorageStats] = useState({ usedMB: "0", totalMB: 1024, percentage: "0" });
  const [currentTime, setCurrentTime] = useState(new Date());

  const currentUser: User | null = (() => {
    try { return JSON.parse(localStorage.getItem('simanda_user') || '{}'); } catch { return null; }
  })();
  const role = currentUser?.jabatan as Role;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const unsubscribe = api.subscribeStats(setStats);
    const updateStorage = () => setStorageStats(api.getStorageStats());
    updateStorage();
    const storageTimer = setInterval(updateStorage, 5000);
    
    return () => {
      clearInterval(timer);
      clearInterval(storageTimer);
      unsubscribe();
    };
  }, []);

  const hour = currentTime.getHours();
  let greeting = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
  else if (hour >= 18) greeting = 'Selamat Malam';

  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Memoized Data
  const pieDataB3 = useMemo(() => [
    { name: 'Balita', value: stats.balita, color: '#F59E0B', gradientId: 'gradBalita' },
    { name: 'Ibu Hamil', value: stats.ibuHamil, color: '#EC4899', gradientId: 'gradHamil' },
    { name: 'Ibu Menyusui', value: stats.ibuMenyusui, color: '#10B981', gradientId: 'gradMenyusui' },
  ].filter(d => d.value > 0), [stats.balita, stats.ibuHamil, stats.ibuMenyusui]);

  const barDataSekolah = useMemo(() => [
    { name: 'Guru', value: stats.guru, color: '#3B82F6' },
    { name: 'PM Kecil', value: stats.pmKecil, color: '#6366F1' },
    { name: 'PM Besar', value: stats.pmBesar, color: '#8B5CF6' },
  ], [stats.guru, stats.pmKecil, stats.pmBesar]);

  const totalPM = (stats.pmKecil || 0) + (stats.pmBesar || 0) + stats.pmb3;

  const recentActivities = useMemo(() => [
    { id: 1, text: "Data Absensi Harian diperbarui", time: "10 menit lalu", icon: <CheckSquare size={14} />, color: "bg-green-100 text-green-600" },
    { id: 2, text: "Stok Bahan Baku (Beras) masuk", time: "1 jam lalu", icon: <Package size={14} />, color: "bg-blue-100 text-blue-600" },
    { id: 3, text: "Laporan PM Sekolah diverifikasi", time: "3 jam lalu", icon: <School size={14} />, color: "bg-purple-100 text-purple-600" },
  ], []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* === HERO SECTION === */}
      <div className="relative bg-gradient-to-br from-[#1e40af] via-[#2A6F97] to-[#0ea5e9] rounded-3xl p-8 text-white shadow-xl shadow-blue-900/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-100 font-medium text-sm backdrop-blur-sm bg-white/10 px-3 py-1 rounded-full w-fit">
               <Calendar size={14} /> {dateStr}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              {greeting}, <span className="text-yellow-300">{currentUser?.nama?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-blue-100 max-w-lg text-sm md:text-base leading-relaxed opacity-90">
              Selamat datang di Dashboard SIMANDA. Semua sistem berjalan normal hari ini.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
             <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl text-center min-w-[140px]">
                <span className="text-xs text-blue-200 uppercase tracking-wider font-semibold block mb-1">Waktu Server</span>
                <span className="text-3xl font-mono font-bold tracking-widest">{timeStr}</span>
             </div>
             <div className="flex items-center gap-2 text-xs text-blue-200 bg-black/20 px-2 py-1 rounded-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Online & Terhubung
             </div>
          </div>
        </div>
      </div>

      {/* === KEY METRICS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
          title="Total Penerima Manfaat" 
          count={totalPM} 
          icon={<Activity size={22} />} 
          bgClass="bg-emerald-50"
          colorClass="text-emerald-600"
          trend="Aktif"
        />
      </div>

      {/* === PROPOSAL STATUS SUMMARY === */}
      <div>
         <div className="flex items-center justify-between mb-4 px-1">
             <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                 <FileText className="text-primary" size={20}/> Ringkasan Status Proposal
             </h3>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <ProposalStatusWidget 
                title="Siswa Penerima Manfaat"
                subtitle="Data Sekolah" 
                icon={<School size={24} />} 
                total={(stats.pmBesar || 0) + (stats.pmKecil || 0)}
                sudah={stats.siswaSudahProposal}
                belum={stats.siswaBelumProposal}
                type="siswa"
             />
             <ProposalStatusWidget 
                title="Guru / Tenaga Pendidik"
                subtitle="Data Sekolah" 
                icon={<GraduationCap size={24} />} 
                total={stats.guru}
                sudah={stats.guruSudahProposal}
                belum={stats.guruBelumProposal}
                type="guru"
             />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === LEFT COLUMN: CHARTS === */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* === IMPROVED PIE CHART (KOMPOSISI B3) === */}
            <Card className="p-0 flex flex-col min-h-[380px] hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-6 pb-0 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Komposisi PM B3</h3>
                  <p className="text-xs text-gray-400 mt-1">Balita vs Ibu Hamil vs Ibu Menyusui</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600"><ArrowUpRight size={18}/></button>
              </div>
              
              <div className="flex-1 w-full relative flex flex-col items-center justify-center p-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <defs>
                      <linearGradient id="gradBalita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#D97706" />
                      </linearGradient>
                      <linearGradient id="gradHamil" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EC4899" />
                        <stop offset="100%" stopColor="#BE185D" />
                      </linearGradient>
                      <linearGradient id="gradMenyusui" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      
                      {/* Glow Filter */}
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
                        <feOffset in="blur" dx="0" dy="2" result="offsetBlur"/>
                        <feFlood floodColor="rgba(0,0,0,0.15)" result="color"/>
                        <feComposite in="color" in2="offsetBlur" operator="in" result="shadow"/>
                        <feMerge>
                          <feMergeNode in="shadow"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={pieDataB3}
                      cx="50%"
                      cy="50%"
                      innerRadius={70} 
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                      cornerRadius={6}
                      isAnimationActive={false} // Disable animation to stop flicker on re-render
                    >
                      {pieDataB3.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#${entry.gradientId})`} 
                          style={{ filter: 'url(#glow)' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none pb-2">
                   <span className="text-3xl font-extrabold text-gray-800">{stats.pmb3}</span>
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total</span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="bg-gray-50/50 p-4 border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-200">
                 <div className="flex flex-col items-center gap-1 text-center px-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-1 ring-2 ring-white shadow-sm"></div>
                    <span className="text-[10px] uppercase text-gray-500 font-bold">Balita</span>
                    <span className="text-sm font-bold text-gray-800">{stats.balita}</span>
                 </div>
                 <div className="flex flex-col items-center gap-1 text-center px-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 mb-1 ring-2 ring-white shadow-sm"></div>
                    <span className="text-[10px] uppercase text-gray-500 font-bold">Ibu Hamil</span>
                    <span className="text-sm font-bold text-gray-800">{stats.ibuHamil}</span>
                 </div>
                 <div className="flex flex-col items-center gap-1 text-center px-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mb-1 ring-2 ring-white shadow-sm"></div>
                    <span className="text-[10px] uppercase text-gray-500 font-bold">Ibu Menyusui</span>
                    <span className="text-sm font-bold text-gray-800">{stats.ibuMenyusui}</span>
                 </div>
              </div>
            </Card>

            {/* Bar Chart */}
            <Card className="p-6 flex flex-col min-h-[380px] hover:shadow-md transition-shadow">
               <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Statistik Sekolah</h3>
                  <p className="text-xs text-gray-400 mt-1">Distribusi Guru & Siswa</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600"><ArrowUpRight size={18}/></button>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barDataSekolah} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9CA3AF', fontSize: 11}} 
                      dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} />
                    <Tooltip 
                      cursor={{fill: '#F9FAFB'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[6, 6, 0, 0]} 
                      barSize={40} 
                      isAnimationActive={false}
                    >
                      {barDataSekolah.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        {/* === RIGHT COLUMN: ACTIONS & INFO === */}
        <div className="space-y-6">
          
          {/* Quick Actions Grid */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
               <h3 className="font-bold text-gray-800 text-lg">Akses Cepat</h3>
               <span className="text-xs text-primary font-medium cursor-pointer hover:underline">Lihat Semua</span>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <QuickActionBtn 
                label="Input Absensi" 
                desc="Isi kehadiran harian karyawan"
                icon={<CheckSquare size={20} />} 
                onClick={() => navigate('/absensi')}
                color="bg-blue-500"
              />

              {['SUPERADMIN', 'KSPPG', 'ADMINSPPG'].includes(role) && (
                <QuickActionBtn 
                  label="Data Karyawan" 
                  desc="Kelola database pegawai"
                  icon={<UserCog size={20} />} 
                  onClick={() => navigate('/karyawan')}
                  color="bg-indigo-500"
                />
              )}

              {['SUPERADMIN', 'KSPPG', 'ADMINSPPG'].includes(role) && (
                <QuickActionBtn 
                  label="Stok Bahan" 
                  desc="Cek ketersediaan stok gudang"
                  icon={<Package size={20} />} 
                  onClick={() => navigate('/inventory/stok-saat-ini')}
                  color="bg-orange-500"
                />
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <Card className="p-5">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                   <Bell size={16} className="text-gray-400" /> Aktivitas Terbaru
                </h3>
             </div>
             <div className="space-y-0 relative">
                {/* Timeline Line */}
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                {recentActivities.map((act, idx) => (
                   <div key={act.id} className="flex gap-4 relative py-3 group">
                      <div className={`w-5 h-5 rounded-full ${act.color} flex items-center justify-center border-2 border-white shadow-sm shrink-0 z-10`}>
                         {act.icon}
                      </div>
                      <div>
                         <p className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors cursor-pointer">{act.text}</p>
                         <p className="text-[10px] text-gray-400 mt-0.5">{act.time}</p>
                      </div>
                   </div>
                ))}
             </div>
             <button className="w-full text-center text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50 hover:text-primary transition-colors">
                Tampilkan Lebih Banyak
             </button>
          </Card>

          {/* DATABASE MONITOR */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm flex flex-col gap-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm border border-blue-50">
                      <Database size={18} />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Kapasitas Database</p>
                      <p className="text-[10px] text-blue-600 font-medium">Free Tier (1 GB)</p>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className={`text-lg font-bold ${parseFloat(storageStats.percentage) > 80 ? 'text-red-600' : 'text-blue-700'}`}>
                      {storageStats.percentage}%
                   </span>
                </div>
             </div>

             <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-blue-100 shadow-inner relative">
                <div 
                   className={`h-full rounded-full transition-all duration-1000 ease-out 
                      ${parseFloat(storageStats.percentage) > 90 ? 'bg-red-500' : 
                        parseFloat(storageStats.percentage) > 70 ? 'bg-yellow-500' : 'bg-green-500'}
                   `}
                   style={{ width: `${storageStats.percentage}%` }}
                ></div>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:10px_10px] opacity-30"></div>
             </div>

             <div className="flex justify-between items-center text-[10px] font-medium text-gray-500">
                <span className="flex items-center gap-1">
                   {parseFloat(storageStats.percentage) < 80 ? <CheckCircle2 size={12} className="text-green-500"/> : <AlertCircle size={12} className="text-red-500"/>}
                   Terpakai: <span className="text-gray-800 font-bold">{storageStats.usedMB} MB</span>
                </span>
                <span>Sisa: {Math.max(0, 1024 - parseFloat(storageStats.usedMB)).toFixed(2)} MB</span>
             </div>
             
             {parseFloat(storageStats.percentage) > 80 && (
                <div className="mt-1 bg-red-100 text-red-700 p-2 rounded-lg text-[10px] font-medium flex items-center gap-2 border border-red-200 animate-pulse">
                   <AlertCircle size={14} /> Peringatan: Penyimpanan hampir penuh. Segera hapus periode lama.
                </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};
