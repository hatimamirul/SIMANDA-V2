import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Card, Button, Input, Modal, LoadingSpinner, useToast, Logo, PrintPreviewDialog, ConfirmationModal } from '../components/UIComponents';
import { api } from '../services/mockService';
import { Periode, AbsensiRecord, User, Role, AbsensiDetail } from '../types';
import { 
  Plus, Calendar, CalendarDays, Check, Pencil, 
  Printer, CloudLightning, Camera, Clock, 
  XCircle, MapPin, User as UserIcon, LogIn, 
  LogOut, Trash2, Lock, RefreshCw, ChevronLeft, 
  ChevronRight, Search, LayoutList, History, 
  UserCheck, AlertCircle, Info, Maximize2,
  CheckCircle
} from 'lucide-react';

export const AbsensiPage: React.FC = () => {
  // === USER & PERMISSION HANDLERS ===
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

  // === STATE MANAGEMENT ===
  const [loading, setLoading] = useState(false);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<AbsensiRecord[]>([]);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriodeId, setEditingPeriodeId] = useState<string | null>(null);
  const [deletePeriodeId, setDeletePeriodeId] = useState<string | null>(null);
  const [newPeriodeName, setNewPeriodeName] = useState('');
  const [newPeriodeDate, setNewPeriodeDate] = useState('');

  // Print & Preview States
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isAbsenModalOpen, setIsAbsenModalOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  
  // Camera & Stream States
  const [cameraActive, setCameraActive] = useState<'MASUK' | 'PULANG' | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamObj, setStreamObj] = useState<MediaStream | null>(null);

  // === INITIAL DATA FETCHING (REALTIME) ===
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

  useEffect(() => {
    if (!selectedPeriode) {
      setAttendanceData([]);
      setCalendarDates([]);
      return;
    }

    const currentP = periodes.find(p => p.id === selectedPeriode);
    if (currentP) calculateWorkingDays(currentP.tanggalMulai);

    setLoading(true);
    const unsubscribe = api.subscribeAbsensi(selectedPeriode, (data) => {
       let filteredData = data;
       
       // Priority 1: Filter by Koordinator Division
       if (isKoordinator && currentUser?.jabatanDivisi) {
         filteredData = data.filter(r => r.divisi === currentUser.jabatanDivisi);
       }
       
       setAttendanceData(filteredData);
       setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedPeriode, periodes, isKoordinator, currentUser?.jabatanDivisi]);

  // === LOGIC HELPERS ===
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

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const formatDateShort = (date: Date) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit' }).format(date);
  const getDayName = (date: Date) => new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
  const getFullDateLabel = (date: Date) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(date);

  // === SEARCH & FILTERED DATA ===
  const filteredAttendance = useMemo(() => {
    if (!searchQuery) return attendanceData;
    const q = searchQuery.toLowerCase();
    return attendanceData.filter(r => r.namaKaryawan.toLowerCase().includes(q));
  }, [attendanceData, searchQuery]);

  const groupedData = useMemo(() => {
    return filteredAttendance.reduce((acc, record) => {
      if (!acc[record.divisi]) acc[record.divisi] = [];
      acc[record.divisi].push(record);
      return acc;
    }, {} as { [key: string]: AbsensiRecord[] });
  }, [filteredAttendance]);

  const sortedDivisions = useMemo(() => Object.keys(groupedData).sort(), [groupedData]);

  // === PERIODE ACTIONS ===
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
      showToast("Nama dan Tanggal Mulai wajib diisi.", "error");
      return;
    }
    setLoading(true);
    try {
      if (editingPeriodeId) {
        await api.updatePeriode({ id: editingPeriodeId, nama: newPeriodeName, tanggalMulai: newPeriodeDate, status: 'OPEN' });
        showToast("Periode berhasil diperbarui.", "success");
      } else {
        const newP: Periode = { id: Date.now().toString(), nama: newPeriodeName, tanggalMulai: newPeriodeDate, status: 'OPEN' };
        await api.savePeriode(newP);
        setSelectedPeriode(newP.id);
        showToast("Periode baru berhasil dibuat.", "success");
      }
      setIsModalOpen(false);
    } catch (e) {
      showToast("Gagal menyimpan periode.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriode = async () => {
    if (!deletePeriodeId) return;
    setLoading(true);
    try {
      await api.deletePeriode(deletePeriodeId);
      showToast("Periode dan data terkait dihapus permanen.", "success");
      setSelectedPeriode('');
      setDeletePeriodeId(null);
    } catch (e) {
      showToast("Gagal menghapus periode.", "error");
    } finally {
      setLoading(false);
    }
  };

  // === ATTENDANCE ACTIONS ===
  const handleCellClick = (recordId: string, dayIndex: number, date: Date) => {
    if (!canEditAttendance) return;
    // Rule: Koordinator only allows attendance for TODAY
    if (isKoordinator && !isDateToday(date)) {
      showToast("Akses dibatasi. Anda hanya dapat mengisi absensi untuk hari ini.", "error");
      return;
    }
    setSelectedRecordId(recordId);
    setSelectedDayIndex(dayIndex);
    setIsAbsenModalOpen(true);
  };

  const handleManualToggle = async (checked: boolean) => {
    if (!selectedRecordId || selectedDayIndex === null) return;
    const record = attendanceData.find(r => r.id === selectedRecordId);
    if (!record) return;

    const updatedHari = { ...record.hari, [selectedDayIndex]: checked };
    const updatedRecord: AbsensiRecord = { 
      ...record, 
      hari: updatedHari, 
      totalHadir: Object.values(updatedHari).filter(Boolean).length 
    };
    await api.saveAbsensiRecord(updatedRecord);
  };

  // === CAMERA ENGINE ===
  const startCamera = async (mode: 'MASUK' | 'PULANG', preferredFacing?: 'user' | 'environment') => {
    setCameraActive(mode);
    const currentFacing = preferredFacing || facingMode;
    
    if (streamObj) {
      streamObj.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: currentFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStreamObj(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      showToast("Kamera tidak dapat diakses. Pastikan izin kamera aktif.", "error");
      setCameraActive(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !selectedRecordId || selectedDayIndex === null) return;
    
    const canvas = document.createElement('canvas');
    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(videoRef.current, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.6);
      const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      processSaveAttendance(cameraActive!, base64, currentTime);
      stopCamera();
    }
  };

  const processSaveAttendance = async (type: 'MASUK' | 'PULANG', photo: string, time: string) => {
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

    // If either time is present, mark as present (True)
    const isPresent = !!newDetail.jamMasuk || !!newDetail.jamPulang;
    
    const updatedRecord: AbsensiRecord = { 
      ...record, 
      hari: { ...record.hari, [selectedDayIndex]: isPresent },
      detailHari: { ...record.detailHari, [selectedDayIndex]: newDetail }
    };
    
    // Recalculate total
    updatedRecord.totalHadir = Object.values(updatedRecord.hari).filter(Boolean).length;
    
    try {
      await api.saveAbsensiRecord(updatedRecord);
      showToast(`Absen ${type} berhasil dicatat.`, "success");
    } catch (e) {
      showToast("Gagal menyimpan ke database.", "error");
    }
  };

  const stopCamera = () => {
    if (streamObj) {
      streamObj.getTracks().forEach(track => track.stop());
      setStreamObj(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(null);
  };

  const toggleCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (cameraActive) startCamera(cameraActive, nextFacing);
  };

  useEffect(() => {
    if (cameraActive && streamObj && videoRef.current) videoRef.current.srcObject = streamObj;
  }, [cameraActive, streamObj]);

  useEffect(() => { if (!isAbsenModalOpen) stopCamera(); }, [isAbsenModalOpen]);

  // === RENDER HELPERS ===
  const modalData = useMemo(() => {
    if (!selectedRecordId || selectedDayIndex === null) return null;
    const rec = attendanceData.find(r => r.id === selectedRecordId);
    if (!rec) return null;
    const date = calendarDates[selectedDayIndex - 1];
    const detail = rec.detailHari?.[selectedDayIndex];
    const isChecked = !!rec.hari[selectedDayIndex];
    return { rec, date, detail, isChecked };
  }, [selectedRecordId, selectedDayIndex, attendanceData, calendarDates]);

  const renderCellVisuals = (record: AbsensiRecord, day: number, date: Date) => {
    const isChecked = !!record.hari[day];
    const detail = record.detailHari?.[day];
    const hasIn = !!detail?.jamMasuk;
    const hasOut = !!detail?.jamPulang;
    
    if (!isChecked) return <div className="text-gray-200 text-[10px]">-</div>;
    
    return (
      <div className="flex flex-col items-center justify-center gap-0.5">
         <Check size={16} strokeWidth={4} className="text-green-600" />
         <div className="flex gap-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${hasIn ? 'bg-blue-500' : 'bg-gray-200'}`} title={hasIn ? `Masuk: ${detail?.jamMasuk}` : ''}></div>
            <div className={`w-1.5 h-1.5 rounded-full ${hasOut ? 'bg-orange-500' : 'bg-gray-200'}`} title={hasOut ? `Pulang: ${detail?.jamPulang}` : ''}></div>
         </div>
      </div>
    );
  };

  const currentPeriodeObj = periodes.find(p => p.id === selectedPeriode);

  const printFilename = useMemo(() => {
    return `Laporan_Absensi_${(currentPeriodeObj?.nama || 'Periode').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  }, [currentPeriodeObj]);

  return (
    <div className="space-y-6 pb-24 print:pb-0 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
              <CalendarDays size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Monitor Absensi</h2>
              <p className="text-sm text-gray-400 font-medium flex items-center gap-2">
                 {isKoordinator ? `Divisi: ${currentUser?.jabatanDivisi}` : 'Pengelolaan Kehadiran & Foto Bukti'}
                 <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                 <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-black tracking-widest flex items-center gap-1 uppercase">
                    <CloudLightning size={10} className="fill-current"/> Realtime
                 </span>
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* SEARCH BOX */}
          <div className="relative group w-full sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
             <input 
                type="text" 
                placeholder="Cari nama karyawan..." 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white outline-none transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
             />
          </div>

          <div className="h-10 w-px bg-gray-100 hidden sm:block"></div>

          {/* PERIODE SELECTOR */}
          <div className="relative flex items-center gap-2 w-full sm:w-auto">
             <select 
                className="pl-4 pr-10 py-3 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-black text-blue-900 focus:ring-4 focus:ring-blue-200 outline-none appearance-none min-w-[220px] cursor-pointer"
                value={selectedPeriode} 
                onChange={(e) => setSelectedPeriode(e.target.value)}
             >
                <option value="" disabled>Pilih Periode...</option>
                {periodes.map(p => ( <option key={p.id} value={p.id}>{p.nama}</option> ))}
              </select>
              <div className="absolute right-3 pointer-events-none text-blue-400">
                <Calendar size={18} />
              </div>
              
              {canManagePeriode && selectedPeriode && (
                <div className="flex gap-1">
                  <button onClick={handleOpenEdit} className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-200 rounded-2xl transition-all shadow-sm"><Pencil size={18} /></button>
                  <button onClick={() => setDeletePeriodeId(selectedPeriode)} className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-200 rounded-2xl transition-all shadow-sm"><Trash2 size={18} /></button>
                </div>
              )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
             {selectedPeriode && (
               <Button variant="secondary" onClick={() => setIsPrintPreviewOpen(true)} icon={<Printer size={18} />} className="flex-1 sm:flex-none py-3 rounded-2xl border-gray-200">Cetak</Button>
             )}
             {canManagePeriode && (
               <Button onClick={handleOpenAdd} icon={<Plus size={20} />} className="flex-1 sm:flex-none py-3 rounded-2xl shadow-lg shadow-primary/20">Periode Baru</Button>
             )}
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner />}

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block no-print">
        {!loading && selectedPeriode && sortedDivisions.map(divisi => (
          <Card key={divisi} className="mb-8 border border-gray-100 shadow-xl shadow-blue-900/5 rounded-[2rem] overflow-hidden">
             <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-8 bg-primary rounded-full"></div>
                   <h3 className="font-black text-gray-800 text-base uppercase tracking-widest">{divisi}</h3>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Status Divisi</span>
                   <span className="px-4 py-1.5 bg-white border border-gray-100 rounded-full text-xs font-black text-primary shadow-sm">
                      {groupedData[divisi].length} Personil
                   </span>
                </div>
             </div>
             
             <div className="overflow-x-auto relative custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                   <thead>
                      <tr className="bg-gray-50/30 text-gray-400 border-b border-gray-50">
                         <th className="p-5 w-16 text-center font-black uppercase text-[10px] tracking-widest sticky left-0 bg-white z-30 border-r border-gray-50">No</th>
                         <th className="p-5 min-w-[280px] font-black uppercase text-[10px] tracking-widest sticky left-16 bg-white z-30 border-r border-gray-50">Nama Lengkap Karyawan</th>
                         {calendarDates.map((date, i) => (
                            <th key={i} className={`p-3 min-w-[65px] text-center border-l border-gray-50 ${isDateToday(date) ? 'bg-blue-50/80 text-blue-700' : ''}`}>
                               <div className="text-[9px] font-black uppercase opacity-60 mb-0.5">{getDayName(date)}</div>
                               <div className="text-xs font-black">{formatDateShort(date)}</div>
                            </th>
                         ))}
                         <th className="p-5 text-center font-black uppercase text-[10px] tracking-widest sticky right-0 bg-white z-20 border-l border-gray-100 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">Total</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {groupedData[divisi].map((record, idx) => (
                        <tr key={record.id} className="group hover:bg-blue-50/20 transition-all duration-300">
                           <td className="p-5 text-center sticky left-0 bg-white group-hover:bg-blue-50/50 z-20 border-r border-gray-50 font-mono font-bold text-gray-400">{idx + 1}</td>
                           <td className="p-5 sticky left-16 bg-white group-hover:bg-blue-50/50 z-20 border-r border-gray-50">
                              <div className="flex items-center gap-3">
                                 <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-black text-xs border border-white shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                    {record.namaKaryawan.charAt(0)}
                                 </div>
                                 <span className="font-bold text-gray-700 tracking-tight">{record.namaKaryawan}</span>
                              </div>
                           </td>
                           {calendarDates.map((date, i) => (
                             <td 
                               key={i} 
                               className={`p-0 text-center border-l border-gray-50 relative cursor-pointer transition-all ${record.hari[i+1] ? 'bg-emerald-50/30' : 'hover:bg-gray-100/50'} ${isDateToday(date) ? 'ring-2 ring-inset ring-blue-400/20' : ''}`}
                               onClick={() => handleCellClick(record.id, i + 1, date)}
                             >
                                <div className="h-16 w-full flex items-center justify-center">
                                   {renderCellVisuals(record, i + 1, date)}
                                </div>
                             </td>
                           ))}
                           <td className="p-5 text-center sticky right-0 bg-white group-hover:bg-blue-50/50 z-10 border-l border-gray-100 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">
                              <span className="text-lg font-black text-primary drop-shadow-sm">{record.totalHadir}</span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </Card>
        ))}
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="lg:hidden space-y-8 no-print px-1">
         {!loading && selectedPeriode && sortedDivisions.map(divisi => (
           <div key={divisi} className="space-y-4">
              <div className="flex items-center justify-between px-3">
                 <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
                    <LayoutList size={14} className="text-primary"/> {divisi}
                 </h3>
                 <span className="text-[10px] font-black bg-white border border-gray-100 text-primary px-3 py-1 rounded-full shadow-sm">
                    {groupedData[divisi].length} Org
                 </span>
              </div>
              <div className="space-y-4">
                 {groupedData[divisi].map((record) => (
                    <div key={record.id} className="bg-white rounded-[2rem] p-6 shadow-xl shadow-blue-900/5 border border-gray-100">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 font-black border border-white shadow-sm">{record.namaKaryawan.charAt(0)}</div>
                             <div>
                                <h4 className="font-black text-gray-800 leading-tight">{record.namaKaryawan}</h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">{record.divisi}</p>
                             </div>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-2xl font-black text-primary">{record.totalHadir}</span>
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hadir</span>
                          </div>
                       </div>
                       <div className="grid grid-cols-7 gap-1.5">
                          {calendarDates.map((date, i) => (
                             <button 
                                key={i} 
                                onClick={() => handleCellClick(record.id, i + 1, date)}
                                className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all ${record.hari[i+1] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50/50 border-gray-100 text-gray-400'} ${isDateToday(date) ? 'ring-4 ring-blue-100 border-blue-400 z-10' : ''}`}
                             >
                                <span className="text-[7px] uppercase font-black tracking-widest mb-0.5">{getDayName(date)}</span>
                                <span className="text-xs font-black">{date.getDate()}</span>
                                {record.hari[i+1] && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shadow-sm shadow-emerald-200"></div>}
                             </button>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
         ))}
      </div>

      {/* ABSEN MODAL (CAMERA & DETAIL) */}
      <Modal isOpen={isAbsenModalOpen} onClose={() => setIsAbsenModalOpen(false)} title="Bukti Kehadiran Karyawan">
         {modalData && (
           <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] flex items-center gap-5 shadow-xl shadow-blue-900/10 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-black text-2xl border border-white/20 shadow-inner shrink-0 uppercase">
                    {modalData.rec.namaKaryawan.charAt(0)}
                 </div>
                 <div className="relative z-10">
                    <h4 className="font-black text-xl tracking-tight leading-tight">{modalData.rec.namaKaryawan}</h4>
                    <div className="flex items-center gap-2 mt-2 text-blue-100">
                       <Calendar size={14} className="text-yellow-400" />
                       <span className="text-xs font-black uppercase tracking-widest">{getFullDateLabel(modalData.date)}</span>
                    </div>
                 </div>
              </div>

              {!cameraActive ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                     {/* IN PANEL */}
                     <div className={`p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden ${modalData.detail?.jamMasuk ? 'border-emerald-100 bg-emerald-50/30' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <LogIn size={20} className={modalData.detail?.jamMasuk ? 'text-emerald-600' : 'text-gray-400'} />
                              <span className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500">Absen Masuk</span>
                           </div>
                           {modalData.detail?.jamMasuk && <CheckCircle size={18} className="text-emerald-500" />}
                        </div>
                        {modalData.detail?.jamMasuk ? (
                          <div className="space-y-4">
                             <div className="text-3xl font-black text-emerald-800 font-mono tracking-widest">{modalData.detail.jamMasuk}</div>
                             {modalData.detail.fotoMasuk && (
                               <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white group">
                                  <img src={modalData.detail.fotoMasuk} alt="Masuk" className="w-full h-40 object-cover" />
                                  <button onClick={() => startCamera('MASUK')} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold gap-2">
                                     <RefreshCw size={20}/> Retake
                                  </button>
                               </div>
                             )}
                          </div>
                        ) : (
                          <button onClick={() => startCamera('MASUK')} className="w-full py-10 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all rounded-2xl">
                             <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100"><Camera size={28} /></div>
                             <span className="text-[10px] font-black uppercase tracking-widest">Ambil Foto Masuk</span>
                          </button>
                        )}
                     </div>

                     {/* OUT PANEL */}
                     <div className={`p-6 rounded-[2rem] border-2 transition-all relative overflow-hidden ${modalData.detail?.jamPulang ? 'border-orange-100 bg-orange-50/30' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <LogOut size={20} className={modalData.detail?.jamPulang ? 'text-orange-600' : 'text-gray-400'} />
                              <span className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500">Absen Pulang</span>
                           </div>
                           {modalData.detail?.jamPulang && <CheckCircle size={18} className="text-orange-500" />}
                        </div>
                        {modalData.detail?.jamPulang ? (
                          <div className="space-y-4">
                             <div className="text-3xl font-black text-orange-800 font-mono tracking-widest">{modalData.detail.jamPulang}</div>
                             {modalData.detail.fotoPulang && (
                               <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white group">
                                  <img src={modalData.detail.fotoPulang} alt="Pulang" className="w-full h-40 object-cover" />
                                  <button onClick={() => startCamera('PULANG')} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold gap-2">
                                     <RefreshCw size={20}/> Retake
                                  </button>
                               </div>
                             )}
                          </div>
                        ) : (
                          !modalData.detail?.jamMasuk ? (
                            <div className="w-full py-10 flex flex-col items-center justify-center gap-3 text-gray-300 bg-gray-100/50 rounded-2xl border-gray-200">
                               <div className="w-14 h-14 bg-white/50 rounded-full flex items-center justify-center border border-gray-100"><Lock size={28} /></div>
                               <span className="text-[10px] font-black uppercase tracking-widest text-center px-4 leading-relaxed">Isi Masuk<br/>Dahulu</span>
                            </div>
                          ) : (
                            <button onClick={() => startCamera('PULANG')} className="w-full py-10 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all rounded-2xl">
                               <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100"><Camera size={28} /></div>
                               <span className="text-[10px] font-black uppercase tracking-widest">Ambil Foto Pulang</span>
                            </button>
                          )
                        )}
                     </div>
                  </div>

                  {!isKoordinator && (
                    <div className="pt-6 border-t border-gray-100">
                       <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 hover:border-primary/20 transition-all cursor-pointer">
                          <div>
                             <h5 className="font-black text-gray-800 text-sm flex items-center gap-2"><History size={16} className="text-primary"/> Status Manual</h5>
                             <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">Override kehadiran tanpa foto</p>
                          </div>
                          <div className="relative inline-block w-14 h-7 transition duration-200 ease-in-out rounded-full border-2 border-gray-200 bg-gray-200 has-[:checked]:bg-emerald-500 has-[:checked]:border-emerald-600">
                             <input 
                                type="checkbox" 
                                className="opacity-0 w-0 h-0 peer" 
                                checked={modalData.isChecked} 
                                onChange={(e) => handleManualToggle(e.target.checked)} 
                             />
                             <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 peer-checked:left-7 shadow-md"></span>
                          </div>
                       </div>
                    </div>
                  )}
                </>
              ) : (
                /* FULL SCREEN CAMERA UI */
                <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-[3/4] sm:aspect-video flex flex-col shadow-2xl border-8 border-white">
                   <video ref={videoRef} autoPlay playsInline muted className={`flex-1 object-cover w-full h-full ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}></video>
                   
                   <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center z-10">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/20"><Camera size={20} className="animate-pulse" /></div>
                         <span className="font-black text-white text-xs uppercase tracking-widest">Ambil {cameraActive}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={toggleCamera} className="bg-white/10 p-3 rounded-full backdrop-blur-xl hover:bg-white/30 border border-white/20 text-white transition-all"><RefreshCw size={24} /></button>
                        <button onClick={stopCamera} className="bg-white/10 p-3 rounded-full backdrop-blur-xl hover:bg-red-500 border border-white/20 text-white transition-all"><XCircle size={24} /></button>
                      </div>
                   </div>

                   <div className="absolute bottom-0 left-0 w-full p-10 bg-gradient-to-t from-black/80 to-transparent flex justify-center z-10">
                      <button onClick={capturePhoto} className="group relative w-20 h-20">
                         <div className="absolute inset-0 bg-white/30 rounded-full animate-ping group-active:scale-90"></div>
                         <div className="absolute inset-0 bg-white rounded-full border-4 border-slate-900 shadow-2xl group-active:scale-95 transition-transform flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full border-2 border-slate-900/10"></div>
                         </div>
                      </button>
                   </div>
                   
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-white/30 border-dashed rounded-[3rem] pointer-events-none hidden sm:block"></div>
                </div>
              )}
           </div>
         )}
      </Modal>

      {/* PERIODE MODALS */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPeriodeId ? "Sesuaikan Konfigurasi Periode" : "Buat Periode Absensi Baru"}>
        <div className="space-y-5">
           <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 items-start border border-blue-100">
              <Info size={18} className="text-blue-600 mt-1" />
              <p className="text-xs text-blue-800 font-medium leading-relaxed">Periode absensi akan digunakan untuk mencatat kehadiran selama 14 hari kerja berturut-turut.</p>
           </div>
           <Input label="Label Nama Periode" placeholder="Contoh: Periode 1 Januari 2025" value={newPeriodeName} onChange={e => setNewPeriodeName(e.target.value)} />
           <Input label="Tanggal Mulai (Hari ke-1)" type="date" value={newPeriodeDate} onChange={e => setNewPeriodeDate(e.target.value)} />
           <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="rounded-xl px-6">Batal</Button>
              <Button onClick={handleSavePeriode} isLoading={loading} className="rounded-xl px-8 shadow-lg shadow-primary/20">Simpan Periode</Button>
           </div>
        </div>
      </Modal>

      <ConfirmationModal 
         isOpen={!!deletePeriodeId} 
         onClose={() => setDeletePeriodeId(null)} 
         onConfirm={handleDeletePeriode} 
         title="Hapus Seluruh Data Periode?" 
         message="Tindakan ini akan menghapus semua rekaman kehadiran, jam kerja, dan foto bukti permanen dari database. Data tidak dapat dipulihkan." 
         isLoading={loading} 
      />

      {/* PRINT PREVIEW DIALOG */}
      <PrintPreviewDialog isOpen={isPrintPreviewOpen} onClose={() => setIsPrintPreviewOpen(false)} title="Laporan Resmi Absensi Karyawan" filename={printFilename}>
        <style>{`
           @media print {
              .print-container { padding: 0 !important; }
              .division-block { page-break-inside: avoid; border: 1px solid #ddd; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; font-size: 10px; }
              th, td { border: 1px solid #000; padding: 4px; text-align: center; }
              .name-cell { text-align: left; padding-left: 8px; width: 220px; }
              .total-cell { font-weight: bold; background: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
           }
        `}</style>
        
        <div className="print-container">
           {/* Report Header */}
           <div className="flex flex-col items-center text-center mb-10 border-b-4 border-double border-black pb-6">
              <div className="flex items-center gap-4 mb-2">
                 <Logo className="w-20 h-20" />
                 <div className="text-center">
                    <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-black">SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)</h1>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-600 mt-1">DESA TALES SETONO - KECAMATAN NGADILUWIH</p>
                 </div>
              </div>
           </div>

           <div className="text-center mb-8">
              <h2 className="text-xl font-black underline uppercase tracking-widest decoration-2 underline-offset-4 text-black">LAPORAN REKAPITULASI ABSENSI</h2>
              <div className="mt-2 text-sm font-bold text-gray-700 uppercase">
                 PERIODE: {currentPeriodeObj?.nama} ({calendarDates.length > 0 ? `${formatDateShort(calendarDates[0])} - ${formatDateShort(calendarDates[calendarDates.length-1])}` : ''})
              </div>
              <p className="text-xs text-gray-500 mt-1 uppercase font-medium">Unit Kerja: {isKoordinator ? currentUser?.jabatanDivisi : 'Seluruh Divisi SPPG'}</p>
           </div>

           {sortedDivisions.map(divisi => (
             <div key={divisi} className="division-block mb-10 overflow-hidden">
                <div className="bg-gray-100 px-4 py-1.5 font-bold text-[10px] border border-black border-b-0 inline-block uppercase tracking-widest text-black">DIVISI: {divisi}</div>
                <table className="w-full border-collapse border border-black text-[10px]">
                   <thead>
                      <tr className="bg-gray-200">
                         <th className="border border-black p-1.5 w-10 text-center font-bold text-black">NO</th>
                         <th className="border border-black p-1.5 text-left pl-3 font-bold text-black">NAMA LENGKAP</th>
                         {calendarDates.map((date, i) => (
                            <th key={i} className="border border-black p-1 w-8 text-center font-bold text-black">
                               <div className="text-[8px] uppercase">{getDayName(date)}</div>
                               <div>{date.getDate()}</div>
                            </th>
                         ))}
                         <th className="border border-black p-1.5 w-12 text-center font-bold text-black">TOTAL</th>
                      </tr>
                   </thead>
                   <tbody>
                      {groupedData[divisi].map((record, idx) => (
                        <tr key={record.id} className="h-8">
                           <td className="border border-black text-center font-bold text-black">{idx + 1}</td>
                           <td className="border border-black text-left pl-3 font-bold uppercase text-black">{record.namaKaryawan}</td>
                           {calendarDates.map((_, i) => (
                             <td key={i} className="border border-black text-center font-bold text-black">
                                {record.hari[i+1] ? 'v' : ''}
                             </td>
                           ))}
                           <td className="border border-black text-center font-black bg-gray-50 text-black">{record.totalHadir}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           ))}

           {/* UPDATED SIGNATURE AREA (OFFICIAL FORMAT) */}
           <div className="mt-12 flex justify-end">
              <div className="text-center min-w-[280px] text-black">
                 <p className="text-sm mb-1">Ngadiluwih, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                 <p className="mb-20 text-sm font-medium">Mengetahui,</p>
                 <div className="w-full">
                    <p className="font-bold underline text-base whitespace-nowrap">Tiurmasi Saulina Sirait, S.T.</p>
                    <p className="text-xs uppercase font-black tracking-widest mt-1">Kepala SPPG</p>
                 </div>
              </div>
           </div>

           <div className="mt-16 pt-4 border-t border-gray-100 text-[8px] text-gray-400 italic flex justify-between no-print">
              <span>Sistem Manajemen Data SIMANDA - Generated {new Date().toLocaleString()}</span>
              <span>Dokumen ini adalah rekapitulasi sah dari sistem absensi digital</span>
           </div>
        </div>
      </PrintPreviewDialog>
    </div>
  );
};
