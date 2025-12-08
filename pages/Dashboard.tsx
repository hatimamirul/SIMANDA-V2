
import React, { useEffect, useState } from 'react';
import { Card } from '../components/UIComponents';
import { api } from '../services/mockService';
import { DashboardStats } from '../types';
import { Users, School, Baby, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
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

  useEffect(() => {
    // Switch to Realtime Subscription
    // This will fire immediately with current data, and then whenever Firestore changes
    const unsubscribe = api.subscribeStats(setStats);
    return () => unsubscribe();
  }, []);

  // Chart 1: General Summary (Karyawan, Sekolah, Total B3)
  const generalChartData = [
    { name: 'Karyawan', value: stats.karyawan, color: '#2A6F97' },
    { name: 'Sekolah', value: stats.pmsekolah, color: '#468FAF' },
    { name: 'Total B3', value: stats.pmb3, color: '#D4AF37' },
  ];

  // Chart 2: Detailed Summary (PM Kecil, PM Besar, Guru, Balita, Ibu Hamil, Ibu Menyusui)
  const detailChartData = [
    { name: 'PM Kecil', value: stats.pmKecil, color: '#61A5C2' },
    { name: 'PM Besar', value: stats.pmBesar, color: '#89C2D9' },
    { name: 'Guru', value: stats.guru, color: '#A9D6E5' },
    { name: 'Balita', value: stats.balita, color: '#E9C46A' },
    { name: 'Ibu Hamil', value: stats.ibuHamil, color: '#F4A261' },
    { name: 'Ibu Menyusui', value: stats.ibuMenyusui, color: '#E76F51' },
  ];

  const StatCard = ({ title, count, icon, color }: { title: string, count: number, icon: React.ReactNode, color: string }) => (
    <Card className="p-6 flex items-center justify-between hover:translate-y-[-4px] transition-transform duration-300 border-b-4" style={{ borderColor: color }}>
      <div>
        <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</p>
        <h3 className="text-4xl font-bold text-gray-800 mt-2">{count}</h3>
      </div>
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300" 
        style={{ backgroundColor: `${color}25` }}
      >
        {React.cloneElement(icon as React.ReactElement<any>, { size: 32, style: { color: color } })}
      </div>
    </Card>
  );

  const CustomChart = ({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{fill: '#6B7280', fontSize: 11, fontWeight: 500}} 
          interval={0}
          angle={-30}
          textAnchor="end"
        />
        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
        <Tooltip 
          cursor={{fill: '#F3F4F6'}}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          formatter={(value: number) => [value, 'Total']}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="bg-gradient-to-r from-primary to-[#184e6e] rounded-2xl p-8 text-white shadow-xl shadow-primary/20">
        <h1 className="text-3xl font-bold mb-2">Selamat Datang di SIMANDA SPPG</h1>
        <p className="text-blue-100 max-w-2xl">
          Sistem Manajemen Data untuk SPPG. Kelola Data Karyawan, Data Penerima Manfaat Sekolah dan B3 dengan mudah dan efisien.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Karyawan" count={stats.karyawan} icon={<Users />} color="#2A6F97" />
        <StatCard title="Total Sekolah" count={stats.pmsekolah} icon={<School />} color="#61A5C2" />
        <StatCard title="Total B3" count={stats.pmb3} icon={<Baby />} color="#D4AF37" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Summary Chart */}
        <Card className="p-6 min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-primary"/> Ringkasan Umum
          </h3>
          <div className="h-[300px] w-full">
            <CustomChart data={generalChartData} />
          </div>
        </Card>

        {/* Detailed Summary Chart */}
        <Card className="p-6 min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-accent"/> Ringkasan Detail
          </h3>
          <div className="h-[300px] w-full">
            <CustomChart data={detailChartData} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Informasi Sistem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="bg-blue-200 p-2 rounded-full text-blue-700">
                <Activity size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Mode Realtime</h4>
                <p className="text-sm text-blue-700">Aktif. Data diperbarui secara otomatis menggunakan Firestore.</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h4 className="font-semibold text-gray-800 mb-2">Pembaruan Terakhir</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                <li>Integrasi Realtime Database (Firebase ready).</li>
                <li>Sinkronisasi otomatis antar tab/device.</li>
                <li>Peningkatan performa dashboard dan absensi.</li>
              </ul>
            </div>
        </div>
      </Card>
    </div>
  );
};
