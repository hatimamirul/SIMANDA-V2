
import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Input, PrintPreviewDialog, Logo } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Karyawan, PMSekolah, PMB3 } from '../types';
import { FileText, Printer, FileEdit, Search, Info, School, Utensils, RotateCcw, UserPlus } from 'lucide-react';

type TemplateType = 'SURAT_TUGAS' | 'BERITA_ACARA' | 'TANDA_TERIMA_HONOR' | 'BA_PENERIMAAN_MAKANAN' | 'BA_PENGEMBALIAN_KOTAK';

export const DocumentGeneratorPage: React.FC = () => {
  const [template, setTemplate] = useState<TemplateType>('SURAT_TUGAS');
  const [category, setCategory] = useState<'KARYAWAN' | 'SEKOLAH' | 'B3'>('KARYAWAN');
  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState<any>(null);
  
  // Additional Fields for the new templates
  const [extraFields, setExtraFields] = useState({
    jamKejadian: '07:30',
    jamExpired: '11:00',
    jumlahPorsi: '',
    jumlahOmpreng: '',
    namaPenyerah: '',
    telpPenyerah: '',
    namaPenerima: '',
    telpPenerima: ''
  });

  // Lists for selection
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [schools, setSchools] = useState<PMSekolah[]>([]);
  const [b3s, setB3s] = useState<PMB3[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [docNumber, setDocNumber] = useState(`001/BA-SPPG/${new Date().getFullYear()}`);

  useEffect(() => {
    const unsubK = api.subscribeKaryawan(setEmployees);
    const unsubS = api.subscribePMs(setSchools);
    const unsubB = api.subscribeB3s(setB3s);
    return () => { unsubK(); unsubS(); unsubB(); };
  }, []);

  // Auto-switch category based on template logic
  useEffect(() => {
    if (template === 'BA_PENERIMAAN_MAKANAN' || template === 'BA_PENGEMBALIAN_KOTAK') {
      setCategory('SEKOLAH');
    }
  }, [template]);

  const handleGenerate = () => {
    let found = null;
    if (category === 'KARYAWAN') found = employees.find(e => e.id === selectedId);
    if (category === 'SEKOLAH') found = schools.find(s => s.id === selectedId);
    if (category === 'B3') found = b3s.find(b => b.id === selectedId);

    if (found) {
        setSelectedData(found);
        setIsPreviewOpen(true);
    } else {
        alert("Silahkan pilih data subjek (Sekolah/Karyawan) terlebih dahulu.");
    }
  };

  const getFullDate = (d: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
  const getDayName = (d: string) => new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date(d));

  const renderTemplateContent = () => {
    if (!selectedData) return null;

    const LOGO_URI = "https://lh3.googleusercontent.com/d/1ocxhsbrHv2rNUe3r3kEma6oV167MGWea";

    return (
      <div className="text-black font-serif p-4">
        {/* Kop Surat Simetris */}
        <div className="grid grid-cols-[100px_1fr_100px] items-center border-b-4 border-black pb-4 mb-6">
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
           <h2 className="text-lg font-bold uppercase leading-tight">
              {template === 'BA_PENERIMAAN_MAKANAN' && "BERITA ACARA PENERIMAAN PAKET MAKANAN PROGRAM MAKAN BERGIZI GRATIS"}
              {template === 'BA_PENGEMBALIAN_KOTAK' && "BERITA ACARA PENGEMBALIAN KOTAK MAKAN PROGRAM MAKAN BERGIZI GRATIS"}
              {template === 'SURAT_TUGAS' && "SURAT TUGAS OPERASIONAL"}
              {template === 'BERITA_ACARA' && "BERITA ACARA KOORDINASI"}
              {template === 'TANDA_TERIMA_HONOR' && "TANDA TERIMA HONORARIUM"}
           </h2>
           <h3 className="text-md font-bold uppercase mt-1">SATUAN PELAYANAN PEMENUHAN GIZI (SPPG) TALES , KABUPATEN KEDIRI</h3>
           {template !== 'BA_PENERIMAAN_MAKANAN' && template !== 'BA_PENGEMBALIAN_KOTAK' && (
             <p className="font-bold mt-2">Nomor: {docNumber}</p>
           )}
        </div>

        {/* Isi Dokumen */}
        <div className="space-y-6 leading-relaxed text-[13px]">
           {/* TEMPLATE BARU: PENERIMAAN MAKANAN */}
           {template === 'BA_PENERIMAAN_MAKANAN' && (
             <div className="space-y-4">
                <p>
                  Pada Hari <span className="font-bold">{getDayName(docDate)}</span> Tanggal <span className="font-bold">{getFullDate(docDate)}</span> Jam <span className="font-bold">{extraFields.jamKejadian}</span> telah diterima paket makanan sejumlah <span className="font-bold">{extraFields.jumlahPorsi || '..........'}</span> porsi dari Satuan Pelayanan Pemenuhan Gizi (SPPG) Tales Kabupaten Kediri yang melayani <span className="font-bold">{selectedData.nama}</span>. Baik dimakan sebelum jam <span className="font-bold">{extraFields.jamExpired}</span>.
                </p>
                
                <div className="mt-12 grid grid-cols-3 gap-4 text-center">
                   <div className="flex flex-col justify-between h-40">
                      <p>Yang Menyerahkan :</p>
                      <p>Nomor Telepon : {extraFields.telpPenyerah || '....................'}</p>
                      <div className="mt-auto">
                        <p className="font-bold underline">{extraFields.namaPenyerah || '................................'}</p>
                      </div>
                   </div>
                   <div className="flex flex-col justify-between h-40">
                      <p>Diterima Oleh :</p>
                      <p>Nomor Telepon : {extraFields.telpPenerima || '....................'}</p>
                      <div className="mt-auto">
                        <p className="font-bold underline">{extraFields.namaPenerima || '................................'}</p>
                      </div>
                   </div>
                   <div className="flex flex-col justify-between h-40">
                      <p>Mengetahui,</p>
                      <p>Kepala SPPG Tales , Kabupaten Kediri</p>
                      <div className="mt-auto">
                        <p className="font-bold underline">Tiurmasi Saulina Sirait, S.T.</p>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* TEMPLATE BARU: PENGEMBALIAN KOTAK */}
           {template === 'BA_PENGEMBALIAN_KOTAK' && (
             <div className="space-y-4">
                <p>
                  Pada Hari <span className="font-bold">{getDayName(docDate)}</span> Tanggal <span className="font-bold">{getFullDate(docDate)}</span> Jam <span className="font-bold">{extraFields.jamKejadian}</span> telah diserahkan kembali kotak makan sejumlah <span className="font-bold">{extraFields.jumlahOmpreng || '..........'}</span> ompreng makan dari <span className="font-bold">{selectedData.nama}</span> kepada Satuan Pelayanan Pemenuhan Gizi (SPPG) Tales , Kabupaten Kediri.
                </p>
                
                <div className="mt-12 grid grid-cols-3 gap-4 text-center">
                   <div className="flex flex-col justify-between h-40">
                      <p>Yang Menyerahkan :</p>
                      <p>Nomor Telepon : {extraFields.telpPenyerah || '....................'}</p>
                      <div className="mt-auto">
                        <p className="font-bold underline">{extraFields.namaPenyerah || '................................'}</p>
                      </div>
                   </div>
                   <div className="flex flex-col justify-between h-40">
                      <p>Diterima Oleh :</p>
                      <p>Nomor Telepon : {extraFields.telpPenerima || '....................'}</p>
                      <div className="mt-auto">
                        <p className="font-bold underline">{extraFields.namaPenerima || '................................'}</p>
                      </div>
                   </div>
                   <div className="flex flex-col justify-between h-40">
                      <p>Mengetahui,</p>
                      <p>Kepala SPPG Tales , Kabupaten Kediri</p>
                      <div className="mt-auto">
                        <p className="font-bold underline">Tiurmasi Saulina Sirait, S.T.</p>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* TEMPLATE LAMA: SURAT TUGAS */}
           {template === 'SURAT_TUGAS' && (
             <>
               <p>Yang bertanda tangan di bawah ini Kepala Satuan Pelayanan Pemenuhan Gizi (SPPG) Tales Setono, menugaskan kepada:</p>
               <table className="w-full ml-8">
                  <tbody>
                    <tr><td className="w-32 py-1">Nama</td><td>: <span className="font-bold">{selectedData.nama}</span></td></tr>
                    {category === 'KARYAWAN' && <tr><td className="py-1">NIK</td><td>: {selectedData.nik}</td></tr>}
                    {category === 'KARYAWAN' && <tr><td className="py-1">Divisi</td><td>: {selectedData.divisi}</td></tr>}
                    {category === 'SEKOLAH' && <tr><td className="py-1">NPSN</td><td>: {selectedData.npsn}</td></tr>}
                  </tbody>
               </table>
               <p>Untuk melaksanakan tugas operasional pemenuhan gizi di wilayah Kecamatan Ngadiluwih pada tanggal {getFullDate(docDate)} sampai dengan selesai.</p>
               <div className="mt-16 grid grid-cols-2 gap-16 px-8 text-center">
                  <div></div>
                  <div>
                    <p>Ngadiluwih, {getFullDate(docDate)}</p>
                    <p className="mb-24 font-bold">Kepala SPPG,</p>
                    <p className="font-bold underline">Tiurmasi Saulina Sirait, S.T.</p>
                  </div>
               </div>
             </>
           )}

           {/* TEMPLATE LAMA: TANDA TERIMA */}
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
               <div className="border-2 border-black p-4 inline-block font-bold mt-4">Rp. ...............................</div>
               <div className="mt-16 grid grid-cols-2 gap-16 px-8 text-center">
                  <div>
                    <p className="mb-24">Penerima,</p>
                    <p className="font-bold underline">{selectedData.nama}</p>
                  </div>
                  <div>
                    <p>Ngadiluwih, {getFullDate(docDate)}</p>
                    <p className="mb-24 font-bold">Kepala SPPG,</p>
                    <p className="font-bold underline">Tiurmasi Saulina Sirait, S.T.</p>
                  </div>
               </div>
             </>
           )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="p-6 lg:col-span-1 space-y-5 h-fit">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                <FileText size={18} className="text-primary"/> Pengaturan Dokumen
            </h3>
            
            <Select 
                label="Jenis Dokumen Template" 
                value={template} 
                onChange={e => setTemplate(e.target.value as TemplateType)} 
                options={[
                    { value: 'BA_PENERIMAAN_MAKANAN', label: 'BA Penerimaan Makanan (Sekolah)' },
                    { value: 'BA_PENGEMBALIAN_KOTAK', label: 'BA Pengembalian Kotak (Sekolah)' },
                    { value: 'SURAT_TUGAS', label: 'Surat Tugas (Karyawan)' },
                    { value: 'TANDA_TERIMA_HONOR', label: 'Tanda Terima Pembayaran' },
                ]}
            />

            <Select 
                label="Sumber Data Subjek" 
                value={category} 
                disabled={template === 'BA_PENERIMAAN_MAKANAN' || template === 'BA_PENGEMBALIAN_KOTAK'}
                onChange={e => { setCategory(e.target.value as any); setSelectedId(''); }} 
                options={[
                    { value: 'KARYAWAN', label: 'Data Karyawan' },
                    { value: 'SEKOLAH', label: 'Data PM Sekolah' },
                    { value: 'B3', label: 'Data PM B3' },
                ]}
            />

            <Select 
                label="Pilih Nama Subjek (Sekolah/Karyawan)" 
                value={selectedId} 
                onChange={e => setSelectedId(e.target.value)} 
                options={[{value: '', label: '-- Pilih --'}, ...getCategoryOptions()]}
            />

            <Input 
                label="Tanggal Kejadian/Dokumen" 
                type="date" 
                value={docDate} 
                onChange={e => setDocDate(e.target.value)} 
            />

            {/* DYNAMIC FIELDS FOR NEW TEMPLATES */}
            {(template === 'BA_PENERIMAAN_MAKANAN' || template === 'BA_PENGEMBALIAN_KOTAK') && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                 <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Isian Berita Acara</h4>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <Input label="Jam Kejadian" type="time" value={extraFields.jamKejadian} onChange={e => setExtraFields({...extraFields, jamKejadian: e.target.value})} />
                    {template === 'BA_PENERIMAAN_MAKANAN' && (
                      <Input label="Batas Makan" type="time" value={extraFields.jamExpired} onChange={e => setExtraFields({...extraFields, jamExpired: e.target.value})} />
                    )}
                 </div>

                 <Input 
                    label={template === 'BA_PENERIMAAN_MAKANAN' ? "Jumlah Porsi" : "Jumlah Ompreng"} 
                    type="number" 
                    value={template === 'BA_PENERIMAAN_MAKANAN' ? extraFields.jumlahPorsi : extraFields.jumlahOmpreng} 
                    onChange={e => setExtraFields({
                        ...extraFields, 
                        [template === 'BA_PENERIMAAN_MAKANAN' ? 'jumlahPorsi' : 'jumlahOmpreng']: e.target.value
                    })} 
                 />

                 <div className="space-y-3 pt-2 border-t border-gray-200">
                    <Input label="Nama Penyerah" placeholder="Siapa yang menyerahkan?" value={extraFields.namaPenyerah} onChange={e => setExtraFields({...extraFields, namaPenyerah: e.target.value})} />
                    <Input label="No Telp Penyerah" placeholder="WA/Telp" value={extraFields.telpPenyerah} onChange={e => setExtraFields({...extraFields, telpPenyerah: e.target.value})} />
                 </div>

                 <div className="space-y-3 pt-2 border-t border-gray-200">
                    <Input label="Nama Penerima" placeholder="Siapa yang menerima?" value={extraFields.namaPenerima} onChange={e => setExtraFields({...extraFields, namaPenerima: e.target.value})} />
                    <Input label="No Telp Penerima" placeholder="WA/Telp" value={extraFields.telpPenerima} onChange={e => setExtraFields({...extraFields, telpPenerima: e.target.value})} />
                 </div>
              </div>
            )}

            <div className="pt-4">
                <Button onClick={handleGenerate} className="w-full" icon={<Printer size={18}/>}>Preview & Cetak</Button>
            </div>
         </Card>

         <div className="lg:col-span-2 space-y-6">
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 flex gap-4">
                <Info className="text-blue-600 shrink-0" size={20} />
                <div className="text-sm text-blue-900 leading-relaxed">
                    <p className="font-bold mb-1">Keterangan Template Baru</p>
                    <p>Dua template baru (Penerimaan Makanan & Pengembalian Kotak) telah disesuaikan dengan format fisik SPPG. Pastikan Anda memilih **Nama Sekolah** yang benar agar sistem dapat menarik data nama lembaga secara otomatis.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                   onClick={() => setTemplate('BA_PENERIMAAN_MAKANAN')}
                   className={`bg-white p-6 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4 ${template === 'BA_PENERIMAAN_MAKANAN' ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-gray-100 shadow-sm hover:border-blue-300'}`}
                >
                   <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Utensils size={24} />
                   </div>
                   <div>
                      <h4 className="font-bold text-gray-800">BA Penerimaan</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Logistik Sekolah</p>
                   </div>
                </div>

                <div 
                   onClick={() => setTemplate('BA_PENGEMBALIAN_KOTAK')}
                   className={`bg-white p-6 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4 ${template === 'BA_PENGEMBALIAN_KOTAK' ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-gray-100 shadow-sm hover:border-purple-300'}`}
                >
                   <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <RotateCcw size={24} />
                   </div>
                   <div>
                      <h4 className="font-bold text-gray-800">BA Pengembalian</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Logistik Sekolah</p>
                   </div>
                </div>

                <div 
                   onClick={() => setTemplate('SURAT_TUGAS')}
                   className={`bg-white p-6 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4 ${template === 'SURAT_TUGAS' ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-gray-100 shadow-sm hover:border-orange-300'}`}
                >
                   <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserPlus size={24} />
                   </div>
                   <div>
                      <h4 className="font-bold text-gray-800">Surat Tugas</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Administrasi SDM</p>
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
