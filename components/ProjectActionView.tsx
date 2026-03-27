import React from 'react';
import Header from './Header';
import GlobalFooter from './GlobalFooter';
import { FULL_BRAND } from '../version';

interface Props {
  onBack: () => void;
  onCreateManual: () => void;
  onUploadFile: () => void;
}

const ProjectActionView: React.FC<Props> = ({ onBack, onCreateManual, onUploadFile }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-200 animate-in h-full overflow-hidden">
      <Header 
        title="Proje Oluştur" 
        onBack={onBack} 
        sticky={true}
      />

      <div className="flex-1 flex flex-col items-center justify-start pt-12 p-8 max-w-md mx-auto w-full gap-4">
        {/* Manuel Proje Oluştur */}
        <button 
          onClick={onCreateManual}
          className="w-full h-32 p-6 bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-blue-50 flex items-center gap-5 group active:scale-[0.98] transition-all hover:border-blue-200"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform shrink-0">
            <i className="fas fa-edit text-xl"></i>
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-wide">Boş Proje Oluştur</h3>
            <p className="text-slate-500 text-[11px] mt-1 font-bold leading-tight">Manuel olarak isim vererek yeni bir çalışma alanı açın.</p>
          </div>
          <i className="fas fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform"></i>
        </button>

        {/* Dosya Yükle */}
        <button 
          onClick={onUploadFile}
          className="w-full h-32 p-6 bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-50 flex items-center gap-5 group active:scale-[0.98] transition-all hover:border-emerald-200"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform shrink-0">
            <i className="fas fa-file-import text-xl"></i>
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-wide">Dosyadan Proje Yükle</h3>
            <p className="text-slate-500 text-[11px] mt-1 font-bold leading-tight">Cihazınızdaki KML veya KMZ dosyalarını içe aktarın.</p>
          </div>
          <i className="fas fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>
      
      <GlobalFooter />
    </div>
  );
};

export default ProjectActionView;
