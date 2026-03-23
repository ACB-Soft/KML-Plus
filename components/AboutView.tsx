import React from 'react';
import { BRAND_NAME, APP_VERSION, DEVELOPER } from '../version';

interface Props {
  onBack: () => void;
}

const AboutView: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-200 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 shrink-0 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 active:scale-90 transition-all"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hakkında</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-12 no-scrollbar">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] shadow-2xl shadow-blue-600/20 flex items-center justify-center mb-6">
            <i className="fas fa-map-marked-alt text-4xl text-white"></i>
          </div>
          <h2 className="text-3xl font-black text-blue-600 tracking-tighter mb-1">{BRAND_NAME}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{APP_VERSION}</p>
        </div>

        <div className="space-y-8">
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Uygulama Hakkında</h3>
            <p className="text-sm font-bold text-slate-600 leading-relaxed">
              {BRAND_NAME}, mobil cihazlar üzerinden KML ve KMZ dosyalarını profesyonel bir şekilde görüntülemek, 
              yönetmek ve arazi çalışmalarında rehberlik etmek amacıyla geliştirilmiş bir mühendislik aracıdır.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Geliştirici</h3>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                <i className="fas fa-code text-xl"></i>
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{DEVELOPER}</div>
                <div className="text-[10px] font-bold text-slate-500">Yazılım ve Mühendislik Çözümleri</div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Yasal</h3>
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
              Bu uygulama mühendislik çalışmalarına yardımcı olması amacıyla sunulmuştur. 
              Uygulama üzerinden elde edilen verilerin doğruluğu cihazınızın GPS hassasiyetine bağlıdır. 
              Kritik ölçümler için profesyonel ekipmanlar kullanılmalıdır.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            &copy; 2026 {DEVELOPER} <br /> Tüm hakları saklıdır.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AboutView;
