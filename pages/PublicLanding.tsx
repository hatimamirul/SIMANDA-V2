
import React, { useEffect, useState } from 'react';
import { useNavigate } from '../components/UIComponents';
import { api } from '../services/mockService';
import { DashboardStats } from '../types';
import { 
  LogIn, MapPin, Calendar, Clock, 
  Users, School, Baby, Heart, 
  ArrowRight, Activity, GraduationCap, 
  ChefHat, ChevronRight 
} from 'lucide-react';
import { Logo } from '../components/UIComponents';

// --- COMPONENTS ---

const StatCard = ({ icon, label, value, subtext, color, delay }: { icon: any, label: string, value: number, subtext?: string, color: string, delay: string }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in ${delay} relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-4xl font-extrabold text-gray-800 tracking-tight">{value.toLocaleString('id-ID')}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} text-white shadow-md group-hover:rotate-12 transition-transform`}>
        {icon}
      </div>
    </div>
  </div>
);

const ArticleCard = ({ title, date, excerpt, image, category }: { title: string, date: string, excerpt: string, image: string, category: string }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col h-full">
    <div className="h-48 overflow-hidden relative">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm uppercase tracking-wide">
        {category}
      </div>
    </div>
    <div className="p-6 flex flex-col flex-1">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
        <Calendar size={12} /> {date}
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2 leading-snug group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">{excerpt}</p>
      <button className="text-primary font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all mt-auto">
        Baca Selengkapnya <ArrowRight size={14} />
      </button>
    </div>
  </div>
);

