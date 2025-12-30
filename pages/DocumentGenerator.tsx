
import React, { useState, useEffect, useRef } from 'react';
/* Added Modal to the import list from components/UIComponents */
import { Card, Button, Select, Input, Modal, PrintPreviewDialog, useToast, LoadingSpinner, ConfirmationModal } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Karyawan, PMSekolah, PMB3 } from '../types';
import { 
  FileText, Printer, FileUp, Plus, Trash2, 
  Database, Layers, Info, MousePointer2,
  RefreshCcw, FileEdit, Type, Sparkles,
  Save, History, ChevronLeft, ChevronRight,
  Maximize2, AlignLeft, Italic, Underline,
  GripVertical, Settings, Calendar
} from 'lucide-react';

interface DraggableField {
  id: string;
  label: string;
  value: string;
  x: number; // percentage
  y: number; // percentage
  page: number; // associated PDF page
  fontSize: number;
  isBold: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  fontFamily: 'serif' | 'sans-serif';
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
  const [templateImg, setTemplateImg] = useState<string[]>([]); // Array of base64 pages
  const [currentPage, setCurrentPage] = useState(1);
  const [fields, setFields] = useState<DraggableField[]>([]);
  const [category, setCategory] = useState<'KARYAWAN' | 'SEKOLAH' | 'B3'>('KARYAWAN');
  const [selectedId, setSelectedId] = useState('');
  const [selectedData, setSelectedData] = useState<any>(null);
  
