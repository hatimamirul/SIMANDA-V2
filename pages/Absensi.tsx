
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

      {/* Main Content Area */}
      {!loading && selectedPeriode && sortedDivisions.map(divisi => (
        <Card key={divisi} className="mb-6 sm:mb-8 border border-gray-200 shadow-sm overflow-hidden no-print"> 
          {/* Header Divisi */}
          <div className="bg-gray-50 px-4 sm:px-5 py-3 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
             <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate mr-2">{divisi}</h3>
             <span className="text-[10px] sm:text-xs font-medium bg-white border border-gray-200 px-2 sm:px-3 py-1 rounded-full text-gray-600 shadow-sm shrink-0">
               {groupedData[divisi].length} Org
             </span>
          </div>

          {/* === DESKTOP VIEW (Table) === */}
          <div className="hidden md:block overflow-x-auto relative">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/50 text-gray-700 border-b border-gray-200">
                  <th className="p-3 w-12 text-center font-semibold sticky left-0 bg-gray-50 z-30 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">No</th>
                  <th className="p-3 min-w-[200px] font-semibold sticky left-12 bg-gray-50 z-30 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Nama Karyawan</th>
                  {calendarDates.map((date, i) => (
                    <th key={i} className={`p-2 min-w-[45px] text-center font-medium border-l border-gray-100 ${isDateToday(date) ? 'bg-blue-100/50 text-blue-700' : ''}`}>
                      <div className="text-[10px] uppercase text-gray-500 mb-0.5">{getDayName(date)}</div>
                      <div className="text-xs">{formatDate(date)}</div>
                    </th>
                  ))}
                  <th className="p-3 text-center font-semibold sticky right-0 bg-gray-50 z-20 border-l border-gray-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupedData[divisi].map((record, idx) => (
                  <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 text-center text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-20 border-r border-gray-100 font-mono text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        {idx + 1}
                    </td>
                    <td className="p-3 font-medium text-gray-800 sticky left-12 bg-white group-hover:bg-gray-50 z-20 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                        {record.namaKaryawan}
                    </td>
                    {calendarDates.map((date, i) => {
                       const isLocked = isKoordinator && !isDateToday(date);
                       const dayIdx = i + 1;
                       return (
                        <td key={i} className={`p-2 text-center border-l border-gray-50 relative ${isDateToday(date) ? 'bg-blue-50/30' : ''}`}>
                          <label className={`
                              relative flex items-center justify-center w-full h-full cursor-pointer
                              ${!canEditAttendance || isLocked ? 'cursor-not-allowed opacity-50' : ''}
                            `}>
                            <input 
                              type="checkbox"
                              className="peer sr-only"
                              checked={!!record.hari[dayIdx]}
                              disabled={!canEditAttendance || isLocked}
                              onChange={(e) => handleAttendanceChange(record.id, dayIdx, e.target.checked)}
                            />
                            {/* Custom Checkbox Design */}
                            <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center text-white peer-hover:border-primary/50">
                              {record.hari[dayIdx] && <Check size={14} strokeWidth={3} />}
                            </div>
                            
                            {/* Saving Indicator */}
                            {savingId === record.id && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            )}
                          </label>
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-bold text-primary sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-gray-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      {record.totalHadir}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* === MOBILE VIEW (Cards Stack) === */}
          <div className="md:hidden">
             <div className="grid grid-cols-1 divide-y divide-gray-100">
                {groupedData[divisi].map((record, idx) => (
                  <div key={record.id} className="p-4 bg-white">
                     {/* Card Header: Name & Total */}
                     <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                             {idx + 1}
                           </div>
                           <div>
                             <h4 className="font-bold text-gray-800 text-sm">{record.namaKaryawan}</h4>
                             <p className="text-[10px] text-gray-500">ID: {record.karyawanId.slice(-4)}</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-xs text-gray-500">Hadir</span>
                           <span className="text-lg font-bold text-primary">{record.totalHadir}</span>
                        </div>
                     </div>
                     
                     {/* Calendar Grid */}
                     <div className="grid grid-cols-7 gap-2">
                        {calendarDates.map((date, i) => {
                           const isLocked = isKoordinator && !isDateToday(date);
                           const dayIdx = i + 1;
                           const checked = !!record.hari[dayIdx];
                           const isToday = isDateToday(date);

                           return (
                             <label 
                               key={i} 
                               className={`
                                  flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer
                                  ${checked 
                                    ? 'bg-primary/10 border-primary text-primary' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}
                                  ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                                  ${(!canEditAttendance || isLocked) ? 'opacity-50 cursor-not-allowed' : ''}
                               `}
                             >
                               <span className="text-[9px] uppercase font-bold mb-1">{getDayName(date)}</span>
                               <span className="text-xs mb-1.5">{formatDate(date).split('/')[0]}</span>
                               
                               <input 
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  disabled={!canEditAttendance || isLocked}
                                  onChange={(e) => handleAttendanceChange(record.id, dayIdx, e.target.checked)}
                               />
                               <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${checked ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                                  {checked && <Check size={10} strokeWidth={3} />}
                               </div>
                             </label>
                           );
                        })}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </Card>
      ))}

      {/* --- MODALS --- */}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPeriodeId ? "Edit Periode" : "Buat Periode Baru"}
      >
        <div className="space-y-4">
          <Input 
            label="Nama Periode" 
            placeholder="Contoh: Januari 2025 - Periode 1" 
            value={newPeriodeName} 
            onChange={(e) => setNewPeriodeName(e.target.value)} 
          />
          <Input 
            label="Tanggal Mulai" 
            type="date" 
            value={newPeriodeDate} 
            onChange={(e) => setNewPeriodeDate(e.target.value)} 
          />
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 flex items-start">
             <Calendar size={18} className="mr-2 mt-0.5 shrink-0"/>
             <span>Periode akan berlaku selama 14 hari berturut-turut mulai dari tanggal yang dipilih.</span>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSavePeriode} isLoading={loading}>Simpan Periode</Button>
          </div>
        </div>
      </Modal>

      {/* --- PRINT PREVIEW --- */}
      <PrintPreviewDialog 
         isOpen={isPrintPreviewOpen} 
         onClose={() => setIsPrintPreviewOpen(false)} 
         title="Laporan Absensi Karyawan"
         filename={printFilename}
      >
        <div className="flex flex-col items-center mb-6 border-b-2 border-gray-800 pb-4">
           <div className="flex items-center gap-4 w-full justify-center">
              <Logo className="w-16 h-16" />
              <div className="text-center">
                 <h1 className="text-2xl font-bold uppercase tracking-wider">Laporan Absensi Karyawan</h1>
                 <h2 className="text-lg font-semibold uppercase text-gray-700">Satuan Pelayanan Pemenuhan Gizi (SPPG)</h2>
                 <p className="text-sm font-medium mt-1">Periode: {currentPeriode?.nama}</p>
                 <p className="text-xs text-gray-500">
                    Tanggal: {calendarDates.length > 0 && formatDate(calendarDates[0])} s/d {calendarDates.length > 0 && formatDate(calendarDates[calendarDates.length-1])}
                 </p>
              </div>
           </div>
        </div>

        {/* Print Tables Per Division */}
        {sortedDivisions.map(divisi => (
           <div key={divisi} className="mb-8 break-inside-avoid">
              <div className="bg-gray-200 px-3 py-1.5 font-bold text-sm border border-black mb-0.5 uppercase tracking-wide">
                 Divisi: {divisi}
              </div>
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-1 w-8 text-center" rowSpan={2}>No</th>
                    <th className="border border-black p-1 text-left pl-2" rowSpan={2}>Nama Karyawan</th>
                    {/* Date Header Row */}
                    {calendarDates.map((date, i) => (
                      <th key={`date-${i}`} className="border border-black p-1 text-center w-8 bg-gray-50">
                         {formatDate(date)}
                      </th>
                    ))}
                    <th className="border border-black p-1 w-10 text-center" rowSpan={2}>Jml</th>
                  </tr>
                  {/* Day Name Header Row */}
                  <tr className="bg-gray-100">
                     {calendarDates.map((date, i) => (
                        <th key={`day-${i}`} className="border border-black p-0.5 text-center font-normal uppercase text-[9px]">
                           {getDayName(date)}
                        </th>
                     ))}
                  </tr>
                </thead>
                <tbody>
                  {groupedData[divisi].map((record, idx) => (
                    <tr key={record.id}>
                      <td className="border border-black p-1 text-center">{idx + 1}</td>
                      <td className="border border-black p-1 pl-2 font-medium">{record.namaKaryawan}</td>
                      {calendarDates.map((_, i) => (
                        <td key={i} className="border border-black p-0 text-center align-middle">
                          {record.hari[i + 1] ? (
                            <div className="flex items-center justify-center h-full w-full">
                               <Check size={12} className="text-black font-bold" strokeWidth={4} />
                            </div>
                          ) : ''}
                        </td>
                      ))}
                      <td className="border border-black p-1 text-center font-bold bg-gray-50">
                        {record.totalHadir}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        ))}
        
        {/* Signature Area */}
        <div className="mt-12 flex justify-end break-inside-avoid">
           <div className="text-center w-64">
              <p className="mb-16">Ngadiluwih, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p className="font-bold border-b border-black pb-1 mb-1">Tiurmasi Saulina Sirait, S.T.</p>
              <p className="text-xs uppercase">Kepala SPPG</p>
           </div>
        </div>
      </PrintPreviewDialog>

    </div>
  );
};
