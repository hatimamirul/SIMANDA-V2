import React, { useEffect, useState } from 'react';
import { Archive, CalendarDays, ImagePlus, Save, UtensilsCrossed } from 'lucide-react';
import { Card } from '../components/UIComponents';
import { NilaiGiziMenu } from '../types';
import { api } from '../services/mockService';

type PortionType = 'PORSI_BESAR' | 'PORSI_KECIL' | 'BALITA' | 'BUMIL_BUSUI';
type NutrientField = 'karbohidrat' | 'protein' | 'serat' | 'energi' | 'lemak';

type PortionForm = {
  jenisPorsi: PortionType;
  label: string;
  gambarMenu: string;
  namaMenu: string;
  karbohidrat: string;
  protein: string;
  serat: string;
  energi: string;
  lemak: string;
};

const createPortions = (): PortionForm[] => [
  { jenisPorsi: 'PORSI_BESAR', label: 'Menu Porsi Besar', gambarMenu: '', namaMenu: '', karbohidrat: '', protein: '', serat: '', energi: '', lemak: '' },
  { jenisPorsi: 'PORSI_KECIL', label: 'Menu Porsi Kecil', gambarMenu: '', namaMenu: '', karbohidrat: '', protein: '', serat: '', energi: '', lemak: '' },
  { jenisPorsi: 'BALITA', label: 'Menu Balita', gambarMenu: '', namaMenu: '', karbohidrat: '', protein: '', serat: '', energi: '', lemak: '' },
  { jenisPorsi: 'BUMIL_BUSUI', label: 'Menu Bumil dan Busui', gambarMenu: '', namaMenu: '', karbohidrat: '', protein: '', serat: '', energi: '', lemak: '' },
];

const nutrientInputs: { field: NutrientField; label: string; unit: string }[] = [
  { field: 'karbohidrat', label: 'Karbohidrat', unit: 'g' },
  { field: 'protein', label: 'Protein', unit: 'g' },
  { field: 'serat', label: 'Serat', unit: 'g' },
  { field: 'energi', label: 'Energi', unit: 'kkal' },
  { field: 'lemak', label: 'Lemak', unit: 'g' },
];

