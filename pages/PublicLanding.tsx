
import React, { useEffect, useState } from 'react';
import { useNavigate } from '../components/UIComponents';
import { api } from '../services/mockService';
import { DashboardStats } from '../types';
import { 
  LogIn, MapPin, Calendar, Clock, 
  Users, School, Baby, Heart, 
  ArrowRight, Activity, GraduationCap, 
  ChefHat, ChevronRight, Instagram, Globe 
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
  
  // Slideshow State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Daftar Foto HD untuk Program MBG
  const heroImages = [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1920&auto=format&fit=crop", // Makanan Sehat (Bowl)
    "https://images.unsplash.com/photo-1576867757603-05b134ebc379?q=80&w=1920&auto=format&fit=crop", // Koki Memasak (Kitchen)
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1920&auto=format&fit=crop", // Bahan Makanan (Nutrition)
    "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=1920&auto=format&fit=crop", // Anak Sekolah (School Lunch)
    "https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=1920&auto=format&fit=crop"  // Bahan Baku Segar
  ];

  useEffect(() => {
    // Realtime Stats Subscription
    const unsub = api.subscribeStats(setStats);
    
    // Realtime Clock
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Slideshow Timer (6 seconds for smoother viewing)
    const slideTimer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    // Navbar Scroll Effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      unsub();
      clearInterval(timer);
      clearInterval(slideTimer);
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

      {/* === HERO SECTION WITH SOFT TRANSITION SLIDESHOW === */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden min-h-[600px] flex items-center">
        
        {/* Slideshow Background */}
        {heroImages.map((img, index) => (
            <div 
                key={index}
                className={`absolute inset-0 z-0 transition-all duration-[2000ms] ease-in-out ${index === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
            >
                {/* Fallback color while loading */}
                <div className="w-full h-full bg-blue-900 absolute inset-0"></div>
                <img src={img} alt="Slideshow" className="w-full h-full object-cover relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                
                {/* Dark Overlay for Text Readability - Smooth Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/60 to-blue-900/30 z-20"></div>
            </div>
        ))}

        <div className="max-w-7xl mx-auto relative z-30 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12 w-full">
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
               <a 
                  href="https://www.instagram.com/sppg.tales?igsh=djZneGxvYnZnd3c4" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl border border-white/30 text-white font-medium backdrop-blur-sm flex items-center gap-3 hover:bg-white/10 transition-colors"
               >
                  <Instagram size={18} /> @sppg.tales
               </a>
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
               <h2 className="text-3xl font-bold text-gray-800 mb-3">Lokasi Kantor SPPG</h2>
               <p className="text-gray-500 max-w-2xl mx-auto">Setono, Tales, Kec. Ngadiluwih, Kabupaten Kediri, Jawa Timur 64171</p>
            </div>
            
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white h-[450px] relative bg-gray-200 group">
               {/* Updated Iframe for SPPG Office Location */}
               <iframe 
                 src="https://maps.google.com/maps?q=3X8P%2BXQX%2C+Setono%2C+Tales%2C+Kec.+Ngadiluwih%2C+Kabupaten+Kediri%2C+Jawa+Timur+64171&t=&z=15&ie=UTF8&iwloc=&output=embed"
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
               <a href="https://www.bgn.go.id/news/berita" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:text-blue-700 transition-colors">Lihat Berita Nasional</a>
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
                     <a href="https://www.instagram.com/sppg.tales?igsh=djZneGxvYnZnd3c4" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors" title="Instagram">
                        <Instagram size={20} />
                     </a>
                     <a href="https://www.bgn.go.id" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer transition-colors" title="Website BGN">
                        <Globe size={20} />
                     </a>
                  </div>
               </div>

               <div>
                  <h4 className="text-lg font-bold mb-6 text-yellow-400">Kontak Kami</h4>
                  <ul className="space-y-4 text-sm text-blue-100">
                     <li className="flex items-start gap-3">
                        <MapPin size={18} className="mt-0.5 shrink-0" />
                        <span>Setono, Tales, Kec. Ngadiluwih,<br/>Kabupaten Kediri, Jawa Timur 64171</span>
                     </li>
                     <li className="flex items-center gap-3">
                        <Clock size={18} className="shrink-0" />
                        <span>Senin - Jumat: 08.00 - 16.00 WIB</span>
                     </li>
                  </ul>
               </div>

               <div>
                  <h4 className="text-lg font-bold mb-6 text-yellow-400">Akses Cepat</h4>
                  <ul className="space-y-3 text-sm text-blue-100">
                     <li><a href="https://www.bgn.go.id" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Badan Gizi Nasional</a></li>
                     <li><a href="https://kemkes.go.id/id/home" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Kementerian Kesehatan</a></li>
                     <li><a href="https://www.bgn.go.id/news/berita" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Berita Badan Gizi Nasional</a></li>
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
