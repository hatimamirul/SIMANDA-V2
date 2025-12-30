
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Input, PrintPreviewDialog, useToast } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Karyawan, PMSekolah, PMB3 } from '../types';
import { 
  FileText, Printer, FileUp, Plus, Trash2, 
  Move, Database, Layers, Info, MousePointer2,
  RefreshCcw, ChevronRight, Settings2, FileEdit
} from 'lucide-react';

interface DraggableField {
  id: string;
  label: string;
  value: string;
  x: number; // position in percentage
  y: number; // position in percentage
  fontSize: number;
  isBold: boolean;
  mappingKey?: string; // e.g., 'nama', 'nik', 'desa'
}

export const DocumentGeneratorPage: React.FC = () => {
  const { showToast } = useToast();
  
  // States
  const [templateImg, setTemplateImg] = useState<string | null>(null);
  const [fields, setFields] = useState<DraggableField[]>([]);
  const [category, setCategory] = useState<'KARYAWAN' | 'SEKOLAH' | 'B3'>('KARYAWAN');
  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState<any>(null);
  
  // Reference Lists
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [schools, setSchools] = useState<PMSekolah[]>([]);
  const [b3s, setB3s] = useState<PMB3[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // Load Initial Data
  useEffect(() => {
    const unsubK = api.subscribeKaryawan(setEmployees);
    const unsubS = api.subscribePMs(setSchools);
    const unsubB = api.subscribeB3s(setB3s);
    return () => { unsubK(); unsubS(); unsubB(); };
  }, []);

  // Handle Template Upload
  const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setTemplateImg(ev.target?.result as string);
      reader.readAsDataURL(file);
      showToast("Template berhasil dimuat!", "success");
    }
  };

  // Add a new manual field
  const addField = () => {
    const newField: DraggableField = {
      id: `field_${Date.now()}`,
      label: 'Label Baru',
      value: 'Teks Isian',
      x: 50,
      y: 50,
      fontSize: 14,
      isBold: false
    };
    setFields([...fields, newField]);
  };

  // Logic to sync fields with selected system data
  useEffect(() => {
    if (selectedId) {
      let dataFound = null;
      if (category === 'KARYAWAN') dataFound = employees.find(e => e.id === selectedId);
      if (category === 'SEKOLAH') dataFound = schools.find(s => s.id === selectedId);
      if (category === 'B3') dataFound = b3s.find(b => b.id === selectedId);
      
      if (dataFound) {
        setSelectedData(dataFound);
        // Auto-update fields that have mapping keys
        setFields(prev => prev.map(f => {
          if (f.mappingKey && dataFound[f.mappingKey]) {
            return { ...f, value: String(dataFound[f.mappingKey]) };
          }
          return f;
        }));
      }
    }
  }, [selectedId, category, employees, schools, b3s]);

  // Dragging Handlers
  const handleMouseDown = (id: string) => setIsDragging(id);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setFields(prev => prev.map(f => f.id === isDragging ? { ...f, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : f));
  };
  const handleMouseUp = () => setIsDragging(null);

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const getCategoryOptions = () => {
    if (category === 'KARYAWAN') return employees.map(e => ({ value: e.id, label: `${e.nama} (${e.divisi})` }));
    if (category === 'SEKOLAH') return schools.map(s => ({ value: s.id, label: s.nama }));
    if (category === 'B3') return b3s.map(b => ({ value: b.id, label: `${b.nama} - ${b.desa}` }));
    return [];
  };

  const getAvailableMappingKeys = () => {
    if (category === 'KARYAWAN') return ['nama', 'nik', 'divisi', 'hp', 'rekening'];
    if (category === 'SEKOLAH') return ['nama', 'npsn', 'desa', 'narahubung', 'jmlsiswa'];
    if (category === 'B3') return ['nama', 'jenis', 'rt', 'rw', 'desa'];
    return [];
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                {/* Fixed: Added missing import for FileEdit to fix compilation error */}
                <FileEdit size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">Generator Dokumen Visual</h2>
                <p className="text-sm text-gray-500">Unggah template fisik Anda, lalu geser teks ke posisi yang tepat.</p>
            </div>
         </div>
         <div className="flex gap-2">
            {!templateImg ? (
              <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all">
                <FileUp size={20} /> Unggah Template
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadTemplate} />
              </label>
            ) : (
              <Button onClick={() => setIsPreviewOpen(true)} icon={<Printer size={20} />} className="px-8 bg-emerald-600 hover:bg-emerald-700">Preview & Cetak</Button>
            )}
         </div>
      </div>

      {!templateImg ? (
        /* Empty State */
        <Card className="p-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
           <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
              <FileUp size={48} />
           </div>
           <h3 className="text-xl font-bold text-gray-700">Belum Ada Template</h3>
           <p className="text-gray-400 max-w-sm text-center mt-2 mb-8">Unggah foto atau scan dokumen kosong Anda (Surat Tugas, Berita Acara, dll) untuk mulai mengisi secara otomatis.</p>
           <label className="cursor-pointer px-10 py-4 bg-white border-2 border-primary text-primary rounded-2xl font-black hover:bg-primary hover:text-white transition-all uppercase tracking-widest">
              Pilih File Gambar
              <input type="file" className="hidden" accept="image/*" onChange={handleUploadTemplate} />
           </label>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SIDEBAR: Configuration */}
          <div className="lg:col-span-4 space-y-6">
            {/* Step 1: Data Source */}
            <Card className="p-5 space-y-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2 text-sm uppercase tracking-wider">
                  <Database size={16} className="text-primary"/> 1. Hubungkan Data
               </h3>
               <Select 
                  label="Sumber Data" 
                  value={category} 
                  onChange={e => { setCategory(e.target.value as any); setSelectedId(''); }} 
                  options={[
                      { value: 'KARYAWAN', label: 'Database Karyawan' },
                      { value: 'SEKOLAH', label: 'Database PM Sekolah' },
                      { value: 'B3', label: 'Database PM B3' },
                  ]}
               />
               <Select 
                  label="Pilih Subjek / Item" 
                  value={selectedId} 
                  onChange={e => setSelectedId(e.target.value)} 
                  options={[{value: '', label: '-- Pilih Data --'}, ...getCategoryOptions()]}
               />
            </Card>

            {/* Step 2: Form Integration */}
            <Card className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Layers size={16} className="text-primary"/> 2. Kotak Isian
                  </h3>
                  <button onClick={addField} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                     <Plus size={16} />
                  </button>
               </div>
               
               {fields.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">Klik tombol + untuk menambah area teks di dokumen.</p>}

               {fields.map((field) => (
                 <div key={field.id} className="p-3 border rounded-xl bg-gray-50/50 space-y-3 relative group">
                    <button onClick={() => deleteField(field.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Trash2 size={14} />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <Input 
                          placeholder="Label (ex: Nama)" 
                          className="text-xs py-1.5" 
                          value={field.label} 
                          onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f))} 
                       />
                       <select 
                          className="text-[10px] bg-white border border-gray-300 rounded px-2 outline-none"
                          value={field.mappingKey || ''}
                          onChange={e => {
                            const key = e.target.value;
                            setFields(fields.map(f => f.id === field.id ? { ...f, mappingKey: key, value: selectedData ? (selectedData[key] || f.value) : f.value } : f))
                          }}
                       >
                          <option value="">Manual</option>
                          {getAvailableMappingKeys().map(k => <option key={k} value={k}>Ambil: {k}</option>)}
                       </select>
                    </div>

                    <textarea 
                        className="w-full text-xs p-2 border rounded bg-white outline-none focus:ring-1 focus:ring-primary h-12"
                        value={field.value}
                        onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                    />

                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-1 bg-white border rounded px-1.5 py-1">
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Px</span>
                          <input 
                            type="number" 
                            className="w-8 text-xs outline-none" 
                            value={field.fontSize} 
                            onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, fontSize: parseInt(e.target.value) || 12 } : f))} 
                          />
                       </div>
                       <button 
                          onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, isBold: !f.isBold } : f))}
                          className={`p-1 border rounded text-[10px] font-black ${field.isBold ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400'}`}
                       >
                          B
                       </button>
                    </div>
                 </div>
               ))}
            </Card>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
               <Info className="text-amber-600 shrink-0" size={18} />
               <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  <strong>Tips:</strong> Klik dan tahan teks di preview sebelah kanan untuk menggeser posisi. Gunakan fitur "Ambil" agar data dari sistem terisi otomatis ke kotak tersebut.
               </p>
            </div>
            
            <Button variant="secondary" onClick={() => { setTemplateImg(null); setFields([]); }} className="w-full text-red-500 hover:bg-red-50" icon={<RefreshCcw size={16}/>}>Reset Template</Button>
          </div>

          {/* MAIN EDITOR: Preview Canvas */}
          <div className="lg:col-span-8">
             <Card className="bg-slate-200 p-4 rounded-[2rem] overflow-hidden shadow-inner min-h-[700px] flex items-center justify-center">
                <div 
                   ref={containerRef}
                   onMouseMove={handleMouseMove}
                   onMouseUp={handleMouseUp}
                   onMouseLeave={handleMouseUp}
                   className="relative bg-white shadow-2xl origin-top transition-transform"
                   style={{ width: '100%', maxWidth: '800px', aspectRatio: '1/1.414', backgroundImage: `url(${templateImg})`, backgroundSize: '100% 100%' }}
                >
                   {fields.map(field => (
                     <div 
                        key={field.id}
                        onMouseDown={() => handleMouseDown(field.id)}
                        className={`absolute cursor-move select-none p-1 border border-dashed border-transparent hover:border-blue-400 hover:bg-blue-50/30 group ${isDragging === field.id ? 'z-50 ring-2 ring-primary bg-white/50 border-solid' : ''}`}
                        style={{ 
                            left: `${field.x}%`, 
                            top: `${field.y}%`, 
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${field.fontSize}px`,
                            fontWeight: field.isBold ? 'bold' : 'normal',
                            color: 'black',
                            fontFamily: 'serif' // matching official documents
                        }}
                     >
                        <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none uppercase font-bold tracking-tighter">
                           {field.label}
                        </div>
                        {field.value || '(Kosong)'}
                     </div>
                   ))}

                   {/* Overlay Guidelines */}
                   <div className="absolute inset-0 pointer-events-none border border-black/10 opacity-50"></div>
                </div>
             </Card>
             <p className="text-center text-xs text-gray-400 mt-4 font-bold flex items-center justify-center gap-2">
                <MousePointer2 size={12}/> Drag teks untuk mengatur tata letak yang presisi sesuai garis isian template Anda
             </p>
          </div>

        </div>
      )}

      {/* FINAL PRINT PREVIEW */}
      <PrintPreviewDialog 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Dokumen Siap Cetak"
        filename={`DOC_${category}_${selectedData?.nama?.replace(/\s+/g, '_') || 'GENERATED'}`}
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
                    fontSize: `${(field.fontSize * 3.78).toFixed(2)}px`, // Scaling for A4 size
                    fontWeight: field.isBold ? 'bold' : 'normal',
                    color: 'black',
                    fontFamily: 'serif'
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
