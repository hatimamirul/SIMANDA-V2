import React, { useEffect, useState } from 'react';
import { Card, Table, Button, LoadingSpinner, SlipGajiModal, ExportModal, PrintPreviewDialog, Logo } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Periode, HonorariumRow } from '../types';
import { Calendar, Wallet, FileDown, CalendarDays, Printer, Files, Image as ImageIcon } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const HonorKaryawanPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [honorData, setHonorData] = useState<HonorariumRow[]>([]);
  const [isExportingImage, setIsExportingImage] = useState(false);
  
  // Slip Gaji State
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [selectedSlipData, setSelectedSlipData] = useState<any>(null);
  const [defaultFilename, setDefaultFilename] = useState("");
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Bulk Print State
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);

  // Realtime Subscription to Periodes
  useEffect(() => {
    const unsubscribe = api.subscribePeriode((data) => {
      setPeriodes(data);
      // Auto-select latest period if none selected
      if (data.length > 0 && !selectedPeriode) {
        setSelectedPeriode(data[data.length - 1].id);
      }
    });
    return () => unsubscribe();
  }, [selectedPeriode]);

  // Realtime Subscription to Honorarium Data
  useEffect(() => {
    if (!selectedPeriode) {
        setHonorData([]);
        return;
    }
    setLoading(true);
    
    // Using the new realtime join subscriber
    const unsubscribe = api.subscribeHonorariumKaryawan(selectedPeriode, (data) => {
        setHonorData(data);
        setLoading(false);
    });
    
    return () => unsubscribe();
  }, [selectedPeriode]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Helper to calculate date range (14 working days)
  const getPeriodeDateRange = (periodeId: string) => {
    const p = periodes.find(x => x.id === periodeId);
    if (!p || !p.tanggalMulai) return '';

    const dates: Date[] = [];
    const currentDate = new Date(p.tanggalMulai);
    let safety = 0;

    // Calculate 14 consecutive days (including Sunday)
    while (dates.length < 14 && safety < 40) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      safety++;
    }

    if (dates.length === 0) return '';
    
    const start = dates[0];
    const end = dates[dates.length - 1];
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const fmt = (d: Date) => new Intl.DateTimeFormat('id-ID', options).format(d);

    return `${fmt(start)} s/d ${fmt(end)}`;
  };

  const totalBudget = honorData.reduce((acc, curr) => acc + curr.totalTerima, 0);
  const currentPeriodeName = periodes.find(p => p.id === selectedPeriode)?.nama || 'Periode';

  const handleExportExcel = () => {
    if (honorData.length === 0) return;
    
    const dataToExport = honorData.map((item, index) => ({
      'No': index + 1,
      'Nama Karyawan': item.nama,
      'Divisi': item.divisi,
      'Bank': item.bank,
      'No Rekening': item.rekening,
      'Total Hadir (Hari)': item.totalHadir,
      'Honor/Hari': item.honorHarian,
      'Total Terima': item.totalTerima
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Honorarium");
    XLSX.writeFile(wb, `Honorarium_Karyawan_${currentPeriodeName}.xlsx`);
  };

  const handleExportImageHD = async () => {
    const element = document.getElementById('bulk-slip-content');
    if (!element) return;

    setIsExportingImage(true);
    
    try {
        // Access html2pdf's bundled html2canvas or use global if available
        // Note: html2pdf bundle usually exposes html2canvas globally or via the internal worker
        // We will try a standard approach assuming html2canvas is available via the script tag in index.html
        
        // Wait a moment for rendering
        await new Promise(resolve => setTimeout(resolve, 500));

        // @ts-ignore
        const canvas = await (window.html2canvas || (window.html2pdf && window.html2pdf().worker && window.html2pdf().worker.html2canvas))(element, {
            scale: 3, // HD Quality (3x Resolution)
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `Slip_Gaji_Batch_${currentPeriodeName.replace(/\s+/g, '_')}_HD.png`;
        link.href = image;
        link.click();

    } catch (error) {
        console.error("Export Image Failed:", error);
        alert("Gagal melakukan export gambar. Pastikan browser mendukung fitur ini.");
    } finally {
        setIsExportingImage(false);
    }
  };

  const handlePrintSlip = (item: HonorariumRow) => {
    const periode = periodes.find(p => p.id === selectedPeriode);
    
    const safeNama = item.nama.replace(/\s+/g, '_');
    const safePeriode = (periode?.nama || 'Periode').replace(/\s+/g, '_');
    const fileName = `Slip_Gaji_${safeNama}_${safePeriode}.pdf`;

    setSelectedSlipData({
      nama: item.nama,
      divisi: item.divisi,
      periode: periode?.nama || '-',
      periodeDates: getPeriodeDateRange(selectedPeriode),
      totalHadir: item.totalHadir,
      honorHarian: item.honorHarian,
      totalTerima: item.totalTerima,
      bank: item.bank,
      rekening: item.rekening
    });
    setDefaultFilename(fileName);
    setIsSlipOpen(true);
  };

  const periodeInfo = periodes.find(p => p.id === selectedPeriode);
  const periodeDateInfo = getPeriodeDateRange(selectedPeriode);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div>
           <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="text-primary" /> Honorarium Karyawan
          </h2>
          <p className="text-sm text-gray-500 mt-1">Perhitungan otomatis gaji berdasarkan absensi (Realtime)</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto items-center relative">
          <select 
            className="pl-4 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-blue-50/50 border-blue-100 font-medium text-blue-900 w-full md:w-64 appearance-none cursor-pointer hover:bg-blue-50 transition-colors"
            value={selectedPeriode}
            onChange={(e) => setSelectedPeriode(e.target.value)}
          >
            <option value="" disabled>Pilih Periode Absensi</option>
            {periodes.map(p => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </select>
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={16}/>
        </div>
      </div>

      {!selectedPeriode ? (
        <Card className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-200">
          <p className="text-lg font-medium">Silahkan pilih periode absensi terlebih dahulu</p>
        </Card>
      ) : loading && honorData.length === 0 ? (
        <LoadingSpinner />
      ) : (
        <>
          <Card className="p-6 bg-gradient-to-r from-primary to-blue-700 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Anggaran Honorarium</p>
                <h3 className="text-3xl font-bold">{formatCurrency(totalBudget)}</h3>
                <div className="mt-2 text-xs text-blue-200 bg-white/10 inline-block px-3 py-1.5 rounded-lg border border-white/10">
                  <p className="font-semibold">{periodeInfo?.nama}</p>
                  <p className="mt-0.5 opacity-90 flex items-center gap-1.5">
                    <CalendarDays size={12}/> {periodeDateInfo}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsBulkPrintOpen(true)} icon={<Files size={18}/>}>
                  Cetak Semua Slip
                </Button>
                <Button variant="secondary" onClick={() => setIsExportModalOpen(true)} icon={<FileDown size={18}/>}>
                  Export Laporan
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <Table<HonorariumRow>
              data={honorData}
              hideActions={false} 
              columns={[
                { header: 'Nama Karyawan', accessor: 'nama' },
                { header: 'Divisi', accessor: (i) => <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{i.divisi}</span> },
                { header: 'Bank', accessor: 'bank' },
                { header: 'Rekening', accessor: 'rekening' },
                { 
                  header: 'Total Hadir', 
                  accessor: (i) => (
                    <span className="font-bold text-gray-800">{i.totalHadir} Hari</span>
                  ) 
                },
                { header: 'Honor/Hari', accessor: (i) => formatCurrency(i.honorHarian) },
                { 
                  header: 'Total Terima', 
                  accessor: (i) => <span className="text-green-600 font-bold">{formatCurrency(i.totalTerima)}</span> 
                },
              ]}
              customActions={(item) => (
                <Button 
                  size="sm" 
                  variant="primary" 
                  onClick={() => handlePrintSlip(item)}
                  icon={<Printer size={14} />}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Slip Gaji
                </Button>
              )}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </Card>
        </>
      )}

      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={`Laporan Honorarium Karyawan - ${currentPeriodeName}`}
        subtitle={`Periode: ${getPeriodeDateRange(selectedPeriode)}`}
        data={honorData}
        columns={[
            { header: 'Nama Karyawan', accessor: 'nama' },
            { header: 'Divisi', accessor: 'divisi' },
            { header: 'Bank', accessor: 'bank' },
            { header: 'Rekening', accessor: 'rekening' },
            { header: 'Total Hadir', accessor: (i) => `${i.totalHadir} Hari` },
            { header: 'Total Terima', accessor: (i) => formatCurrency(i.totalTerima) }
        ]}
        onExportExcel={handleExportExcel}
      />

      <SlipGajiModal 
        isOpen={isSlipOpen} 
        onClose={() => setIsSlipOpen(false)} 
        data={selectedSlipData}
        defaultFilename={defaultFilename}
      />

      {/* --- BULK PRINT MODAL (PROFESSIONAL LAYOUT & HD EXPORT) --- */}
      <PrintPreviewDialog
        isOpen={isBulkPrintOpen}
        onClose={() => setIsBulkPrintOpen(false)}
        title={`Cetak Semua Slip - ${periodeInfo?.nama || ''}`}
        filename={`Slip_Gaji_Batch_${periodeInfo?.nama?.replace(/\s+/g, '_')}`}
      >
         <div className="no-print mb-6 flex justify-end">
            <Button 
               variant="success" 
               onClick={handleExportImageHD} 
               isLoading={isExportingImage}
               icon={<ImageIcon size={18} />}
               className="shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
               Export Image (Full HD)
            </Button>
         </div>

         <style>{`
           /* Screen Styles */
           .bulk-container { 
              display: flex;
              flex-direction: column;
              gap: 20px;
              width: 100%;
              background: #525659; /* Contrast background for screen view */
              padding: 20px;
              align-items: center;
           }
           
           .slip-wrapper {
              background: white;
              width: 100%;
              max-width: 210mm; /* A4 Width restriction */
              min-height: 9.5cm; /* Est height ~1/3 A4 */
              box-sizing: border-box;
              position: relative;
              box-shadow: 0 4px 10px rgba(0,0,0,0.15);
           }

           /* --- PRINT STYLES (Professional A4) --- */
           @media print {
             @page { 
               size: A4 portrait;
               margin: 5mm; 
             }
             body { 
               background: white; 
               margin: 0;
               padding: 0;
               -webkit-print-color-adjust: exact; 
               print-color-adjust: exact;
             }
             
             .bulk-container { 
               display: block; 
               width: 100%;
               padding: 0;
               background: white;
             }
             
             /* Container Slip */
             .slip-wrapper {
                display: block;
                width: 100%;
                max-width: 100%;
                min-height: auto;
                
                /* Border tipis untuk potong */
                border: 1px dashed #ccc; 
                margin-bottom: 0;     
                
                box-sizing: border-box;
                
                /* CRITICAL: Prevent cutting inside the slip */
                page-break-inside: avoid !important; 
                break-inside: avoid !important;
                
                position: relative;
                background-color: white;
                box-shadow: none;
             }
           }

           /* --- INTERNAL SLIP LAYOUT (PROFESSIONAL DESIGN) --- */
           .slip-inner {
              padding: 15px 25px;
              font-family: 'Arial', sans-serif; /* Clean Sans Serif */
              color: #000;
              border: 1px solid white; /* Invisible border for spacing logic */
           }

           /* Header Area */
           .slip-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px double #000; /* Double line for professional look */
              padding-bottom: 10px;
              margin-bottom: 15px;
           }
           .header-left { display: flex; align-items: center; gap: 15px; }
           .header-logo img { width: 55px; height: 55px; object-fit: contain; }
           .header-text h1 { font-size: 16px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
           .header-text h2 { font-size: 11px; font-weight: 600; margin: 2px 0 0 0; text-transform: uppercase; color: #444; }
           .header-right { text-align: right; }
           .slip-label { font-size: 18px; font-weight: 800; text-transform: uppercase; color: #000; border: 2px solid #000; padding: 2px 10px; display: inline-block; }

           /* Content Grid */
           .slip-content {
              display: flex;
              gap: 30px;
              margin-bottom: 15px;
           }
           .col-left { flex: 1; }
           .col-right { flex: 1; }

           /* Data Rows */
           .data-row { display: flex; font-size: 11px; margin-bottom: 4px; align-items: flex-start; }
           .label { width: 90px; font-weight: 600; color: #555; }
           .sep { width: 10px; font-weight: 600; }
           .val { flex: 1; font-weight: 800; color: #000; }

           /* Calculation Table */
           .calc-table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
           .calc-table th { background-color: #f0f0f0; border: 1px solid #000; padding: 4px 8px; text-align: left; font-weight: 800; text-transform: uppercase; }
           .calc-table td { border: 1px solid #000; padding: 4px 8px; }
           .calc-table .num { text-align: right; font-family: 'Courier New', monospace; font-weight: 600; }
           .calc-table .total-row { background-color: #e6e6e6; font-weight: 800; font-size: 12px; }

           /* Footer */
           .slip-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 15px;
              padding-top: 5px;
           }
           .sig-box { text-align: center; width: 160px; }
           .sig-place { font-size: 10px; margin-bottom: 5px; font-style: italic; text-align: center; }
           .sig-title { font-size: 10px; font-weight: 700; margin-bottom: 45px; text-transform: uppercase; }
           .sig-name { font-size: 11px; font-weight: 800; text-decoration: underline; text-transform: uppercase; }

         `}</style>

         <div id="bulk-slip-content" className="bulk-container">
            {honorData.map((item) => (
               <div key={item.id} className="slip-wrapper">
                  <div className="slip-inner">
                      
                      {/* Professional Header */}
                      <div className="slip-header">
                         <div className="header-left">
                            <div className="header-logo"><Logo /></div>
                            <div className="header-text">
                               <h1>SPPG Ngadiluwih</h1>
                               <h2>Satuan Pelayanan Pemenuhan Gizi</h2>
                            </div>
                         </div>
                         <div className="header-right">
                            <div className="slip-label">SLIP GAJI</div>
                         </div>
                      </div>

                      {/* Content Grid */}
                      <div className="slip-content">
                         {/* Left: Employee Info */}
                         <div className="col-left">
                            <div className="data-row">
                               <span className="label">NAMA</span><span className="sep">:</span>
                               <span className="val">{item.nama}</span>
                            </div>
                            <div className="data-row">
                               <span className="label">DIVISI</span><span className="sep">:</span>
                               <span className="val">{item.divisi}</span>
                            </div>
                            <div className="data-row">
                               <span className="label">PERIODE</span><span className="sep">:</span>
                               <span className="val" style={{fontSize: '10px'}}>{periodeDateInfo}</span>
                            </div>
                         </div>
                         
                         {/* Right: Bank Info */}
                         <div className="col-right">
                            <div className="data-row">
                               <span className="label">BANK</span><span className="sep">:</span>
                               <span className="val">{item.bank}</span>
                            </div>
                            <div className="data-row">
                               <span className="label">NO. REK</span><span className="sep">:</span>
                               <span className="val">{item.rekening}</span>
                            </div>
                            <div className="data-row">
                               <span className="label">BULAN</span><span className="sep">:</span>
                               <span className="val">{periodeInfo?.nama}</span>
                            </div>
                         </div>
                      </div>

                      {/* Details Table */}
                      <table className="calc-table">
                         <thead>
                            <tr>
                               <th>KETERANGAN</th>
                               <th style={{textAlign: 'center', width: '60px'}}>VOL</th>
                               <th style={{textAlign: 'right', width: '100px'}}>SATUAN</th>
                               <th style={{textAlign: 'right', width: '110px'}}>JUMLAH</th>
                            </tr>
                         </thead>
                         <tbody>
                            <tr>
                               <td>Honorarium Harian</td>
                               <td style={{textAlign: 'center'}}>{item.totalHadir}</td>
                               <td className="num">{new Intl.NumberFormat('id-ID').format(item.honorHarian)}</td>
                               <td className="num">{new Intl.NumberFormat('id-ID').format(item.totalTerima)}</td>
                            </tr>
                            <tr className="total-row">
                               <td colSpan={3} style={{textAlign: 'right', paddingRight: '15px'}}>TOTAL DITERIMA</td>
                               <td className="num">{formatCurrency(item.totalTerima)}</td>
                            </tr>
                         </tbody>
                      </table>

                      {/* Footer Signatures */}
                      <div className="slip-footer">
                         <div className="sig-box">
                            <div className="sig-title">PENERIMA</div>
                            <div className="sig-name">{item.nama}</div>
                         </div>
                         <div className="sig-box">
                            <div className="sig-place">Ngadiluwih, {new Date().toLocaleDateString('id-ID')}</div>
                            <div className="sig-title">KEPALA SPPG</div>
                            <div className="sig-name">Tiurmasi S.S., S.T.</div>
                         </div>
                      </div>

                  </div>
               </div>
            ))}
         </div>
      </PrintPreviewDialog>
    </div>
  );
};
