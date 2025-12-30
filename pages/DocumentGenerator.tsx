
import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Input, PrintPreviewDialog, Logo } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Karyawan, PMSekolah, PMB3 } from '../types';
// Added School to lucide-react imports
import { FileText, Printer, FileEdit, Search, Info, School } from 'lucide-react';

type TemplateType = 'SURAT_TUGAS' | 'BERITA_ACARA' | 'TANDA_TERIMA_HONOR' | 'LAPORAN_PENDATAAN';

export const DocumentGeneratorPage: React.FC = () => {
  const [template, setTemplate] = useState<TemplateType>('SURAT_TUGAS');
  const [category, setCategory] = useState<'KARYAWAN' | 'SEKOLAH' | 'B3'>('KARYAWAN');
  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState<any>(null);
  
  // Lists for selection
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [schools, setSchools] = useState<PMSekolah[]>([]);
  const [b3s, setB3s] = useState<PMB3[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docNumber, setDocNumber] = useState('001/SPPG-TALES/2025');

  useEffect(() => {
    const unsubK = api.subscribeKaryawan(setEmployees);
    const unsubS = api.subscribePMs(setSchools);
    const unsubB = api.subscribeB3s(setB3s);
    return () => { unsubK(); unsubS(); unsubB(); };
  }, []);

  const handleGenerate = () => {
    let found = null;
    if (category === 'KARYAWAN') found = employees.find(e => e.id === selectedId);
    if (category === 'SEKOLAH') found = schools.find(s => s.id === selectedId);
    if (category === 'B3') found = b3s.find(b => b.id === selectedId);

    if (found) {
        setSelectedData(found);
        setIsPreviewOpen(true);
    } else {
        alert("Silahkan pilih data terlebih dahulu.");
    }
  };

  const getFullDate = (d: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));

  const renderTemplateContent = () => {
    if (!selectedData) return null;

    const LOGO_URI = "https://lh3.googleusercontent.com/d/1ocxhsbrHv2rNUe3r3kEma6oV167MGWea";

    return (
      <div className="text-black font-serif p-4">
        {/* Kop Surat Simetris */}
        <div className="grid grid-cols-[100px_1fr_100px] items-center border-b-4 border-black pb-4 mb-8">
            <div className="h-20 w-full flex items-center justify-center">
                <img src={LOGO_URI} alt="Logo" className="max-h-full object-contain" />
            </div>
            <div className="text-center px-4">
                <h1 className="text-2xl font-bold uppercase leading-tight">SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)</h1>
                <h2 className="text-sm font-bold uppercase tracking-wider mt-1">DESA TALES SETONO - KECAMATAN NGADILUWIH</h2>
                <p className="text-[10px] mt-1">Alamat: Setono, Tales, Kec. Ngadiluwih, Kab. Kediri, Jawa Timur 64171</p>
            </div>
            <div className="w-[100px]"></div>
        </div>

        {/* Judul Dokumen */}
        <div className="text-center mb-8">
           <h2 className="text-xl font-bold underline uppercase">
              {template.replace(/_/g, ' ')}
           </h2>
           <p className="font-bold">Nomor: {docNumber}</p>
        </div>

        {/* Isi Dokumen Berdasarkan Template */}
        <div className="space-y-6 leading-relaxed text-sm">
           {template === 'SURAT_TUGAS' && (
             <>
               <p>Yang bertanda tangan di bawah ini Kepala Satuan Pelayanan Pemenuhan Gizi (SPPG) Tales Setono, menugaskan kepada:</p>
               <table className="w-full ml-8">
                  <tbody>
                    <tr><td className="w-32 py-1">Nama</td><td>: <span className="font-bold">{selectedData.nama}</span></td></tr>
                    {category === 'KARYAWAN' && <tr><td className="py-1">NIK</td><td>: {selectedData.nik}</td></tr>}
                    {category === 'KARYAWAN' && <tr><td className="py-1">Divisi</td><td>: {selectedData.divisi}</td></tr>}
                    {category === 'SEKOLAH' && <tr><td className="py-1">NPSN</td><td>: {selectedData.npsn}</td></tr>}
                    {category === 'B3' && <tr><td className="py-1">Desa</td><td>: {selectedData.desa}</td></tr>}
                  </tbody>
               </table>
               <p>Untuk melaksanakan tugas pendataan dan pelayanan pemenuhan gizi di wilayah Kecamatan Ngadiluwih pada tanggal {getFullDate(docDate)} sampai dengan selesai.</p>
               <p>Demikian surat tugas ini diberikan untuk dapat dipergunakan sebagaimana mestinya dengan penuh tanggung jawab.</p>
             </>
           )}

           {template === 'BERITA_ACARA' && (
             <>
               <p>Pada hari ini, tanggal <span className="font-bold">{getFullDate(docDate)}</span>, telah dilakukan koordinasi antara SPPG Tales Setono dengan pihak terkait:</p>
               <table className="w-full ml-8">
                  <tbody>
                    <tr><td className="w-32 py-1">Subjek</td><td>: <span className="font-bold">{selectedData.nama}</span></td></tr>
                    <tr><td className="py-1">Keperluan</td><td>: Koordinasi Program Pemenuhan Gizi Nasional</td></tr>
                  </tbody>
               </table>
               <p>Hasil koordinasi menyatakan bahwa seluruh data telah diverifikasi dan siap untuk ditindaklanjuti sesuai dengan standar operasional prosedur yang berlaku.</p>
               <p>Berita acara ini dibuat dalam keadaan sadar untuk dipergunakan sebagai arsip administrasi.</p>
             </>
           )}

           {template === 'TANDA_TERIMA_HONOR' && (
             <>
               <p>Telah diterima uang sebesar <span className="font-bold italic"> (Terbilang: ........................................... ) </span> dari SPPG Tales Setono sebagai pembayaran Honorarium atas:</p>
               <table className="w-full ml-8">
                  <tbody>
                    <tr><td className="w-32 py-1">Penerima</td><td>: <span className="font-bold">{selectedData.nama}</span></td></tr>
                    {category === 'KARYAWAN' && <tr><td className="py-1">Tugas</td><td>: {selectedData.divisi}</td></tr>}
                    <tr><td className="py-1">Tanggal Bayar</td><td>: {getFullDate(docDate)}</td></tr>
                  </tbody>
               </table>
               <div className="border-2 border-black p-4 inline-block font-bold mt-4">
                  Rp. ...............................
               </div>
             </>
           )}
        </div>

        {/* Tanda Tangan */}
        <div className="mt-16 grid grid-cols-2 gap-16 px-8">
           <div className="text-center">
              <p className="mb-24">Penerima/Petugas,</p>
              <p className="font-bold underline">{selectedData.nama}</p>
           </div>
           <div className="text-center">
              <p>Ngadiluwih, {getFullDate(docDate)}</p>
              <p className="mb-24 font-bold">Kepala SPPG,</p>
              <p className="font-bold underline">Tiurmasi Saulina Sirait, S.T.</p>
           </div>
        </div>
      </div>
    );
  };

  const getCategoryOptions = () => {
    if (category === 'KARYAWAN') return employees.map(e => ({ value: e.id, label: `${e.nama} (${e.divisi})` }));
    if (category === 'SEKOLAH') return schools.map(s => ({ value: s.id, label: s.nama }));
    if (category === 'B3') return b3s.map(b => ({ value: b.id, label: `${b.nama} - ${b.desa}` }));
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
         <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <FileEdit size={24} />
         </div>
         <div>
            <h2 className="text-xl font-bold text-gray-800">Generator Dokumen Otomatis</h2>
            <p className="text-sm text-gray-500">Pilih template dan data subjek untuk mengisi dokumen secara otomatis.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-6 md:col-span-1 space-y-5 h-fit">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                <FileText size={18} className="text-primary"/> Pengaturan Dokumen
            </h3>
            
            <Select 
                label="Jenis Dokumen Template" 
                value={template} 
                onChange={e => setTemplate(e.target.value as TemplateType)} 
                options={[
                    { value: 'SURAT_TUGAS', label: 'Surat Tugas (Karyawan)' },
                    { value: 'BERITA_ACARA', label: 'Berita Acara Koordinasi' },
                    { value: 'TANDA_TERIMA_HONOR', label: 'Tanda Terima Pembayaran' },
                ]}
            />

            <Select 
                label="Sumber Data Subjek" 
                value={category} 
                onChange={e => { setCategory(e.target.value as any); setSelectedId(''); }} 
                options={[
                    { value: 'KARYAWAN', label: 'Data Karyawan' },
                    { value: 'SEKOLAH', label: 'Data PM Sekolah' },
                    { value: 'B3', label: 'Data PM B3' },
                ]}
            />

            <Select 
                label="Pilih Subjek / Subjek" 
                value={selectedId} 
                onChange={e => setSelectedId(e.target.value)} 
                options={[{value: '', label: '-- Pilih --'}, ...getCategoryOptions()]}
            />

            <Input 
                label="Nomor Dokumen" 
                value={docNumber} 
                onChange={e => setDocNumber(e.target.value)} 
            />

            <Input 
                label="Tanggal Dokumen" 
                type="date" 
                value={docDate} 
                onChange={e => setDocDate(e.target.value)} 
            />

            <div className="pt-4">
                <Button onClick={handleGenerate} className="w-full" icon={<Printer size={18}/>}>Generate Dokumen</Button>
            </div>
         </Card>

         <div className="md:col-span-2 space-y-6">
            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 flex gap-4">
                <Info className="text-amber-600 shrink-0" size={20} />
                <div className="text-sm text-amber-900 leading-relaxed">
                    <p className="font-bold mb-1">Panduan Penggunaan</p>
                    <ul className="list-disc ml-4 space-y-1">
                        <li>Pilih template yang ingin Anda gunakan.</li>
                        <li>Pilih kategori data (Karyawan/Sekolah/B3).</li>
                        <li>Sistem akan menarik data real-time untuk mengisi variabel nama, NIK, dan lokasi.</li>
                        <li>Klik "Generate" untuk melihat preview dan mencetak dokumen.</li>
                    </ul>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-primary transition-colors cursor-pointer group">
                   <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <FileText size={24} />
                   </div>
                   <div>
                      <h4 className="font-bold text-gray-800">Template Karyawan</h4>
                      <p className="text-xs text-gray-400">Surat Tugas, Slip Gaji, Tanda Terima.</p>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-primary transition-colors cursor-pointer group">
                   <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <School size={24} />
                   </div>
                   <div>
                      <h4 className="font-bold text-gray-800">Template Sekolah</h4>
                      <p className="text-xs text-gray-400">Berita Acara, Serah Terima PM.</p>
                   </div>
                </div>
            </div>
         </div>
      </div>

      <PrintPreviewDialog 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Preview Dokumen Arsip"
        filename={`${template}_${selectedData?.nama?.replace(/\s+/g, '_')}`}
      >
        {renderTemplateContent()}
      </PrintPreviewDialog>
    </div>
  );
};
