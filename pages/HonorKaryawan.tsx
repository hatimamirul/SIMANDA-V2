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

      {/* --- BULK PRINT MODAL (SAFE LAYOUT) --- */}
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
              grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
              gap: 20px; 
           }
           .slip-item {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
           }
           
           /* Tampilan Cetak (Print) - Layout Stabil */
           @media print {
             @page { 
               size: A4 portrait; 
               margin: 5mm; 
             }
             body { -webkit-print-color-adjust: exact; }
             
             .bulk-container {
                display: block; /* Hindari grid saat cetak */
                font-size: 0; /* Hilangkan spasi antar inline-block */
             }
             
             .slip-wrapper {
                display: inline-block;
                width: 49%; /* 2 Kolom dengan sedikit margin */
                margin-right: 1%;
                margin-bottom: 10px;
                vertical-align: top;
                font-size: 10px; /* Reset font size */
                page-break-inside: avoid; /* Jangan potong slip */
                break-inside: avoid;
             }
             
             .slip-wrapper:nth-child(2n) {
                margin-right: 0; /* Hapus margin kanan untuk item genap */
             }

             .slip-item {
                border: 1px dashed #666; /* Garis potong */
                padding: 10px;
                height: auto;
                background-color: white;
                box-shadow: none;
                border-radius: 4px;
             }
             
             /* Perkecil teks khusus cetak */
             .slip-item * { font-size: 9px !important; }
             .slip-header { font-size: 11px !important; }
             .slip-amount { font-size: 12px !important; }
             .slip-signature { font-size: 8px !important; }
           }
         `}</style>

         <div className="bulk-container">
            {honorData.map((item) => (
               <div key={item.id} className="slip-wrapper">
                   <div className="slip-item">
                      {/* Header Slip Kompak */}
                      <div className="flex items-center gap-2 border-b border-black pb-2 mb-2">
                         <Logo className="w-6 h-6" />
                         <div className="leading-tight">
                            <h3 className="font-bold text-gray-900 uppercase slip-header">SPPG Ngadiluwih</h3>
                            <p className="text-gray-600 font-medium">{periodeInfo?.nama}</p>
                         </div>
                      </div>

                      {/* Body Slip */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2 text-gray-800">
                         <div>
                            <span className="text-gray-500 block text-[8px] uppercase font-bold">Nama</span>
                            <span className="font-bold uppercase truncate block">{item.nama}</span>
                         </div>
                         <div className="text-right">
                            <span className="text-gray-500 block text-[8px] uppercase font-bold">Divisi</span>
                            <span className="font-semibold truncate block">{item.divisi}</span>
                         </div>
                         <div>
                            <span className="text-gray-500 block text-[8px] uppercase font-bold">Rekening</span>
                            <span className="truncate block">{item.bank} - {item.rekening}</span>
                         </div>
                         <div className="text-right">
                            <span className="text-gray-500 block text-[8px] uppercase font-bold">Periode</span>
                            <span className="truncate block">{periodeDateInfo}</span>
                         </div>
                      </div>

                      {/* Perhitungan */}
                      <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-500">Honor Harian</span>
                            <span className="font-mono text-gray-700">{formatCurrency(item.honorHarian)}</span>
                         </div>
                         <div className="flex justify-between items-center mb-1 border-b border-gray-200 pb-1">
                            <span className="text-gray-500">Total Hadir</span>
                            <span className="font-mono text-gray-700">{item.totalHadir} Hari</span>
                         </div>
                         <div className="flex justify-between items-center pt-1">
                            <span className="font-bold text-gray-800 uppercase">Total Diterima</span>
                            <span className="font-bold text-gray-900 font-mono slip-amount">{formatCurrency(item.totalTerima)}</span>
                         </div>
                      </div>

                      {/* Tanda Tangan Dual */}
                      <div className="flex justify-between items-end px-1 mt-2">
                         {/* Tanda Tangan Penerima */}
                         <div className="text-center w-24">
                            <p className="text-gray-400 mb-6 uppercase slip-signature font-bold">Penerima</p>
                            <p className="font-bold uppercase border-t border-black pt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{item.nama.split(' ')[0]}</p>
                         </div>
                         
                         {/* Tanda Tangan Kepala SPPG */}
                         <div className="text-center w-28">
                            <p className="text-gray-500 mb-1 slip-signature">Ngadiluwih, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month:'short', year:'2-digit'})}</p>
                            <p className="text-gray-400 mb-2 uppercase slip-signature font-bold">Kepala SPPG</p>
                            <p className="font-bold underline">Tiurmasi S.S., S.T.</p>
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
