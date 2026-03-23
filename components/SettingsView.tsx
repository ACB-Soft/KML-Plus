import React from 'react';
import GlobalFooter from './GlobalFooter';
import { APP_VERSION } from '../version';

interface Props {
  onBack: () => void;
}

const SettingsView: React.FC<Props> = ({ onBack }) => {
  const [showUpdateMsg, setShowUpdateMsg] = React.useState(false);

  const handleClearCache = () => {
    if (window.confirm('Tüm verileriniz silinecek. Emin misiniz?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col animate-in h-full overflow-hidden bg-slate-200">
      <header className="px-8 pt-6 pb-6 flex items-center gap-5 shrink-0 bg-slate-200 border-b border-slate-300">
        <button 
          onClick={onBack} 
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 text-slate-800 active:scale-90 transition-all"
        >
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Ayarlar</h2>
        </div>
      </header>

      <div className="flex-1 px-8 overflow-y-auto no-scrollbar py-4">
        <div className="max-w-sm mx-auto w-full space-y-8">
          
          {/* Uygulama Ayarları */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <i className="fas fa-sliders-h"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Genel Ayarlar</h3>
            </div>
            
            <div className="space-y-4">
              {/* Harita Altlığı */}
              <div className="soft-card p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm uppercase">Varsayılan Harita</h4>
                  <p className="text-[10px] font-bold text-slate-500">Açılışta aktif olacak katman</p>
                </div>
                <select className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-0">
                  <option>Uydu</option>
                  <option>Hibrit</option>
                  <option>Topo</option>
                </select>
              </div>
            </div>
          </section>

          {/* Sistem İşlemleri */}
          <section className="space-y-4 pb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <i className="fas fa-tools"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Sistem</h3>
            </div>
            
            <div className="space-y-3">
              {/* Güncelleme Denetimi */}
              <button 
                onClick={() => {
                  setShowUpdateMsg(true);
                  setTimeout(() => setShowUpdateMsg(false), 3000);
                }}
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all shadow-sm group relative"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-sync-alt"></i>
                  </div>
                  <span className="font-black text-slate-900 text-sm uppercase">Güncelleme Denetimi</span>
                </div>
                <i className="fas fa-chevron-right text-slate-300 text-xs group-hover:translate-x-1 transition-transform"></i>
                
                {showUpdateMsg && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-12 bg-emerald-600 text-white py-2 px-4 rounded-lg text-xs font-bold animate-bounce shadow-lg z-50 whitespace-nowrap">
                    Uygulamanız günceldir. (Sürüm: {APP_VERSION})
                  </div>
                )}
              </button>
            </div>
          </section>

        </div>
      </div>
      
      <GlobalFooter />
    </div>
  );
};

export default SettingsView;