const formatProductionDay = (date: string) => {
  if (!date) return 'Pilih tanggal produksi untuk menampilkan hari.';
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${date}T00:00:00`));
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex gap-3 mb-5">
    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">{icon}</div>
    <div>
      <h2 className="font-bold text-gray-800">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

const MenuImageUploader: React.FC<{ label: string; value: string; onChange: (file?: File) => void }> = ({ label, value, onChange }) => (
  <label className="group block rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
    <input className="sr-only" type="file" accept="image/*" required onChange={(event) => onChange(event.target.files?.[0])} />
    <div className="relative overflow-hidden rounded-xl border border-dashed border-gray-200 bg-slate-50">
      {value ? (
        <>
          <img src={value} alt={label} className="h-52 w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pt-10 pb-3 text-sm font-semibold text-white">{label}</div>
        </>
      ) : (
        <div className="h-52 flex flex-col items-center justify-center text-center px-5 text-gray-400">
          <div className="w-12 h-12 mb-3 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-primary"><ImagePlus size={24} /></div>
          <span className="font-semibold text-gray-600">Belum ada gambar menu</span>
          <span className="mt-1 text-xs">Pilih gambar untuk {label.toLowerCase()}</span>
        </div>
      )}
    </div>
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-700">{value ? 'Gambar sudah dipilih' : label}</p>
        <p className="mt-0.5 text-xs text-gray-500">JPG, PNG, WEBP · Maks. 5 MB</p>
      </div>
      <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">Pilih atau Ganti Gambar</span>
    </div>
  </label>
);

export const DataNilaiGiziPage: React.FC = () => {
  const [tanggalProduksi, setTanggalProduksi] = useState('');
  const [tanggalBatasDikonsumsi, setTanggalBatasDikonsumsi] = useState('');
  const [jamBatasDikonsumsi, setJamBatasDikonsumsi] = useState('');
  const [portions, setPortions] = useState<PortionForm[]>(createPortions);
  const [records, setRecords] = useState<NilaiGiziMenu[]>([]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [error, setError] = useState('');

  useEffect(() => api.subscribeNilaiGizi(setRecords), []);

  const updatePortion = (index: number, field: keyof PortionForm, value: string) => {
    setPortions(current => current.map((portion, itemIndex) => itemIndex === index ? { ...portion, [field]: value } : portion));
  };

  const handleImageChange = (index: number, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updatePortion(index, 'gambarMenu', String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const batasDikonsumsi = `${tanggalBatasDikonsumsi}T${jamBatasDikonsumsi}`;
    const mulaiProduksi = `${tanggalProduksi}T00:00`;

    if (batasDikonsumsi < mulaiProduksi) {
      setError('Batas dikonsumsi tidak boleh lebih awal dari tanggal produksi.');
      return;
    }

    setStatus('saving');
    try {
      await api.saveNilaiGizi({
        id: `nilai-gizi-${Date.now()}`,
        tanggalProduksi,
        batasDikonsumsi,
        porsiMenus: portions.map(({ label: _label, ...portion }) => ({
          ...portion,
          karbohidrat: Number(portion.karbohidrat),
          protein: Number(portion.protein),
          serat: Number(portion.serat),
          energi: Number(portion.energi),
          lemak: Number(portion.lemak),
        })),
        createdAt: new Date().toISOString(),
      });
      setTanggalProduksi('');
      setTanggalBatasDikonsumsi('');
      setJamBatasDikonsumsi('');
      setPortions(createPortions());
      setStatus('success');
      window.setTimeout(() => setStatus('idle'), 3500);
    } catch {
      setError('Data belum dapat disimpan. Periksa koneksi Firebase dan izin aksesnya.');
      setStatus('idle');
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Data Nilai Gizi</h1>
          <p className="text-gray-500 mt-1">Setiap kelompok porsi memiliki gambar, nama menu, dan nilai gizi tersendiri.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start md:self-auto px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold">
          <UtensilsCrossed size={18} /> {records.length} data tersimpan
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 md:p-7">
          <SectionTitle icon={<CalendarDays size={20} />} title="Jadwal Produksi dan Konsumsi" description="Informasi ini berlaku bersama untuk keempat jenis porsi menu." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label>
              <span className="text-sm font-semibold text-gray-700">Hari dan Tanggal Produksi</span>
              <input required type="date" value={tanggalProduksi} onChange={(event) => setTanggalProduksi(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
              <p className="mt-2 text-sm text-primary font-medium">{formatProductionDay(tanggalProduksi)}</p>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="text-sm font-semibold text-gray-700">Batas Dikonsumsi</span>
                <input required min={tanggalProduksi || undefined} type="date" value={tanggalBatasDikonsumsi} onChange={(event) => setTanggalBatasDikonsumsi(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </label>
              <label>
                <span className="text-sm font-semibold text-gray-700">Jam Batas Konsumsi</span>
                <input required type="time" value={jamBatasDikonsumsi} onChange={(event) => setJamBatasDikonsumsi(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
              </label>
              <p className="col-span-2 text-sm text-gray-500">Tanggal dan jam terakhir menu layak dikonsumsi.</p>
            </div>
          </div>
        </Card>

        {portions.map((portion, index) => (
          <Card key={portion.jenisPorsi} className="p-5 md:p-7">
            <SectionTitle icon={<ImagePlus size={20} />} title={portion.label} description="Isi dokumentasi gambar, nama menu, dan kandungan gizi khusus untuk porsi ini." />
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
              <MenuImageUploader label={portion.label} value={portion.gambarMenu} onChange={(file) => handleImageChange(index, file)} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
                <label className="md:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">Nama Menu</span>
                  <input required value={portion.namaMenu} onChange={(event) => updatePortion(index, 'namaMenu', event.target.value)} placeholder="Contoh: Nasi, ayam bumbu kuning, sayur wortel" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
                </label>
                {nutrientInputs.map(({ field, label, unit }) => (
                  <label key={field}>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                    <div className="relative mt-2">
                      <input required min="0" step="0.01" type="number" value={portion[field]} onChange={(event) => updatePortion(index, field, event.target.value)} placeholder="0" className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-16 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
                      <span className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-400">{unit}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {status === 'success' && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">Data nilai gizi berhasil disimpan.</div>}

        <div className="flex justify-end">
          <button disabled={status === 'saving'} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-lg shadow-primary/20 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70">
            <Save size={18} /> {status === 'saving' ? 'Menyimpan...' : 'Simpan Data Nilai Gizi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const ArsipMenuHarianPage: React.FC = () => {
  const [records, setRecords] = useState<NilaiGiziMenu[]>([]);
  const [tanggalFilter, setTanggalFilter] = useState('');

  useEffect(() => api.subscribeNilaiGizi(setRecords), []);

  const filteredRecords = records
    .filter(item => !tanggalFilter || item.tanggalProduksi === tanggalFilter)
    .sort((a, b) => b.tanggalProduksi.localeCompare(a.tanggalProduksi));

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Arsip Menu Harian</h1>
          <p className="mt-1 text-gray-500">Arsip menyimpan maksimal 20 data menu terbaru berdasarkan tanggal produksi.</p>
        </div>
        <div className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary">{records.length}/20 menu tersimpan</div>
      </div>

      <Card className="p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
          <label className="max-w-md">
            <span className="text-sm font-semibold text-gray-700">Filter Tanggal Produksi</span>
            <input type="date" value={tanggalFilter} onChange={(event) => setTanggalFilter(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
          </label>
          {tanggalFilter && <button type="button" onClick={() => setTanggalFilter('')} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">Tampilkan Semua</button>}
        </div>
      </Card>

      {filteredRecords.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-5 text-primary"><Archive size={32} /></div>
          <h2 className="text-xl font-bold text-gray-800">Tidak ada menu untuk tanggal produksi ini</h2>
          <p className="mt-2 max-w-md text-gray-500">Simpan data dari submenu Data Nilai Gizi atau pilih tanggal produksi yang lain.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredRecords.map(record => (
            <Card key={record.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-gray-100 bg-slate-50/80 px-5 py-4 md:px-6">
                <div>
                  <p className="font-bold text-gray-800">Produksi: {formatProductionDay(record.tanggalProduksi)}</p>
                  <p className="mt-1 text-sm text-gray-500">Batas dikonsumsi: {record.batasDikonsumsi.replace('T', ' · ')} WIB</p>
                </div>
                <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-primary shadow-sm">{record.porsiMenus.length} jenis porsi</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-5 md:p-6">
                {record.porsiMenus.map(porsi => (
                  <div key={porsi.jenisPorsi} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <img src={porsi.gambarMenu} alt={porsi.namaMenu} className="h-40 w-full object-cover bg-slate-100" />
                    <div className="p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">{porsi.jenisPorsi.replaceAll('_', ' ')}</p>
                      <h3 className="mt-1 font-bold text-gray-800 line-clamp-2">{porsi.namaMenu}</h3>
                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>Karbo: {porsi.karbohidrat} g</span><span>Protein: {porsi.protein} g</span>
                        <span>Serat: {porsi.serat} g</span><span>Energi: {porsi.energi} kkal</span>
                        <span>Lemak: {porsi.lemak} g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
