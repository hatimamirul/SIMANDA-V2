
import React, { useEffect, useState } from 'react';
import { useNavigate } from '../components/UIComponents';
import { api } from '../services/mockService';
import { DashboardStats } from '../types';
import { 
  LogIn, MapPin, Calendar, Clock, 
  Users, School, Baby, Heart, 
  ArrowRight, Activity, GraduationCap, 
  ChefHat, ChevronRight, Instagram, Globe, CheckCircle2,
  Newspaper
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

const ArticleCard = ({ title, date, excerpt, image, category, link }: { title: string, date: string, excerpt: string, image: string, category: string, link: string }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 group flex flex-col h-full cursor-pointer relative top-0 hover:-top-2">
    <div className="h-60 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
      {/* Added onError handler to fallback if image fails */}
      <img 
        src={image} 
        alt={title} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop"; // Fallback image
        }}
      />
      <div className="absolute top-4 left-4 z-20 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md uppercase tracking-wide">
        {category}
      </div>
    </div>
    <div className="p-8 flex flex-col flex-1 relative">
      <div className="flex items-center gap-2 text-gray-400 text-xs mb-4 font-bold uppercase tracking-wider">
        <Calendar size={12} className="text-blue-500" /> {date}
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors font-sans">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3 font-medium">{excerpt}</p>
      
      <a href={link} target="_blank" rel="noopener noreferrer" className="mt-auto pt-5 border-t border-gray-100 flex justify-between items-center group/btn">
         <span className="text-xs font-bold text-blue-600 group-hover/btn:underline">BACA SELENGKAPNYA</span>
         <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all">
            <ArrowRight size={14} />
         </div>
      </a>
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

  // Daftar Foto HD (Updated to Google Drive DIRECT LINK format)
  // Format: https://lh3.googleusercontent.com/d/[FILE_ID]
  const heroImages = [
    "https://lh3.googleusercontent.com/d/1EzIG1vfpAnHFiNAkiZRIP0MmMNm8IKkE", // Healthy Plate
    "https://lh3.googleusercontent.com/d/1oGUr8LWox9IYW9s_WeBAQLgtx4AkKmrl", // Chef Serving
    "https://lh3.googleusercontent.com/d/13aoYC7Z6GZGHm7wpj3CeXjaXSrR2Ni7V", // Kids in Class
    "https://lh3.googleusercontent.com/d/1mc9JGxrXb_ferO2Hs3zmHlS2dYIxRqq7", // Fresh Vegetables
    "https://lh3.googleusercontent.com/d/1sIRR2InrXABLGgiWBz8UF1TGmL6_WHKA"  // Food Preparation
  ];

  useEffect(() => {
    const unsub = api.subscribeStats(setStats);
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    // Smooth Slideshow Interval (5 seconds)
    const slideTimer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

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
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 overflow-x-hidden selection:bg-blue-200 selection:text-blue-900">
      
      {/* === NAVBAR === */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-md py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className={`p-1.5 rounded-xl transition-all ${scrolled ? 'bg-blue-50' : 'bg-white/20 backdrop-blur-sm'}`}>
                <Logo className="w-10 h-10 drop-shadow-md" />
            </div>
            <div className="hidden md:block">
              <h1 className={`font-extrabold text-xl leading-none tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'} font-sans`}>SIMANDA SPPG</h1>
              <div className="flex items-center gap-1.5 mt-1">
                 <span className={`h-0.5 w-4 rounded-full ${scrolled ? 'bg-blue-600' : 'bg-yellow-400'}`}></span>
                 <p className={`text-[10px] font-bold tracking-widest uppercase ${scrolled ? 'text-slate-500' : 'text-blue-100'}`}>Badan Gizi Nasional</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`hidden md:flex flex-col items-end text-right ${scrolled ? 'text-slate-600' : 'text-white'}`}>
              <div className="text-xs font-medium opacity-80">{dayName}, {dateStr}</div>
              <div className="text-xl font-bold font-mono leading-none tracking-wider">{timeStr}</div>
            </div>

            {/* MODERN LOGIN BUTTON */}
            <button 
              onClick={() => navigate('/login')}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all duration-300 shadow-lg transform hover:-translate-y-0.5 active:scale-95 border
                ${scrolled 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent hover:shadow-blue-500/30' 
                  : 'bg-white text-blue-900 border-transparent hover:bg-gray-50 shadow-black/10'
                }`}
            >
              <LogIn size={18} strokeWidth={2.5} />
              <span>Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* === HERO SECTION === */}
      <header className="relative h-[100vh] min-h-[650px] flex items-center overflow-hidden">
        
        {/* Slideshow Background */}
        {heroImages.map((img, index) => (
            <div 
                key={index}
                className={`absolute inset-0 z-0 transition-all duration-[2000ms] ease-in-out transform
                    ${index === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}
                `}
            >
                <div className="absolute inset-0 bg-slate-900"></div>
                <img 
                    src={img} 
                    alt="Hero Background" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                        // Fallback to solid color if image fails to load
                        e.currentTarget.style.display = 'none';
                    }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10"></div>
            </div>
        ))}

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-30 w-full flex flex-col md:flex-row items-center gap-16 pt-10">
          
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
            
            <p className="text-lg md:text-xl text-slate-200 leading-relaxed max-w-xl font-light border-l-4 border-yellow-400 pl-6">
              Sistem Informasi Manajemen Data (SIMANDA) Satuan Pelayanan Pemenuhan Gizi Desa Tales Setono. <strong className="text-white font-semibold">Transparan, Akurat, Terintegrasi.</strong>
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
               <button onClick={() => window.scrollTo({top: 900, behavior: 'smooth'})} className="px-8 py-4 bg-yellow-400 text-yellow-950 rounded-2xl font-bold shadow-xl shadow-yellow-400/20 hover:bg-yellow-300 hover:scale-105 transition-all flex items-center gap-2">
                 Lihat Data Statistik <ChevronRight size={20} strokeWidth={3} />
               </button>
               {/* Updated Button Text & Icon */}
               <div className="px-8 py-4 rounded-2xl border border-white/30 text-white font-semibold backdrop-blur-md bg-white/5 flex items-center gap-3 cursor-default hover:bg-white/10 transition-colors">
                  <MapPin size={20} className="text-red-400" /> 
                  <span>Wilayah Kerja Kec. Ngadiluwih</span>
               </div>
            </div>
          </div>

          {/* Right Floating Card */}
          <div className="md:w-2/5 w-full hidden md:block animate-scale-in delay-200">
             <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:bg-white/15 transition-colors duration-500">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-[80px] -ml-16 -mb-16 pointer-events-none"></div>
                
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
                   <div className="bg-slate-900/40 rounded-2xl p-4 flex justify-between items-center border border-white/10 hover:border-white/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-200"><School size={18}/></div>
                        <span className="text-slate-200 font-medium">Siswa Sekolah</span>
                      </div>
                      <span className="text-white font-bold text-lg">{totalSiswa.toLocaleString()}</span>
                   </div>
                   <div className="bg-slate-900/40 rounded-2xl p-4 flex justify-between items-center border border-white/10 hover:border-white/30 transition-colors">
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
        <div className="mt-10 bg-white rounded-[2.5rem] p-12 shadow-2xl border border-gray-100 animate-fade-in delay-500 relative overflow-hidden">
           {/* Background Pattern */}
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-pink-50/80 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none"></div>

           <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6 relative z-10">
              <div>
                 <div className="flex items-center gap-2 text-pink-600 font-bold text-sm uppercase tracking-wider mb-3">
                    <Activity size={16} /> Data Prioritas Nasional
                 </div>
                 <h3 className="text-4xl font-black text-gray-900 tracking-tight">
                    Detail Penerima Manfaat B3
                 </h3>
                 <p className="text-gray-500 mt-3 max-w-xl text-lg leading-relaxed">Fokus pemenuhan gizi untuk pencegahan stunting pada Balita, Ibu Hamil, dan Ibu Menyusui di wilayah kerja.</p>
              </div>
              <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl flex items-center gap-4 border border-slate-700">
                 <span className="text-sm uppercase tracking-widest text-slate-400">Total Terdaftar</span>
                 <span className="w-px h-8 bg-slate-700"></span>
                 <span className="text-3xl text-yellow-400 font-mono">{stats.pmb3.toLocaleString()}</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {/* Balita Card */}
              <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-3xl p-8 border border-orange-100 shadow-lg hover:shadow-xl transition-all group">
                 <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner mb-6 group-hover:scale-110 transition-transform">
                    <Baby size={32} />
                 </div>
                 <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Kategori</p>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Balita</h4>
                    <p className="text-4xl font-black text-orange-600">{stats.balita}</p>
                    <div className="h-2 w-full bg-gray-100 rounded-full mt-4 overflow-hidden">
                       <div className="h-full bg-orange-500 rounded-full" style={{ width: `${stats.pmb3 ? (stats.balita/stats.pmb3)*100 : 0}%` }}></div>
                    </div>
                 </div>
              </div>

              {/* Ibu Hamil Card */}
              <div className="bg-gradient-to-br from-white to-pink-50/30 rounded-3xl p-8 border border-pink-100 shadow-lg hover:shadow-xl transition-all group">
                 <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 shadow-inner mb-6 group-hover:scale-110 transition-transform">
                    <Heart size={32} />
                 </div>
                 <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Kategori</p>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Ibu Hamil</h4>
                    <p className="text-4xl font-black text-pink-600">{stats.ibuHamil}</p>
                    <div className="h-2 w-full bg-gray-100 rounded-full mt-4 overflow-hidden">
                       <div className="h-full bg-pink-500 rounded-full" style={{ width: `${stats.pmb3 ? (stats.ibuHamil/stats.pmb3)*100 : 0}%` }}></div>
                    </div>
                 </div>
              </div>

              {/* Ibu Menyusui Card */}
              <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-3xl p-8 border border-emerald-100 shadow-lg hover:shadow-xl transition-all group">
                 <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner mb-6 group-hover:scale-110 transition-transform">
                    <Activity size={32} />
                 </div>
                 <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Kategori</p>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Ibu Menyusui</h4>
                    <p className="text-4xl font-black text-emerald-600">{stats.ibuMenyusui}</p>
                    <div className="h-2 w-full bg-gray-100 rounded-full mt-4 overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.pmb3 ? (stats.ibuMenyusui/stats.pmb3)*100 : 0}%` }}></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* === MAP SECTION (IMPROVED PREMIUM LOOK) === */}
      <section className="py-24 bg-slate-100 relative overflow-hidden">
         <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
         
         <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
            <div className="text-center mb-16">
               <span className="text-blue-600 font-bold text-xs uppercase tracking-widest bg-blue-100 px-4 py-1.5 rounded-full border border-blue-200">Pusat Operasional</span>
               <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-6 mb-6 tracking-tight">Lokasi Kantor SPPG</h2>
               <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
                  Dapur umum dan pusat kendali distribusi gizi kami berlokasi strategis untuk menjangkau seluruh penerima manfaat di Kecamatan Ngadiluwih.
               </p>
            </div>
            
            {/* FLOATING MAP CARD (PREMIUM) */}
            <div className="relative">
                {/* Background Blur Glow */}
                <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-10 rounded-full transform scale-90"></div>
                
                <div className="bg-white p-4 rounded-[3rem] shadow-2xl shadow-slate-300 border-8 border-white relative overflow-hidden group h-[550px] transform hover:scale-[1.01] transition-transform duration-500">
                   
                   <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-gray-200">
                       {/* Maps Iframe */}
                       <iframe 
                         src="https://maps.google.com/maps?q=3X8P%2BXQX%2C+Setono%2C+Tales%2C+Kec.+Ngadiluwih%2C+Kabupaten+Kediri%2C+Jawa+Timur+64171&t=&z=15&ie=UTF8&iwloc=&output=embed"
                         width="100%" 
                         height="100%" 
                         style={{border:0}} 
                         allowFullScreen={false} 
                         loading="lazy" 
                         referrerPolicy="no-referrer-when-downgrade"
                         className="w-full h-full filter grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 ease-in-out"
                       ></iframe>

                       {/* Floating Info Box on Map */}
                       <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/60 max-w-sm animate-fade-in delay-300">
                          <div className="flex items-start gap-4">
                             <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0 shadow-sm">
                                <MapPin size={24} fill="currentColor" />
                             </div>
                             <div>
                                <h4 className="font-black text-gray-900 text-lg leading-tight mb-1">SPPG Tales Setono</h4>
                                <p className="text-gray-500 text-xs leading-relaxed font-medium">
                                   Setono, Tales, Kec. Ngadiluwih, Kab. Kediri, Jawa Timur 64171
                                </p>
                                <a 
                                   href="https://maps.google.com/maps?q=3X8P%2BXQX%2C+Setono%2C+Tales%2C+Kec.+Ngadiluwih%2C+Kabupaten+Kediri%2C+Jawa+Timur+64171" 
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="inline-flex items-center gap-1 text-white bg-blue-600 px-4 py-2 rounded-lg text-xs font-bold mt-4 hover:bg-blue-700 transition-colors shadow-md"
                                >
                                   Buka di Google Maps <ArrowRight size={12}/>
                                </a>
                             </div>
                          </div>
                       </div>
                   </div>
                </div>
            </div>
         </div>
      </section>

      {/* === ARTICLES SECTION (UPDATED TO BGN NEWS) === */}
      <section className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 border-b border-gray-100 pb-8">
               <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider mb-3">
                    <Newspaper size={16} /> Berita Nasional
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Berita & Kegiatan Terkini</h2>
                  <p className="text-gray-500 text-lg">Update terbaru seputar kebijakan dan kegiatan Badan Gizi Nasional Republik Indonesia.</p>
               </div>
               <a href="https://www.bgn.go.id/news/berita" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-3 shadow-lg shadow-slate-200">
                  Lihat Semua Berita <ArrowRight size={18}/>
               </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <ArticleCard 
                  title="Kepala Badan Gizi Nasional Tinjau Kesiapan Dapur Satuan Pelayanan"
                  date="18 Desember 2025"
                  category="Kunjungan Kerja"
                  image="https://images.unsplash.com/photo-1577106263724-2c8e03bfe9f4?q=80&w=2070&auto=format&fit=crop"
                  excerpt="Kepala Badan Gizi Nasional melakukan peninjauan langsung ke beberapa titik Satuan Pelayanan Pemenuhan Gizi untuk memastikan kesiapan infrastruktur dan SDM."
                  link="https://www.bgn.go.id/news/berita"
               />
               <ArticleCard 
                  title="Program Makan Bergizi Gratis Capai Target 1 Juta Anak Sekolah"
                  date="15 Desember 2025"
                  category="Nasional"
                  image="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop"
                  excerpt="Capaian luar biasa program nasional dalam mendistribusikan makanan bergizi kepada lebih dari satu juta siswa sekolah dasar di seluruh Indonesia."
                  link="https://www.bgn.go.id/news/berita"
               />
               <ArticleCard 
                  title="Standar Gizi Baru untuk Ibu Hamil dan Balita Resmi Diterapkan"
                  date="10 Desember 2025"
                  category="Kebijakan"
                  image="https://images.unsplash.com/photo-1615485500704-8e99099928b3?q=80&w=2070&auto=format&fit=crop"
                  excerpt="Badan Gizi Nasional merilis pedoman teknis terbaru mengenai komposisi gizi makro dan mikro yang wajib ada dalam paket makanan tambahan."
                  link="https://www.bgn.go.id/news/berita"
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

