
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Input, PrintPreviewDialog, useToast, LoadingSpinner } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Karyawan, PMSekolah, PMB3 } from '../types';
import { 
  FileText, Printer, FileUp, Plus, Trash2, 
  Database, Layers, Info, MousePointer2,
  RefreshCcw, FileEdit, Type, Sparkles
} from 'lucide-react';

interface DraggableField {
  id: string;
  label: string;
  value: string;
  x: number; // percentage
  y: number; // percentage
  fontSize: number;
  isBold: boolean;
  mappingKey?: string;
}

export const DocumentGeneratorPage: React.FC = () => {
  const { showToast } = useToast();
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateImg, setTemplateImg] = useState<string | null>(null);
  const [fields, setFields] = useState<DraggableField[]>([]);
  const [category, setCategory] = useState<'KARYAWAN' | 'SEKOLAH' | 'B3'>('KARYAWAN');
  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState<any>(null);
  
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [schools, setSchools] = useState<PMSekolah[]>([]);
  const [b3s, setB3s] = useState<PMB3[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  useEffect(() => {
    const unsubK = api.subscribeKaryawan(setEmployees);
    const unsubS = api.subscribePMs(setSchools);
    const unsubB = api.subscribeB3s(setB3s);
    return () => { unsubK(); unsubS(); unsubB(); };
  }, []);

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setLoadingTemplate(true);
      try {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const typedarray = new Uint8Array(ev.target?.result as ArrayBuffer);
          // @ts-ignore (using PDF.js from index.html)
          const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
          const page = await pdf.getPage(1); // Merender halaman pertama sebagai template
          
          const viewport = page.getViewport({ scale: 2.0 }); // High res rendering
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            setTemplateImg(canvas.toDataURL('image/png'));
            showToast("Template PDF berhasil dimuat!", "success");
          }
          setLoadingTemplate(false);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        showToast("Gagal memproses PDF", "error");
        setLoadingTemplate(false);
      }
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setTemplateImg(ev.target?.result as string);
      reader.readAsDataURL(file);
      showToast("Template gambar berhasil dimuat!", "success");
    } else {
      showToast("Format file tidak didukung. Gunakan PDF atau Gambar.", "error");
    }
  };

  const addFieldAtPosition = (e: React.MouseEvent) => {
    if (!isDragging && containerRef.current) {
       // Optional: allow double click to add field directly
    }
  };

  const addField = () => {
    const newField: DraggableField = {
      id: `field_${Date.now()}`,
      label: `Input Baru ${fields.length + 1}`,
      value: '',
      x: 50,
      y: 50,
      fontSize: 13,
      isBold: false
    };
    setFields([...fields, newField]);
  };

  useEffect(() => {
    if (selectedId) {
      let dataFound = null;
      if (category === 'KARYAWAN') dataFound = employees.find(e => e.id === selectedId);
      if (category === 'SEKOLAH') dataFound = schools.find(s => s.id === selectedId);
      if (category === 'B3') dataFound = b3s.find(b => b.id === selectedId);
      
      if (dataFound) {
        setSelectedData(dataFound);
        setFields(prev => prev.map(f => {
          if (f.mappingKey && dataFound[f.mappingKey]) {
            return { ...f, value: String(dataFound[f.mappingKey]) };
          }
          return f;
        }));
      }
    }
  }, [selectedId]);

  const handleMouseDown = (id: string) => setIsDragging(id);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFields(prev => prev.map(f => f.id === isDragging ? { ...f, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : f));
  };
  const handleMouseUp = () => setIsDragging(null);

  const getAvailableMappingKeys = () => {
    if (category === 'KARYAWAN') return ['nama', 'nik', 'divisi', 'hp', 'rekening'];
    if (category === 'SEKOLAH') return ['nama', 'npsn', 'desa', 'narahubung', 'jmlsiswa', 'pmBesar', 'pmKecil'];
    if (category === 'B3') return ['nama', 'jenis', 'rt', 'rw', 'desa'];
    return [];
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <FileEdit size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Pengisian Dokumen PDF</h2>
                <p className="text-sm text-gray-500">Unggah file PDF asli Anda dan tempatkan isian teks secara visual.</p>
            </div>
         </div>
         <div className="flex gap-2">
            {!templateImg ? (
              <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all">
                {loadingTemplate ? <LoadingSpinner /> : <FileUp size={20} />} Unggah PDF Template
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleUploadTemplate} />
              </label>
            ) : (
              <div className="flex gap-2">
                 <Button variant="secondary" onClick={() => { setTemplateImg(null); setFields([]); }} icon={<RefreshCcw size={18}/>}>Ganti PDF</Button>
                 <Button onClick={() => setIsPreviewOpen(true)} icon={<Printer size={20} />} className="px-8 bg-emerald-600 hover:bg-emerald-700">Preview & Cetak</Button>
              </div>
            )}
         </div>
      </div>

      {!templateImg ? (
        <Card className="p-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-white/50">
           <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 text-gray-300 shadow-sm border border-gray-100">
              <FileUp size={48} />
           </div>
           <h3 className="text-xl font-black text-gray-700 uppercase tracking-widest">Belum Ada Dokumen</h3>
           <p className="text-gray-400 max-w-sm text-center mt-3 mb-10 font-medium">Unggah file PDF asli Anda (Berita Acara, Kwitansi, dll) untuk mulai mengisi secara digital.</p>
           <label className="cursor-pointer px-12 py-5 bg-primary text-white rounded-2xl font-black hover:shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-widest text-sm flex items-center gap-3">
              Pilih File PDF Sekarang
              <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleUploadTemplate} />
           </label>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-4 space-y-5">
            <Card className="p-5 space-y-4">
               <h3 className="font-black text-gray-800 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] mb-2">
                  <Database size={16} className="text-primary"/> 1. Hubungkan Database
               </h3>
               <Select 
                  label="Tarik Data Dari" 
                  value={category} 
                  onChange={e => { setCategory(e.target.value as any); setSelectedId(''); }} 
                  options={[
                      { value: 'KARYAWAN', label: 'Data Karyawan' },
                      { value: 'SEKOLAH', label: 'Data PM Sekolah' },
                      { value: 'B3', label: 'Data PM B3' },
                  ]}
               />
               <Select 
                  label="Pilih Subjek" 
                  value={selectedId} 
                  onChange={e => setSelectedId(e.target.value)} 
                  options={[{value: '', label: '-- Pilih Data --'}, ...((category === 'KARYAWAN' ? employees : category === 'SEKOLAH' ? schools : b3s).map(i => ({ value: i.id, label: i.nama })))]}
               />
            </Card>

            <Card className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-gray-800 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                      <Layers size={16} className="text-primary"/> 2. Form Isian Dokumen
                  </h3>
                  <button onClick={addField} className="p-1.5 bg-primary text-white rounded-lg hover:scale-110 transition-all shadow-md">
                     <Plus size={16} strokeWidth={3} />
                  </button>
               </div>
               
               {fields.length === 0 && (
                 <div className="text-center py-10 px-6 border-2 border-dashed border-gray-100 rounded-2xl">
                    <p className="text-xs text-gray-400 italic">Gunakan tombol + untuk menambah titik isian teks di dokumen Anda.</p>
                 </div>
               )}

               <div className="space-y-4">
               {fields.map((field) => (
                 <div key={field.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-3 relative group hover:border-primary/30 transition-colors">
                    <button onClick={() => setFields(fields.filter(f => f.id !== field.id))} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors">
                       <Trash2 size={16} />
                    </button>
                    
                    <div className="flex gap-2 items-center">
                       <div className="p-1.5 bg-white border border-gray-200 rounded-lg text-primary"><Type size={14}/></div>
                       <input 
                          placeholder="Label (Misal: Nama)" 
                          className="bg-transparent text-xs font-black uppercase tracking-wider outline-none text-gray-500 w-full" 
                          value={field.label} 
                          onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f))} 
                       />
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                       <div className="flex gap-1">
                          <textarea 
                              className="flex-1 text-sm p-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary/20 h-16 resize-none font-medium"
                              placeholder="Ketik isi teks di sini..."
                              value={field.value}
                              onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                          />
                          <select 
                              className="w-10 bg-white border border-gray-200 rounded-xl text-[10px] appearance-none text-center font-bold text-primary hover:bg-primary hover:text-white cursor-pointer transition-colors"
                              title="Hubungkan ke Database"
                              value={field.mappingKey || ''}
                              onChange={e => {
                                const key = e.target.value;
                                setFields(fields.map(f => f.id === field.id ? { ...f, mappingKey: key, value: selectedData ? (String(selectedData[key]) || f.value) : f.value } : f))
                              }}
                          >
                              <option value="">⚙️</option>
                              {getAvailableMappingKeys().map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Ukuran:</span>
                          <input 
                            type="number" 
                            className="w-10 text-xs bg-white border border-gray-200 rounded-lg py-1 px-1.5 text-center font-bold" 
                            value={field.fontSize} 
                            onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, fontSize: parseInt(e.target.value) || 12 } : f))} 
                          />
                          <button 
                              onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, isBold: !f.isBold } : f))}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${field.isBold ? 'bg-primary text-white shadow-md' : 'bg-white border border-gray-200 text-gray-400'}`}
                          >
                              B
                          </button>
                       </div>
                       <div className="text-[9px] text-gray-300 font-bold">POS: {Math.round(field.x)}%, {Math.round(field.y)}%</div>
                    </div>
                 </div>
               ))}
               </div>
            </Card>

            <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
               <Sparkles className="absolute top-0 right-0 p-3 opacity-20" size={50} />
               <div className="relative z-10">
                 <h4 className="font-black text-sm uppercase tracking-[0.2em] mb-2">Panduan Cepat</h4>
                 <ul className="text-[11px] space-y-2 opacity-90 font-medium">
                   <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-white mt-1.5 shrink-0"></div> Pilih subjek di Step 1 untuk mengisi otomatis.</li>
                   <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-white mt-1.5 shrink-0"></div> Gunakan ikon ⚙️ pada kotak isian untuk memetakan kolom database.</li>
                   <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-white mt-1.5 shrink-0"></div> Geser teks pada dokumen (sebelah kanan) ke posisi yang tepat.</li>
                 </ul>
               </div>
            </div>
          </div>

          <div className="lg:col-span-8 sticky top-6">
             <Card className="bg-slate-800 p-8 rounded-[3rem] overflow-hidden shadow-2xl min-h-[800px] flex items-center justify-center border-[12px] border-slate-700">
                <div 
                   ref={containerRef}
                   onMouseMove={handleMouseMove}
                   onMouseUp={handleMouseUp}
                   onMouseLeave={handleMouseUp}
                   className="relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] origin-top cursor-crosshair"
                   style={{ width: '100%', maxWidth: '700px', aspectRatio: '1/1.414', backgroundImage: `url(${templateImg})`, backgroundSize: '100% 100%' }}
                >
                   {fields.map(field => (
                     <div 
                        key={field.id}
                        onMouseDown={() => handleMouseDown(field.id)}
                        className={`absolute cursor-move select-none p-1 border-2 border-dashed transition-all group ${isDragging === field.id ? 'z-50 border-primary bg-white/80 scale-110 shadow-xl' : 'border-transparent hover:border-blue-400 hover:bg-blue-50/20'}`}
                        style={{ 
                            left: `${field.x}%`, 
                            top: `${field.y}%`, 
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${field.fontSize}px`,
                            fontWeight: field.isBold ? 'bold' : 'normal',
                            color: 'black',
                            fontFamily: 'serif',
                            lineHeight: 1
                        }}
                     >
                        <div className="absolute -top-6 left-0 bg-primary text-white text-[9px] px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none uppercase font-black tracking-widest">
                           {field.label}
                        </div>
                        {field.value || '(Kosong)'}
                     </div>
                   ))}
                </div>
             </Card>
             <div className="mt-4 flex items-center justify-center gap-6 text-gray-400 font-bold text-xs uppercase tracking-widest">
                <div className="flex items-center gap-2"><MousePointer2 size={14}/> Drag Teks Untuk Memposisikan</div>
                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                <div className="flex items-center gap-2">Halaman Editor: A4 Portrait</div>
             </div>
          </div>

        </div>
      )}

      <PrintPreviewDialog 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Dokumen Hasil Isian"
        filename={`FORM_${selectedData?.nama?.replace(/\s+/g, '_') || 'CETAK'}`}
      >
        <div 
           className="relative mx-auto bg-white"
           style={{ width: '210mm', height: '297mm', backgroundImage: `url(${templateImg})`, backgroundSize: '100% 100%' }}
        >
           {fields.map(field => (
             <div 
                key={field.id}
                className="absolute"
                style={{ 
                    left: `${field.x}%`, 
                    top: `${field.y}%`, 
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${(field.fontSize * 3.77).toFixed(2)}px`, // Scaling DPI untuk PDF A4
                    fontWeight: field.isBold ? 'bold' : 'normal',
                    color: 'black',
                    fontFamily: 'serif',
                    whiteSpace: 'pre-wrap'
                }}
             >
                {field.value}
             </div>
           ))}
        </div>
      </PrintPreviewDialog>
    </div>
  );
};
