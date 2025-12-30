
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from '../components/UIComponents';
import { Card } from '../components/UIComponents';
import { api } from '../services/mockService';
import { DashboardStats, User, Role, PMSekolah } from '../types';
import { 
  Users, School, Baby, Activity, Calendar, 
  TrendingUp, ArrowRight, CheckSquare,
  Package, UserCog, Bell,
  ArrowUpRight, Database, AlertCircle, CheckCircle2,
  FileCheck, FileClock, GraduationCap, FileText, PieChart as PieIcon, ListChecks,
  Clock, LayoutGrid, Zap, MapPin
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend
} from 'recharts';

// --- SUB-COMPONENTS ---

const StatCard = React.memo(({ title, count, icon, colorClass, bgClass, trend, isLoading }: { title: string, count: number, icon: React.ReactNode, colorClass: string, bgClass: string, trend?: string, isLoading: boolean }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 relative group overflow-hidden">
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgClass} ${colorClass} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      {trend && (
         <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
           <TrendingUp size={10} /> {trend}
         </div>
      )}
    </div>
    <div className="relative z-10">
      {isLoading ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
      ) : (
          <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{new Intl.NumberFormat('id-ID').format(count)}</h3>
      )}
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-1">{title}</p>
    </div>
    <div className={`absolute -right-2 -bottom-2 opacity-[0.03] transform rotate-12 group-hover:scale-125 transition-transform duration-500 ${colorClass}`}>
       {React.cloneElement(icon as React.ReactElement<any>, { size: 70 })}
    </div>
  </div>
));

