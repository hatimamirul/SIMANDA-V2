
import React from 'react';
import { Card, Toolbar } from '../components/UIComponents';
import { Construction, FileText, Archive, Clock, Sparkles } from 'lucide-react';

export const DocumentGeneratorPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-400 rounded-2xl">
                <FileText size={24} />
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Arsip & Dokumen</h2>
                <p className="text-sm text-gray-400 font-medium">Pusat penyimpanan berkas digital SPPG.</p>
            </div>
         </div>
      </div>

      {/* UNDER DEVELOPMENT PLACEHOLDER */}
      <Card className="p-24 flex flex-col items-center justify-center text-center bg-white border-none shadow-xl shadow-blue-900/5 rounded-[3rem] relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50 rounded-full -ml-24 -mb-24 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl relative z-10">
              <Archive size={56} className="animate-bounce" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2.5 rounded-2xl shadow-lg border-4 border-white text-yellow-950">
              <Construction size={24} strokeWidth={3} />
            </div>
          </div>

          <h2 className="text-3xl font-black text-gray-800 mb-4 tracking-tight uppercase">
            Fitur Sedang <span className="text-blue-600">Dikembangkan</span>
          </h2>
          
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed font-medium text-lg">
            Sistem Arsip Dokumen Digital & Visual Generator sedang dalam tahap finalisasi untuk memastikan keamanan dan akurasi data.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-500 uppercase tracking-widest">
              <Clock size={16} className="text-blue-500" /> Tahap Integrasi
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-500 uppercase tracking-widest">
              <Sparkles size={16} className="text-blue-500" /> High Performance
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-50 w-full max-w-lg">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">Mohon Tunggu Update Selanjutnya</p>
          </div>
        </div>
      </Card>

      {/* MINI INFO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-sm">
           <h4 className="font-bold text-gray-800 text-sm mb-2">Cloud Archive</h4>
           <p className="text-xs text-gray-400 leading-relaxed">Penyimpanan otomatis scan dokumen (Proposal, Surat Tugas, Kwitansi) di server awan.</p>
        </div>
        <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-sm">
           <h4 className="font-bold text-gray-800 text-sm mb-2">Visual Engine</h4>
           <p className="text-xs text-gray-400 leading-relaxed">Kemampuan mengisi PDF secara otomatis menggunakan database karyawan dan sekolah.</p>
        </div>
        <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-sm">
           <h4 className="font-bold text-gray-800 text-sm mb-2">Security Log</h4>
           <p className="text-xs text-gray-400 leading-relaxed">Setiap akses dokumen akan tercatat dalam log sistem untuk keamanan arsip negara.</p>
        </div>
      </div>
    </div>
  );
};
