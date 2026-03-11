import React from 'react';
import { BRAND_NAME } from '../version';

interface Props {
  onFinish: () => void;
}

const Onboarding: React.FC<Props> = ({ onFinish }) => {
  const handlePermissionAndStart = () => {
    onFinish();
  };

  return (
    <div className="flex-1 flex flex-col bg-white animate-in overflow-hidden px-8 py-2 md:py-6 justify-around">
      {/* Üst Kısım: Logo ve Başlık */}
      <div className="flex flex-col items-center text-center shrink-0">
        <div className="relative mb-4 md:mb-6">
          <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full"></div>
          <div className="relative w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/30 transform rotate-2">
            <i className="fas fa-shield-halved text-white text-2xl md:text-3xl transform -rotate-2"></i>
          </div>
        </div>
        
        <div className="space-y-2 md:space-y-3">
          <p className="text-slate-900 font-black text-[12px] md:text-[14px] uppercase tracking-[0.18em] leading-tight max-w-[260px] mx-auto opacity-80">
            Mobil Cihazlarınız için<br/>KML/KMZ Görüntüleme Uygulaması
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-blue-600 tracking-tighter leading-none">
            {BRAND_NAME}
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center w-full max-w-sm mx-auto space-y-2 md:space-y-3">
        <div className="w-full flex gap-3 md:gap-4 text-left items-center p-3 md:p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <i className="fas fa-location-dot text-sm md:text-base"></i>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-wider">Konum Erişimi</h4>
            <p className="text-[11px] md:text-[12px] text-slate-500 font-bold leading-tight">
              GPS verilerini kullanarak konum ve yükseklik bilgisi üretmek için gereklidir.
            </p>
          </div>
        </div>

        <div className="w-full flex gap-3 md:gap-4 text-left items-center p-3 md:p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <i className="fas fa-file-export text-sm md:text-base"></i>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-wider">Dosya Erişimi</h4>
            <p className="text-[11px] md:text-[12px] text-slate-500 font-bold leading-tight">
              Verileri içeri ve dışarı aktarmak için gereklidir. Verileriniz sadece yerel cihazınızda depolanır.
            </p>
          </div>
        </div>

        <div className="w-full flex gap-3 md:gap-4 text-left items-center p-3 md:p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <i className="fas fa-globe text-sm md:text-base"></i>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-wider">İnternet Erişimi</h4>
            <p className="text-[11px] md:text-[12px] text-slate-500 font-bold leading-tight">
              Uydu görüntüsü altlıklarının yüklenebilmesi için gereklidir.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto shrink-0">
        <button 
          onClick={handlePermissionAndStart}
          className="w-full py-4 md:py-5 px-5 bg-blue-600 text-white rounded-[1.5rem] md:rounded-[1.8rem] font-black text-[13px] md:text-[14px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 active:scale-[0.97] transition-all flex items-center justify-center gap-4"
        >
          İZİNLERİ ONAYLA VE BAŞLA
          <i className="fas fa-arrow-right text-white/50 text-[11px]"></i>
        </button>
      </div>
    </div>
  );
};

export default Onboarding;