import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock3, ExternalLink, Heart, Instagram, Loader2, Maximize2, Music2, ShieldCheck, UtensilsCrossed, X } from 'lucide-react';
import { NilaiGiziMenu } from '../types';
import { api } from '../services/mockService';

const toLocalDateInput = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const formatDate = (date: string) => new Intl.DateTimeFormat('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date(`${date}T00:00:00`));

export const PublicDailyMenu: React.FC = () => {
  const [records, setRecords] = useState<NilaiGiziMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState<{ src: string; label: string } | null>(null);
  const today = toLocalDateInput(now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = api.subscribeNilaiGizi((data) => {
      setRecords(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const dailyRecords = useMemo(() => records
    .filter(item => item.tanggalProduksi === today && item.status !== 'DRAFT')
    .sort((a, b) => b.createdAt?.localeCompare(a.createdAt || '') || 0), [records, today]);

  const currentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#eaf7ff] via-slate-50 to-white text-slate-800">
      <header className="border-b border-white/70 bg-white/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">SIMANDA SPPG</p>
            <p className="text-sm font-semibold text-slate-600">SPPG KEDIRI NGADILUWIH TALES</p>
          </div>
          <div className="flex items-center gap-2 text-right">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span>
            <div>
              <p className="text-xs font-semibold text-slate-500">Waktu saat ini</p>
              <p className="font-mono text-lg font-black tracking-wider text-primary">{currentTime} WIB</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-[#2778a7] to-[#104d74] px-6 py-10 text-white shadow-xl md:px-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <UtensilsCrossed aria-hidden="true" size={190} strokeWidth={0.8} className="absolute -bottom-12 -right-8 text-white/[0.08]" />
          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider"><Heart size={14} className="text-yellow-300" /> SPPG Kediri Ngadiluwih Tales</div>
            <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">Menu Hari Ini</h1>
            <p className="mt-2 text-lg font-semibold text-blue-50 md:text-2xl">{formatDate(today)}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm md:text-base">
              <span className="inline-flex items-center gap-2 rounded-xl bg-black/15 px-3 py-2"><CalendarDays size={18} /> Ditampilkan sesuai hari saat ini</span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-black/15 px-3 py-2"><Clock3 size={18} /> Data diperbarui real-time</span>
            </div>
          </div>
        </div>

        <aside role="alert" className="mt-6 overflow-hidden rounded-[1.5rem] border-2 border-amber-300 bg-amber-50 shadow-md shadow-amber-100/60">
          <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-100/70 px-5 py-4">
            <div className="rounded-xl bg-amber-500 p-2 text-white shadow-sm"><AlertTriangle size={20} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-amber-950">Perhatian untuk Penerima Manfaat</h2><span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black tracking-wider text-white">WAJIB DIPERHATIKAN</span></div>
              <p className="mt-1 text-sm font-semibold text-amber-900">Harap dibaca sebelum menerima dan mengonsumsi makanan.</p>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            <div className="flex items-start gap-3 rounded-2xl bg-white/85 p-4 ring-1 ring-amber-100">
              <span className="mt-0.5 rounded-lg bg-rose-100 p-2 text-rose-700"><AlertTriangle size={18} /></span>
              <div><p className="font-bold text-slate-800">DILARANG MEMBAWA PULANG MAKANAN</p><p className="mt-1 text-sm leading-relaxed text-slate-600">Menu diberikan untuk dikonsumsi sesuai ketentuan layanan SPPG.</p></div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-white/85 p-4 ring-1 ring-amber-100">
              <span className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-700"><ShieldCheck size={18} /></span>
              <div><p className="font-bold text-slate-800">HARAP SEGERA DIKONSUMSI SETELAH DITERIMA</p><p className="mt-1 text-sm leading-relaxed text-slate-600">Konsumsi menu sebelum batas waktu yang tercantum demi menjaga kualitas makanan.</p></div>
            </div>
          </div>
        </aside>

        {isLoading ? (
          <div className="flex flex-col items-center py-24 text-primary"><Loader2 size={36} className="animate-spin" /><p className="mt-4 font-medium">Memuat informasi menu hari ini...</p></div>
        ) : dailyRecords.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UtensilsCrossed size={32} /></div>
            <h2 className="mt-5 text-xl font-bold text-slate-800">Data belum di-share oleh SPPG</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-500">Belum ada menu untuk {formatDate(today)}. Informasi akan muncul otomatis setelah SPPG menyimpan dan membagikan data menu hari ini.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {dailyRecords.map(record => (
              <section key={record.id} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-lg shadow-slate-200/40">
                <div className="border-b border-slate-100 bg-slate-50 p-5 md:p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" /><p className="text-sm font-black text-slate-800">Informasi Penting</p></div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 shadow-sm">WAJIB DIPERHATIKAN</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-blue-700">Tanggal Hari Produksi</p>
                    <p className="mt-2 text-lg font-bold text-slate-800">{formatDate(record.tanggalProduksi)}</p>
                    <p className="mt-1 text-sm text-slate-500">Menu ini diproduksi pada tanggal tersebut.</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-amber-800">Batas Waktu Dikonsumsi</p>
                    {(() => {
                      const [deadlineDate, deadlineTime] = record.batasDikonsumsi.split('T');
                      return (
                        <div className="mt-3 flex items-center gap-3 text-amber-950">
                          <div className="rounded-xl border border-blue-200 bg-blue-100 px-3 py-2 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Tanggal Batas</p><p className="mt-1 text-lg font-black text-blue-700">{deadlineDate}</p></div>
                          <span aria-hidden="true" className="h-10 w-px bg-amber-300" />
                          <div className="rounded-xl border border-rose-200 bg-rose-100 px-3 py-2 shadow-sm"><p className="text-[10px] font-black uppercase tracking-wider text-rose-700">Jam Batas</p><p className="mt-1 text-2xl font-black tracking-tight text-rose-700">{deadlineTime} WIB</p></div>
                        </div>
                      );
                    })()}
                    <p className="mt-1 text-sm font-medium text-amber-800">Mohon konsumsi sebelum batas waktu ini.</p>
                  </div>
                </div>
                </div>
                <div className="border-b border-slate-100 px-5 py-3 md:px-7 sm:hidden">
                  <p className="text-xs font-semibold text-slate-500">Geser untuk melihat semua porsi <span className="ml-1 text-primary">→</span></p>
                </div>
                <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-5 sm:py-5 xl:grid-cols-4 md:px-7 md:py-7">
                  {record.porsiMenus.map(porsi => (
                    <article key={porsi.jenisPorsi} className="min-w-[84%] snap-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:min-w-0">
                      <button type="button" onClick={() => setSelectedImage({ src: porsi.gambarMenu, label: `${porsi.jenisPorsi.replaceAll('_', ' ')} — ${porsi.namaMenu}` })} className="group relative block w-full overflow-hidden bg-slate-100 text-left" aria-label={`Perbesar gambar ${porsi.namaMenu}`}>
                        <img src={porsi.gambarMenu} alt={porsi.namaMenu} className="h-52 w-full object-cover transition duration-300 group-hover:scale-105" />
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/45 group-hover:opacity-100"><span className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold backdrop-blur"><Maximize2 size={17} /> Perbesar Gambar</span></span>
                      </button>
                      <div className="p-5">
                        <p className="text-xs font-black uppercase tracking-wider text-primary">{porsi.jenisPorsi.replaceAll('_', ' ')}</p>
                        <h2 className="mt-2 min-h-12 text-lg font-bold leading-snug text-slate-800">{porsi.namaMenu}</h2>
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                          <span>Karbohidrat: <b>{porsi.karbohidrat} g</b></span><span>Protein: <b>{porsi.protein} g</b></span>
                          <span>Serat: <b>{porsi.serat} g</b></span><span>Energi: <b>{porsi.energi} kkal</b></span>
                          <span>Lemak: <b>{porsi.lemak} g</b></span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-xs leading-relaxed text-slate-500">
          <p>Menu harian juga dapat dilihat melalui <a href="https://www.bgn.go.id/radar-mbg" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-primary underline decoration-primary/40 underline-offset-2 hover:text-[#104d74]">Radar MBG Badan Gizi Nasional <ExternalLink size={12} /></a></p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"><span className="font-semibold text-slate-600">Ikuti informasi kami</span><span className="inline-flex items-center gap-1.5"><Music2 size={13} className="text-slate-700" /> TikTok: Sppg Tales Stono</span><span className="inline-flex items-center gap-1.5"><Instagram size={13} className="text-rose-600" /> Instagram: @Sppg.Tales</span></div>
        </footer>
      </section>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Lihat Foto Penuh" onClick={() => setSelectedImage(null)}>
          <div className="relative max-h-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedImage(null)} className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-2 text-slate-700 shadow-lg hover:bg-slate-100" aria-label="Tutup gambar"><X size={20} /></button>
            <img src={selectedImage.src} alt={selectedImage.label} className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            <p className="mt-3 text-center text-sm font-semibold text-white">Lihat Foto Penuh · {selectedImage.label}</p>
          </div>
        </div>
      )}
    </main>
  );
};
