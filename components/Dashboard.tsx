import React from 'react';
import { BRAND_NAME } from '../version';

interface Props {
  onStartCapture: () => void;
  onStakeout: () => void;
  onShowList: () => void;
  onShowExport: () => void;
  onShowHelp: () => void;
}

const Dashboard: React.FC<Props> = ({ onStartCapture, onStakeout, onShowList, onShowExport, onShowHelp }) => {
  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] animate-in px-8 pt-20 md:pt-28 justify-start relative">
      {/* Dil / Bayrak - Sol Üst Köşe */}
      <div className="absolute top-6 left-8 z-20">
        <button 
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-blue-100 active:scale-90 transition-all hover:bg-blue-50 overflow-hidden"
          title="Dil Değiştir"
        >
          <div className="w-8 h-6 rounded-md overflow-hidden flex items-center justify-center shadow-sm">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/b/b4/Flag_of_Turkey.svg" 
              alt="Türk Bayrağı" 
              className="w-full h-full object-cover"
              style={{ objectPosition: '35% 50%' }}
              referrerPolicy="no-referrer"
            />
          </div>
        </button>
      </div>

      {/* Üst Butonlar - Sağ Üst Köşe */}
      <div className="absolute top-6 right-8 z-20 flex items-center gap-2">
        {/* Ayarlar Butonu (Pasif) */}
        <button 
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-blue-100 text-slate-400 cursor-not-allowed active:scale-95 transition-all"
          title="Ayarlar (Yakında)"
        >
          <i className="fas fa-cog text-xl font-black"></i>
        </button>

        {/* Koyu Tema Butonu (Pasif) */}
        <button 
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-blue-100 text-slate-400 cursor-not-allowed active:scale-95 transition-all"
          title="Koyu Tema (Yakında)"
        >
          <i className="fas fa-moon text-xl font-black"></i>
        </button>

        {/* Yardım Butonu (Glow Efektli) */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
          <button 
            onClick={onShowHelp}
            className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-blue-100 text-blue-600 active:scale-90 transition-all hover:bg-blue-50 group"
          >
            <i className="fas fa-question text-xl font-black group-hover:text-amber-500 transition-colors stroke-current stroke-2" style={{ WebkitTextStroke: '1px' }}></i>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white animate-bounce"></div>
          </button>
        </div>
      </div>

      {/* Header - Logo kaldırıldı, metinler merkezlendi ve üst girinti artırıldı */}
      <header className="flex flex-col items-center shrink-0 mb-10 md:mb-16">
        {/* Açıklama Metni - Siyah Renk, Merkezlenmiş */}
        <p className="text-sm md:text-base font-black text-slate-900 uppercase tracking-[0.2em] mb-4 leading-tight text-center w-full max-w-sm">
          Mobil cihazlarınız için <br /> KML/KMZ Görüntüleme Uygulaması
        </p>
        
        {/* Ana Başlık - #2563eb Mavi Renk */}
        <h1 className="text-5xl md:text-6xl font-black text-[#2563eb] tracking-tighter leading-none text-center">
          {BRAND_NAME}
        </h1>
      </header>

      <main className="w-full max-w-sm mx-auto flex flex-col space-y-2.5 md:space-y-3">
        {/* Ana Menü - Ultra kompakt ve dikey sıralı */}
        
        {/* Yeni Proje Oluştur */}
        <button 
          onClick={onStartCapture}
          className="w-full py-3 md:py-4 px-5 bg-emerald-600 text-white rounded-xl md:rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all flex items-center justify-between group relative overflow-hidden border border-white/10"
        >
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
              <i className="fas fa-folder-plus text-base md:text-lg text-white"></i>
            </div>
            <span className="text-sm md:text-base font-black tracking-tight leading-none uppercase">Yeni Proje Yükle</span>
          </div>
          <i className="fas fa-chevron-right text-white/40 group-hover:translate-x-1 transition-transform text-[10px]"></i>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
        </button>

        {/* Projeye Devam Et */}
        <button 
          onClick={onStakeout}
          className="w-full py-3 md:py-4 px-5 bg-blue-600 text-white rounded-xl md:rounded-2xl shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-between group relative overflow-hidden border border-white/10"
        >
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
              <i className="fas fa-map-location-dot text-base md:text-lg text-white"></i>
            </div>
            <span className="text-sm md:text-base font-black tracking-tight leading-none uppercase">Kayıtlı Projeler</span>
          </div>
          <i className="fas fa-chevron-right text-white/40 group-hover:translate-x-1 transition-transform text-[10px]"></i>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
        </button>
      </main>
    </div>
  );
};

export default Dashboard;