
import React from 'react';
import { Card, Toolbar } from '../components/UIComponents';
import { Construction } from 'lucide-react';

export const HonorPICSekolahPage: React.FC = () => {
  return (
    <div>
      <Toolbar 
        title="Honorarium PIC Sekolah" 
        onSearch={() => {}} 
        onAdd={() => {}} 
        onExport={() => {}} 
        searchPlaceholder="Search..."
      />
      <Card className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <Construction size={40} className="text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Halaman Dalam Pengembangan</h2>
        <p className="text-gray-500 max-w-md">
          Fitur Manajemen Honorarium PIC Sekolah sedang disiapkan. Silahkan kembali lagi nanti.
        </p>
      </Card>
    </div>
  );
};
