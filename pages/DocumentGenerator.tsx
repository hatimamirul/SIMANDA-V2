
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Input, Modal, PrintPreviewDialog, useToast, LoadingSpinner } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Karyawan, PMSekolah, PMB3 } from '../types';
import { 
  FileText, Printer, FileUp, Plus, Trash2, 
  Database, Layers, Info, MousePointer2,
  RefreshCcw, FileEdit, Sparkles,
  Save, History, ChevronLeft, ChevronRight,
  Maximize2, Italic, GripVertical, Calendar,
  Wand2, Search, CheckCircle2
} from 'lucide-react';

interface DraggableField {
  id: string;
  label: string;
  value: string;
  x: number; // percentage
  y: number; // percentage
  page: number;
  fontSize: number;
  isBold: boolean;
  isItalic?: boolean;
  fontFamily: string;
  mappingKey?: string;
}

interface SavedTemplate {
  id: string;
  name: string;
  fields: DraggableField[];
  category: 'KARYAWAN' | 'SEKOLAH' | 'B3';
}

export const DocumentGeneratorPage: React.FC = () => {
  const { showToast } = useToast();
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [templateImg, setTemplateImg] = useState<string[]>([]); 
  const [pdfMetadata, setPdfMetadata] = useState<any[]>([]); // To store text positions for auto-analysis
  const [currentPage, setCurrentPage] = useState(1);
  const [fields, setFields] = useState<DraggableField[]>([]);
  const [category, setCategory] = useState<'KARYAWAN' | 'SEKOLAH' | 'B3'>('KARYAWAN');
  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState<any>(null);
  
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [schools, setSchools] = useState<PMSekolah[]>([]);
  const [b3s, setB3s] = useState<PMB3[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  useEffect(() => {
    api.subscribeKaryawan(setEmployees);
    api.subscribePMs(setSchools);
    api.subscribeB3s(setB3s);
    const localSaved = localStorage.getItem('simanda_doc_templates');
    if (localSaved) setSavedTemplates(JSON.parse(localSaved));
  }, []);

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingTemplate(true);
    const pages: string[] = [];
    const metadata: any[] = [];

    if (file.type === 'application/pdf') {
      try {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const typedarray = new Uint8Array(ev.target?.result as ArrayBuffer);
          // @ts-ignore
          const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            
            // 1. Render Image
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
              pages.push(canvas.toDataURL('image/png'));
            }

            // 2. Extract Text Metadata for Analysis
            const textContent = await page.getTextContent();
            metadata.push(textContent.items.map((item: any) => ({
                text: item.str,
                transform: item.transform, // [scaleX, skewY, skewX, scaleY, tx, ty]
                width: item.width,
                height: item.height
            })));
          }
          setTemplateImg(pages);
          setPdfMetadata(metadata);
          setCurrentPage(1);
          showToast(`PDF ${pages.length} Halaman berhasil dimuat!`, "success");
          setLoadingTemplate(false);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        showToast("Gagal memproses PDF", "error");
        setLoadingTemplate(false);
      }
    }
  };

  // --- AUTOMATIC ANALYSIS ENGINE ---
  const autoAnalyzeTemplate = () => {
    if (pdfMetadata.length === 0) return;
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const currentPageMetadata = pdfMetadata[currentPage - 1];
      const newFields: DraggableField[] = [];
      
      // Keywords to DB Column Mapping
      const mappingTable: { [key: string]: string } = {
        'NAMA': 'nama',
        'NIK': 'nik',
        'NPSN': 'npsn',
        'DESA': 'desa',
        'TELEPON': 'hp',
        'HP': 'hp',
        'REKENING': 'rekening',
        'DIVISI': 'divisi',
        'ALAMAT': 'desa'
      };

      currentPageMetadata.forEach((item: any) => {
        const text = item.text.toUpperCase();
        const foundKeyword = Object.keys(mappingTable).find(k => text.includes(k));

        if (foundKeyword) {
          // Calculate coordinate (PDF coordinates are bottom-to-top, we need top-to-bottom percentage)
          // Transform array: [scaleX, skewY, skewX, scaleY, tx, ty]
          const fontSize = Math.abs(item.transform[0]);
          const x = (item.transform[4] / 600) * 100 + 15; // Shift to the right of keyword
          const y = 100 - (item.transform[5] / 842) * 100; // Flip Y axis

          newFields.push({
            id: `auto_${Date.now()}_${Math.random()}`,
            label: `Auto: ${foundKeyword}`,
            value: '',
            x: Math.min(x, 90),
            y: Math.min(y, 98),
            page: currentPage,
            fontSize: fontSize > 8 ? fontSize : 12, // Match detected size
            isBold: false,
            fontFamily: 'serif',
            mappingKey: mappingTable[foundKeyword]
          });
        }
      });

      if (newFields.length > 0) {
        setFields(prev => [...prev, ...newFields]);
        showToast(`Ditemukan ${newFields.length} area isian potensial!`, "success");
      } else {
        showToast("Tidak ditemukan kata kunci isian di halaman ini.", "info");
      }
      setIsAnalyzing(false);
    }, 1500);
  };

  const addField = (type: 'manual' | 'date' = 'manual') => {
    const newField: DraggableField = {
      id: `field_${Date.now()}`,
      label: type === 'date' ? 'Tanggal' : `Input ${fields.length + 1}`,
      value: type === 'date' ? new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
      x: 50,
      y: 50,
      page: currentPage,
      fontSize: 12,
      isBold: false,
      fontFamily: 'serif',
      mappingKey: ''
    };
    setFields([...fields, newField]);
  };

  const saveCurrentTemplate = () => {
    if (!templateName) return;
    const newTemplate = { id: `tpl_${Date.now()}`, name: templateName, fields, category };
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('simanda_doc_templates', JSON.stringify(updated));
    setShowSaveModal(false);
    showToast("Template berhasil disimpan!", "success");
  };

  useEffect(() => {
    if (selectedId) {
      const source = category === 'KARYAWAN' ? employees : category === 'SEKOLAH' ? schools : b3s;
      const dataFound = source.find(e => e.id === selectedId);
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
  }, [selectedId, category]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    setFields(prev => prev.map(f => f.id === isDragging ? { ...f, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : f));
  };

  const getAvailableMappingKeys = () => {
    if (category === 'KARYAWAN') return ['nama', 'nik', 'divisi', 'hp', 'rekening', 'honorHarian'];
    if (category === 'SEKOLAH') return ['nama', 'npsn', 'desa', 'narahubung', 'jmlsiswa', 'pmBesar', 'pmKecil'];
    if (category === 'B3') return ['nama', 'jenis', 'rt', 'rw', 'desa'];
    return [];
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <FileEdit size={24} />
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Smart Document Engine</h2>
                <p className="text-sm text-gray-500 font-medium">Isi dokumen fisik otomatis dengan presisi ukuran font asli.</p>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-2">
            {!templateImg.length ? (
              <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all">
                {loadingTemplate ? <LoadingSpinner /> : <FileUp size={20} />} 
                Pilih PDF
                <input type="file" className="hidden" accept=".pdf" onChange={handleUploadTemplate} />
              </label>
            ) : (
              <div className="flex gap-2">
                 <Button variant="secondary" onClick={autoAnalyzeTemplate} isLoading={isAnalyzing} icon={<Wand2 size={18}/>} className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">Analisa Otomatis</Button>
                 <Button variant="secondary" onClick={() => setShowSaveModal(true)} icon={<Save size={18}/>}>Simpan</Button>
                 <Button onClick={() => setIsPreviewOpen(true)} icon={<Printer size={20} />} className="px-8 bg-emerald-600">Cetak</Button>
              </div>
            )}
         </div>
      </div>

      {!templateImg.length ? (
        <Card className="p-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-white">
           <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-200">
              <Sparkles size={48} />
           </div>
           <h3 className="text-xl font-black text-gray-700 uppercase tracking-widest">Belum Ada Berkas</h3>
           <p className="text-gray-400 max-w-sm text-center mt-2 mb-10 font-medium text-sm">Unggah berkas PDF asli Anda. Sistem akan mendeteksi garis dan kolom teks secara otomatis.</p>
           
           <div className="flex gap-4">
              <label className="cursor-pointer px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl flex items-center gap-3">
                 <FileUp size={20}/> Unggah PDF Baru
                 <input type="file" className="hidden" accept=".pdf" onChange={handleUploadTemplate} />
              </label>
              {savedTemplates.length > 0 && (
                <div className="relative group">
                    <button className="px-10 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold flex items-center gap-3">
                        <History size={20}/> Gunakan Layout Lama
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-2xl rounded-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                        {savedTemplates.map(t => (
                            <button key={t.id} onClick={() => { setFields(t.fields); setCategory(t.category); setTemplateImg(['#']); showToast(`Layout ${t.name} dimuat`,"info"); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-lg text-sm font-bold text-gray-700">{t.name}</button>
                        ))}
                    </div>
                </div>
              )}
           </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-5">
            <Card className="p-5 space-y-4">
               <h3 className="font-black text-gray-800 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  <Database size={14} className="text-primary"/> Sumber Data
               </h3>
               <Select 
                  label="Pilih Database" 
                  value={category} 
                  onChange={e => { setCategory(e.target.value as any); setSelectedId(''); }} 
                  options={[
                      { value: 'KARYAWAN', label: 'Data Karyawan' },
                      { value: 'SEKOLAH', label: 'Data PM Sekolah' },
                      { value: 'B3', label: 'Data PM B3' },
                  ]}
               />
               <Select 
                  label="Pilih Item" 
                  value={selectedId} 
                  onChange={e => setSelectedId(e.target.value)} 
                  options={[{value: '', label: '-- Pilih --'}, ...((category === 'KARYAWAN' ? employees : category === 'SEKOLAH' ? schools : b3s).map(i => ({ value: i.id, label: i.nama })))]}
               />
            </Card>

            <Card className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
               <div className="flex justify-between items-center">
                  <h3 className="font-black text-gray-800 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                      <Layers size={14} className="text-primary"/> Daftar Kotak Isian
                  </h3>
                  <button onClick={() => addField('manual')} className="p-1.5 bg-primary text-white rounded-lg shadow-md"><Plus size={16}/></button>
               </div>
               
               <div className="space-y-3">
               {fields.map((field) => (
                 <div key={field.id} className={`p-4 border border-gray-100 rounded-2xl bg-white shadow-sm space-y-3 relative group hover:border-primary/40 transition-all ${isDragging === field.id ? 'ring-2 ring-primary border-primary' : ''}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center overflow-hidden">
                           <GripVertical size={14} className="text-gray-300 shrink-0" />
                           <input className="bg-transparent text-[10px] font-black uppercase tracking-wider outline-none text-gray-400 w-full" value={field.label} onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f))} />
                        </div>
                        <button onClick={() => setFields(fields.filter(f => f.id !== field.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>

                    <div className="flex gap-2">
                       <textarea 
                          className="flex-1 text-xs p-2 border border-gray-200 rounded-xl bg-gray-50 outline-none h-14 resize-none font-medium"
                          value={field.value}
                          placeholder="Nilai teks..."
                          onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                       />
                       <select 
                          className="w-10 bg-white border border-gray-200 rounded-xl text-[10px] text-center font-bold text-primary"
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

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                       <div className="flex items-center gap-1.5">
                          <input type="number" className="w-9 text-[10px] bg-gray-50 border border-gray-200 rounded-lg py-1 text-center font-bold" value={field.fontSize} onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, fontSize: parseInt(e.target.value) || 12 } : f))} />
                          <button onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, isBold: !f.isBold } : f))} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${field.isBold ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>B</button>
                       </div>
                       <div className="text-[9px] font-bold text-gray-400">PG {field.page} | POS: {Math.round(field.x)}%, {Math.round(field.y)}%</div>
                    </div>
                 </div>
               ))}
               </div>
            </Card>

            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
               <Sparkles className="absolute top-0 right-0 p-3 opacity-10" size={50} />
               <h4 className="font-black text-[10px] uppercase tracking-widest mb-3 text-blue-300">Tips Analisa</h4>
               <p className="text-[11px] leading-relaxed opacity-80">Klik tombol <strong>Analisa Otomatis</strong> untuk mendeteksi kata kunci seperti Nama, NIK, dll langsung dari teks dokumen asli.</p>
            </div>
          </div>

          {/* EDITOR */}
          <div className="lg:col-span-8 space-y-4">
             <div className="bg-slate-800 text-white p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-30"><ChevronLeft size={20}/></button>
                   <span className="text-xs font-black uppercase tracking-widest">Halaman {currentPage} / {templateImg.length}</span>
                   <button disabled={currentPage === templateImg.length} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-30"><ChevronRight size={20}/></button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold opacity-60"><Maximize2 size={14}/> 210 x 297 mm</div>
             </div>

             <Card className="bg-slate-200 p-8 rounded-[3rem] shadow-inner flex flex-col items-center h-[900px] overflow-auto border-[12px] border-slate-300">
                <div 
                   ref={containerRef}
                   onMouseMove={handleMouseMove}
                   onMouseUp={() => setIsDragging(null)}
                   onMouseLeave={() => setIsDragging(null)}
                   className="relative bg-white shadow-2xl origin-top shrink-0"
                   style={{ width: '700px', aspectRatio: '1/1.414', backgroundImage: `url(${templateImg[currentPage - 1]})`, backgroundSize: '100% 100%' }}
                >
                   {fields.filter(f => f.page === currentPage).map(field => (
                     <div 
                        key={field.id}
                        onMouseDown={() => setIsDragging(field.id)}
                        className={`absolute cursor-move select-none p-1 border-2 border-dashed transition-all group ${isDragging === field.id ? 'z-50 border-primary bg-white/80 scale-105 shadow-xl' : 'border-transparent hover:border-blue-400 hover:bg-blue-50/20'}`}
                        style={{ 
                            left: `${field.x}%`, 
                            top: `${field.y}%`, 
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${field.fontSize}px`,
                            fontWeight: field.isBold ? 'bold' : 'normal',
                            color: 'black',
                            fontFamily: 'serif',
                            lineHeight: 1,
                            whiteSpace: 'nowrap'
                        }}
                     >
                        <div className="absolute -top-6 left-0 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 whitespace-nowrap uppercase font-black">{field.label}</div>
                        {field.value || '(Kosong)'}
                     </div>
                   ))}
                </div>
             </Card>
          </div>
        </div>
      )}

      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Simpan Konfigurasi Layout">
         <div className="space-y-4">
            <Input label="Nama Layout" placeholder="Contoh: Berita Acara - V1" value={templateName} onChange={e => setTemplateName(e.target.value)} />
            <Button onClick={saveCurrentTemplate} disabled={!templateName} className="w-full">Simpan Sekarang</Button>
         </div>
      </Modal>

      <PrintPreviewDialog 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Hasil Cetak Dokumen"
        filename={`DOC_${selectedData?.nama?.replace(/\s+/g, '_') || 'GEN'}`}
      >
        <div className="space-y-8">
           {templateImg.map((img, pgIdx) => (
               <div 
                  key={pgIdx}
                  className="relative mx-auto bg-white shadow-md overflow-hidden"
                  style={{ width: '210mm', height: '297mm', backgroundImage: `url(${img})`, backgroundSize: '100% 100%' }}
               >
                  {fields.filter(f => f.page === (pgIdx + 1)).map(field => (
                    <div 
                        key={field.id}
                        className="absolute"
                        style={{ 
                            left: `${field.x}%`, 
                            top: `${field.y}%`, 
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${(field.fontSize * 3.77).toFixed(2)}px`, // Exact Scaling DPI to A4
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
           ))}
        </div>
      </PrintPreviewDialog>
    </div>
  );
};
