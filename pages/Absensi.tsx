
import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Input, Modal, LoadingSpinner, useToast, Logo, PrintPreviewDialog, ConfirmationModal } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Periode, AbsensiRecord, User, Role, AbsensiDetail } from '../types';
import { Plus, Calendar, CalendarDays, Check, Pencil, Printer, CloudLightning, Camera, Clock, XCircle, MapPin, User as UserIcon, LogIn, LogOut, Trash2, Lock, RefreshCw } from 'lucide-react';

export const AbsensiPage: React.FC = () => {
  // Get current user to check role
  const currentUser: User | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('simanda_user') || '{}');
    } catch { return null; }
  })();
  const role = currentUser?.jabatan as Role;
  
  const isKoordinator = role === 'KOORDINATORDIVISI';
  const canManagePeriode = role === 'SUPERADMIN' || role === 'KSPPG';
  const canEditAttendance = role !== 'ADMINSPPG' && role !== 'PETUGAS';
  
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AbsensiRecord[]>([]);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  
  // Modal State for New/Edit/Delete Period
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriodeId, setEditingPeriodeId] = useState<string | null>(null);
  const [deletePeriodeId, setDeletePeriodeId] = useState<string | null>(null); // For deletion
  const [newPeriodeName, setNewPeriodeName] = useState('');
  const [newPeriodeDate, setNewPeriodeDate] = useState('');

  // Print Preview State
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // === NEW: Camera / Attendance Detail Modal State ===
  const [isAbsenModalOpen, setIsAbsenModalOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<'MASUK' | 'PULANG' | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Camera Toggle State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamObj, setStreamObj] = useState<MediaStream | null>(null);

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

  // 2. Subscribe to Attendance Data
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
    const unsubscribe = api.subscribeAbsensi(selectedPeriode, (data) => {
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

  // === PERIODE MANAGEMENT ===
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

  const handleDeletePeriode = async () => {
    if (!deletePeriodeId) return;
    setLoading(true);
    try {
        await api.deletePeriode(deletePeriodeId);
        showToast("Periode dan data foto berhasil dihapus permanen.", "success");
        setSelectedPeriode(''); // Reset selection
        setDeletePeriodeId(null);
    } catch (e) {
        showToast("Gagal menghapus periode", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleSavePeriode = async () => {
    if (!newPeriodeName || !newPeriodeDate) {
      showToast("Mohon lengkapi nama dan tanggal periode.", "error");
      return;
    }
    setLoading(true);

    if (editingPeriodeId) {
      const updatedPeriode: Periode = { id: editingPeriodeId, nama: newPeriodeName, tanggalMulai: newPeriodeDate, status: 'OPEN' };
      await api.updatePeriode(updatedPeriode);
      setIsModalOpen(false);
      showToast("Periode berhasil diperbarui!", "success");
    } else {
      const newPeriode: Periode = { id: Date.now().toString(), nama: newPeriodeName, tanggalMulai: newPeriodeDate, status: 'OPEN' };
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

  // === ATTENDANCE LOGIC ===

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const handleCellClick = (recordId: string, dayIndex: number, date: Date) => {
    if (!canEditAttendance) return;

    // Koordinator restriction: only today
    if (isKoordinator && !isDateToday(date)) {
        showToast("Anda hanya dapat mengisi absensi untuk hari ini.", "error");
        return;
    }

    setSelectedRecordId(recordId);
    setSelectedDayIndex(dayIndex);
    setIsAbsenModalOpen(true);
  };

  const startCamera = async (mode: 'MASUK' | 'PULANG', preferredFacing?: 'user' | 'environment') => {
    setCameraActive(mode);
    const currentFacing = preferredFacing || facingMode;
    
    // Stop existing stream if any before switching
    if (streamObj) {
      streamObj.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: currentFacing } 
      });
      setStreamObj(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal mengakses kamera. Pastikan izin diberikan.", "error");
      setCameraActive(null);
    }
  };

  const toggleCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (cameraActive) {
      startCamera(cameraActive, newFacing);
    }
  };

  const stopCamera = () => {
    if (streamObj) {
      streamObj.getTracks().forEach(track => track.stop());
      setStreamObj(null);
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    setCameraActive(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !selectedRecordId || selectedDayIndex === null) return;

    const canvas = document.createElement('canvas');
    // Resize for thumbnail storage (efficiency)
    const w = 400; 
    const h = (videoRef.current.videoHeight / videoRef.current.videoWidth) * w;
    canvas.width = w;
    canvas.height = h;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If front camera, mirror the photo to feel natural
      if (facingMode === 'user') {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
      }
      
      ctx.drawImage(videoRef.current, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.6); // Compress quality
      
      const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      saveDetailedAttendance(cameraActive!, base64, currentTime);
      stopCamera();
    }
  };

  const saveDetailedAttendance = async (type: 'MASUK' | 'PULANG', photo: string, time: string) => {
    if (!selectedRecordId || selectedDayIndex === null) return;
    
    const record = attendanceData.find(r => r.id === selectedRecordId);
    if (!record) return;

    const currentDetail = record.detailHari?.[selectedDayIndex] || {};
    const newDetail: AbsensiDetail = { ...currentDetail };

    if (type === 'MASUK') {
        newDetail.jamMasuk = time;
        newDetail.fotoMasuk = photo;
    } else {
        newDetail.jamPulang = time;
        newDetail.fotoPulang = photo;
    }

    // FIX: Update Legacy Boolean (Checked if EITHER Masuk OR Pulang exists)
    const isPresent = !!newDetail.jamMasuk || !!newDetail.jamPulang; 

    // Construct Update
    const updatedRecord: AbsensiRecord = {
        ...record,
        hari: { ...record.hari, [selectedDayIndex]: isPresent },
        detailHari: { ...record.detailHari, [selectedDayIndex]: newDetail },
        totalHadir: isPresent ? record.totalHadir + (record.hari[selectedDayIndex] ? 0 : 1) : record.totalHadir
    };

    // Recalculate Total Hadir properly based on map
    updatedRecord.totalHadir = Object.values(updatedRecord.hari).filter(Boolean).length;

    try {
        await api.saveAbsensiRecord(updatedRecord);
        showToast(`Berhasil absen ${type.toLowerCase()}!`, "success");
    } catch (e) {
        showToast("Gagal menyimpan absensi.", "error");
    }
  };

  const handleManualToggle = async (checked: boolean) => {
    if (!selectedRecordId || selectedDayIndex === null) return;
    const record = attendanceData.find(r => r.id === selectedRecordId);
    if (!record) return;

    // Admin Override logic
    const updatedHari = { ...record.hari, [selectedDayIndex]: checked };
    
    const updatedRecord = { 
        ...record, 
        hari: updatedHari,
        totalHadir: Object.values(updatedHari).filter(Boolean).length
    };

    await api.saveAbsensiRecord(updatedRecord);
  };

  // Helper to get selected Record details for Modal
  const getSelectedRecordData = () => {
    if (!selectedRecordId || selectedDayIndex === null) return null;
    const rec = attendanceData.find(r => r.id === selectedRecordId);
    if (!rec) return null;
    const date = calendarDates[selectedDayIndex - 1];
    const detail = rec.detailHari?.[selectedDayIndex];
    const isChecked = !!rec.hari[selectedDayIndex];
    return { rec, date, detail, isChecked };
  };

  const modalData = getSelectedRecordData();

  // Ensure camera stream is attached when switching modes
  useEffect(() => {
    if (cameraActive && streamObj && videoRef.current) {
        videoRef.current.srcObject = streamObj;
    }
  }, [cameraActive, streamObj]);

  // Cleanup on modal close
  useEffect(() => {
    if (!isAbsenModalOpen) {
        stopCamera();
    }
  }, [isAbsenModalOpen]);


  // Grouping Data
  const groupedData = attendanceData.reduce((acc, record) => {
    if (!acc[record.divisi]) { acc[record.divisi] = []; }
    acc[record.divisi].push(record);
    return acc;
  }, {} as { [key: string]: AbsensiRecord[] });
  const sortedDivisions = Object.keys(groupedData).sort();

  const formatDate = (date: Date) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit' }).format(date);
  const getDayName = (date: Date) => new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
  const getFullDate = (date: Date) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(date);

  const currentPeriode = periodes.find(p => p.id === selectedPeriode);
  const printFilename = `Laporan_Absensi_${currentPeriode?.nama.replace(/\s+/g, '_') || 'SPPG'}`;

  // Helper to render cell content
  const renderCellContent = (record: AbsensiRecord, i: number, date: Date) => {
     const isChecked = !!record.hari[i];
     const detail = record.detailHari?.[i];
     const hasIn = !!detail?.jamMasuk;
     const hasOut = !!detail?.jamPulang;

     if (!isChecked) return null;

     return (
        <div className="flex flex-col items-center justify-center h-full">
            <Check size={16} strokeWidth={4} className="text-green-600" />
            <div className="flex gap-0.5 mt-0.5">
                {hasIn && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`Masuk: ${detail.jamMasuk}`}></div>}
                {hasOut && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" title={`Pulang: ${detail.jamPulang}`}></div>}
            </div>
        </div>
     );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-8 print:pb-0 print:space-y-0">
      
      {/* --- HEADER TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 no-print">
        <div>
           <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarDays className="text-primary shrink-0" /> <span className="truncate">Absensi & Kehadiran</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-2">
            {isKoordinator ? `Divisi: ${currentUser?.jabatanDivisi}` : 'Monitor kehadiran, jam, dan foto'}
            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium flex items-center gap-1">
                <CloudLightning size={10} /> Realtime Sync
            </span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex items-center gap-2 w-full sm:w-auto">
             <select 
                className="pl-3 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-blue-50/50 font-medium text-blue-900 w-full sm:w-64 text-sm"
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
              >
                <option value="" disabled>Pilih Periode Absensi</option>
                {periodes.map(p => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
              {canManagePeriode && selectedPeriode && (
                <>
                    <Button variant="secondary" onClick={handleOpenEdit} className="px-3 py-2 shrink-0" title="Edit Periode"><Pencil size={18} /></Button>
                    <Button variant="danger" onClick={() => setDeletePeriodeId(selectedPeriode)} className="px-3 py-2 shrink-0" title="Hapus Periode"><Trash2 size={18} /></Button>
                </>
              )}
          </div>
          
          {selectedPeriode && (
            <Button variant="secondary" onClick={() => setIsPrintPreviewOpen(true)} icon={<Printer size={18} />} className="justify-center">Cetak</Button>
          )}

          {canManagePeriode && (
            <Button onClick={handleOpenAdd} icon={<Plus size={18} />} className="justify-center">Periode Baru</Button>
          )}
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {/* --- DESKTOP TABLE VIEW (Hidden on Mobile) --- */}
      <div className="hidden lg:block">
      {!loading && selectedPeriode && sortedDivisions.map(divisi => (
        <Card key={divisi} className="mb-6 border border-gray-200 shadow-sm overflow-hidden no-print"> 
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
             <h3 className="font-bold text-gray-800 text-sm">{divisi}</h3>
             <span className="text-xs font-medium bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
               {groupedData[divisi].length} Org
             </span>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/50 text-gray-700 border-b border-gray-200">
                  <th className="p-3 w-12 text-center font-semibold sticky left-0 bg-gray-50 z-30 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">No</th>
                  <th className="p-3 min-w-[200px] font-semibold sticky left-12 bg-gray-50 z-30 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Karyawan</th>
                  {calendarDates.map((date, i) => (
                    <th key={i} className={`p-2 min-w-[50px] text-center border-l border-gray-100 ${isDateToday(date) ? 'bg-blue-100/50 text-blue-700' : ''}`}>
                      <div className="text-[10px] uppercase text-gray-500">{getDayName(date)}</div>
                      <div className="text-xs font-bold">{formatDate(date)}</div>
                    </th>
                  ))}
                  <th className="p-3 text-center sticky right-0 bg-gray-50 z-20 border-l border-gray-200">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupedData[divisi].map((record, idx) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-3 text-center sticky left-0 bg-white group-hover:bg-gray-50 z-20 border-r border-gray-100 font-mono text-gray-500 text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{idx + 1}</td>
                    <td className="p-3 font-medium text-gray-700 sticky left-12 bg-white group-hover:bg-gray-50 z-20 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[200px]" title={record.namaKaryawan}>
                      {record.namaKaryawan}
                    </td>
                    {calendarDates.map((date, i) => {
                       const dayIndex = i + 1;
                       const isToday = isDateToday(date);
                       return (
                        <td 
                          key={i} 
                          className={`p-0 text-center border-l border-gray-100 relative h-10 w-12 cursor-pointer transition-colors
                             ${record.hari[dayIndex] ? 'bg-green-50/50 hover:bg-green-100' : 'hover:bg-gray-100'}
                             ${isToday ? 'ring-1 ring-inset ring-blue-200' : ''}
                          `}
                          onClick={() => handleCellClick(record.id, dayIndex, date)}
                        >
                          {renderCellContent(record, dayIndex, date)}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-bold text-primary sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-gray-200">
                      {record.totalHadir}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
      </div>

      {/* --- MOBILE CARD VIEW (Visible on Mobile) --- */}
      <div className="lg:hidden space-y-6">
      {!loading && selectedPeriode && sortedDivisions.map(divisi => (
        <div key={divisi}>
          <div className="flex items-center justify-between mb-3 px-1">
             <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{divisi}</h3>
             <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-500">{groupedData[divisi].length} Org</span>
          </div>
          
          <div className="space-y-3">
             {groupedData[divisi].map((record, idx) => (
                <div key={record.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                   <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-800">{record.namaKaryawan}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{record.divisi}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xl font-bold text-primary">{record.totalHadir}</span>
                        <span className="text-[10px] text-gray-400">Hadir</span>
                      </div>
                   </div>

                   {/* Mobile Grid Calendar */}
                   <div className="grid grid-cols-7 gap-1">
                      {calendarDates.map((date, i) => {
                         const dayIndex = i + 1;
                         const isChecked = !!record.hari[dayIndex];
                         const isToday = isDateToday(date);
                         
                         return (
                           <button 
                              key={i}
                              onClick={() => handleCellClick(record.id, dayIndex, date)}
                              className={`
                                flex flex-col items-center justify-center p-1 rounded-lg border aspect-square transition-all
                                ${isChecked 
                                   ? 'bg-green-50 border-green-200 text-green-700' 
                                   : 'bg-gray-50 border-gray-100 text-gray-400'
                                }
                                ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 z-10' : ''}
                              `}
                           >
                              <span className="text-[8px] uppercase font-bold">{getDayName(date)}</span>
                              <span className="text-xs">{date.getDate()}</span>
                              {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-0.5"></div>}
                           </button>
                         )
                      })}
                   </div>
                </div>
             ))}
          </div>
        </div>
      ))}
      </div>


      {/* --- ABSENSI & CAMERA MODAL --- */}
      <Modal isOpen={isAbsenModalOpen} onClose={() => setIsAbsenModalOpen(false)} title="Detail Absensi">
         {modalData && (
           <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                    {modalData.rec.namaKaryawan.charAt(0)}
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900">{modalData.rec.namaKaryawan}</h4>
                    <p className="text-sm text-blue-800 flex items-center gap-1.5">
                       <Calendar size={14}/> {getFullDate(modalData.date)}
                    </p>
                 </div>
              </div>
              
              {!cameraActive ? (
                <>
                  {/* Attendance Actions Grid */}
                  <div className="grid grid-cols-2 gap-4">
                     {/* Masuk Section */}
                     <div className={`p-4 rounded-xl border-2 transition-all ${modalData.detail?.jamMasuk ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                           <LogIn size={18} className={modalData.detail?.jamMasuk ? 'text-green-600' : 'text-gray-400'} />
                           <span className="font-bold text-sm text-gray-700">Absen Masuk</span>
                        </div>
                        
                        {modalData.detail?.jamMasuk ? (
                           <div className="space-y-3">
                              <div className="text-2xl font-bold text-green-700 font-mono tracking-tight">
                                 {modalData.detail.jamMasuk}
                              </div>
                              {modalData.detail.fotoMasuk && (
                                 <img src={modalData.detail.fotoMasuk} alt="Masuk" className="w-full h-32 object-cover rounded-lg shadow-sm border border-green-100" />
                              )}
                           </div>
                        ) : (
                           <button 
                              onClick={() => startCamera('MASUK')}
                              className="w-full py-6 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                           >
                              <Camera size={24} />
                              <span className="text-xs font-semibold">Ambil Foto Masuk</span>
                           </button>
                        )}
                     </div>

                     {/* Pulang Section */}
                     <div className={`p-4 rounded-xl border-2 transition-all ${modalData.detail?.jamPulang ? 'border-orange-200 bg-orange-50' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                           <LogOut size={18} className={modalData.detail?.jamPulang ? 'text-orange-600' : 'text-gray-400'} />
                           <span className="font-bold text-sm text-gray-700">Absen Pulang</span>
                        </div>
                        
                        {modalData.detail?.jamPulang ? (
                           <div className="space-y-3">
                              <div className="text-2xl font-bold text-orange-700 font-mono tracking-tight">
                                 {modalData.detail.jamPulang}
                              </div>
                              {modalData.detail.fotoPulang && (
                                 <img src={modalData.detail.fotoPulang} alt="Pulang" className="w-full h-32 object-cover rounded-lg shadow-sm border border-orange-100" />
                              )}
                           </div>
                        ) : (
                           !modalData.detail?.jamMasuk ? (
                               <button disabled className="w-full py-6 flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed border border-gray-200">
                                  <Lock size={24} />
                                  <span className="text-xs font-semibold text-center">Isi Absen Masuk<br/>Terlebih Dahulu</span>
                               </button>
                           ) : (
                               <button 
                                  onClick={() => startCamera('PULANG')}
                                  className="w-full py-6 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                               >
                                  <Camera size={24} />
                                  <span className="text-xs font-semibold">Ambil Foto Pulang</span>
                               </button>
                           )
                        )}
                     </div>
                  </div>

                  {/* Manual Override for Admin */}
                  {!isKoordinator && (
                    <div className="pt-4 border-t border-gray-100">
                        <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                            <span className="text-sm font-medium text-gray-700">Status Kehadiran (Manual)</span>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full border border-gray-300 bg-white has-[:checked]:bg-green-500 has-[:checked]:border-green-600">
                                <input 
                                    type="checkbox" 
                                    className="opacity-0 w-0 h-0 peer"
                                    checked={modalData.isChecked}
                                    onChange={(e) => handleManualToggle(e.target.checked)}
                                />
                                <span className="absolute left-1 top-1 w-4 h-4 bg-gray-300 rounded-full transition-all duration-200 peer-checked:left-[1.6rem] peer-checked:bg-white shadow-sm"></span>
                            </div>
                        </label>
                        <p className="text-[10px] text-gray-400 mt-1 px-3">
                           *Centang manual jika kamera tidak dapat digunakan atau untuk koreksi data.
                        </p>
                    </div>
                  )}
                </>
              ) : (
                /* CAMERA VIEW */
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4] sm:aspect-video flex flex-col">
                   <video 
                     ref={videoRef} 
                     autoPlay 
                     playsInline 
                     muted 
                     className={`flex-1 object-cover w-full h-full ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                   ></video>
                   
                   <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/60 to-transparent text-white flex justify-between items-center z-10">
                      <span className="font-bold flex items-center gap-2">
                        <Camera size={16}/> {cameraActive === 'MASUK' ? 'Foto Masuk' : 'Foto Pulang'}
                      </span>
                      <div className="flex gap-2">
                        {/* CAMERA TOGGLE BUTTON */}
                        <button onClick={toggleCamera} className="bg-white/20 p-2 rounded-full backdrop-blur-md hover:bg-white/40 transition-colors" title="Ganti Kamera">
                           <RefreshCw size={20} />
                        </button>
                        <button onClick={stopCamera} className="bg-white/20 p-2 rounded-full backdrop-blur-md hover:bg-white/40 transition-colors">
                           <XCircle size={20} />
                        </button>
                      </div>
                   </div>
                   
                   {/* TARGET NAME OVERLAY */}
                   <div className="absolute top-16 left-0 w-full flex justify-center z-10">
                      <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-lg text-center">
                         <p className="text-[10px] uppercase tracking-widest text-gray-300 mb-0.5">Target Karyawan</p>
                         <p className="font-bold text-lg leading-none">{modalData.rec.namaKaryawan}</p>
                      </div>
                   </div>

                   <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center z-10">
                      <button 
                        onClick={capturePhoto}
                        className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                      >
                         <div className="w-14 h-14 rounded-full border-2 border-black"></div>
                      </button>
                   </div>
                </div>
              )}
           </div>
         )}
      </Modal>

      {/* --- ADD/EDIT PERIODE MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPeriodeId ? "Edit Periode" : "Buat Periode Baru"}>
        <div className="space-y-4">
          <Input 
            label="Nama Periode" 
            placeholder="Contoh: Januari 2025" 
            value={newPeriodeName} 
            onChange={e => setNewPeriodeName(e.target.value)} 
          />
          <Input 
            label="Tanggal Mulai" 
            type="date" 
            value={newPeriodeDate} 
            onChange={e => setNewPeriodeDate(e.target.value)} 
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSavePeriode} isLoading={loading}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <ConfirmationModal 
        isOpen={!!deletePeriodeId}
        onClose={() => setDeletePeriodeId(null)}
        onConfirm={handleDeletePeriode}
        title="Hapus Periode & Bersihkan Data"
        message="Apakah anda yakin? Tindakan ini akan MENGHAPUS PERMANEN seluruh data absensi dan FOTO KARYAWAN di periode ini. Ini akan mengosongkan penyimpanan database secara signifikan."
        isLoading={loading}
      />

      {/* --- PRINT PREVIEW --- */}
      <PrintPreviewDialog 
        isOpen={isPrintPreviewOpen} 
        onClose={() => setIsPrintPreviewOpen(false)} 
        title="Laporan Absensi"
        filename={printFilename}
      >
        <div className="text-center mb-6">
           <h1 className="text-xl font-bold uppercase">Laporan Absensi Karyawan</h1>
           <h2 className="text-lg uppercase text-gray-600">{currentPeriode?.nama}</h2>
           <p className="text-sm text-gray-500 mt-1">Divisi: {isKoordinator ? currentUser?.jabatanDivisi : 'Semua Divisi'}</p>
        </div>

        {sortedDivisions.map(divisi => (
          <div key={divisi} className="mb-8 break-inside-avoid">
            <div className="bg-gray-200 px-3 py-1 font-bold text-sm border border-gray-400 border-b-0 inline-block">{divisi}</div>
            <table className="w-full border-collapse border border-gray-400 text-xs">
               <thead>
                 <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-1 w-8 text-center">No</th>
                    <th className="border border-gray-400 p-1 text-left">Nama</th>
                    {calendarDates.map((date, i) => (
                       <th key={i} className="border border-gray-400 p-1 w-8 text-center">
                          <div className="text-[9px] uppercase">{getDayName(date)}</div>
                          <div>{date.getDate()}</div>
                       </th>
                    ))}
                    <th className="border border-gray-400 p-1 w-10 text-center">Jml</th>
                 </tr>
               </thead>
               <tbody>
                  {groupedData[divisi].map((record, idx) => (
                    <tr key={record.id}>
                       <td className="border border-gray-400 p-1 text-center">{idx + 1}</td>
                       <td className="border border-gray-400 p-1 truncate max-w-[150px]">{record.namaKaryawan}</td>
                       {calendarDates.map((_, i) => (
                          <td key={i} className="border border-gray-400 p-1 text-center font-bold">
                             {record.hari[i+1] ? 'v' : ''}
                          </td>
                       ))}
                       <td className="border border-gray-400 p-1 text-center font-bold bg-gray-50">{record.totalHadir}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        ))}

        <div className="mt-8 flex justify-end">
           <div className="text-center w-48">
              <p className="mb-16">Mengetahui,</p>
              <p className="font-bold underline">Tiurmasi Saulina Sirait, S.T.</p>
              <p className="text-xs">Kepala SPPG</p>
           </div>
        </div>
      </PrintPreviewDialog>
    </div>
  );
};
