import React, { useEffect, useState } from 'react';
import { Card, Table, Button, LoadingSpinner, SlipGajiModal, ExportModal, PrintPreviewDialog, Logo } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Periode, HonorariumRow } from '../types';
import { Calendar, Wallet, FileDown, CalendarDays, Printer, Files, FileText } from 'lucide-react';

// Declare XLSX from global scope
const XLSX = (window as any).XLSX;

export const HonorKaryawanPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [honorData, setHonorData] = useState<HonorariumRow[]>([]);
  
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

  // --- FEATURE: EXPORT TO WORD ---
  const handleExportWord = () => {
    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title><style>body{font-family:Arial, sans-serif;} .slip-container{border:1px solid #000; padding:10px; margin-bottom:15px; page-break-inside:avoid;} .header{text-align:center; border-bottom:2px solid #000; margin-bottom:10px; padding-bottom:5px;} .title{font-size:14pt; font-weight:bold; text-transform:uppercase;} .subtitle{font-size:10pt;} .content-table{width:100%; border-collapse:collapse; font-size:10pt;} .content-table td{padding:2px;} .box-total{border:1px solid #000; padding:5px; margin-top:5px; background-color:#f0f0f0; font-weight:bold;} .signatures{width:100%; margin-top:20px;} .sign-col{width:50%; text-align:center; vertical-align:bottom; height:60px;}</style></head><body>";
    
    let contentHtml = "";
    
    honorData.forEach(item => {
        contentHtml += `
        <div class="slip-container">
            <div class="header">
                <div class="title">SPPG NGADILUWIH</div>
                <div class="subtitle">SLIP GAJI - ${periodeInfo?.nama}</div>
            </div>
            <table class="content-table">
                <tr>
                    <td width="20%"><strong>Nama</strong></td>
                    <td width="30%">: ${item.nama}</td>
                    <td width="20%"><strong>Periode</strong></td>
                    <td width="30%">: ${periodeDateInfo}</td>
                </tr>
                <tr>
                    <td><strong>Divisi</strong></td>
                    <td>: ${item.divisi}</td>
                    <td><strong>Bank</strong></td>
                    <td>: ${item.bank} - ${item.rekening}</td>
                </tr>
            </table>
            
            <div style="margin-top: 10px; border-top: 1px dashed #000; padding-top:5px;">
                <table class="content-table">
                    <tr>
                        <td>Honor Harian</td>
                        <td align="right">Rp ${new Intl.NumberFormat('id-ID').format(item.honorHarian)}</td>
                    </tr>
                    <tr>
                        <td>Total Kehadiran</td>
                        <td align="right">${item.totalHadir} Hari</td>
                    </tr>
                </table>
            </div>

            <div class="box-total">
                <table width="100%">
                    <tr>
                        <td>TOTAL DITERIMA</td>
                        <td align="right" style="font-size:12pt;">Rp ${new Intl.NumberFormat('id-ID').format(item.totalTerima)}</td>
                    </tr>
                </table>
            </div>

            <table class="signatures">
                <tr>
                    <td class="sign-col">
                        <div style="margin-bottom:40px;">Penerima</div>
                        <div style="font-weight:bold; text-decoration:underline;">${item.nama}</div>
                    </td>
                    <td class="sign-col">
                        <div style="margin-bottom:40px;">Kepala SPPG</div>
                        <div style="font-weight:bold; text-decoration:underline;">Tiurmasi S.S., S.T.</div>
                    </td>
                </tr>
            </table>
        </div>
        <br/>
        `;
    });

    const postHtml = "</body></html>";
    const html = preHtml + contentHtml + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    // Create download link
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    
    if ((navigator as any).msSaveOrOpenBlob) {
        (navigator as any).msSaveOrOpenBlob(blob, `Slip_Gaji_${periodeInfo?.nama}.doc`);
    } else {
        downloadLink.href = url;
        downloadLink.download = `Slip_Gaji_${periodeInfo?.nama}.doc`;
        downloadLink.click();
    }
    
    document.body.removeChild(downloadLink);
  };

  const handlePrintSlip = (item: HonorariumRow) => {
    const periode = periodes.find(p => p.id === selectedPeriode);
    
    // Construct default filename: Slip_Gaji_NamaKaryawan_Periode.pdf
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

      {/* --- BULK PRINT MODAL (FORMAT A4 PROFESIONAL + EXPORT WORD) --- */}
      <PrintPreviewDialog
        isOpen={isBulkPrintOpen}
        onClose={() => setIsBulkPrintOpen(false)}
        title={`Cetak Semua Slip - ${periodeInfo?.nama || ''}`}
        filename={`Bulk_Slip_${periodeInfo?.nama?.replace(/\s+/g, '_')}`}
      >
         {/* Extra Toolbar inside Print Preview for Word Export */}
         <div className="flex justify-end mb-4 no-print">
            <Button 
                variant="secondary" 
                onClick={handleExportWord} 
                icon={<FileText size={16} className="text-blue-600"/>}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
                Export ke Ms. Word
            </Button>
         </div>

         <style>{`
           /* Tampilan Layar (Screen) */
           .bulk-container { 
              display: grid; 
              gap: 20px; 
              grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); 
           }
           .slip-wrapper {
              background: white;
              border: 1px solid #ccc;
              padding: 0;
              border-radius: 4px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
              overflow: hidden;
           }

           /* Tampilan Cetak (Print) - Layout Presisi 3 Slip per A4 */
           @media print {
             @page { 
               size: A4 portrait; 
               margin: 5mm 10mm; /* Atas/Bawah 5mm, Kiri/Kanan 10mm */
             }
             body { 
               background: white; 
               margin: 0; padding: 0;
               -webkit-print-color-adjust: exact; 
             }
             
             .bulk-container { 
               display: block; 
               width: 100%;
             }
             
             /* Container Slip Individual - Tinggi ~90mm agar muat 3 */
             .slip-wrapper {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 90mm; /* Fixed Height for consistency */
                border: 2px solid #000; /* Border Luar Tebal */
                margin-bottom: 3mm; 
                box-sizing: border-box;
                page-break-inside: avoid;
                position: relative;
                background-color: white;
                box-shadow: none;
                border-radius: 0;
             }

             /* Logic Page Break per 3 Item */
             .slip-wrapper:nth-child(3n) {
                page-break-after: always;
                margin-bottom: 0;
             }

             /* Hide Word Export Button on Print */
             .no-print { display: none !important; }
           }

           /* Common Styles for Content */
           .slip-inner {
              padding: 10px 15px;
              display: flex;
              flex-direction: column;
              height: 100%;
              justify-content: space-between;
           }

           .slip-header {
              display: flex;
              align-items: center;
              gap: 10px;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
           }
           
           .slip-title-text {
              line-height: 1.1;
           }
           .slip-main-title { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #000; }
           .slip-sub-title { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #444; }

           .slip-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              font-size: 10px;
           }

           .info-row { display: flex; margin-bottom: 2px; }
           .info-label { width: 70px; font-weight: 600; color: #555; }
           .info-val { flex: 1; font-weight: 700; color: #000; text-transform: uppercase; }

           .payment-box {
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 4px;
              padding: 6px 10px;
              margin-top: 5px;
           }
           
           .pay-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; }
           .pay-total { display: flex; justify-content: space-between; border-top: 1px dashed #999; padding-top: 4px; margin-top: 4px; }
           .total-label { font-size: 11px; font-weight: 800; }
           .total-val { font-size: 12px; font-weight: 900; }

           .signatures {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 5px;
              padding: 0 10px;
           }
           .sign-box { text-align: center; width: 120px; }
           .sign-label { font-size: 9px; font-weight: 600; color: #555; margin-bottom: 35px; text-transform: uppercase; }
           .sign-name { font-size: 10px; font-weight: 800; text-transform: uppercase; text-decoration: underline; }
           .sign-date { font-size: 9px; color: #444; margin-bottom: 2px; font-style: italic; }

         `}</style>

         <div className="bulk-container">
            {honorData.map((item) => (
               <div key={item.id} className="slip-wrapper">
                  <div className="slip-inner">
                      {/* Header */}
                      <div className="slip-header">
                         <Logo className="w-10 h-10 object-contain" />
                         <div className="slip-title-text">
                            <div className="slip-main-title">SPPG NGADILUWIH</div>
                            <div className="slip-sub-title">SLIP GAJI - {periodeInfo?.nama}</div>
                         </div>
                      </div>

                      {/* Info Grid */}
                      <div className="slip-grid">
                         <div>
                            <div className="info-row"><span className="info-label">NAMA</span><span className="info-val">: {item.nama}</span></div>
                            <div className="info-row"><span className="info-label">DIVISI</span><span className="info-val">: {item.divisi}</span></div>
                         </div>
                         <div>
                            <div className="info-row"><span className="info-label">PERIODE</span><span className="info-val">: {periodeDateInfo}</span></div>
                            <div className="info-row"><span className="info-label">BANK</span><span className="info-val">: {item.bank}</span></div>
                         </div>
                      </div>

                      {/* Payment Calculation */}
                      <div className="payment-box">
                         <div className="pay-row">
                            <span>Honorarium Harian</span>
                            <span className="font-mono">{formatCurrency(item.honorHarian)}</span>
                         </div>
                         <div className="pay-row">
                            <span>Total Kehadiran</span>
                            <span className="font-mono">{item.totalHadir} Hari</span>
                         </div>
                         <div className="pay-total">
                            <span className="total-label">TOTAL DITERIMA</span>
                            <span className="total-val">{formatCurrency(item.totalTerima)}</span>
                         </div>
                      </div>

                      {/* Signatures */}
                      <div className="signatures">
                         <div className="sign-box">
                            <div className="sign-label">Penerima</div>
                            <div className="sign-name">{item.nama}</div>
                         </div>
                         <div className="sign-box">
                            <div className="sign-date">Ngadiluwih, {new Date().toLocaleDateString('id-ID')}</div>
                            <div className="sign-label">Kepala SPPG</div>
                            <div className="sign-name">Tiurmasi S.S., S.T.</div>
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