const ProposalStatusWidget = React.memo(({ title, subtitle, icon, total, sudah, belum, type, isLoading }: { title: string, subtitle: string, icon: any, total: number, sudah: number, belum: number, type: 'siswa' | 'guru', isLoading: boolean }) => {
   const percentSudah = total > 0 ? Math.round((sudah / total) * 100) : 0;
   const isSiswa = type === 'siswa';
   const lightBg = isSiswa ? 'bg-blue-50' : 'bg-purple-50';
   const iconColor = isSiswa ? 'text-blue-600' : 'text-purple-600';
   const gradientId = isSiswa ? 'gradSiswa' : 'gradGuru';
   const startColor = isSiswa ? '#3B82F6' : '#8B5CF6';
   const endColor = isSiswa ? '#0EA5E9' : '#D946EF';
   const startAngle = 220;
   const maxAngleSpan = 260;
   const endAngleTrack = startAngle - maxAngleSpan;
   const endAngleValue = startAngle - ((percentSudah / 100) * maxAngleSpan);
   const trackData = useMemo(() => [{ value: 1 }], []);

   return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lightBg} ${iconColor} shadow-inner`}>
                  {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
              </div>
              <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{subtitle}</p>
                  <h4 className="font-bold text-gray-800 text-sm leading-tight">{title}</h4>
              </div>
          </div>
          <div className="flex items-center justify-between gap-4">
              <div className="relative w-28 h-28 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <defs>
                              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor={startColor} />
                                  <stop offset="100%" stopColor={endColor} />
                              </linearGradient>
                          </defs>
                          <Pie
                              data={trackData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={50}
                              startAngle={startAngle}
                              endAngle={endAngleTrack}
                              dataKey="value"
                              stroke="none"
                              fill="#F3F4F6"
                              cornerRadius={5}
                              isAnimationActive={false} 
                          />
                          {!isLoading && percentSudah > 0 && (
                              <Pie
                                  data={trackData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={50}
                                  startAngle={startAngle}
                                  endAngle={endAngleValue}
                                  dataKey="value"
                                  stroke="none"
                                  cornerRadius={5}
                                  fill={`url(#${gradientId})`}
                                  isAnimationActive={false} 
                              />
                          )}
                      </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      {isLoading ? (
                          <div className="h-6 w-10 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                          <span className={`text-xl font-extrabold ${iconColor}`}>{percentSudah}%</span>
                      )}
                  </div>
              </div>
              <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500 font-bold uppercase">Total Target</span>
                      <span className="font-black text-gray-800">{total.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-gray-100 w-full"></div>
                  <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              <span className="text-gray-600 font-medium">Sudah</span>
                          </div>
                          <span className="font-bold text-gray-800">{sudah.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
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
    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md hover:bg-blue-50/30 transition-all duration-200 text-left group w-full"
  >
    <div className={`p-2.5 rounded-lg text-white shadow-sm group-hover:scale-110 transition-transform duration-300 ${color}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{label}</h4>
      <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{desc}</p>
    </div>
    <ArrowRight size={14} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
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

  const [schools, setSchools] = useState<PMSekolah[]>([]); 
  const [storageStats, setStorageStats] = useState({ usedMB: "0", totalMB: 1024, percentage: "0" });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataLoading, setDataLoading] = useState(true);

  const currentUser: User | null = (() => {
    try { return JSON.parse(localStorage.getItem('simanda_user') || '{}'); } catch { return null; }
  })();
  const role = currentUser?.jabatan as Role;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    setDataLoading(true);
    const unsubscribeStats = api.subscribeStats((data) => {
        setStats(data);
    });

    const unsubscribeSchools = api.subscribePMs((data) => {
        setSchools(data);
        setDataLoading(false);
    });

    const updateStorage = () => setStorageStats(api.getStorageStats());
    updateStorage();
    const storageTimer = setInterval(updateStorage, 5000);
    
    return () => {
      clearInterval(timer);
      clearInterval(storageTimer);
      unsubscribeStats();
      unsubscribeSchools();
    };
  }, []);

  const hour = currentTime.getHours();
  let greeting = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
  else if (hour >= 18) greeting = 'Selamat Malam';

  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Filtered List for Table
  const proposalInSchools = useMemo(() => {
     return schools.filter(s => s.statusProposal === 'SUDAH').sort((a, b) => a.nama.localeCompare(b.nama));
  }, [schools]);

  // Grand Totals for Table
  const totals = useMemo(() => {
     return proposalInSchools.reduce((acc, s) => ({
        pmBesar: acc.pmBesar + (s.pmBesar || 0),
        pmKecil: acc.pmKecil + (s.pmKecil || 0),
        guru: acc.guru + (s.jmlguru || 0)
     }), { pmBesar: 0, pmKecil: 0, guru: 0 });
  }, [proposalInSchools]);

  // Chart Data
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
    { id: 1, text: "Absensi Harian diperbarui", time: "Baru saja", icon: <CheckSquare size={12} />, color: "bg-green-100 text-green-600" },
    { id: 2, text: "Stok Beras Masuk Gudang", time: "1 jam lalu", icon: <Package size={12} />, color: "bg-blue-100 text-blue-600" },
    { id: 3, text: "Update Proposal SDN 1 Tales", time: "3 jam lalu", icon: <School size={12} />, color: "bg-purple-100 text-purple-600" },
  ], []);

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-[1600px] mx-auto">
      
      {/* === HERO SECTION === */}
      <div className="relative bg-gradient-to-br from-[#1e40af] via-[#2A6F97] to-[#0ea5e9] rounded-[2rem] p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400 opacity-[0.07] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-blue-100 font-bold text-[10px] uppercase tracking-[0.2em] backdrop-blur-md bg-white/10 px-4 py-1.5 rounded-full mb-6 border border-white/10">
               <Calendar size={12} /> {dateStr}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
              {greeting}, <span className="text-yellow-300">{currentUser?.nama?.split(' ')[0] || 'Admin'}</span>
            </h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base leading-relaxed opacity-80 mx-auto lg:mx-0">
              Sistem Manajemen Data Terpadu Satuan Pelayanan Pemenuhan Gizi. Semua layanan terpantau dalam kendali Anda.
            </p>
          </div>

          <div className="flex flex-row items-center gap-4">
             <div className="bg-black/20 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-3xl text-center shadow-2xl">
                <span className="text-[10px] text-blue-200 uppercase tracking-[0.2em] font-black block mb-2">Pukul</span>
                <span className="text-4xl font-mono font-black tracking-widest text-white drop-shadow-md">{timeStr}</span>
             </div>
             <div className="hidden sm:flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-xl border border-emerald-400/20 backdrop-blur-sm">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                   SERVER ONLINE
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-blue-300 bg-blue-400/10 px-3 py-1.5 rounded-xl border border-blue-400/20 backdrop-blur-sm">
                   <Zap size={10} className="fill-current"/> REALTIME SYNC
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* === ROW 1: KEY METRICS === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Personil Karyawan" 
          count={stats.karyawan} 
          icon={<Users size={22} />} 
          bgClass="bg-blue-50"
          colorClass="text-blue-600"
          trend="+2 Minggu Ini"
          isLoading={dataLoading}
        />
        <StatCard 
          title="Lembaga Sekolah" 
          count={stats.pmsekolah} 
          icon={<School size={22} />} 
          bgClass="bg-indigo-50"
          colorClass="text-indigo-600"
          isLoading={dataLoading}
        />
        <StatCard 
          title="Prioritas B3" 
          count={stats.pmb3} 
          icon={<Baby size={22} />} 
          bgClass="bg-pink-50"
          colorClass="text-pink-600"
          trend="Stabil"
          isLoading={dataLoading}
        />
        <StatCard 
          title="Total Penerima" 
          count={totalPM} 
          icon={<Activity size={22} />} 
          bgClass="bg-emerald-50"
          colorClass="text-emerald-600"
          trend="Aktif"
          isLoading={dataLoading}
        />
      </div>

      {/* === ROW 2: SCHOOL PROPOSAL FOCUS === */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Summary Table */}
          <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-gray-800 text-base uppercase tracking-wider flex items-center gap-2">
                      <ListChecks className="text-primary" size={18}/> Rekapitulasi Proposal Masuk
                  </h3>
                  <div className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-tighter">Terakhir Sinkron: Baru Saja</div>
              </div>
              
              <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                          <thead>
                              <tr className="bg-gray-50/50 border-b border-gray-100">
                                  <th className="p-4 font-black text-gray-400 uppercase text-[9px] tracking-widest w-12 text-center">No</th>
                                  <th className="p-4 font-black text-gray-600 uppercase text-[9px] tracking-widest">Nama Lembaga Pendidikan</th>
                                  <th className="p-4 font-black text-gray-500 uppercase text-[9px] tracking-widest">Desa</th>
                                  <th className="p-4 font-black text-blue-600 uppercase text-[9px] tracking-widest text-center">P. Besar</th>
                                  <th className="p-4 font-black text-red-600 uppercase text-[9px] tracking-widest text-center">P. Kecil</th>
                                  <th className="p-4 font-black text-purple-600 uppercase text-[9px] tracking-widest text-center">Guru</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 bg-white">
                              {dataLoading ? (
                                  [...Array(5)].map((_, i) => (
                                      <tr key={i}><td colSpan={6} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse"></div></td></tr>
                                  ))
                              ) : proposalInSchools.length === 0 ? (
                                  <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic font-medium">Belum ada data proposal dengan status 'SUDAH'</td></tr>
                              ) : (
                                  proposalInSchools.map((s, idx) => (
                                      <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                                          <td className="p-4 text-gray-400 font-mono text-xs text-center">{idx + 1}</td>
                                          <td className="p-4 font-bold text-gray-700">{s.nama}</td>
                                          <td className="p-4">
                                            <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                              <MapPin size={10} className="text-gray-400"/> {s.desa || '-'}
                                            </span>
                                          </td>
                                          <td className="p-4 text-center font-mono font-black text-blue-700">{s.pmBesar || 0}</td>
                                          <td className="p-4 text-center font-mono font-black text-red-700">{s.pmKecil || 0}</td>
                                          <td className="p-4 text-center font-mono font-black text-purple-700">{s.jmlguru || 0}</td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                          {!dataLoading && proposalInSchools.length > 0 && (
                              <tfoot className="bg-slate-900 text-white font-bold">
                                  <tr>
                                      <td colSpan={3} className="p-5 text-right uppercase tracking-[0.2em] text-[10px] text-slate-400 border-r border-slate-800">Total Keseluruhan</td>
                                      <td className="p-5 text-center font-mono text-xl text-yellow-400 font-black">{totals.pmBesar}</td>
                                      <td className="p-5 text-center font-mono text-xl text-yellow-400 font-black">{totals.pmKecil}</td>
                                      <td className="p-5 text-center font-mono text-xl text-yellow-400 font-black">{totals.guru}</td>
                                  </tr>
                              </tfoot>
                          )}
                      </table>
                  </div>
              </Card>
          </div>

          {/* Progress Indicators Column */}
          <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-gray-800 text-base uppercase tracking-wider flex items-center gap-2">
                      <FileText className="text-primary" size={18}/> Progress Data
                  </h3>
              </div>
              <div className="grid grid-cols-1 gap-4 h-fit">
                  <ProposalStatusWidget 
                      title="Siswa Terdata"
                      subtitle="Status Proposal" 
                      icon={<School size={24} />} 
                      total={(stats.pmBesar || 0) + (stats.pmKecil || 0)}
                      sudah={stats.siswaSudahProposal}
                      belum={stats.siswaBelumProposal}
                      type="siswa"
                      isLoading={dataLoading}
                  />
                  <ProposalStatusWidget 
                      title="Guru & Staff"
                      subtitle="Status Proposal" 
                      icon={<GraduationCap size={24} />} 
                      total={stats.guru}
                      sudah={stats.guruSudahProposal}
                      belum={stats.guruBelumProposal}
                      type="guru"
                      isLoading={dataLoading}
                  />
              </div>
          </div>
      </div>

      {/* === ROW 3: VISUAL ANALYSIS & ACTIONS === */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Composition Chart */}
        <div className="lg:col-span-4 h-full">
            <Card className="h-full border border-gray-100 flex flex-col p-6 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">Komposisi PM B3</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Balita, Ibu Hamil & Menyusui</p>
                </div>
                <PieIcon size={18} className="text-gray-300"/>
              </div>
              
              <div className="flex-1 relative flex flex-col items-center justify-center min-h-[220px]">
                <ResponsiveContainer width="100%" height={220}>
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
                    </defs>
                    <Pie
                      data={pieDataB3}
                      cx="50%"
                      cy="50%"
                      innerRadius={65} 
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                      cornerRadius={8}
                      isAnimationActive={false}
                    >
                      {pieDataB3.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#${entry.gradientId})`} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pb-2">
                   <span className="text-2xl font-black text-gray-800">{stats.pmb3}</span>
                   <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Jiwa</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-3 gap-2">
                 <div className="text-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mx-auto mb-1.5"></div>
                    <p className="text-[8px] uppercase font-black text-gray-400 mb-0.5">Balita</p>
                    <p className="text-xs font-black text-gray-800">{stats.balita}</p>
                 </div>
                 <div className="text-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mx-auto mb-1.5"></div>
                    <p className="text-[8px] uppercase font-black text-gray-400 mb-0.5">Hamil</p>
                    <p className="text-xs font-black text-gray-800">{stats.ibuHamil}</p>
                 </div>
                 <div className="text-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto mb-1.5"></div>
                    <p className="text-[8px] uppercase font-black text-gray-400 mb-0.5">Busui</p>
                    <p className="text-xs font-black text-gray-800">{stats.ibuMenyusui}</p>
                 </div>
              </div>
            </Card>
        </div>

        {/* Bar Chart Analysis */}
        <div className="lg:col-span-4 h-full">
            <Card className="h-full border border-gray-100 p-6 rounded-2xl hover:shadow-md transition-shadow flex flex-col">
               <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">Statistik Sekolah</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Distribusi Penerima Per Unit</p>
                </div>
                <LayoutGrid size={18} className="text-gray-300"/>
              </div>
              <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barDataSekolah} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} 
                      dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10}} />
                    <Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={32} isAnimationActive={false}>
                      {barDataSekolah.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
        </div>

        {/* Database & Activity Info */}
        <div className="lg:col-span-4 space-y-6">
           {/* QUICK ACTIONS ROW */}
           <div className="grid grid-cols-1 gap-3">
              <QuickActionBtn 
                label="Absensi Harian" 
                desc="Input kehadiran pegawai SPPG"
                icon={<CheckSquare />} 
                onClick={() => navigate('/absensi')}
                color="bg-blue-600"
              />
              <QuickActionBtn 
                label="Logistik Gudang" 
                desc="Manajemen stok bahan baku"
                icon={<Package />} 
                onClick={() => navigate('/inventory/stok-saat-ini')}
                color="bg-orange-500"
              />
           </div>

           {/* DATABASE MONITOR MINI */}
           <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20"><Database size={40}/></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cloud Storage</p>
                    <h4 className="text-sm font-bold">Infrastruktur Database</h4>
                 </div>
                 <span className={`text-sm font-black ${parseFloat(storageStats.percentage) > 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {storageStats.percentage}%
                 </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3 relative z-10">
                 <div 
                    className={`h-full transition-all duration-1000 ${parseFloat(storageStats.percentage) > 90 ? 'bg-red-500' : parseFloat(storageStats.percentage) > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${storageStats.percentage}%` }}
                 ></div>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 relative z-10 uppercase tracking-tighter">
                 <span>Terpakai: {storageStats.usedMB} MB</span>
                 <span>Sisa: {Math.max(0, 1024 - parseFloat(storageStats.usedMB)).toFixed(1)} MB</span>
              </div>
           </div>

           {/* RECENT ACTIVITY SMALL */}
           <Card className="p-5 border border-gray-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                 <Bell size={14} className="text-primary" />
                 <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Aktivitas Terkini</h4>
              </div>
              <div className="space-y-4">
                 {recentActivities.map((act) => (
                    <div key={act.id} className="flex gap-3 items-start group cursor-pointer">
                       <div className={`w-6 h-6 rounded-lg ${act.color} flex items-center justify-center shrink-0`}>
                          {act.icon}
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-gray-700 leading-tight line-clamp-1">{act.text}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-medium">{act.time}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
