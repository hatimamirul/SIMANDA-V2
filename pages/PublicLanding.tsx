
import React, { useEffect, useState } from 'react';
import { useNavigate } from '../components/UIComponents';
import { api } from '../services/mockService';
import { DashboardStats } from '../types';
import { 
  LogIn, MapPin, Calendar, Clock, 
  Users, School, Baby, Heart, 
  ArrowRight, Activity, GraduationCap, 
  ChefHat, ChevronRight, Instagram, Globe, CheckCircle2 
} from 'lucide-react';
import { Logo } from '../components/UIComponents';

// --- COMPONENTS ---

const StatCard = ({ icon, label, value, subtext, color, delay }: { icon: any, label: string, value: number, subtext?: string, color: string, delay: string }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 animate-fade-in ${delay} relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.08] rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-2 font-sans">{label}</p>
        <h3 className="text-4xl font-black text-gray-800 tracking-tight font-sans">{value.toLocaleString('id-ID')}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${color}`}></div> {subtext}</p>}
      </div>
      <div className={`p-3.5 rounded-xl ${color} text-white shadow-lg shadow-blue-900/5 group-hover:rotate-6 transition-transform duration-500`}>
        {icon}
      </div>
    </div>
  </div>
);

const ArticleCard = ({ title, date, excerpt, image, category }: { title: string, date: string, excerpt: string, image: string, category: string }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 group flex flex-col h-full cursor-pointer">
    <div className="h-56 overflow-hidden relative">
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10"></div>
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-800 shadow-sm uppercase tracking-wide border border-gray-100">
        {category}
      </div>
    </div>
    <div className="p-7 flex flex-col flex-1">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-4 font-medium">
        <Calendar size={14} className="text-primary" /> {date}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3 leading-snug group-hover:text-primary transition-colors font-sans">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">{excerpt}</p>
      <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
         <span className="text-xs font-bold text-gray-400 group-hover:text-primary transition-colors">Baca Selengkapnya</span>
         <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
            <ArrowRight size={14} />
         </div>
      </div>
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

  // Daftar Foto HD untuk Program MBG (Unsplash High Quality)
  const heroImages = [
    "https://images.unsplash.com/photo-1594498653385-d5175c532c38?q=80&w=2070&auto=format&fit=crop", // Healthy Plate (Colorful)
    "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop", // Chef Cooking (Kitchen)
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop", // Nutrition (Avocado/Veg)
    "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop", // Kids Eating (School)
    "https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=2070&auto=format&fit=crop"  // Fresh Ingredients
  ];

  useEffect(() => {
    const unsub = api.subscribeStats(setStats);
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Smooth Slideshow Interval (6 seconds)
    const slideTimer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayName = days[time.getDay()];
  const dateStr = `${time.getDate()} ${months[time.getMonth()]} ${time.getFullYear()}`;
  const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 overflow-x-hidden selection:bg-yellow-200 selection:text-yellow-900">
      
      {/* === NAVBAR === */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className={`p-1.5 rounded-xl transition-all ${scrolled ? 'bg-blue-50' : 'bg-white/20 backdrop-blur-sm'}`}>
                <Logo className="w-10 h-10 drop-shadow-md" />
            </div>
            <div className="hidden md:block">
              <h1 className={`font-extrabold text-xl leading-none tracking-tight ${scrolled ? 'text-slate-800' : 'text-white'} font-sans`}>SIMANDA SPPG</h1>
              <div className="flex items-center gap-1.5 mt-1">
                 <span className={`h-0.5 w-4 rounded-full ${scrolled ? 'bg-yellow-500' : 'bg-yellow-400'}`}></span>
                 <p className={`text-[10px] font-bold tracking-widest uppercase ${scrolled ? 'text-slate-500' : 'text-blue-100'}`}>Badan Gizi Nasional</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`hidden md:flex flex-col items-end text-right ${scrolled ? 'text-slate-600' : 'text-white'}`}>
              <div className="text-xs font-medium opacity-80">{dayName}, {dateStr}</div>
              <div className="text-xl font-bold font-mono leading-none tracking-wider">{timeStr}</div>
            </div>

            <button 
              onClick={() => navigate('/login')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 border
                ${scrolled 
                  ? 'bg-blue-600 text-white border-transparent hover:bg-blue-700 shadow-blue-200' 
                  : 'bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white hover:text-blue-900'
                }`}
            >
              <LogIn size={18} />
              <span>Login Pengelola</span>
            </button>
          </div>
        </div>
      </nav>

      {/* === HERO SECTION WITH SOFT SLIDESHOW === */}
      <header className="relative h-[100vh] min-h-[600px] flex items-center overflow-hidden">
        
        {/* Slideshow Background */}
        {heroImages.map((img, index) => (
            <div 
                key={index}
                className={`absolute inset-0 z-0 transition-all duration-[2500ms] ease-in-out transform
                    ${index === currentImageIndex ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}
                `}
            >
                <div className="absolute inset-0 bg-slate-900"></div> {/* Fallback color */}
                <img src={img} alt="Hero Background" className="w-full h-full object-cover" />
                
                {/* Advanced Gradient Overlay for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40 z-10"></div>
            </div>
        ))}

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-30 w-full flex flex-col md:flex-row items-center gap-16 pt-16">
          
          {/* Left Content */}
          <div className="md:w-3/5 space-y-8 animate-slide-in-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-50 text-xs font-bold uppercase tracking-wider shadow-lg">
              <Activity size={14} className="text-yellow-400" /> 
              <span>Portal Data Terpadu SPPG</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-sm font-sans">
              Mewujudkan Gizi <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-500">Generasi Emas</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed max-w-xl font-light">
              Sistem Informasi Manajemen Data (SIMANDA) Satuan Pelayanan Pemenuhan Gizi Desa Tales Setono. <strong className="text-white font-semibold">Transparan, Akurat, Terintegrasi.</strong>
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
               <button onClick={() => window.scrollTo({top: 900, behavior: 'smooth'})} className="px-8 py-4 bg-yellow-400 text-yellow-950 rounded-2xl font-bold shadow-xl shadow-yellow-400/20 hover:bg-yellow-300 hover:scale-105 transition-all flex items-center gap-2">
                 Lihat Data Statistik <ChevronRight size={20} strokeWidth={3} />
               </button>
               <a 
                  href="https://www.instagram.com/sppg.tales?igsh=djZneGxvYnZnd3c4" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-2xl border border-white/30 text-white font-semibold backdrop-blur-md hover:bg-white/10 transition-all flex items-center gap-3"
               >
                  <Instagram size={20} /> @sppg.tales
               </a>
            </div>
          </div>

          {/* Right Floating Card */}
          <div className="md:w-2/5 w-full hidden md:block animate-scale-in delay-200">
             <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors duration-500">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -ml-16 -mb-16 pointer-events-none"></div>
                
                <div className="flex items-center gap-5 mb-8 relative z-10">
                   <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                      <Heart size={32} strokeWidth={2.5} fill="currentColor" className="text-white/20" />
                      <Heart size={32} strokeWidth={2.5} className="absolute" />
                   </div>
                   <div>
                      <p className="text-blue-200 text-sm font-bold uppercase tracking-wider mb-1">Total Penerima Manfaat</p>
                      <h3 className="text-5xl font-black text-white tracking-tight">{totalPenerimaManfaat.toLocaleString('id-ID')}</h3>
                   </div>
                </div>

                <div className="space-y-4 relative z-10">
                   <div className="bg-slate-900/40 rounded-2xl p-4 flex justify-between items-center border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-200"><School size={18}/></div>
                        <span className="text-slate-200 font-medium">Siswa Sekolah</span>
                      </div>
                      <span className="text-white font-bold text-lg">{totalSiswa.toLocaleString()}</span>
                   </div>
                   <div className="bg-slate-900/40 rounded-2xl p-4 flex justify-between items-center border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-200"><Baby size={18}/></div>
                        <span className="text-slate-200 font-medium">Ibu & Balita (B3)</span>
                      </div>
                      <span className="text-white font-bold text-lg">{stats.pmb3.toLocaleString()}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* === STATS GRID SECTION === */}
      <section className="py-24 max-w-7xl mx-auto px-4 md:px-8 relative z-20 -mt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
              icon={<School size={30} />} 
              label="Total Sekolah" 
              value={stats.pmsekolah} 
              subtext="Mitra Sekolah Aktif"
              color="bg-blue-500"
              delay="delay-100"
           />
           <StatCard 
              icon={<Users size={30} />} 
              label="Total Siswa" 
              value={totalSiswa} 
              subtext="Siswa Penerima Gizi"
              color="bg-indigo-500"
              delay="delay-200"
           />
           <StatCard 
              icon={<GraduationCap size={30} />} 
              label="Tenaga Pendidik" 
              value={stats.guru} 
              subtext="Guru & Staff Sekolah"
              color="bg-purple-500"
              delay="delay-300"
           />
           <StatCard 
              icon={<ChefHat size={30} />} 
              label="Tim SPPG" 
              value={stats.karyawan} 
              subtext="Personil Dapur & Logistik"
              color="bg-orange-500"
              delay="delay-400"
           />
        </div>

        {/* Detail B3 Section */}
        <div className="mt-10 bg-white rounded-[2rem] p-10 shadow-xl border border-gray-100 animate-fade-in delay-500 relative overflow-hidden">
           {/* Background Pattern */}
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-pink-50/50 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none"></div>

           <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-6 relative z-10">
              <div>
                 <div className="flex items-center gap-2 text-pink-600 font-bold text-sm uppercase tracking-wider mb-2">
                    <Activity size={16} /> Data Prioritas Nasional
                 </div>
                 <h3 className="text-3xl font-black text-gray-800">
                    Detail Penerima Manfaat B3
                 </h3>
                 <p className="text-gray-500 mt-2 max-w-lg">Fokus pemenuhan gizi untuk pencegahan stunting pada Balita, Ibu Hamil, dan Ibu Menyusui.</p>
              </div>
              <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-3">
                 <span>Total Terdaftar</span>
                 <span className="w-px h-6 bg-white/20"></span>
                 <span className="text-2xl text-yellow-400">{stats.pmb3.toLocaleString()}</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Balita Card */}
              <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-100 flex items-center gap-5 hover:bg-orange-50 transition-colors">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-md">
                    <Baby size={32} />
                 </div>
                 <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Balita</p>
                    <p className="text-3xl font-black text-gray-800">{stats.balita}</p>
                    <div className="h-1.5 w-24 bg-gray-200 rounded-full mt-2 overflow-hidden">
                       <div className="h-full bg-orange-400 rounded-full" style={{ width: `${stats.pmb3 ? (stats.balita/stats.pmb3)*100 : 0}%` }}></div>
                    </div>
                 </div>
              </div>

              {/* Ibu Hamil Card */}
              <div className="bg-pink-50/50 rounded-2xl p-6 border border-pink-100 flex items-center gap-5 hover:bg-pink-50 transition-colors">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-pink-500 shadow-md">
                    <Heart size={32} />
                 </div>
                 <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ibu Hamil</p>
                    <p className="text-3xl font-black text-gray-800">{stats.ibuHamil}</p>
                    <div className="h-1.5 w-24 bg-gray-200 rounded-full mt-2 overflow-hidden">
                       <div className="h-full bg-pink-400 rounded-full" style={{ width: `${stats.pmb3 ? (stats.ibuHamil/stats.pmb3)*100 : 0}%` }}></div>
                    </div>
                 </div>
              </div>

              {/* Ibu Menyusui Card */}
              <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex items-center gap-5 hover:bg-emerald-50 transition-colors">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-md">
                    <Activity size={32} />
                 </div>
                 <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ibu Menyusui</p>
                    <p className="text-3xl font-black text-gray-800">{stats.ibuMenyusui}</p>
                    <div className="h-1.5 w-24 bg-gray-200 rounded-full mt-2 overflow-hidden">
                       <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${stats.pmb3 ? (stats.ibuMenyusui/stats.pmb3)*100 : 0}%` }}></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* === MAP SECTION (IMPROVED LAYOUT) === */}
      <section className="py-20 bg-slate-100 relative">
         <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
         
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
               <span className="text-blue-600 font-bold text-xs uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full">Wilayah Kerja</span>
               <h2 className="text-4xl font-black text-gray-800 mt-4 mb-4">Lokasi Kantor SPPG</h2>
               <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
                  Pusat operasional dan dapur umum kami berlokasi strategis untuk menjangkau seluruh penerima manfaat di Kecamatan Ngadiluwih.
               </p>
            </div>
            
            {/* FLOATING MAP CARD */}
            <div className="bg-white p-3 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-gray-200 relative overflow-hidden group">
               
               <div className="relative w-full h-[500px] rounded-[2rem] overflow-hidden">
                   {/* Maps Iframe */}
                   <iframe 
                     src="https://maps.google.com/maps?q=3X8P%2BXQX%2C+Setono%2C+Tales%2C+Kec.+Ngadiluwih%2C+Kabupaten+Kediri%2C+Jawa+Timur+64171&t=&z=15&ie=UTF8&iwloc=&output=embed"
                     width="100%" 
                     height="100%" 
                     style={{border:0}} 
                     allowFullScreen={false} 
                     loading="lazy" 
                     referrerPolicy="no-referrer-when-downgrade"
                     className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-1000 ease-in-out"
                   ></iframe>

                   {/* Floating Info Box on Map */}
                   <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/50 max-w-xs animate-fade-in delay-300">
                      <div className="flex items-start gap-4">
                         <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                            <MapPin size={24} fill="currentColor" className="opacity-20" />
                            <MapPin size={24} className="absolute" />
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">SPPG Tales Setono</h4>
                            <p className="text-gray-500 text-xs leading-relaxed">
                               Setono, Tales, Kec. Ngadiluwih, Kab. Kediri, Jawa Timur 64171
                            </p>
                            <a 
                               href="https://maps.google.com/maps?q=3X8P%2BXQX%2C+Setono%2C+Tales%2C+Kec.+Ngadiluwih%2C+Kabupaten+Kediri%2C+Jawa+Timur+64171" 
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold mt-3 hover:underline"
                            >
                               Buka di Google Maps <ArrowRight size={12}/>
                            </a>
                         </div>
                      </div>
                   </div>
               </div>
            </div>
         </div>
      </section>

      {/* === ARTICLES SECTION === */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4 border-b border-gray-100 pb-8">
               <div>
                  <h2 className="text-4xl font-black text-gray-800 mb-3">Berita & Kegiatan</h2>
                  <p className="text-gray-500 text-lg">Update terbaru seputar kegiatan pemenuhan gizi.</p>
               </div>
               <a href="https://www.bgn.go.id/news/berita" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                  Lihat Berita Nasional <ArrowRight size={18}/>
               </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <ArticleCard 
                  title="Penyaluran Makanan Bergizi Tahap 1 Sukses Dilaksanakan"
                  date="15 Desember 2025"
                  category="Kegiatan"
                  image="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  excerpt="Tim SPPG berhasil mendistribusikan lebih dari 500 paket makanan bergizi kepada siswa SD di wilayah Desa Tales dengan menu 4 sehat 5 sempurna."
               />
               <ArticleCard 
                  title="Pentingnya Protein Hewani untuk Mencegah Stunting"
                  date="12 Desember 2025"
                  category="Edukasi"
                  image="https://images.unsplash.com/photo-1607623814075-e51df1bd6562?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  excerpt="Edukasi mengenai pentingnya konsumsi telur, ikan, dan daging bagi balita untuk mendukung pertumbuhan otak dan fisik yang optimal."
               />
               <ArticleCard 
                  title="Kunjungan Tim Monitoring Badan Gizi Nasional"
                  date="10 Desember 2025"
                  category="Berita"
                  image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  excerpt="Tim pusat melakukan monitoring dan evaluasi terhadap standar operasional prosedur dapur, kebersihan, dan alur distribusi SPPG Tales Setono."
               />
            </div>
         </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-slate-900 text-white pt-24 pb-12 border-t border-slate-800">
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="bg-white p-1.5 rounded-lg"><Logo className="w-8 h-8" /></div>
                     <div>
                        <span className="font-bold text-xl tracking-tight block leading-none">SIMANDA SPPG</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">Badan Gizi Nasional</span>
                     </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                     Sistem Informasi Manajemen Data untuk mendukung program pemenuhan gizi nasional yang tepat sasaran, transparan, dan akuntabel demi masa depan Indonesia.
                  </p>
                  <div className="flex gap-3 pt-2">
                     <a href="https://www.instagram.com/sppg.tales?igsh=djZneGxvYnZnd3c4" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all duration-300" title="Instagram">
                        <Instagram size={18} />
                     </a>
                     <a href="https://www.bgn.go.id" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-300" title="Website BGN">
                        <Globe size={18} />
                     </a>
                  </div>
               </div>

               <div>
                  <h4 className="text-lg font-bold mb-6 text-white border-b border-slate-800 pb-4 inline-block">Kontak Kami</h4>
                  <ul className="space-y-5 text-sm text-slate-300">
                     <li className="flex items-start gap-4">
                        <div className="mt-1 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                           <MapPin size={14} />
                        </div>
                        <span className="leading-relaxed">Setono, Tales, Kec. Ngadiluwih,<br/>Kabupaten Kediri, Jawa Timur 64171</span>
                     </li>
                     <li className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                           <Clock size={14} />
                        </div>
                        <span>Senin - Jumat: 08.00 - 16.00 WIB</span>
                     </li>
                  </ul>
               </div>

               <div>
                  <h4 className="text-lg font-bold mb-6 text-white border-b border-slate-800 pb-4 inline-block">Tautan Penting</h4>
                  <ul className="space-y-3 text-sm text-slate-400">
                     <li>
                        <a href="https://www.bgn.go.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-yellow-400 transition-colors group">
                           <CheckCircle2 size={14} className="text-slate-600 group-hover:text-yellow-400 transition-colors"/> Badan Gizi Nasional
                        </a>
                     </li>
                     <li>
                        <a href="https://kemkes.go.id/id/home" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-yellow-400 transition-colors group">
                           <CheckCircle2 size={14} className="text-slate-600 group-hover:text-yellow-400 transition-colors"/> Kementerian Kesehatan
                        </a>
                     </li>
                     <li>
                        <a href="https://www.bgn.go.id/news/berita" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-yellow-400 transition-colors group">
                           <CheckCircle2 size={14} className="text-slate-600 group-hover:text-yellow-400 transition-colors"/> Berita Terkini
                        </a>
                     </li>
                  </ul>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
               <p>&copy; 2025 SIMANDA SPPG. Hak Cipta Dilindungi.</p>
               <p>Dibuat untuk Satuan Pelayanan Pemenuhan Gizi.</p>
            </div>
         </div>
      </footer>
    </div>
  );
};

