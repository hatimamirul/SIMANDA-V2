
import React, { useState, useRef, createContext, useContext, useEffect } from 'react';
import { X, Search, FileDown, FileUp, Plus, Loader2, Eye, EyeOff, Pencil, Trash2, AlertTriangle, CheckCircle, XCircle, Info, Printer, Edit3, Download, LayoutGrid, List, FileSpreadsheet, FileText } from 'lucide-react';

// === CUSTOM ROUTER IMPLEMENTATION ===
const RouterContext = createContext<{ path: string; navigate: (to: string, opts?: { replace?: boolean }) => void }>({ 
  path: window.location.pathname, 
  navigate: () => {} 
});

export const BrowserRouter: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string, { replace }: { replace?: boolean } = {}) => {
    if (replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    setPath(to);
    window.scrollTo(0, 0);
  };

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
};

export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path } = useContext(RouterContext);
  let elementToRender: React.ReactNode = null;
  let found = false;

  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return;
    const { path: routePath, element } = child.props as any;
    if (routePath === path || routePath === '*') {
      elementToRender = element;
      if (routePath === path) found = true;
    }
  });

  return <>{elementToRender}</>;
};

export const Route: React.FC<{ path: string; element: React.ReactNode }> = () => null;

export const useNavigate = () => {
  const { navigate } = useContext(RouterContext);
  return navigate;
};

export const useLocation = () => {
  const { path } = useContext(RouterContext);
  return { pathname: path };
};

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to, replace }) => {
  const { navigate } = useContext(RouterContext);
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
};

export const NavLink: React.FC<{ 
  to: string; 
  children: React.ReactNode; 
  className?: string | ((props: { isActive: boolean }) => string);
  onClick?: () => void;
}> = ({ to, children, className, onClick }) => {
  const { path, navigate } = useContext(RouterContext);
  const isActive = path === to || (to !== '/' && path.startsWith(to));

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick();
    navigate(to);
  };

  const appliedClassName = typeof className === 'function' ? className({ isActive }) : className;

  return (
    <a href={to} onClick={handleClick} className={appliedClassName}>
      {children}
    </a>
  );
};

const LOGO_URI = "https://lh3.googleusercontent.com/d/1ocxhsbrHv2rNUe3r3kEma6oV167MGWea";

export const Logo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`flex items-center justify-center bg-[#0a2340] text-white font-bold rounded-full border-2 border-[#D4AF37] ${className}`} title="Logo Failed to Load" {...props}>
        <span className="text-[0.5em] leading-tight text-center">BGN</span>
      </div>
    );
  }
  return (
    <img src={LOGO_URI} alt="Badan Gizi Nasional Logo" className={`object-contain ${className}`} onError={() => setError(true)} referrerPolicy="no-referrer" {...props} />
  );
};

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; message: string; type: ToastType; }
interface ToastContextType { showToast: (message: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };
  const removeToast = (id: string) => { setToasts((prev) => prev.filter((t) => t.id !== id)); };
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none no-print">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto min-w-[320px] max-w-sm w-full p-4 rounded-xl shadow-2xl flex items-start gap-3 transform transition-all duration-500 animate-slide-in-right border-l-[6px] backdrop-blur-sm ${toast.type === 'success' ? 'bg-white/95 border-emerald-500 shadow-emerald-500/20' : ''} ${toast.type === 'error' ? 'bg-white/95 border-rose-500 shadow-rose-500/20' : ''} ${toast.type === 'info' ? 'bg-white/95 border-blue-500 shadow-blue-500/20' : ''}`}>
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : ''} ${toast.type === 'error' ? 'bg-rose-100 text-rose-600' : ''} ${toast.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}`}>
              {toast.type === 'success' && <CheckCircle size={18} strokeWidth={3} />}
              {toast.type === 'error' && <AlertTriangle size={18} strokeWidth={3} />}
              {toast.type === 'info' && <Info size={18} strokeWidth={3} />}
            </div>
            <div className="flex-1 min-w-0">
               <h4 className={`text-sm font-bold mb-0.5 tracking-tight ${toast.type === 'success' ? 'text-emerald-800' : ''} ${toast.type === 'error' ? 'text-rose-800' : ''} ${toast.type === 'info' ? 'text-blue-800' : ''}`}>
                  {toast.type === 'success' ? 'BERHASIL' : toast.type === 'error' ? 'GAGAL' : 'INFORMASI'}
               </h4>
               <p className="text-sm font-medium text-gray-600 leading-snug break-words"> {toast.message} </p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"> <X size={18} /> </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-4"> <Loader2 className="animate-spin text-primary" size={24} /> </div>
);

export const FormHelperText: React.FC = () => (
  <p className="text-[10px] text-red-500 mt-0.5 ml-1 italic">*kotak tidak boleh kosong, harus di isi lengkap</p>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', icon, className = '', isLoading, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary hover:bg-[#1f5676] text-white focus:ring-primary",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600"
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : (icon && <span className="mr-2">{icon}</span>)}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export const Input: React.FC<InputProps> = ({ label, error, className = '', type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <input type={inputType} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${error ? 'border-red-500' : 'border-gray-300'} ${isPassword ? 'pr-10' : ''} ${className}`} {...props} />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none" tabIndex={-1}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: { value: string; label: string }[]; }
export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white ${className}`} {...props}>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] ${className}`} {...props}> {children} </div>
);

interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors"> <X size={20} className="text-gray-600" /> </button>
        </div>
        <div className="p-6"> {children} </div>
      </div>
    </div>
  );
};

interface ExportModalProps<T> {
  isOpen: boolean; onClose: () => void; title: string; subtitle?: string; data: T[];
  columns: { header: string; accessor: keyof T | ((item: T) => string | number | undefined) }[];
  onExportExcel?: () => void; 
}
export const ExportModal = <T extends {}>({ isOpen, onClose, title, subtitle, data, columns, onExportExcel }: ExportModalProps<T>) => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  if (!isOpen) return null;
  const handleSmartExcelExport = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) return;
    const exportData = data.map(item => {
        const row: any = {};
        columns.forEach(col => {
            const val = typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor];
            row[col.header] = val;
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
    if (!element || !(window as any).html2pdf) return;
    setIsPdfLoading(true);
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'] } 
    };
    (window as any).html2pdf().set(opt).from(element).save().then(() => { setIsPdfLoading(false); });
  };
  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"> <Printer size={20} /> </div>
             <div>
                <h3 className="text-lg font-bold text-gray-800">Preview Export Laporan</h3>
                <p className="text-xs text-gray-500">Format telah dioptimalkan untuk cetak & arsip.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"> <X size={20} className="text-gray-600" /> </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
           <div id="export-preview-content" className="bg-white p-10 shadow-sm border border-gray-200 mx-auto max-w-[297mm] text-black">
              <style>{`
                .pdf-table { width: 100%; border-collapse: collapse; font-size: 10px; color: #000; font-family: Arial, sans-serif; }
                .pdf-table th { background-color: #E5E7EB; color: black; font-weight: bold; text-transform: uppercase; text-align: center !important; vertical-align: middle; border: 1px solid #000; padding: 8px 4px; }
                .pdf-table td { border: 1px solid #000; padding: 6px 4px; vertical-align: middle; color: black; }
                thead { display: table-header-group; } 
                .header-grid { display: grid; grid-template-columns: 100px 1fr 100px; align-items: center; border-bottom: 2px solid black; padding-bottom: 15px; margin-bottom: 20px; }
                .logo-img { width: 100%; height: 80px; object-fit: contain; }
                @media print { body { -webkit-print-color-adjust: exact; } .pdf-table { width: 100%; } }
              `}</style>
              <div className="header-grid report-header">
                  <div className="logo-container"> <img src={LOGO_URI} alt="Logo" className="logo-img" /> </div>
                  <div className="text-center px-2">
                    <h1 className="text-2xl font-bold uppercase tracking-wide leading-tight text-black">SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)</h1>
                    <h2 className="text-sm font-bold uppercase tracking-wider mt-1 text-black">DESA TALES SETONO - KECAMATAN NGADILUWIH</h2>
                    <p className="text-xs text-gray-600 mt-1 italic">Tanggal Laporan: {currentDate}</p>
                  </div>
                  <div className="w-[100px]"></div>
              </div>
              <div className="text-center mb-6 report-header">
                 <h2 className="text-xl font-bold underline decoration-2 underline-offset-4 uppercase text-black">{title}</h2>
                 {subtitle && <p className="text-sm font-medium mt-1 text-gray-700 uppercase">{subtitle}</p>}
              </div>
              <table className="pdf-table">
                 <thead>
                    <tr> <th style={{width: '35px'}}>NO</th> {columns.map((col, idx) => ( <th key={idx}>{col.header}</th> ))} </tr>
                 </thead>
                 <tbody>
                    {data.length === 0 ? (
                       <tr><td colSpan={columns.length + 1} className="p-4 text-center italic">Tidak ada data</td></tr>
                    ) : (
                       data.map((item, idx) => (
                          <tr key={idx}>
                             <td className="text-center font-medium">{idx + 1}</td>
                             {columns.map((col, cIdx) => ( <td key={cIdx}>{typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as any)}</td> ))}
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
              {/* UPDATED SIGNATURE AREA (EXPORT MODAL) */}
              <div className="mt-12 flex justify-end page-break-inside-avoid">
                 <div className="text-center min-w-[220px] text-black">
                    <p className="mb-20 text-sm">Mengetahui,</p>
                    <p className="font-bold underline text-sm whitespace-nowrap">Tiurmasi Saulina Sirait, S.T.</p>
                    <p className="text-xs font-medium uppercase mt-0.5">Kepala SPPG</p>
                 </div>
              </div>
           </div>
        </div>
        <div className="p-4 border-t bg-white flex justify-end gap-3 rounded-b-xl shrink-0">
           <Button variant="secondary" onClick={onClose}>Batal</Button>
           <Button variant="success" onClick={() => { handleSmartExcelExport(); onClose(); }} icon={<FileSpreadsheet size={18} />}> Download Excel </Button>
           <Button variant="danger" onClick={handleExportPdf} isLoading={isPdfLoading} icon={<FileText size={18} />}> Download PDF </Button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmationModalProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; isLoading?: boolean; }
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>Hapus</Button>
        </div>
      </div>
    </div>
  );
};