export const PublicLanding: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ 
    karyawan: 0, pmsekolah: 0, pmb3: 0, pmKecil: 0, pmBesar: 0, guru: 0,
    balita: 0, ibuHamil: 0, ibuMenyusui: 0,
    siswaSudahProposal: 0, siswaBelumProposal: 0, guruSudahProposal: 0, guruBelumProposal: 0
  });
  const [time, setTime] = useState(new Date());
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsub = api.subscribeStats(setStats);
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      unsub();
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const totalSiswa = (stats.pmKecil || 0) + (stats.pmBesar || 0);
  const totalPenerimaManfaat = totalSiswa + stats.pmb3;

  // Date Formatting
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dayName = days[time.getDay()];
  const dateStr = `${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`;
  const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800 overflow-x-hidden">
      
      {/* === NAVBAR === */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 md:w-12 md:h-12 drop-shadow-md" />
            <div className="hidden md:block">
              <h1 className={`font-bold text-lg leading-none tracking-tight ${scrolled ? 'text-gray-800' : 'text-white'}`}>SIMANDA SPPG</h1>
              <p className={`text-[10px] font-medium tracking-widest uppercase mt-1 ${scrolled ? 'text-gray-500' : 'text-blue-100'}`}>Badan Gizi Nasional</p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            {/* Realtime Clock (Desktop) */}
            <div className={`hidden md:flex flex-col items-end text-right ${scrolled ? 'text-gray-600' : 'text-white'}`}>
              <div className="text-xs font-medium opacity-90">{dayName}, {dateStr}</div>
              <div className="text-xl font-bold font-mono leading-none tracking-wider">{timeStr}</div>
            </div>

            {/* Login Button */}
            <button 
              onClick={() => navigate('/login')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95
                ${scrolled 
                  ? 'bg-primary text-white hover:bg-blue-700' 
                  : 'bg-white text-primary hover:bg-gray-100'
                }`}
            >
              <LogIn size={18} />
              <span>Login Pengelola</span>
            </button>
          </div>
        </div>
      </nav>

      {/* === HERO SECTION === */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] via-[#2A6F97] to-[#0ea5e9] z-0">
           <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-white opacity-5 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-yellow-400 opacity-10 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2 space-y-6 animate-slide-in-right">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-blue-50 text-xs font-bold uppercase tracking-wider">
              <Activity size={14} className="text-yellow-400" /> Portal Data Terpadu
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">
              Mewujudkan Gizi <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">Generasi Emas</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-lg mx-auto md:mx-0 font-light">
              Sistem Informasi Manajemen Data (SIMANDA) Satuan Pelayanan Pemenuhan Gizi Desa Tales Setono, Kecamatan Ngadiluwih. Transparan, Akurat, Terintegrasi.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
               <button onClick={() => window.scrollTo({top: 800, behavior: 'smooth'})} className="px-8 py-3.5 bg-yellow-400 text-yellow-900 rounded-xl font-bold shadow-lg shadow-yellow-400/20 hover:bg-yellow-300 transition-all flex items-center gap-2">
                 Lihat Statistik <ChevronRight size={18} />
               </button>
               <div className="px-6 py-3.5 rounded-xl border border-white/30 text-white font-medium backdrop-blur-sm flex items-center gap-3">
                  <MapPin size={18} /> Ngadiluwih, Kediri
               </div>
            </div>
          </div>

          {/* Hero Highlight Card */}
          <div className="md:w-[450px] w-full animate-scale-in delay-200">
             <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Heart size={28} strokeWidth={2.5} />
                   </div>
                   <div>
                      <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">Total Penerima Manfaat</p>
                      <h3 className="text-4xl font-black text-white">{totalPenerimaManfaat.toLocaleString('id-ID')}</h3>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-white text-sm flex items-center gap-2"><School size={16}/> Siswa Sekolah</span>
                      <span className="text-white font-bold">{totalSiswa.toLocaleString()}</span>
                   </div>
                   <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-white text-sm flex items-center gap-2"><Baby size={16}/> Penerima B3</span>
                      <span className="text-white font-bold">{stats.pmb3.toLocaleString()}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* === STATS GRID SECTION === */}
      <section className="py-20 max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
              icon={<School size={28} />} 
              label="Total Sekolah" 
              value={stats.pmsekolah} 
              subtext="Tersebar di berbagai desa"
              color="bg-blue-500"
              delay="delay-100"
           />
           <StatCard 
              icon={<Users size={28} />} 
              label="Total Siswa" 
              value={totalSiswa} 
              subtext="Penerima manfaat aktif"
              color="bg-indigo-500"
              delay="delay-200"
           />
           <StatCard 
              icon={<GraduationCap size={28} />} 
              label="Tenaga Pendidik" 
              value={stats.guru} 
              subtext="Guru & Staff sekolah"
              color="bg-purple-500"
              delay="delay-300"
           />
           <StatCard 
              icon={<ChefHat size={28} />} 
              label="Total Karyawan" 
              value={stats.karyawan} 
              subtext="Tim SPPG (Masak, Distribusi, dll)"
              color="bg-orange-500"
              delay="delay-400"
           />
        </div>

        {/* B3 Breakdown Section */}
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-xl border border-gray-100 animate-fade-in delay-500">
           <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <div>
                 <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Baby className="text-pink-500" /> Detail Penerima B3
                 </h3>
                 <p className="text-gray-500 mt-1">Rincian data Balita, Ibu Hamil, dan Ibu Menyusui</p>
              </div>
              <div className="bg-pink-50 px-4 py-2 rounded-lg border border-pink-100 text-pink-700 font-bold">
                 Total: {stats.pmb3.toLocaleString()} Jiwa
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-orange-100 flex items-center gap-4">
                 <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">
                    {stats.balita > 0 ? Math.round((stats.balita / stats.pmb3) * 100) : 0}%
                 </div>
                 <div>
                    <p className="text-gray-500 text-xs font-bold uppercase">Balita</p>
                    <p className="text-2xl font-extrabold text-gray-800">{stats.balita}</p>
                 </div>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-5 rounded-2xl border border-pink-100 flex items-center gap-4">
                 <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-lg">
                    {stats.ibuHamil > 0 ? Math.round((stats.ibuHamil / stats.pmb3) * 100) : 0}%
                 </div>
                 <div>
                    <p className="text-gray-500 text-xs font-bold uppercase">Ibu Hamil</p>
                    <p className="text-2xl font-extrabold text-gray-800">{stats.ibuHamil}</p>
                 </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-lg">
                    {stats.ibuMenyusui > 0 ? Math.round((stats.ibuMenyusui / stats.pmb3) * 100) : 0}%
                 </div>
                 <div>
                    <p className="text-gray-500 text-xs font-bold uppercase">Ibu Menyusui</p>
                    <p className="text-2xl font-extrabold text-gray-800">{stats.ibuMenyusui}</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* === MAP SECTION === */}
      <section className="py-12 bg-white">
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-10">
               <h2 className="text-3xl font-bold text-gray-800 mb-3">Wilayah Jangkauan</h2>
               <p className="text-gray-500 max-w-2xl mx-auto">Melayani pemenuhan gizi untuk masyarakat di wilayah Desa Tales Setono dan sekitarnya.</p>
            </div>
            
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white h-[400px] relative bg-gray-200 group">
               {/* Embed Google Map Iframe (Ngadiluwih Area) */}
               <iframe 
                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63236.43634706596!2d111.96860167520478!3d-7.868779976776999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7850ce2260f065%3A0x4027a76e3532820!2sNgadiluwih%2C%20Kediri%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1709228392811!5m2!1sen!2sid" 
                 width="100%" 
                 height="100%" 
                 style={{border:0}} 
                 allowFullScreen={false} 
                 loading="lazy" 
                 referrerPolicy="no-referrer-when-downgrade"
                 className="grayscale group-hover:grayscale-0 transition-all duration-700"
               ></iframe>
               
               <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-5 py-3 rounded-xl shadow-lg border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Lokasi Pusat</p>
                  <p className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={16} className="text-red-500"/> SPPG Tales Setono</p>
               </div>
            </div>
         </div>
      </section>

      {/* === ARTICLES SECTION === */}
      <section className="py-20 bg-gray-50">
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
               <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Berita & Kegiatan</h2>
                  <p className="text-gray-500">Update terbaru seputar kegiatan pemenuhan gizi.</p>
               </div>
               <button className="text-primary font-semibold hover:text-blue-700 transition-colors">Lihat Semua Berita</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <ArticleCard 
                  title="Penyaluran Makanan Bergizi Tahap 1 Sukses Dilaksanakan"
                  date="15 Desember 2025"
                  category="Kegiatan"
                  image="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  excerpt="Tim SPPG berhasil mendistribusikan lebih dari 500 paket makanan bergizi kepada siswa SD di wilayah Desa Tales."
               />
               <ArticleCard 
                  title="Pentingnya Protein Hewani untuk Mencegah Stunting"
                  date="12 Desember 2025"
                  category="Edukasi"
                  image="https://images.unsplash.com/photo-1607623814075-e51df1bd6562?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  excerpt="Edukasi mengenai pentingnya konsumsi telur dan ikan bagi balita untuk mendukung pertumbuhan optimal."
               />
               <ArticleCard 
                  title="Kunjungan Tim Monitoring Badan Gizi Nasional"
                  date="10 Desember 2025"
                  category="Berita"
                  image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  excerpt="Tim pusat melakukan monitoring dan evaluasi terhadap standar operasional prosedur dapur SPPG Tales Setono."
               />
            </div>
         </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-[#0a2340] text-white pt-16 pb-8 border-t border-blue-900">
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
               <div>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="bg-white p-1 rounded-full"><Logo className="w-8 h-8" /></div>
                     <span className="font-bold text-xl tracking-tight">SIMANDA SPPG</span>
                  </div>
                  <p className="text-blue-200 text-sm leading-relaxed mb-6">
                     Sistem Informasi Manajemen Data untuk mendukung program pemenuhan gizi nasional yang tepat sasaran, transparan, dan akuntabel.
                  </p>
                  <div className="flex gap-4">
                     {/* Social Placeholders */}
                     <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.072 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                     </div>
                  </div>
               </div>

               <div>
                  <h4 className="text-lg font-bold mb-6 text-yellow-400">Kontak Kami</h4>
                  <ul className="space-y-4 text-sm text-blue-100">
                     <li className="flex items-start gap-3">
                        <MapPin size={18} className="mt-0.5 shrink-0" />
                        <span>Desa Tales Setono, Kec. Ngadiluwih,<br/>Kabupaten Kediri, Jawa Timur</span>
                     </li>
                     <li className="flex items-center gap-3">
                        <Clock size={18} className="shrink-0" />
                        <span>Senin - Jumat: 08.00 - 16.00 WIB</span>
                     </li>
                  </ul>
               </div>

               <div>
                  <h4 className="text-lg font-bold mb-6 text-yellow-400">Tautan Cepat</h4>
                  <ul className="space-y-3 text-sm text-blue-100">
                     <li><a href="#" className="hover:text-white transition-colors">Badan Gizi Nasional</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Kementerian Kesehatan</a></li>
                     <li><a href="#" className="hover:text-white transition-colors">Kabupaten Kediri</a></li>
                     <li><a href="/login" className="hover:text-white transition-colors">Login Internal</a></li>
                  </ul>
               </div>
            </div>

            <div className="pt-8 border-t border-blue-900/50 text-center text-xs text-blue-400">
               <p>&copy; 2025 SIMANDA SPPG - Sistem Manajemen Data Satuan Pelayanan Pemenuhan Gizi.</p>
            </div>
         </div>
      </footer>
    </div>
  );
};
