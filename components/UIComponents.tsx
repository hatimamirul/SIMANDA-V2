import React, { useState, useEffect, createContext, useContext, Fragment } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  X, Check, AlertCircle, Loader2, Search, Plus, 
  Download, Upload, Edit, Trash2, Printer, 
  FileSpreadsheet, FileText, LayoutGrid, List,
  ChevronLeft, ChevronRight, Eye, CheckCircle2,
  Menu
} from 'lucide-react';

// Re-export router components
export { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link };

export const LOGO_URI = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; // Placeholder

// === TOAST CONTEXT ===
type ToastType = 'success' | 'error' | 'info';
interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in-right border ${
          toast.type === 'success' ? 'bg-white border-green-100 text-green-700' : 
          toast.type === 'error' ? 'bg-white border-red-100 text-red-700' : 
          'bg-white border-blue-100 text-blue-700'
        }`}>
          {toast.type === 'success' && <CheckCircle2 size={18} className="text-green-500" />}
          {toast.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
          {toast.type === 'info' && <AlertCircle size={18} className="text-blue-500" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

// === BASIC COMPONENTS ===

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <img src={LOGO_URI} alt="Logo" className={`object-contain ${className || 'w-10 h-10'}`} />
);

export const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center p-8">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className || ''}`}>
    {children}
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}
export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading, icon, className, ...props }) => {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  const baseStyles = "rounded-xl font-bold transition-all duration-200 flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    success: "bg-green-50 text-green-600 hover:bg-green-100 border border-green-100"
  };

  return (
    <button className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className || ''}`} disabled={isLoading} {...props}>
      {isLoading && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />}
      {!isLoading && icon}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>}
    <input 
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-700 ${className || ''}`} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: {value: string|number, label: string}[] }> = ({ label, options, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-700 appearance-none bg-white ${className || ''}`} 
        {...props}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <ChevronRight className="rotate-90" size={16} />
      </div>
    </div>
  </div>
);

export const FormHelperText: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] text-red-500 mt-1 italic flex items-center gap-1">
    <AlertCircle size={10} /> {children || "Wajib diisi"}
  </p>
);

// === MODALS ===

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; isLoading?: boolean }> = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>Ya, Lanjutkan</Button>
        </div>
      </div>
    </Modal>
  );
};

export const PreviewModal: React.FC<{ isOpen: boolean; onClose: () => void; src: string | null; title: string }> = ({ isOpen, onClose, src, title }) => {
  if (!isOpen || !src) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
         <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-gray-300">
            <X size={24} />
         </button>
         {src.startsWith('data:application/pdf') || src.endsWith('.pdf') ? (
            <iframe src={src} className="w-full h-[80vh] bg-white rounded-lg" title={title}></iframe>
         ) : (
            <img src={src} alt="Preview" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain bg-white" />
         )}
         <p className="text-white mt-4 font-medium">{title}</p>
      </div>
    </div>
  );
};

export const PrintPreviewDialog: React.FC<{ isOpen: boolean; onClose: () => void; title: string; filename?: string; children: React.ReactNode }> = ({ isOpen, onClose, title, filename, children }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-gray-900/90 flex flex-col animate-fade-in no-print-overlay">
       <div className="h-14 bg-gray-800 flex items-center justify-between px-4 shadow-md shrink-0">
          <h3 className="text-white font-bold">{title}</h3>
          <div className="flex items-center gap-2">
             <Button variant="secondary" onClick={onClose} className="text-xs py-1.5 h-8">Tutup</Button>
             <Button onClick={handlePrint} icon={<Printer size={14} />} className="text-xs py-1.5 h-8">Cetak / PDF</Button>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
           <div className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[10mm] md:p-[15mm] text-black print-content">
               {children}
           </div>
       </div>
       <style>{`
          @media print {
            .no-print-overlay { position: static; background: white; display: block; height: auto; overflow: visible; }
            .no-print-overlay > div:first-child { display: none; }
            .print-content { box-shadow: none; max-width: 100%; width: 100%; padding: 0; margin: 0; }
            body { background: white; }
          }
       `}</style>
    </div>
  );
};

// === TABLE & TOOLBAR ===

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  isLoading?: boolean;
  hideActions?: boolean;
  customActions?: (item: T) => React.ReactNode;
}

export const Table = <T extends { id: string }>({ data, columns, onEdit, onDelete, isLoading, hideActions, customActions }: TableProps<T>) => {
  if (isLoading) return <LoadingSpinner />;
  if (data.length === 0) return <div className="p-8 text-center text-gray-400 italic">Tidak ada data untuk ditampilkan</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-xs">
          <tr>
            <th className="p-4 font-bold w-12 text-center">No</th>
            {columns.map((col, idx) => (
              <th key={idx} className={`p-4 font-bold ${col.className || ''}`}>{col.header}</th>
            ))}
            {!hideActions && <th className="p-4 font-bold text-center w-32">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((item, idx) => (
            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
              <td className="p-4 text-center text-gray-400 font-mono text-xs">{idx + 1}</td>
              {columns.map((col, cIdx) => (
                <td key={cIdx} className={`p-4 ${col.className || ''}`}>
                  {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                </td>
              ))}
              {!hideActions && (
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {customActions && customActions(item)}
                    {onEdit && (
                      <button onClick={() => onEdit(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">
                        <Edit size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(item)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface ToolbarProps {
  title: string;
  onSearch: (val: string) => void;
  onAdd?: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  searchPlaceholder?: string;
  layoutMode?: 'table' | 'grid';
  onLayoutChange?: (mode: 'table' | 'grid') => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ title, onSearch, onAdd, onExport, onImport, searchPlaceholder, layoutMode, onLayoutChange }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder={searchPlaceholder || "Search..."} 
            onChange={e => onSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-64"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
        
        <div className="flex items-center gap-2">
            {onLayoutChange && (
              <div className="flex bg-gray-100 p-1 rounded-xl mr-2">
                <button onClick={() => onLayoutChange('table')} className={`p-1.5 rounded-lg transition-all ${layoutMode === 'table' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                  <List size={18} />
                </button>
                <button onClick={() => onLayoutChange('grid')} className={`p-1.5 rounded-lg transition-all ${layoutMode === 'grid' ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
                  <LayoutGrid size={18} />
                </button>
              </div>
            )}
            
            {onImport && (
              <label className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 cursor-pointer transition-colors" title="Import Excel">
                <Upload size={20} />
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={(e) => e.target.files && onImport(e.target.files[0])} />
              </label>
            )}

            {onExport && (
              <button onClick={onExport} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors" title="Export Data">
                <Download size={20} />
              </button>
            )}

            {onAdd && (
              <Button onClick={onAdd} icon={<Plus size={18} />}>Tambah Data</Button>
            )}
        </div>
      </div>
    </div>
  );
};

// === SLIP GAJI MODAL ===

export const SlipGajiModal: React.FC<{ isOpen: boolean; onClose: () => void; data: any; defaultFilename?: string }> = ({ isOpen, onClose, data, defaultFilename }) => {
  if (!isOpen || !data) return null;

  return (
    <PrintPreviewDialog isOpen={isOpen} onClose={onClose} title="Slip Gaji Karyawan" filename={defaultFilename}>
      <div className="border border-black p-8 max-w-2xl mx-auto">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
             <Logo className="w-12 h-12" />
             <div className="text-left">
                <h2 className="text-xl font-bold uppercase tracking-wider">SPPG Tales Setono</h2>
                <p className="text-xs uppercase">Satuan Pelayanan Pemenuhan Gizi - Ngadiluwih</p>
             </div>
          </div>
          <h1 className="text-2xl font-black uppercase underline">SLIP GAJI</h1>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
           <div>
              <table className="w-full">
                 <tbody>
                    <tr><td className="font-bold py-1">Nama</td><td>: {data.nama}</td></tr>
                    <tr><td className="font-bold py-1">Divisi</td><td>: {data.divisi}</td></tr>
                    <tr><td className="font-bold py-1">Periode</td><td>: {data.periode}</td></tr>
                 </tbody>
              </table>
           </div>
           <div>
              <table className="w-full">
                 <tbody>
                    <tr><td className="font-bold py-1">Bank</td><td>: {data.bank}</td></tr>
                    <tr><td className="font-bold py-1">No. Rek</td><td>: {data.rekening}</td></tr>
                    <tr><td className="font-bold py-1">Tanggal</td><td>: {new Date().toLocaleDateString('id-ID')}</td></tr>
                 </tbody>
              </table>
           </div>
        </div>

        <table className="w-full border-collapse border border-black mb-8 text-sm">
           <thead>
              <tr className="bg-gray-100">
                 <th className="border border-black p-2 text-left">Keterangan</th>
                 <th className="border border-black p-2 text-center w-24">Volume</th>
                 <th className="border border-black p-2 text-right w-32">Satuan (Rp)</th>
                 <th className="border border-black p-2 text-right w-32">Jumlah (Rp)</th>
              </tr>
           </thead>
           <tbody>
              <tr>
                 <td className="border border-black p-2">Honorarium Harian</td>
                 <td className="border border-black p-2 text-center">{data.totalHadir} Hari</td>
                 <td className="border border-black p-2 text-right">{new Intl.NumberFormat('id-ID').format(data.honorHarian)}</td>
                 <td className="border border-black p-2 text-right font-bold">{new Intl.NumberFormat('id-ID').format(data.totalTerima)}</td>
              </tr>
              <tr className="bg-gray-200">
                 <td colSpan={3} className="border border-black p-2 text-right font-bold">TOTAL DITERIMA</td>
                 <td className="border border-black p-2 text-right font-black text-lg">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.totalTerima)}</td>
              </tr>
           </tbody>
        </table>

        <div className="flex justify-between mt-12 mb-4 text-center text-sm break-inside-avoid">
           <div className="w-40">
              <p className="mb-20 font-bold">Penerima</p>
              <p className="font-bold underline">{data.nama}</p>
           </div>
           <div className="w-40">
              <p className="mb-20 font-bold">Kepala SPPG</p>
              <p className="font-bold underline">Tiurmasi S.S., S.T.</p>
           </div>
        </div>
      </div>
    </PrintPreviewDialog>
  );
};


// === EXPORT PREVIEW MODAL (FULL INTEGRATION) ===

interface ExportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: T[];
  columns: { header: string; accessor: keyof T | ((item: T) => React.ReactNode); className?: string }[];
  onExportExcel?: () => void;
  hideLogo?: boolean;
  summaryData?: { [key: string]: string | number };
}

export const ExportModal = <T extends {}>({ isOpen, onClose, title, subtitle, data, columns, onExportExcel, hideLogo = false, summaryData }: ExportModalProps<T>) => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  if (!isOpen) return null;

  // Calculate the first index that contains summary data to determine colspan
  const firstValueIndex = summaryData 
    ? columns.findIndex(col => summaryData[col.header] !== undefined)
    : -1;

  // INTERNAL SMART EXCEL EXPORT
  const handleSmartExcelExport = () => {
    // Check if XLSX is available globally
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
        alert("Library XLSX belum dimuat. Mohon refresh halaman.");
        return;
    }

    if (onExportExcel) {
        onExportExcel();
        return;
    }

    const exportData = data.map(item => {
        const row: any = {};
        columns.forEach(col => {
            const val = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
            row[col.header] = React.isValidElement(val) ? String(val) : val;
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const wscols = columns.map(col => {
        let maxLength = col.header.length;
        exportData.forEach((row: any) => {
            const cellValue = String(row[col.header] || '');
            if (cellValue.length > maxLength) maxLength = cellValue.length;
        });
        return { wch: Math.min(maxLength + 3, 60) }; 
    });
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Export");
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `${safeTitle}_Export.xlsx`);
  };

  const handleExportPdf = () => {
    const element = document.getElementById('export-preview-content');
    const html2pdf = (window as any).html2pdf;
    if (!element || !html2pdf) {
        alert("Library PDF belum siap.");
        return;
    }

    setIsPdfLoading(true);
    const opt = {
      margin: [10, 10, 10, 10], // mm margins
      filename: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'] } 
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsPdfLoading(false);
    });
  };

  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Printer size={20} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-gray-800">Preview Export Laporan</h3>
                <p className="text-xs text-gray-500">Format telah dioptimalkan untuk cetak & arsip.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
           <div id="export-preview-content" className="bg-white p-10 shadow-sm border border-gray-200 mx-auto max-w-[297mm] text-black">
              
              {/* PDF Styles Injection */}
              <style>{`
                .pdf-table { 
                    width: 100%; 
                    margin: 0 auto;
                    border-collapse: collapse; 
                    font-size: 10px; 
                    color: #000; 
                    font-family: Arial, sans-serif;
                }
                .pdf-table th { 
                    background-color: #E5E7EB; 
                    color: black;
                    font-weight: bold;
                    text-transform: uppercase;
                    text-align: center !important; 
                    vertical-align: middle;
                    border: 1px solid #000; 
                    padding: 8px 4px;
                }
                .pdf-table td { 
                    border: 1px solid #000; 
                    padding: 6px 4px; 
                    vertical-align: middle;
                    color: black;
                }
                .pdf-table tr:nth-child(even) { background-color: #fdfdfd; }
                .pdf-table tfoot td {
                    font-weight: bold;
                    border: 1px solid #000;
                    padding: 8px 4px;
                    background-color: #F3F4F6;
                }
                .col-blue { background-color: #DBEAFE !important; }
                .col-pink { background-color: #FCE7F3 !important; }
                .col-purple { background-color: #F3E8FF !important; }
                .col-guru { background-color: #e0e7ff !important; }
                .text-center { text-align: center !important; }
                .report-header { page-break-inside: avoid; }
                thead { display: table-header-group; } 
                tfoot { display: table-footer-group; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                .header-grid {
                    display: grid;
                    grid-template-columns: 100px 1fr 100px; 
                    align-items: center;
                    border-bottom: 2px solid black;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .logo-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 80px;
                    width: 100%;
                }
                .logo-img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain; 
                }
              `}</style>

              {/* Report Header */}
              <div className="header-grid report-header">
                  <div className="logo-container">
                      {!hideLogo && <img src={LOGO_URI} alt="Logo" className="logo-img" />}
                  </div>
                  <div className="text-center px-2">
                    <h1 className="text-2xl font-bold uppercase tracking-wide leading-tight text-black">SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)</h1>
                    <h2 className="text-sm font-bold uppercase tracking-wider mt-1 text-black">DESA TALES SETONO - KECAMATAN NGADILUWIH</h2>
                    <p className="text-xs text-gray-600 mt-1 italic">Tanggal Laporan: {currentDate}</p>
                  </div>
                  <div className="w-[100px]"></div>
              </div>

              {/* Report Title */}
              <div className="text-center mb-6 report-header">
                 <h2 className="text-xl font-bold underline decoration-2 underline-offset-4 uppercase text-black">{title}</h2>
                 {subtitle && <p className="text-sm font-medium mt-1 text-gray-700 uppercase">{subtitle}</p>}
              </div>

              {/* Report Table */}
              <table className="pdf-table">
                 <thead>
                    <tr>
                       <th style={{width: '35px'}}>NO</th>
                       {columns.map((col, idx) => (
                          <th key={idx} className={col.className}>
                             {col.header}
                          </th>
                       ))}
                    </tr>
                 </thead>
                 <tbody>
                    {data.length === 0 ? (
                       <tr><td colSpan={columns.length + 1} className="p-4 text-center italic">Tidak ada data</td></tr>
                    ) : (
                       data.map((item, idx) => (
                          <tr key={idx}>
                             <td className="text-center font-medium">{idx + 1}</td>
                             {columns.map((col, cIdx) => (
                                <td key={cIdx} className={col.className}>
                                   {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as any)}
                                </td>
                             ))}
                          </tr>
                       ))
                    )}
                 </tbody>
                 {summaryData && (
                    <tfoot>
                        <tr>
                            <td 
                                colSpan={firstValueIndex === -1 ? columns.length + 1 : firstValueIndex + 1} 
                                className="text-right font-black bg-gray-200 border border-black px-2 uppercase text-[10px] tracking-wider"
                            >
                                TOTAL KESELURUHAN:
                            </td>
                            {columns.map((col, idx) => {
                                if (idx < firstValueIndex) return null;
                                const val = summaryData[col.header];
                                return (
                                    <td key={idx} className={`text-center font-bold border border-black ${col.className || 'bg-gray-200'}`}>
                                        {val !== undefined ? val : ''}
                                    </td>
                                );
                            })}
                        </tr>
                    </tfoot>
                 )}
              </table>

              {/* Footer Signature */}
              <div className="mt-10 flex justify-end page-break-inside-avoid">
                 <div className="text-center w-64 text-black">
                    <p className="mb-16">Mengetahui,</p>
                    <p className="font-bold underline whitespace-nowrap">Tiurmasi Saulina Sirait, S.T.</p>
                    <p className="text-xs">Kepala SPPG</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-white flex justify-end gap-3 rounded-b-xl shrink-0">
           <Button variant="secondary" onClick={onClose}>Batal</Button>
           <Button 
              variant="success" 
              onClick={() => { 
                  handleSmartExcelExport();
                  onClose(); 
              }} 
              icon={<FileSpreadsheet size={18} />}
           >
              Download Excel
           </Button>
           <Button 
              variant="danger" 
              onClick={handleExportPdf} 
              isLoading={isPdfLoading} 
              icon={<FileText size={18} />}
           >
              Download PDF
           </Button>
        </div>
      </div>
    </div>
  );
};
