

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/UIComponents';
import { api } from '../services/mockService';
import { DashboardStats } from '../types';
import { 
  Users, School, Baby, Activity, Calendar, Clock, 
  TrendingUp, ArrowRight, PlusCircle, CheckSquare, FileText,
  GraduationCap
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
  if (hour >= 12 && hour < 15) greeting = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
  else if (hour >= 18) greeting = 'Selamat Malam';

  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // --- DATA PREPARATION ---

  // 1. Donut Chart: Komposisi PM B3
  const pieDataB3 = [
    { name: 'Balita', value: stats.balita, color: '#FFD166' },      // Yellow
    { name: 'Ibu Hamil', value: stats.ibuHamil, color: '#EF476F' }, // Pink/Red
    { name: 'Ibu Menyusui', value: stats.ibuMenyusui, color: '#06D6A0' }, // Green
  ].filter(d => d.value > 0); // Hide zero values

  // 2. Bar Chart: Statistik Sekolah
  const barDataSekolah = [
    { name: 'Guru', value: stats.guru, color: '#118AB2' },
    { name: 'PM Kecil', value: stats.pmKecil, color: '#48CAE4' },
    { name: 'PM Besar', value: stats.pmBesar, color: '#0077B6' },
  ];

  // Total Penerima Manfaat (Sekolah + B3)
  const totalPM = (stats.pmKecil || 0) + (stats.pmBesar || 0) + stats.pmb3;

  // --- COMPONENTS ---

  const StatCard = ({ title, count, icon, color, subText }: { title: string, count: number, icon: React.ReactNode, color: string, subText?: string }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp size={12} />
            <span>Aktif</span>
          </div>
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-1">{new Intl.NumberFormat('id-ID').format(count)}</h3>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        {subText && <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">{subText}</p>}
      </div>
      
      {/* Background Decoration */}
      <div 
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 pointer-events-none group-hover:scale-150 transition-transform duration-500"
        style={{ backgroundColor: color }}
      />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* === HERO SECTION === */}
      <div className="relative bg-gradient-to-r from-[#1A4D6F] to-[#2A6F97] rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-blue-900/10 overflow-hidden">
        {/* Abstract Pattern Overlay */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent opacity-10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-100/80 text-sm font-medium">
               <Calendar size={16} /> {dateStr}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
              {greeting}, <span className="text-blue-200">Admin!</span>
            </h1>
            <p className="text-blue-100 max-w-xl text-sm md:text-base leading-relaxed opacity-90">
              Selamat datang di Dashboard SIMANDA SPPG. Berikut adalah ringkasan aktivitas dan statistik data terkini.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <Clock className="text-accent" size={24} />
            <span className="text-2xl font-mono font-bold tracking-wider">{timeStr}</span>
          </div>
        </div>
      </div>

      {/* === KEY METRICS (5 COLUMNS) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="Total Karyawan" 
          count={stats.karyawan} 
          icon={<Users size={24} />} 
          color="#2A6F97" 
          subText="Divisi & Operasional"
        />
        <StatCard 
          title="Total Sekolah" 
          count={stats.pmsekolah} 
          icon={<School size={24} />} 
          color="#61A5C2" 
          subText={`Terdiri dari ${stats.pmsekolah} Institusi`}
        />
        <StatCard 
          title="Total Guru" 
          count={stats.guru} 
          icon={<GraduationCap size={24} />} 
          color="#E9C46A" 
          subText="Tenaga Pendidik"
        />
        <StatCard 
          title="Penerima Manfaat B3" 
          count={stats.pmb3} 
          icon={<Baby size={24} />} 
          color="#F4A261" 
          subText="Balita, Ibu Hamil & Menyusui"
        />
        <StatCard 
          title="Total Penerima Manfaat" 
          count={totalPM} 
          icon={<Activity size={24} />} 
          color="#264653" 
          subText="Gabungan Sekolah & B3"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* === LEFT COLUMN: CHARTS (2/3 width) === */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card className="p-6 flex flex-col min-h-[350px]">
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 text-lg">Komposisi PM B3</h3>
                <p className="text-sm text-gray-400">Proporsi Balita, Ibu Hamil, Menyusui</p>
              </div>
              <div className="flex-1 w-full relative">
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
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                   <span className="text-2xl font-bold text-gray-300 opacity-20">{stats.pmb3}</span>
                </div>
              </div>
            </Card>

            {/* Bar Chart */}
            <Card className="p-6 flex flex-col min-h-[350px]">
              <div className="mb-4">
                <h3 className="font-bold text-gray-800 text-lg">Statistik Sekolah</h3>
                <p className="text-sm text-gray-400">Perbandingan Guru & Siswa (PM)</p>
              </div>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barDataSekolah} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#9CA3AF', fontSize: 12}} 
                      dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#F9FAFB'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
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

        {/* === RIGHT COLUMN: ACTIONS & INFO (1/3 width) === */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary"/> Akses Cepat
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/absensi')}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <span className="font-semibold block text-sm">Input Absensi</span>
                    <span className="text-xs opacity-70">Monitor kehadiran harian</span>
                  </div>
                </div>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </button>

              <button 
                onClick={() => navigate('/karyawan')}
                className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm">
                    <PlusCircle size={18} />
                  </div>
                  <div>
                    <span className="font-semibold block text-sm">Data Karyawan</span>
                    <span className="text-xs opacity-70">Kelola data pegawai</span>
                  </div>
                </div>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </button>

              <button 
                onClick={() => navigate('/honor-karyawan')}
                className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition-colors group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg text-emerald-600 shadow-sm">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="font-semibold block text-sm">Laporan Gaji</span>
                    <span className="text-xs opacity-70">Cek honorarium periode</span>
                  </div>
                </div>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>
          </Card>

          {/* System Info (Mini) */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg">
            <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Activity size={18} className="text-green-400"/> System Status
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                <span className="text-gray-400">Database</span>
                <span className="text-green-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                <span className="text-gray-400">Mode</span>
                <span className="text-blue-300 font-mono">Realtime</span>
              </div>
              <div className="pt-2 text-xs text-gray-500">
                Last synced: {timeStr}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
