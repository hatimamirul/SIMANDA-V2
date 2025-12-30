
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Input, Modal, PrintPreviewDialog, useToast, LoadingSpinner } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Karyawan, PMSekolah, PMB3, User } from '../types';
import { 
  FileText, Printer, FileUp, Plus, Trash2, 
  Database, Layers, Info, MousePointer2,
  RefreshCcw, FileEdit, Sparkles,
  Save, History, ChevronLeft, ChevronRight,
  Maximize2, Italic, GripVertical, Calendar,
  Wand2, Search, CheckCircle2, Clock, MapPin,
  UserCheck, Zap, ArrowRightLeft, User as UserIcon
} from 'lucide-react';

interface DraggableField {
  id: string;
  label: string;
  value: string;
  x: number; 
  y: number; 
  page: number;
  fontSize: number;
  isBold: boolean;
  fontFamily: string;
  mappingKey?: string;
  type?: 'text' | 'date' | 'time' | 'day';
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
  const [pdfMetadata, setPdfMetadata] = useState<any[]>([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [fields, setFields] = useState<DraggableField[]>([]);
  const [category, setCategory] = useState<'KARYAWAN' | 'SEKOLAH' | 'B3'>('SEKOLAH');
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

  // Assisted Form State
  const [assistData, setAssistData] = useState({
    hari: '',
    tanggal: new Date().toLocaleDateString('id-ID'),
    jamTerima: '',
    jamKembali: '',
    jumlahPaket: '',
    sekolahId: '',
    jamKadaluarsa: '',
    karyawanDistribusiId: '',
    karyawanHp: ''
  });

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
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
              pages.push(canvas.toDataURL('image/png'));
            }
            const textContent = await page.getTextContent();
            metadata.push(textContent.items.map((item: any) => ({
                text: item.str,
                transform: item.transform,
                width: item.width,
                height: item.height
            })));
          }
          setTemplateImg(pages);
          setPdfMetadata(metadata);
          setCurrentPage(1);
          showToast(`PDF ${pages.length} Halaman dimuat.`, "success");
          setLoadingTemplate(false);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        showToast("Gagal memproses PDF", "error");
        setLoadingTemplate(false);
      }
    }
  };

  // --- ENGINE ANALISA KHUSUS BERITA ACARA BGN ---
  const autoAnalyzeTemplate = () => {
    if (pdfMetadata.length === 0) return;
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const currentPageMetadata = pdfMetadata[currentPage - 1];
      const newFields: DraggableField[] = [];
      
      // Keywords specific to the provided BGN Berita Acara image
      const keywords = [
        { label: 'Hari', key: 'hari', offset: [5, 0], match: 'PADA HARI' },
        { label: 'Tanggal', key: 'tanggal', offset: [10, 0], match: 'TANGGAL' },
        { label: 'Jam Terima', key: 'jamTerima', offset: [5, 0], match: 'JAM' },
        { label: 'Jumlah Paket', key: 'jumlahPaket', offset: [5, 0], match: 'SEJUMLAH' },
        { label: 'Melayani', key: 'melayani', offset: [0, -10], match: 'YANG MELAYANI' },
        { label: 'Kadaluarsa', key: 'jamKadaluarsa', offset: [15, 0], match: 'SEBELUM JAM' },
        { label: 'Menyerahkan', key: 'penyerah', offset: [20, 0], match: 'YANG MENYERAHKAN :' },
        { label: 'HP Penyerah', key: 'hpPenyerah', offset: [20, 0], match: 'NOMOR TELEPON :' },
        { label: 'Penerima', key: 'penerima', offset: [20, 0], match: 'DITERIMA OLEH :' },
      ];

      currentPageMetadata.forEach((item: any) => {
        const text = item.text.toUpperCase();
        keywords.forEach(kw => {
            if (text.includes(kw.match)) {
                const fontSize = Math.abs(item.transform[0]);
                // Basic PDF coordinate conversion to percentages
                const x = (item.transform[4] / 600) * 100 + kw.offset[0];
                const y = 100 - (item.transform[5] / 842) * 100 + kw.offset[1];

                newFields.push({
                    id: `${kw.key}_${Date.now()}_${Math.random()}`,
                    label: kw.label,
                    value: '',
                    x: Math.min(x, 90),
                    y: Math.min(y, 98),
                    page: currentPage,
                    fontSize: fontSize || 11,
                    isBold: false,
                    fontFamily: 'sans-serif',
                });
            }
        });
      });

      if (newFields.length > 0) {
        setFields(prev => [...prev, ...newFields]);
        showToast(`${newFields.length} area isian dideteksi otomatis.`, "success");
      }
      setIsAnalyzing(false);
    }, 1200);
  };

  // --- LOGIKA ASISTEN FORM CEPAT ---
  const applyAssist = () => {
    const sekolah = schools.find(s => s.id === assistData.sekolahId);
    const karyawan = employees.find(e => e.id === assistData.karyawanDistribusiId);

    setFields(prev => prev.map(f => {
        if (f.label.includes('Hari')) return { ...f, value: assistData.hari };
        if (f.label.includes('Tanggal')) return { ...f, value: assistData.tanggal };
        if (f.label.includes('Jam Terima')) return { ...f, value: assistData.jamTerima };
        if (f.label.includes('Jam Kembali')) return { ...f, value: assistData.jamKembali };
        if (f.label.includes('Jumlah Paket')) return { ...f, value: assistData.jumlahPaket };
        if (f.label.includes('Melayani') || f.label.includes('Ompreng')) return { ...f, value: sekolah?.nama || '' };
        if (f.label.includes('Kadaluarsa')) return { ...f, value: assistData.jamKadaluarsa };
        if (f.label.includes('Menyerahkan') || f.label.includes('Penerima')) return { ...f, value: karyawan?.nama || '' };
        if (f.label.includes('HP Penyerah') || f.label.includes('Nomor Telepon')) return { ...f, value: karyawan?.hp || '' };
        return f;
    }));
    showToast("Isian formulir diterapkan ke dokumen.", "info");
  };

  const addField = (type: 'manual' | 'date' = 'manual') => {
    const newField: DraggableField = {
      id: `field_${Date.now()}`,
      label: type === 'date' ? 'Tanggal' : `Input ${fields.length + 1}`,
      value: type === 'date' ? new Date().toLocaleDateString('id-ID') : '',
      x: 50, y: 50, page: currentPage, fontSize: 11, isBold: false, fontFamily: 'sans-serif'
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
    showToast("Layout disimpan!", "success");
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    setFields(prev => prev.map(f => f.id === isDragging ? { ...f, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : f));
  };

  const distKaryawan = employees.filter(e => e.divisi === 'Distribusi');

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                <FileEdit size={24} />
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Visual Document Generator</h2>
                <p className="text-sm text-gray-400 font-medium">Asisten pengisian dokumen otomatis presisi tinggi.</p>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-2">
            {!templateImg.length ? (
              <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:shadow-xl transition-all">
                {loadingTemplate ? <LoadingSpinner /> : <FileUp size={20} />} 
                Pilih Berkas PDF
                <input type="file" className="hidden" accept=".pdf" onChange={handleUploadTemplate} />
              </label>
            ) : (
              <div className="flex gap-2">
                 <Button variant="secondary" onClick={autoAnalyzeTemplate} isLoading={isAnalyzing} icon={<Wand2 size={18}/>} className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 rounded-2xl">Pindai Area Isian</Button>
                 <Button variant="secondary" onClick={() => setShowSaveModal(true)} icon={<Save size={18}/>} className="rounded-2xl">Simpan Layout</Button>
                 <Button onClick={() => setIsPreviewOpen(true)} icon={<Printer size={20} />} className="px-8 bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg shadow-emerald-100">Cetak Hasil</Button>
              </div>
            )}
         </div>
      </div>

      {!templateImg.length ? (
        <Card className="p-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-white rounded-[3rem]">
           <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-200 border border-blue-100">
              <Zap size={48} />
           </div>
           <h3 className="text-xl font-black text-gray-700 uppercase tracking-widest">Mulai Pembuatan Dokumen</h3>
           <p className="text-gray-400 max-w-sm text-center mt-2 mb-10 font-medium text-sm">Unggah file Berita Acara atau dokumen PDF lainnya untuk diisi secara digital.</p>
           
           <div className="flex gap-4">
              <label className="cursor-pointer px-10 py-4 bg-primary text-white rounded-3xl font-bold shadow-xl shadow-primary/20 flex items-center gap-3 hover:-translate-y-1 transition-all">
                 <FileUp size={20}/> Pilih PDF Dari Komputer
                 <input type="file" className="hidden" accept=".pdf" onChange={handleUploadTemplate} />
              </label>
              {savedTemplates.length > 0 && (
                <div className="relative group">
                    <button className="px-10 py-4 bg-gray-100 text-gray-600 rounded-3xl font-bold flex items-center gap-3 hover:bg-gray-200 transition-all">
                        <History size={20}/> Gunakan Layout Tersimpan
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white shadow-2xl rounded-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-2">Pilih Konfigurasi</p>
                        {savedTemplates.map(t => (
                            <button key={t.id} onClick={() => { setFields(t.fields); setCategory(t.category); setTemplateImg(['#']); showToast(`Layout ${t.name} dimuat`,"info"); }} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 rounded-xl text-sm font-bold text-gray-700 transition-colors">{t.name}</button>
                        ))}
                    </div>
                </div>
              )}
           </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ASISTEN PANEL (SIDEBAR) */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* SMART ASSISTANT FORM */}
            <Card className="p-6 border-l-8 border-l-blue-600 rounded-3xl shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-gray-800 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
                        <Zap size={16} className="text-blue-600"/> Asisten Form Cepat
                    </h3>
                    <div className="p-1 bg-blue-100 text-blue-600 rounded-lg"><Sparkles size={14}/></div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Hari</label>
                            <select 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-200 outline-none"
                                value={assistData.hari}
                                onChange={e => setAssistData({...assistData, hari: e.target.value})}
                            >
                                {['','Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => <option key={h} value={h}>{h || '-- Pilih --'}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Tanggal</label>
                            <input 
                                type="text" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none"
                                placeholder="11/12/2025"
                                value={assistData.tanggal}
                                onChange={e => setAssistData({...assistData, tanggal: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Jam Terima</label>
                            <input 
                                type="text" className="w-full bg-blue-50/50 border border-blue-100 rounded-xl px-3 py-2 text-sm font-bold text-blue-800 outline-none" placeholder="07:30"
                                value={assistData.jamTerima} onChange={e => setAssistData({...assistData, jamTerima: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Kadaluarsa</label>
                            <input 
                                type="text" className="w-full bg-orange-50/50 border border-orange-100 rounded-xl px-3 py-2 text-sm font-bold text-orange-800 outline-none" placeholder="11:00"
                                value={assistData.jamKadaluarsa} onChange={e => setAssistData({...assistData, jamKadaluarsa: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Lembaga Sekolah (Yang Melayani)</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none"
                            value={assistData.sekolahId}
                            onChange={e => setAssistData({...assistData, sekolahId: e.target.value})}
                        >
                            <option value="">-- Pilih Sekolah --</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Petugas Penyerah (Distribusi)</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none"
                            value={assistData.karyawanDistribusiId}
                            onChange={e => setAssistData({...assistData, karyawanDistribusiId: e.target.value})}
                        >
                            <option value="">-- Pilih Petugas --</option>
                            {distKaryawan.map(e => <option key={e.id} value={e.id}>{e.nama} ({e.divisi})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Jumlah Paket / Ompreng</label>
                        <div className="relative">
                            <input 
                                type="number" className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-sm font-black text-emerald-800 outline-none pr-10" placeholder="0"
                                value={assistData.jumlahPaket} onChange={e => setAssistData({...assistData, jumlahPaket: e.target.value})}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600">PORSI</span>
                        </div>
                    </div>

                    <Button onClick={applyAssist} className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-3 shadow-lg shadow-blue-100" icon={<Zap size={18}/>}>Terapkan ke Dokumen</Button>
                </div>
            </Card>

            {/* RAW FIELDS LIST */}
            <Card className="p-5 space-y-4 max-h-[400px] overflow-y-auto rounded-3xl">
               <div className="flex justify-between items-center">
                  <h3 className="font-black text-gray-800 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                      <Layers size={14} className="text-primary"/> Data Isian Visual
                  </h3>
                  <button onClick={() => addField('manual')} className="p-1.5 bg-primary text-white rounded-lg shadow-md hover:scale-110 transition-transform"><Plus size={16}/></button>
               </div>
               
               <div className="space-y-3">
               {fields.map((field) => (
                 <div key={field.id} className={`p-4 border border-gray-100 rounded-2xl bg-white shadow-sm space-y-2 relative group hover:border-primary/40 transition-all ${isDragging === field.id ? 'ring-2 ring-primary border-primary' : ''}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center overflow-hidden">
                           <GripVertical size={14} className="text-gray-300 shrink-0" />
                           <input className="bg-transparent text-[10px] font-black uppercase tracking-wider outline-none text-gray-400 w-full" value={field.label} onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, label: e.target.value } : f))} />
                        </div>
                        <button onClick={() => setFields(fields.filter(f => f.id !== field.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>

                    <input 
                        className="w-full text-xs p-2 border border-gray-200 rounded-xl bg-gray-50 outline-none font-bold text-gray-800 uppercase"
                        value={field.value}
                        onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, value: e.target.value } : f))}
                    />

                    <div className="flex items-center justify-between pt-1">
                       <div className="flex items-center gap-1.5">
                          <input type="number" className="w-8 text-[10px] bg-gray-50 border border-gray-200 rounded-lg py-1 text-center font-bold" value={field.fontSize} onChange={e => setFields(fields.map(f => f.id === field.id ? { ...f, fontSize: parseInt(e.target.value) || 12 } : f))} />
                          <button onClick={() => setFields(fields.map(f => f.id === field.id ? { ...f, isBold: !f.isBold } : f))} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${field.isBold ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>B</button>
                       </div>
                       <div className="text-[8px] font-bold text-gray-300 uppercase">Halaman {field.page}</div>
                    </div>
                 </div>
               ))}
               </div>
            </Card>
          </div>

          {/* EDITOR CANVAS AREA */}
          <div className="lg:col-span-8 space-y-4">
             {/* Pagination Toolbar */}
             <div className="bg-slate-800 text-white p-4 rounded-[2rem] flex items-center justify-between shadow-2xl border border-slate-700">
                <div className="flex items-center gap-4">
                   <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl disabled:opacity-30 transition-all"><ChevronLeft size={20}/></button>
                   <div className="flex flex-col items-center min-w-[120px]">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Halaman</span>
                      <span className="text-sm font-black">{currentPage} dari {templateImg.length}</span>
                   </div>
                   <button disabled={currentPage === templateImg.length} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl disabled:opacity-30 transition-all"><ChevronRight size={20}/></button>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40">
                   <Maximize2 size={16}/> LIVE EDITOR
                </div>
             </div>

             {/* Main Canvas */}
             <Card className="bg-slate-200 p-8 rounded-[4rem] shadow-inner flex flex-col items-center h-[900px] overflow-auto border-[16px] border-white relative group">
                <div 
                   ref={containerRef}
                   onMouseMove={handleMouseMove}
                   onMouseUp={() => setIsDragging(null)}
                   onMouseLeave={() => setIsDragging(null)}
                   className="relative bg-white shadow-2xl origin-top shrink-0 transition-all duration-300"
                   style={{ width: '700px', aspectRatio: '1/1.414', backgroundImage: `url(${templateImg[currentPage - 1]})`, backgroundSize: '100% 100%' }}
                >
                   {/* Overlay Guidelines */}
                   <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_0)] bg-[size:20px_20px]"></div>

                   {fields.filter(f => f.page === currentPage).map(field => (
                     <div 
                        key={field.id}
                        onMouseDown={() => setIsDragging(field.id)}
                        className={`absolute cursor-move select-none p-1 border-2 border-dashed transition-all group ${isDragging === field.id ? 'z-50 border-blue-600 bg-white/90 scale-105 shadow-2xl ring-4 ring-blue-500/10' : 'border-transparent hover:border-blue-400 hover:bg-blue-50/20'}`}
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
                        <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[8px] px-2 py-0.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 whitespace-nowrap uppercase font-black tracking-widest border border-white/20 transition-opacity">
                            {field.label}
                        </div>
                        {field.value || '(Kosong)'}
                     </div>
                   ))}
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase"><MousePointer2 size={14} className="text-blue-400"/> Klik & Geser Teks</div>
                    <div className="w-px h-4 bg-white/20"></div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase"><Clock size={14} className="text-blue-400"/> Auto-Placement</div>
                </div>
             </Card>
          </div>
        </div>
      )}

      {/* SAVE MODAL */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Simpan Tata Letak">
         <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-800 text-xs font-medium border border-blue-100">
               Konfigurasi koordinat teks akan disimpan. Anda dapat menggunakan layout ini kembali saat mengunggah dokumen PDF yang sama di masa mendatang.
            </div>
            <Input label="Nama Konfigurasi" placeholder="Misal: Berita Acara Harian" value={templateName} onChange={e => setTemplateName(e.target.value)} autoFocus />
            <Button onClick={saveCurrentTemplate} disabled={!templateName} className="w-full rounded-2xl py-3 shadow-lg shadow-blue-100">Simpan Sekarang</Button>
         </div>
      </Modal>

      {/* PRINT PREVIEW */}
      <PrintPreviewDialog 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Final Dokumen"
        filename={`DOC_${new Date().getTime()}`}
      >
        <div className="space-y-8 no-scrollbar">
           {templateImg.map((img, pgIdx) => (
               <div 
                  key={pgIdx}
                  className="relative mx-auto bg-white shadow-2xl overflow-hidden break-after-page"
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
                            fontSize: `${(field.fontSize * 3.77).toFixed(2)}px`, // Scaling precise for A4 Web Graphics
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
