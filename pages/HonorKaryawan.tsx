import React, { useEffect, useState } from 'react';
import { Card, Table, Button, LoadingSpinner, SlipGajiModal, ExportModal, PrintPreviewDialog, Logo } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Periode, HonorariumRow } from '../types';
import { Calendar, Wallet, FileDown, CalendarDays, Printer, Files } from 'lucide-react';

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

      {/* --- BULK PRINT MODAL (FORMAT SLIP PREMIUM PRESISI A4) --- */}
      <PrintPreviewDialog
        isOpen={isBulkPrintOpen}
        onClose={() => setIsBulkPrintOpen(false)}
        title={`Cetak Semua Slip - ${periodeInfo?.nama || ''}`}
        filename={`Bulk_Slip_${periodeInfo?.nama?.replace(/\s+/g, '_')}`}
      >
         <style>{`
           /* Tampilan Layar (Screen) */
           .bulk-container { 
              display: grid; 
              gap: 20px; 
              grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); 
           }
           
           .slip-wrapper {
              background: white;
              border: 1px solid #ccc;
              border-radius: 4px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
              overflow: hidden;
              position: relative;
              /* Tinggi fix agar mirip tampilan cetak */
              height: 350px; 
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
             
             /* Container Slip Individual */
             .slip-wrapper {
                display: block;
                width: 100%;
                /* 
                   Tinggi Kertas A4 = 297mm. 
                   Margin Atas 5mm + Bawah 5mm = 10mm.
                   Sisa area cetak = 287mm.
                   287mm / 3 = 95.6mm per slip.
                   Kita set 92mm agar ada sedikit jarak aman (gap).
                */
                height: 92mm; 
                border: 1px solid #999; 
                margin-bottom: 3mm; /* Jarak antar slip */
                box-sizing: border-box;
                page-break-inside: avoid;
                position: relative;
                background-color: white;
                box-shadow: none;
                border-radius: 4px;
             }

             /* Logic Page Break: Paksa ganti halaman setiap 3 item */
             .slip-wrapper:nth-child(3n) {
                page-break-after: always;
                margin-bottom: 0;
             }
           }

           /* --- STYLING ISI SLIP (COMMON) --- */
           .slip-inner {
              padding: 12px 18px;
              display: flex;
              flex-direction: column;
              height: 100%;
              justify-content: space-between;
              font-family: Arial, sans-serif;
           }

           /* Header Area */
           .slip-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 5px;
           }
           .slip-header img {
              width: 45px;
              height: 45px;
              object-fit: contain;
           }
           .slip-title-block {
              line-height: 1.2;
           }
           .slip-title-main { font-size: 16px; font-weight: 800; text-transform: uppercase; color: #000; letter-spacing: 0.5px; }
           .slip-title-sub { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #444; }

           /* Divider Line */
           .slip-divider {
              border-bottom: 2px solid #000;
              margin-bottom: 12px;
           }

           /* Info Grid (Nama, Divisi vs Periode, Bank) */
           .slip-info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              column-gap: 20px;
              row-gap: 4px;
              font-size: 10px;
              margin-bottom: 8px;
           }
           .info-row { display: flex; align-items: flex-start; }
           .info-label { width: 60px; font-weight: 700; color: #666; text-transform: uppercase; }
           .info-sep { width: 10px; text-align: center; font-weight: 700; }
           .info-val { flex: 1; font-weight: 700; color: #000; text-transform: uppercase; }

           /* Calculation Box (Gray Background) */
           .calc-box {
              background-color: #f3f4f6; /* Gray-100 */
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 6px 12px;
              margin-bottom: 8px;
           }
           .calc-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; color: #333; }
           .calc-row.total { 
              border-top: 1px dashed #999; 
              margin-top: 4px; 
              padding-top: 4px; 
              font-size: 12px;
              font-weight: 800;
              color: #000;
           }

           /* Footer Signatures */
           .signatures-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: auto; /* Push to bottom */
              padding-bottom: 5px;
           }
           .sig-block { text-align: center; min-width: 140px; }
           .sig-title { font-size: 9px; color: #555; font-weight: 600; margin-bottom: 30px; text-transform: uppercase; } /* Space for signing */
           .sig-date { font-size: 9px; color: #444; font-style: italic; margin-bottom: 2px; text-align: right; margin-right: 10px; }
           .sig-name { font-size: 10px; font-weight: 800; text-transform: uppercase; text-decoration: underline; color: #000; }

         `}</style>

         <div className="bulk-container">
            {honorData.map((item) => (
               <div key={item.id} className="slip-wrapper">
                  <div className="slip-inner">
                      
                      {/* Top Section */}
                      <div>
                          <div className="slip-header">
                             <Logo />
                             <div className="slip-title-block">
                                <div className="slip-title-main">SPPG NGADILUWIH</div>
                                <div className="slip-title-sub">SLIP GAJI - {periodeInfo?.nama}</div>
                             </div>
                          </div>
                          <div className="slip-divider"></div>

                          <div className="slip-info-grid">
                             {/* Left Column */}
                             <div>
                                <div className="info-row">
                                   <span className="info-label">NAMA</span><span className="info-sep">:</span>
                                   <span className="info-val">{item.nama}</span>
                                </div>
                                <div className="info-row">
                                   <span className="info-label">DIVISI</span><span className="info-sep">:</span>
                                   <span className="info-val">{item.divisi}</span>
                                </div>
                             </div>
                             {/* Right Column */}
                             <div>
                                <div className="info-row">
                                   <span className="info-label">PERIODE</span><span className="info-sep">:</span>
                                   <span className="info-val">{periodeDateInfo}</span>
                                </div>
                                <div className="info-row">
                                   <span className="info-label">BANK</span><span className="info-sep">:</span>
                                   <span className="info-val">{item.bank} - {item.rekening}</span>
                                </div>
                             </div>
                          </div>

                          <div className="calc-box">
                             <div className="calc-row">
                                <span>Honorarium Harian</span>
                                <span className="font-mono">{formatCurrency(item.honorHarian)}</span>
                             </div>
                             <div className="calc-row">
                                <span>Total Kehadiran</span>
                                <span className="font-mono">{item.totalHadir} Hari</span>
                             </div>
                             <div className="calc-row total">
                                <span>TOTAL DITERIMA</span>
                                <span>{formatCurrency(item.totalTerima)}</span>
                             </div>
                          </div>
                      </div>

                      {/* Bottom Section (Signatures) */}
                      <div>
                          <div className="sig-date">
                             Ngadiluwih, {new Date().toLocaleDateString('id-ID')}
                          </div>
                          <div className="signatures-row">
                             <div className="sig-block">
                                <div className="sig-title">PENERIMA</div>
                                <div className="sig-name">{item.nama}</div>
                             </div>
                             <div className="sig-block">
                                <div className="sig-title">KEPALA SPPG</div>
                                <div className="sig-name">Tiurmasi S.S., S.T.</div>
                             </div>
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