interface PreviewModalProps { isOpen: boolean; onClose: () => void; src: string | null; title: string; }
export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, src, title }) => {
  if (!isOpen || !src) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in no-print">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Eye size={18}/> {title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"> <X size={20} className="text-gray-600" /> </button>
        </div>
        <div className="p-4 flex-1 overflow-auto bg-gray-100 flex items-center justify-center">
          {src.startsWith('data:image') || src.match(/\.(jpeg|jpg|gif|png)$/) ? (
             <img src={src} alt="Preview" className="max-w-full max-h-[70vh] object-contain shadow-lg rounded" />
          ) : ( <iframe src={src} className="w-full h-[70vh] border-0 rounded bg-white" title="Document Preview" /> )}
        </div>
      </div>
    </div>
  );
};

interface PrintPreviewDialogProps { isOpen: boolean; onClose: () => void; title: string; onPrint?: () => void; filename?: string; children: React.ReactNode; }
export const PrintPreviewDialog: React.FC<PrintPreviewDialogProps> = ({ isOpen, onClose, title, onPrint, filename, children }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  if (!isOpen) return null;
  const handlePrint = () => {
    if (onPrint) { onPrint(); return; }
    const originalTitle = document.title;
    if (filename) document.title = filename;
    window.print();
    if (filename) setTimeout(() => { document.title = originalTitle; }, 500);
  };
  const handleDownload = () => {
    const element = document.getElementById('printable-preview-content');
    if (!element || !(window as any).html2pdf) return;
    setIsDownloading(true);
    const opt = {
      margin: 5, filename: filename?.endsWith('.pdf') ? filename : `${filename || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }, pagebreak: { mode: ['css', 'legacy'] }
    };
    (window as any).html2pdf().set(opt).from(element).save().then(() => { setIsDownloading(false); });
  };
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"> <Printer size={18} className="text-primary"/> {title} </h3>
          <div className="flex gap-2">
             <Button onClick={handlePrint} icon={<Printer size={16}/>} size="sm">Cetak Sekarang</Button>
             <Button onClick={handleDownload} icon={<Download size={16}/>} size="sm" variant="secondary" isLoading={isDownloading}>Download PDF</Button>
             <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"> <X size={20} className="text-gray-600" /> </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto bg-gray-100 flex-1">
           <div id="printable-preview-content" className="bg-white shadow-lg border border-gray-200 p-8 mx-auto max-w-[297mm] min-h-[210mm] text-black"> {children} </div>
        </div>
        <style>{`
          @media print {
            @page { size: landscape; margin: 5mm; }
            body, html, #root { height: 100% !important; width: 100% !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: white !important; }
            body * { visibility: hidden; } .no-print { display: none !important; }
            #printable-preview-content, #printable-preview-content * { visibility: visible; }
            #printable-preview-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; border: none; box-shadow: none; z-index: 99999; }
            table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            th { text-align: center !important; background-color: #E5E7EB !important; -webkit-print-color-adjust: exact; border: 1px solid black; } 
            td { border: 1px solid black; }
          }
        `}</style>
      </div>
    </div>
  );
};

interface SlipGajiModalProps {
  isOpen: boolean; onClose: () => void;
  data: { nama: string; divisi: string; periode: string; periodeDates: string; totalHadir: number; honorHarian: number; totalTerima: number; bank: string; rekening: string; } | null;
  defaultFilename?: string;
}
export const SlipGajiModal: React.FC<SlipGajiModalProps> = ({ isOpen, onClose, data, defaultFilename }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [fileName, setFileName] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  useEffect(() => { if (isOpen && defaultFilename) setFileName(defaultFilename); }, [isOpen, defaultFilename]);
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = fileName || "Slip_Gaji_Karyawan";
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
  };
  const handleDownload = () => {
    const element = document.getElementById('printable-slip');
    if (!element || !(window as any).html2pdf) return;
    setIsDownloading(true);
    const opt = { margin: 0, filename: fileName.endsWith('.pdf') ? fileName : `${fileName || 'document'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } };
    (window as any).html2pdf().set(opt).from(element).save().then(() => { setIsDownloading(false); });
  };
  if (!isOpen || !data) return null;
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl sticky top-0 z-10 no-print flex-wrap gap-2">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mr-auto"><Printer size={18} className="text-primary"/> Preview Slip Gaji</h3>
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20">
            <Edit3 size={14} className="text-gray-400" />
            <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} className="text-sm outline-none w-48 text-gray-600 font-medium" placeholder="Nama File..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} icon={<Printer size={16}/>} size="sm">Cetak</Button>
            <Button onClick={handleDownload} icon={<Download size={16}/>} size="sm" variant="secondary" isLoading={isDownloading}>Download PDF</Button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"> <X size={20} className="text-gray-600" /> </button>
          </div>
        </div>
        <div className="p-8 bg-gray-100 flex justify-center">
          <div ref={componentRef} id="printable-slip" className="bg-white p-2 w-full max-w-[210mm] min-h-[148mm] mx-auto text-black relative print:shadow-none print:w-full print:h-full print:m-0 print:absolute print:top-0 print:left-0 print:p-0">
            <style>{`
              @media print {
                @page { size: landscape; margin: 0mm; }
                body, html, #root { height: 100% !important; width: 100% !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: white !important; }
                body * { visibility: hidden; } #printable-slip, #printable-slip * { visibility: visible; }
                #printable-slip { position: fixed; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 10mm; background: white; z-index: 99999; -webkit-print-color-adjust: exact; }
                .slip-header-grid { display: grid; grid-template-columns: 100px 1fr 100px; align-items: center; border-bottom: 4px double black; padding-bottom: 10px; margin-bottom: 20px; }
              }
              .slip-header-grid { display: grid; grid-template-columns: 100px 1fr 100px; align-items: center; border-bottom: 4px double black; padding-bottom: 10px; margin-bottom: 20px; }
              .logo-img-slip { width: 100%; height: 80px; object-fit: contain; }
            `}</style>
            <div className="border-2 border-black p-8 h-full relative flex flex-col justify-between">
              <div>
                <div className="slip-header-grid">
                  <div className="logo-container"> <img src={LOGO_URI} alt="Logo" className="logo-img-slip" /> </div>
                  <div className="text-center px-2">
                    <h1 className="text-xl font-bold uppercase tracking-wide leading-tight text-black">SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)</h1>
                    <h2 className="text-sm font-bold uppercase tracking-wider mt-1 text-black">DESA TALES SETONO - KECAMATAN NGADILUWIH</h2>
                  </div>
                  <div className="w-[100px]"></div>
                </div>
                <div className="text-center mb-8"> <h2 className="text-2xl font-bold underline decoration-2 underline-offset-4 text-black">SLIP GAJI</h2> </div>
                <div className="grid grid-cols-2 gap-x-8 mb-8 border border-black p-4 rounded-sm">
                  <table className="w-full text-sm text-black">
                    <tbody>
                      <tr><td className="w-32 font-semibold py-1">Nama Karyawan</td><td className="py-1">: {data.nama}</td></tr>
                      <tr><td className="font-semibold py-1">Divisi</td><td className="py-1">: {data.divisi}</td></tr>
                      <tr><td className="font-semibold py-1">Bank</td><td className="py-1">: {data.bank}</td></tr>
                    </tbody>
                  </table>
                  <table className="w-full text-sm text-black">
                    <tbody>
                      <tr><td className="w-32 font-semibold py-1">Periode</td><td className="py-1">: {data.periode}</td></tr>
                      <tr><td className="font-semibold py-1">Tanggal</td><td className="py-1">: {data.periodeDates}</td></tr>
                      <tr><td className="font-semibold py-1">No. Rekening</td><td className="py-1">: {data.rekening}</td></tr>
                    </tbody>
                  </table>
                </div>
                <table className="w-full border-collapse border border-black mb-8 text-sm text-black">
                  <thead> <tr className="bg-gray-200"> <th className="border border-black px-4 py-2 text-left w-1/2 font-bold">KETERANGAN</th> <th className="border border-black px-4 py-2 text-center font-bold">VOL</th> <th className="border border-black px-4 py-2 text-right font-bold">SATUAN (Rp)</th> <th className="border border-black px-4 py-2 text-right font-bold">JUMLAH (Rp)</th> </tr> </thead>
                  <tbody> <tr> <td className="border border-black px-4 py-3">Honorarium Harian</td> <td className="border border-black px-4 py-3 text-center">{data.totalHadir} Hari</td> <td className="border border-black px-4 py-3 text-right">{new Intl.NumberFormat('id-ID').format(data.honorHarian)}</td> <td className="border border-black px-4 py-3 text-right font-medium">{new Intl.NumberFormat('id-ID').format(data.totalTerima)}</td> </tr> </tbody>
                  <tfoot> <tr className="bg-gray-100"> <td colSpan={3} className="border border-black px-4 py-3 text-right text-base font-bold">TOTAL DITERIMA</td> <td className="border border-black px-4 py-3 text-right text-base font-bold">{formatCurrency(data.totalTerima)}</td> </tr> </tfoot>
                </table>
              </div>
              {/* UPDATED SIGNATURE AREA (SLIP GAJI MODAL) */}
              <div className="grid grid-cols-2 mt-8 px-4 text-black text-sm gap-x-16">
                <div className="flex flex-col items-center justify-end">
                  <p className="mb-20 font-bold">Penerima,</p>
                  <div className="border-b border-black w-56 text-center pb-1 font-bold">{data.nama}</div>
                </div>
                <div className="flex flex-col items-center justify-end">
                  <p className="mb-1 text-center">Ngadiluwih, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                  <p className="mb-20 text-center">Mengetahui,</p>
                  <div className="w-full text-center">
                     <p className="font-bold underline whitespace-nowrap">Tiurmasi Saulina Sirait, S.T.</p>
                     <p className="text-xs uppercase mt-0.5">Kepala SPPG</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToolbarProps { onSearch: (q: string) => void; onAdd?: () => void; onExport: () => void; onImport?: (file: File) => void; searchPlaceholder?: string; title: string; layoutMode?: 'table' | 'grid'; onLayoutChange?: (mode: 'table' | 'grid') => void; }
