
import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Select, Modal, LoadingSpinner, useToast, Logo, PrintPreviewDialog } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Periode, AbsensiRecord, User, Role } from '../types';
import { Plus, Calendar, Save, AlertCircle, CalendarDays, Check, X, Pencil, User as UserIcon, Lock, Printer, CloudLightning } from 'lucide-react';

export const AbsensiPage: React.FC = () => {
  // Get current user to check role
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();
  const role = currentUser?.jabatan as Role;
  
  const isKoordinator = role === 'KOORDINATORDIVISI';
  const isAdminSPPG = role === 'ADMINSPPG';
  
  const canManagePeriode = role === 'SUPERADMIN' || role === 'KSPPG';
  const canEditAttendance = role !== 'ADMINSPPG' && role !== 'PETUGAS';
  
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AbsensiRecord[]>([]);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Modal State for New/Edit Period
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriodeId, setEditingPeriodeId] = useState<string | null>(null);
  const [newPeriodeName, setNewPeriodeName] = useState('');
  const [newPeriodeDate, setNewPeriodeDate] = useState('');

  // Print Preview State
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // 1. Subscribe to Periodes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = api.subscribePeriode((data) => {
      setPeriodes(data);
      if (data.length > 0 && !selectedPeriode) {
        setSelectedPeriode(data[data.length - 1].id);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedPeriode]);

  // 2. Subscribe to Attendance Data based on Selected Periode
  useEffect(() => {
    if (!selectedPeriode) {
      setAttendanceData([]);
      setCalendarDates([]);
      return;
    }

    const currentP = periodes.find(p => p.id === selectedPeriode);
    if (currentP) {
      calculateWorkingDays(currentP.tanggalMulai);
    }

    setLoading(true);
    // Realtime subscription
    // When User A updates, Firestore updates, and this callback fires for User B
    const unsubscribe = api.subscribeAbsensi(selectedPeriode, (data) => {
       // Filter if Koordinator
       let filteredData = data;
       if (isKoordinator && currentUser?.jabatanDivisi) {
         filteredData = data.filter(r => r.divisi === currentUser.jabatanDivisi);
       }
       setAttendanceData(filteredData);
       setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedPeriode, periodes, isKoordinator, currentUser?.jabatanDivisi]);

  const calculateWorkingDays = (startDateStr: string) => {
    if (!startDateStr) return [];
    
    const dates: Date[] = [];
    let currentDate = new Date(startDateStr);
    let safetyCounter = 0;
    
    while (dates.length < 14 && safetyCounter < 30) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      safetyCounter++;
    }
    setCalendarDates(dates);
  };

  const handleOpenAdd = () => {
    setEditingPeriodeId(null);
    setNewPeriodeName('');
    setNewPeriodeDate('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (!selectedPeriode) return;
    const p = periodes.find(item => item.id === selectedPeriode);
    if (p) {
      setEditingPeriodeId(p.id);
      setNewPeriodeName(p.nama);
      setNewPeriodeDate(p.tanggalMulai);
      setIsModalOpen(true);
    }
  };

  const handleSavePeriode = async () => {
    if (!newPeriodeName || !newPeriodeDate) {
      showToast("Mohon lengkapi nama dan tanggal periode.", "error");
      return;
    }
    setLoading(true);

    if (editingPeriodeId) {
      const updatedPeriode: Periode = {
        id: editingPeriodeId,
        nama: newPeriodeName,
        tanggalMulai: newPeriodeDate,
        status: 'OPEN'
      };
      await api.updatePeriode(updatedPeriode);
      setIsModalOpen(false);
      showToast("Periode berhasil diperbarui!", "success");
      // Calculate working days update handled by subscription effect
    } else {
      const newPeriode: Periode = {
        id: Date.now().toString(),
        nama: newPeriodeName,
        tanggalMulai: newPeriodeDate,
        status: 'OPEN'
      };
      await api.savePeriode(newPeriode);
      setIsModalOpen(false);
      showToast("Periode baru berhasil dibuat!", "success");
      setSelectedPeriode(newPeriode.id);
    }
    
    setNewPeriodeName('');
    setNewPeriodeDate('');
    setEditingPeriodeId(null);
    setLoading(false);
  };

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const handleAttendanceChange = async (recordId: string, dayIndex: number, checked: boolean) => {
    if (!canEditAttendance) return;

    if (isKoordinator) {
      const targetDate = calendarDates[dayIndex - 1];
      if (targetDate && !isDateToday(targetDate)) {
        showToast(`Anda hanya dapat mengisi absensi untuk hari ini (${formatDate(new Date())}).`, "error");
        return;
      }
    }

    // 1. Optimistic Update (Instant Feedback)
    setAttendanceData(prev => prev.map(record => {
      if (record.id === recordId) {
        const updatedHari = { ...record.hari, [dayIndex]: checked };
        const total = Object.values(updatedHari).filter(Boolean).length;
        return { ...record, hari: updatedHari, totalHadir: total };
      }
      return record;
    }));

    // 2. Auto Save to Realtime DB
    // this sends the update to Firestore immediately
    setSavingId(recordId);
    try {
        const recordToSave = attendanceData.find(r => r.id === recordId);
        if (recordToSave) {
            const updatedHari = { ...recordToSave.hari, [dayIndex]: checked };
            const total = Object.values(updatedHari).filter(Boolean).length;
            const updatedRecord = { ...recordToSave, hari: updatedHari, totalHadir: total };
            await api.saveAbsensiRecord(updatedRecord);
        }
    } catch (e) {
        showToast("Gagal menyimpan perubahan. Periksa koneksi internet.", "error");
        // Revert optimistic update if needed, but for simplicity we rely on next snapshot
    } finally {
        setSavingId(null);
    }
  };

  const handlePrintClick = () => {
    setIsPrintPreviewOpen(true);
  };

  const groupedData = attendanceData.reduce((acc, record) => {
    if (!acc[record.divisi]) {
      acc[record.divisi] = [];
    }
    acc[record.divisi].push(record);
    return acc;
  }, {} as { [key: string]: AbsensiRecord[] });

  const sortedDivisions = Object.keys(groupedData).sort();

  const formatDate = (date: Date) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit' }).format(date);
  const getDayName = (date: Date) => new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);

  const currentPeriode = periodes.find(p => p.id === selectedPeriode);
  const printFilename = `Laporan_Absensi_${currentPeriode?.nama.replace(/\s+/g, '_') || 'SPPG'}`;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-8 print:pb-0 print:space-y-0">
      
      {/* Header / Toolbar */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 no-print">
        <div>
           <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="text-primary shrink-0" /> <span className="truncate">Absensi Karyawan</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-2">
            {isKoordinator ? `Divisi: ${currentUser?.jabatanDivisi}` : 'Kelola kehadiran 14 hari'}
            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium flex items-center gap-1">
                <CloudLightning size={10} /> Auto-Save
            </span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <select 
                className="pl-3 sm:pl-4 pr-10 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-blue-50/50 border-blue-100 font-medium text-blue-900 w-full sm:w-64 appearance-none cursor-pointer hover:bg-blue-50 transition-colors text-sm"
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
            
            {canManagePeriode && selectedPeriode && (
              <Button 
                variant="secondary" 
                onClick={handleOpenEdit} 
                className="px-3 py-2 sm:py-2.5 shrink-0"
                title="Edit Periode Ini"
              >
                <Pencil size={18} />
              </Button>
            )}
          </div>
          
          {selectedPeriode && (
            <Button 
              variant="secondary" 
              onClick={handlePrintClick} 
              icon={<Printer size={18} />} 
              className="shadow-sm w-full sm:w-auto whitespace-nowrap justify-center"
            >
              Cetak
            </Button>
          )}

          {canManagePeriode && (
            <Button onClick={handleOpenAdd} icon={<Plus size={18} />} className="shadow-sm w-full sm:w-auto justify-center">Periode Baru</Button>
          )}
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {!loading && !selectedPeriode && (
        <Card className="p-8 md:p-12 text-center text-gray-500 border-2 border-dashed border-gray-200 bg-gray-50/30">
          <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <CalendarDays className="text-primary/60" size={32} />
          </div>
          <p className="text-lg font-bold text-gray-700">Belum ada periode yang dipilih</p>
          <p className="text-sm text-gray-500 mt-1">Silahkan pilih periode atau buat periode baru untuk memulai absensi.</p>
        </Card>
      )}

      {/* Main Table View */}
      {!loading && selectedPeriode && sortedDivisions.map(divisi => (
        <Card key={divisi} className="mb-6 sm:mb-8 border border-gray-200 shadow-sm overflow-hidden no-print"> 
          {/* Header Divisi */}
          <div className="bg-gray-50 px-4 sm:px-5 py-3 border-b border-gray-200 flex justify-between items-center">
             <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate mr-2">{divisi}</h3>
             <span className="text-[10px] sm:text-xs font-medium bg-white border border-gray-200 px-2 sm:px-3 py-1 rounded-full text-gray-600 shadow-sm shrink-0">
               {groupedData[divisi].length} Org
             </span>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/50 text-gray-700 border-b border-gray-200">
                  {/* Sticky No - HIDDEN ON MOBILE */}
                  <th className="hidden sm:table-cell p-3 w-12 text-center font-semibold sticky left-0 bg-gray-50 z-30 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">No</th>
                  
                  {/* Sticky Nama - Left 0 on Mobile, Left 12 on Desktop */}
                  <th className="p-2 sm:p-3 min-w-[140px] sm:min-w-[220px] font-semibold sticky left-0 sm:left-12 bg-gray-50 z-30 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Nama Karyawan
                  </th>
                  
                  {/* Dates */}
                  {calendarDates.map((date, index) => (
                    <th key={index} className={`p-1 sm:p-2 min-w-[38px] sm:min-w-[42px] text-center border-r border-gray-200 last:border-r-0 ${isDateToday(date) ? 'bg-blue-50/50' : ''}`}>
                      <div className={`flex flex-col items-center justify-center py-1 rounded ${isDateToday(date) ? 'bg-blue-100 text-blue-700' : ''}`}>
                        <span className="text-[9px] sm:text-[10px] uppercase text-gray-500 font-bold">{getDayName(date)}</span>
                        <span className={`text-[10px] sm:text-xs font-bold ${isDateToday(date) ? 'text-blue-800' : 'text-gray-800'}`}>{formatDate(date)}</span>
                      </div>
                    </th>
                  ))}
                  
                  {/* Total */}
                  <th className="p-2 sm:p-3 w-12 sm:w-16 text-center font-semibold bg-gray-50 sticky right-0 z-20 border-l border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {groupedData[divisi].map((record, idx) => (
                  <tr key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                    {/* No - HIDDEN ON MOBILE */}
                    <td className="hidden sm:table-cell p-3 text-center text-gray-500 sticky left-0 bg-white group-hover:bg-blue-50/30 z-20 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] font-medium text-xs">
                        {idx + 1}
                    </td>
                    
                    {/* Nama - Sticky Left 0 on Mobile */}
                    <td className="p-2 sm:p-3 font-medium text-gray-700 sticky left-0 sm:left-12 bg-white group-hover:bg-blue-50/30 z-20 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap text-xs sm:text-sm">
                      <div className="truncate max-w-[130px] sm:max-w-none">
                        {record.namaKaryawan}
                      </div>
                    </td>

                    {/* Checkboxes */}
                    {calendarDates.map((date, dIdx) => {
                      const dayIndex = dIdx + 1;
                      const isChecked = record.hari[dayIndex] || false;
                      const isToday = isDateToday(date);
                      const isSaving = savingId === record.id;
                      
                      return (
                        <td key={dIdx} className={`p-0 sm:p-1 text-center border-r border-gray-200 last:border-r-0 align-middle ${isToday ? 'bg-blue-50/20' : ''}`}>
                           <label className={`relative inline-flex items-center justify-center w-full h-[36px] sm:h-full cursor-pointer group-hover/cell:bg-black/5 rounded transition-colors ${!canEditAttendance ? 'cursor-not-allowed opacity-60' : ''}`}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              disabled={!canEditAttendance || isSaving}
                              onChange={(e) => handleAttendanceChange(record.id, dayIndex, e.target.checked)}
                              className="peer sr-only"
                            />
                            {/* Custom Checkbox Design */}
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-[1.5px] border-gray-300 rounded transition-all duration-200 
                              peer-checked:bg-primary peer-checked:border-primary peer-checked:scale-110
                              hover:border-primary flex items-center justify-center text-white shadow-sm
                            ">
                              <Check size={12} className="opacity-0 peer-checked:opacity-100 transition-opacity sm:w-3.5 sm:h-3.5" strokeWidth={3.5} />
                            </div>
                          </label>
                        </td>
                      )
                    })}
                    
                    {/* Total */}
                    <td className="p-2 sm:p-3 text-center font-bold text-primary bg-white group-hover:bg-blue-50/30 sticky right-0 border-l border-gray-200 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] text-xs sm:text-sm">
                      {record.totalHadir}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {/* Print Preview Dialog */}
      <PrintPreviewDialog 
        isOpen={isPrintPreviewOpen} 
        onClose={() => setIsPrintPreviewOpen(false)}
        title={`Laporan Absensi: ${currentPeriode?.nama}`}
        filename={printFilename}
      >
        <div className="p-4">
          <div className="flex items-center gap-6 border-b-4 border-double border-gray-800 pb-6 mb-8">
             <Logo className="w-24 h-24 object-contain" />
             <div className="flex-1 text-center">
                <h1 className="text-2xl font-bold uppercase tracking-wide leading-tight text-black">SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)</h1>
                <h2 className="text-lg font-bold uppercase tracking-wider mt-1 text-black">DESA TALES SETONO - KECAMATAN NGADILUWIH</h2>
                <p className="text-sm mt-2 text-black">Laporan Absensi Karyawan</p>
             </div>
             <div className="w-24"></div>
          </div>
          
          <div className="flex justify-between items-end mb-6 text-black">
             <div>
               <p className="font-bold text-sm">Periode: {currentPeriode?.nama}</p>
             </div>
             <div>
               <p className="font-bold text-sm">Total Karyawan: {attendanceData.length}</p>
             </div>
          </div>

          {sortedDivisions.map(divisi => (
            <div key={divisi} className="mb-8 break-inside-avoid">
              <div className="bg-gray-200 px-4 py-2 border border-black border-b-0 font-bold text-black text-sm uppercase">
                 Divisi: {divisi}
              </div>
              <table className="w-full border-collapse border border-black text-xs text-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-2 w-10 text-center">No</th>
                    <th className="border border-black px-3 py-2 text-left">Nama Karyawan</th>
                    {calendarDates.map((date, idx) => (
                      <th key={idx} className="border border-black px-1 py-2 w-8 text-center bg-gray-50">
                        {idx + 1}
                      </th>
                    ))}
                    <th className="border border-black px-2 py-2 w-12 text-center bg-gray-100">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedData[divisi].map((record, idx) => (
                    <tr key={record.id}>
                      <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                      <td className="border border-black px-3 py-1.5 font-medium uppercase">{record.namaKaryawan}</td>
                      {calendarDates.map((_, dIdx) => (
                         <td key={dIdx} className="border border-black px-1 py-1.5 text-center">
                            {record.hari[dIdx + 1] ? '✓' : ''}
                         </td>
                      ))}
                      <td className="border border-black px-2 py-1.5 text-center font-bold bg-gray-50">{record.totalHadir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          
          <div className="grid grid-cols-2 mt-12 px-8 text-black break-inside-avoid">
             <div className="text-center">
             </div>
             <div className="text-center">
                <p className="mb-1">Ngadiluwih, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                <p className="mb-20 font-bold">Kepala SPPG</p>
                <p className="font-bold underline decoration-1 underline-offset-4">Tiurmasi Saulina Sirait, S.T.</p>
             </div>
          </div>
        </div>
      </PrintPreviewDialog>

      {/* Add/Edit Periode Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPeriodeId ? "Edit Periode" : "Buat Periode Baru"}
      >
        <div className="space-y-4">
          <div>
            <Input 
              label="Nama Periode" 
              placeholder="Contoh: Januari 2025 - Periode 1" 
              value={newPeriodeName}
              onChange={(e) => setNewPeriodeName(e.target.value)}
            />
          </div>
          <div>
            <Input 
              type="date" 
              label="Tanggal Mulai (Hari ke-1)" 
              value={newPeriodeDate}
              onChange={(e) => setNewPeriodeDate(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Sistem akan otomatis menghitung 14 hari kerja kedepan.</p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSavePeriode} isLoading={loading}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