  // Template Storage
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [schools, setSchools] = useState<PMSekolah[]>([]);
  const [b3s, setB3s] = useState<PMB3[]>([]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Load Data & Saved Layouts
  useEffect(() => {
    const unsubK = api.subscribeKaryawan(setEmployees);
    const unsubS = api.subscribePMs(setSchools);
    const unsubB = api.subscribeB3s(setB3s);
    
    const localSaved = localStorage.getItem('simanda_doc_templates');
    if (localSaved) setSavedTemplates(JSON.parse(localSaved));

    return () => { unsubK(); unsubS(); unsubB(); };
  }, []);

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingTemplate(true);
    const pages: string[] = [];

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
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
              pages.push(canvas.toDataURL('image/png'));
            }
          }
          setTemplateImg(pages);
          setCurrentPage(1);
          showToast(`PDF ${pages.length} Halaman berhasil dimuat!`, "success");
          setLoadingTemplate(false);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        showToast("Gagal memproses PDF", "error");
        setLoadingTemplate(false);
      }
    } else {
        // Handle images as single page
        const reader = new FileReader();
        reader.onload = (ev) => {
            setTemplateImg([ev.target?.result as string]);
            setCurrentPage(1);
            setLoadingTemplate(false);
        };
        reader.readAsDataURL(file);
    }
  };

  const addField = (type: 'manual' | 'date' | 'sign' = 'manual') => {
    let defaultValue = '';
    let label = `Input ${fields.length + 1}`;
    let mappingKey = '';

    if (type === 'date') {
        defaultValue = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        label = "Tanggal Otomatis";
    }

    const newField: DraggableField = {
      id: `field_${Date.now()}`,
      label,
      value: defaultValue,
      x: 50,
      y: 50,
      page: currentPage,
      fontSize: 13,
      isBold: false,
      fontFamily: 'serif',
      mappingKey
    };
    setFields([...fields, newField]);
  };

  const saveCurrentTemplate = () => {
      if (!templateName) return;
      const newTemplate: SavedTemplate = {
          id: `tpl_${Date.now()}`,
          name: templateName,
          fields: fields,
          category: category
      };
      const updated = [...savedTemplates, newTemplate];
      setSavedTemplates(updated);
      localStorage.setItem('simanda_doc_templates', JSON.stringify(updated));
      setShowSaveModal(false);
      setTemplateName('');
      showToast("Layout Dokumen berhasil disimpan ke memori!", "success");
  };

  const loadTemplate = (id: string) => {
      const tpl = savedTemplates.find(t => t.id === id);
      if (tpl) {
          setFields(tpl.fields);
          setCategory(tpl.category);
          showToast(`Layout "${tpl.name}" diterapkan.`, "info");
      }
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

  const handleMouseDown = (id: string) => setIsDragging(id);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    if (snapToGrid) {
        x = Math.round(x * 2) / 2; // Snap to 0.5% grid
        y = Math.round(y * 2) / 2;
    }

    setFields(prev => prev.map(f => f.id === isDragging ? { ...f, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : f));
  };

  const handleMouseUp = () => setIsDragging(null);

  const getAvailableMappingKeys = () => {
    if (category === 'KARYAWAN') return ['nama', 'nik', 'divisi', 'hp', 'rekening', 'honorHarian'];
    if (category === 'SEKOLAH') return ['nama', 'npsn', 'desa', 'narahubung', 'jmlsiswa', 'pmBesar', 'pmKecil'];
    if (category === 'B3') return ['nama', 'jenis', 'rt', 'rw', 'desa'];
    return [];
  };

  return (
    <div className="space-y-6 pb-20">
      {/* --- HEADER --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileEdit size={24} />
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Document Visual Engine</h2>
                <p className="text-sm text-gray-500 font-medium">Otomasi pengisian dokumen fisik dengan database.</p>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-2">
            {!templateImg.length ? (
              <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all">
                {loadingTemplate ? <LoadingSpinner /> : <FileUp size={20} />} 
                Pilih Dokumen PDF
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleUploadTemplate} />
              </label>
            ) : (
              <div className="flex gap-2">
                 <Button variant="secondary" onClick={() => setShowSaveModal(true)} icon={<Save size={18}/>}>Simpan Layout</Button>
                 <Button variant="secondary" onClick={() => { setTemplateImg([]); setFields([]); }} icon={<RefreshCcw size={18}/>}>Ganti PDF</Button>
                 <Button onClick={() => setIsPreviewOpen(true)} icon={<Printer size={20} />} className="px-8 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">Cetak Dokumen</Button>
              </div>
            )}
         </div>
      </div>

      {!templateImg.length ? (
        <Card className="p-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-white shadow-inner">
           <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-200">
              <FileText size={56} />
           </div>
           <h3 className="text-xl font-black text-gray-700 uppercase tracking-widest">Siapkan Template Anda</h3>
           <p className="text-gray-400 max-w-sm text-center mt-3 mb-10 font-medium">Unggah berkas PDF asli (Berita Acara, Surat Tugas, Kwitansi) untuk memetakan kolom isian secara otomatis.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <label className="cursor-pointer p-8 bg-white border-2 border-primary/20 rounded-3xl hover:border-primary hover:bg-blue-50 transition-all group flex flex-col items-center text-center">
                 <div className="p-4 bg-primary/10 text-primary rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <FileUp size={32} />
                 </div>
                 <span className="font-bold text-primary">Unggah Berkas Baru</span>
                 <p className="text-xs text-gray-400 mt-2">Mulai menata dari nol</p>
                 <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleUploadTemplate} />
              </label>

              <div className="p-8 bg-gray-50 border-2 border-gray-100 rounded-3xl flex flex-col items-center text-center">
                 <div className="p-4 bg-gray-200 text-gray-400 rounded-2xl mb-4">
                    <History size={32} />
                 </div>
                 <span className="font-bold text-gray-400">Gunakan Layout Tersimpan</span>
                 <select 
                    className="mt-3 w-full p-2 bg-white border rounded-lg text-xs font-bold outline-none"
                    onChange={(e) => loadTemplate(e.target.value)}
                    value=""
                 >
                    <option value="">-- Pilih Layout --</option>
                    {savedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                 </select>
              </div>
           </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* --- SIDEBAR CONTROLS --- */}
          <div className="lg:col-span-4 space-y-5">
            {/* STEP 1: DATA SOURCE */}
            <Card className="p-5 space-y-4">
               <h3 className="font-black text-gray-800 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] mb-2">
                  <Database size={16} className="text-primary"/> 1. Hubungkan Data
               </h3>
               <Select 
                  label="Pilih Database" 
                  value={category} 
                  onChange={e => { setCategory(e.target.value as any); setSelectedId(''); }} 
                  options={[
                      { value: 'KARYAWAN', label: 'Data Karyawan (Pegawai)' },
                      { value: 'SEKOLAH', label: 'Data PM Sekolah (Lembaga)' },
                      { value: 'B3', label: 'Data PM B3 (Prioritas)' },
                  ]}
               />
               <Select 
                  label="Pilih Subjek / Item" 
                  value={selectedId} 
                  onChange={e => setSelectedId(e.target.value)} 
                  options={[{value: '', label: '-- Pilih Data --'}, ...((category === 'KARYAWAN' ? employees : category === 'SEKOLAH' ? schools : b3s).map(i => ({ value: i.id, label: i.nama })))]}
               />
            </Card>

            {/* STEP 2: FIELDS MANAGEMENT */}
            <Card className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-gray-800 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                      <Layers size={16} className="text-primary"/> 2. Kotak Isian
                  </h3>
                  <div className="flex gap-1">
                     <button onClick={() => addField('manual')} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Tambah Teks Manual">
                        <Plus size={16} strokeWidth={3} />
                     </button>
                     <button onClick={() => addField('date')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Tambah Tanggal Otomatis">
                        <Calendar size={16} strokeWidth={2} />
                     </button>
                  </div>
               </div>
               
               <div className="space-y-3">
               {fields.map((field) => (
                 <div key={field.id} className={`p-4 border border-gray-100 rounded-2xl bg-white shadow-sm space-y-3 relative group hover:border-primary/40 transition-all ${isDragging === field.id ? 'ring-2 ring-primary border-primary' : ''}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center overflow-hidden">
                           <GripVertical size={14} className="text-gray-300 shrink-0 cursor-grab" />
                           <input 
                              placeholder="Label Field" 
                              className="bg-transparent text-[10px] font-black uppercase tracking-wider outline-none text-gray-400 w-full truncate" 
                              value={field.label} 
                              onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f))} 
                           />
                        </div>
                        <button onClick={() => setFields(fields.filter(f => f.id !== field.id))} className="text-gray-300 hover:text-red-500 transition-colors">
                           <Trash2 size={14} />
                        </button>
                    </div>

                    <div className="flex gap-2">
                       <textarea 
                          className="flex-1 text-xs p-2 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary/20 h-14 resize-none font-medium"
                          placeholder="Nilai Teks..."
                          value={field.value}
                          onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                       />
                       <select 
                          className="w-10 bg-white border border-gray-200 rounded-xl text-[10px] text-center font-bold text-primary cursor-pointer"
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

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 overflow-x-auto gap-3">
                       <div className="flex items-center gap-1.5">
                          <input 
                            type="number" 
                            className="w-9 text-[10px] bg-gray-50 border border-gray-200 rounded-lg py-1 text-center font-bold" 
                            value={field.fontSize} 
                            onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, fontSize: parseInt(e.target.value) || 12 } : f))} 
                          />
                          <button 
                              onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, isBold: !f.isBold } : f))}
                              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black transition-all ${field.isBold ? 'bg-primary text-white shadow-md' : 'bg-gray-50 border border-gray-200 text-gray-400'}`}
                          >
                              B
                          </button>
                          <button 
                              onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, isItalic: !f.isItalic } : f))}
                              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-serif transition-all ${field.isItalic ? 'bg-primary text-white shadow-md' : 'bg-gray-50 border border-gray-200 text-gray-400'}`}
                          >
                              <Italic size={10} />
                          </button>
                       </div>
                       <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-[9px] font-bold text-gray-500 whitespace-nowrap">
                          PG {field.page} | {Math.round(field.x)}%, {Math.round(field.y)}%
                       </div>
                    </div>
                 </div>
               ))}
               </div>
            </Card>
            
            <div className="flex items-center justify-between px-2">
               <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${snapToGrid ? 'bg-primary' : 'bg-gray-300'}`}>
                     <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${snapToGrid ? 'left-5.5' : 'left-0.5'}`} style={{left: snapToGrid ? '22px' : '2px'}}></div>
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Snap to Grid</span>
                  <input type="checkbox" className="hidden" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} />
               </label>
            </div>
          </div>

          {/* --- EDITOR CANVAS --- */}
          <div className="lg:col-span-8 space-y-4">
             {/* PDF Paging Toolbar */}
             <div className="bg-slate-800 text-white p-3 rounded-2xl flex items-center justify-between shadow-lg border border-slate-700">
                <div className="flex items-center gap-4">
                   <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-30"
                   >
                      <ChevronLeft size={20}/>
                   </button>
                   <span className="text-xs font-black uppercase tracking-[0.2em]">Halaman {currentPage} dari {templateImg.length}</span>
                   <button 
                      disabled={currentPage === templateImg.length}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-30"
                   >
                      <ChevronRight size={20}/>
                   </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold opacity-60">
                   <Maximize2 size={14}/> LAYOUT EDITOR A4
                </div>
             </div>

             <Card className="bg-slate-900 p-8 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col items-center border-[12px] border-slate-800 h-[900px] relative">
                {/* Scrollable container for the actual canvas */}
                <div className="w-full h-full overflow-auto flex justify-center custom-scrollbar">
                    <div 
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="relative bg-white shadow-2xl origin-top cursor-crosshair shrink-0"
                    style={{ 
                        width: '700px', 
                        aspectRatio: '1/1.414', 
                        backgroundImage: `url(${templateImg[currentPage - 1]})`, 
                        backgroundSize: '100% 100%' 
                    }}
                    >
                    {/* Grid Overlay for Visual Aid */}
                    {snapToGrid && (
                        <div className="absolute inset-0 pointer-events-none opacity-5" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '10px 10px'}}></div>
                    )}

                    {fields.filter(f => f.page === currentPage).map(field => (
                        <div 
                            key={field.id}
                            onMouseDown={() => handleMouseDown(field.id)}
                            className={`absolute cursor-move select-none p-1 border-2 border-dashed transition-all group ${isDragging === field.id ? 'z-50 border-primary bg-white/80 scale-105 shadow-xl' : 'border-transparent hover:border-blue-400 hover:bg-blue-50/20'}`}
                            style={{ 
                                left: `${field.x}%`, 
                                top: `${field.y}%`, 
                                transform: 'translate(-50%, -50%)',
                                fontSize: `${field.fontSize}px`,
                                fontWeight: field.isBold ? 'bold' : 'normal',
                                fontStyle: field.isItalic ? 'italic' : 'normal',
                                textDecoration: field.isUnderline ? 'underline' : 'none',
                                color: 'black',
                                fontFamily: field.fontFamily === 'serif' ? 'serif' : 'sans-serif',
                                lineHeight: 1,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <div className="absolute -top-6 left-0 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none uppercase font-black">
                            {field.label}
                            </div>
                            {field.value || '(Kosong)'}
                        </div>
                    ))}
                    </div>
                </div>

                <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md text-white/70 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-4">
                        <div className="flex items-center gap-1.5"><MousePointer2 size={12}/> Klik & Drag Teks</div>
                        <div className="w-1 h-1 rounded-full bg-white/30"></div>
                        <div className="flex items-center gap-1.5"><History size={12}/> Auto-Save Posisi</div>
                    </div>
                </div>
             </Card>
          </div>
        </div>
      )}

      {/* --- SAVE TEMPLATE MODAL --- */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Simpan Konfigurasi Layout">
         <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-2xl flex gap-4">
                <Sparkles className="text-blue-600 shrink-0" size={24}/>
                <p className="text-xs text-blue-900 leading-relaxed font-medium">Layout akan disimpan secara permanen di memori browser Anda. Anda bisa memanggil kembali pengaturan ini di masa mendatang untuk file dokumen yang sejenis.</p>
            </div>
            <Input 
                label="Nama Layout / Template" 
                placeholder="Contoh: Berita Acara Penerimaan Sekolah"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowSaveModal(false)}>Batal</Button>
                <Button onClick={saveCurrentTemplate} disabled={!templateName} icon={<Save size={18}/>}>Simpan Sekarang</Button>
            </div>
         </div>
      </Modal>

      {/* --- FINAL PRINT PREVIEW --- */}
      <PrintPreviewDialog 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Dokumen Hasil Isian"
        filename={`FORM_${selectedData?.nama?.replace(/\s+/g, '_') || 'CETAK'}`}
      >
        <div className="space-y-8">
           {templateImg.map((img, pgIdx) => (
               <div 
                  key={pgIdx}
                  className="relative mx-auto bg-white shadow-md border border-gray-100 overflow-hidden break-after-page"
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
                            fontSize: `${(field.fontSize * 3.77).toFixed(2)}px`, // High-fidelity scale to A4 DPI
                            fontWeight: field.isBold ? 'bold' : 'normal',
                            fontStyle: field.isItalic ? 'italic' : 'normal',
                            textDecoration: field.isUnderline ? 'underline' : 'none',
                            color: 'black',
                            fontFamily: field.fontFamily === 'serif' ? 'serif' : 'sans-serif',
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