export const Toolbar: React.FC<ToolbarProps> = ({ onSearch, onAdd, onExport, onImport, searchPlaceholder = "Search...", title, layoutMode, onLayoutChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const handleImportClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file && onImport) onImport(file); if (e.target) e.target.value = ''; };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; setSearchValue(val); onSearch(val); };
  const handleClearSearch = () => { setSearchValue(''); onSearch(''); };
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200/60 no-print">
      <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
      <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 items-center">
        <div className="relative flex-grow sm:flex-grow-0 group w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <Search className="text-gray-400 group-focus-within:text-primary transition-colors" size={18} /> </div>
          <input type="text" placeholder={searchPlaceholder} value={searchValue} className="pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-full sm:w-72 bg-gray-50 focus:bg-white transition-all text-sm" onChange={handleSearchChange} />
          {searchValue && ( <button onClick={handleClearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 outline-none transition-colors"> <X size={16} /> </button> )}
        </div>
        {layoutMode && onLayoutChange && (
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button onClick={() => onLayoutChange('table')} className={`p-1.5 rounded-md transition-all ${layoutMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}> <List size={18} /> </button>
            <button onClick={() => onLayoutChange('grid')} className={`p-1.5 rounded-md transition-all ${layoutMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}> <LayoutGrid size={18} /> </button>
          </div>
        )}
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
           {onAdd && <Button onClick={onAdd} icon={<Plus size={18} />} className="whitespace-nowrap shadow-sm">Add New</Button>}
           <Button variant="secondary" onClick={onExport} icon={<FileDown size={18} />} className="whitespace-nowrap shadow-sm">Export</Button>
           {onImport && ( <> <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} /> <Button variant="secondary" onClick={handleImportClick} icon={<FileUp size={18} />} className="whitespace-nowrap shadow-sm">Import</Button> </> )}
        </div>
      </div>
    </div>
  );
};

interface TableProps<T> { columns: { header: string; accessor: keyof T | ((item: T) => React.ReactNode) }[]; data: T[]; onEdit: (item: T) => void; onDelete: (item: T) => void; isLoading?: boolean; hideActions?: boolean; customActions?: (item: T) => React.ReactNode; }
export const Table = <T extends { id: string }>({ columns, data, onEdit, onDelete, isLoading, hideActions = false, customActions }: TableProps<T>) => (
  <div className="overflow-x-auto relative min-h-[150px] no-print">
    {isLoading && ( <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center"> <Loader2 className="animate-spin text-primary" size={32} /> </div> )}
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/50">
          {columns.map((col, idx) => ( <th key={idx} className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"> {col.header} </th> ))}
          {!hideActions && <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {!isLoading && data.length === 0 ? ( <tr> <td colSpan={columns.length + (hideActions ? 0 : 1)} className="p-8 text-center text-gray-500"> No data found. </td> </tr> ) : (
          data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
              {columns.map((col, idx) => ( <td key={idx} className="p-4 text-sm text-gray-700 whitespace-nowrap"> {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)} </td> ))}
              {!hideActions && (
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 items-center">
                    {customActions && customActions(item)}
                    <Button type="button" size="sm" variant="secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(item); }} icon={<Pencil size={14} />}> Edit </Button>
                    <Button type="button" size="sm" variant="danger" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(item); }} icon={<Trash2 size={14} />}> Delete </Button>
                  </div>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
