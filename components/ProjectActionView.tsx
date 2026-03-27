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
          className="w-full py-3 md:py-4 px-5 bg-white rounded-xl md:rounded-2xl shadow-lg shadow-blue-900/5 border border-blue-50 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-blue-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform shrink-0">
              <i className="fas fa-edit text-sm md:text-base"></i>
            </div>
            <div className="text-left">
              <h3 className="font-black text-slate-800 uppercase text-xs md:text-sm tracking-tight leading-none">Boş Proje Oluştur</h3>
              <p className="text-slate-500 text-[10px] mt-0.5 font-bold leading-tight">Manuel yeni çalışma alanı</p>
            </div>
          </div>
          <i className="fas fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform text-[10px]"></i>
        </button>

        {/* Dosya Yükle */}
        <button 
          onClick={onUploadFile}
          className="w-full py-3 md:py-4 px-5 bg-white rounded-xl md:rounded-2xl shadow-lg shadow-emerald-900/5 border border-emerald-50 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-emerald-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform shrink-0">
              <i className="fas fa-file-import text-sm md:text-base"></i>
            </div>
            <div className="text-left">
              <h3 className="font-black text-slate-800 uppercase text-xs md:text-sm tracking-tight leading-none">Dosyadan Proje Yükle</h3>
              <p className="text-slate-500 text-[10px] mt-0.5 font-bold leading-tight">KML veya KMZ dosyalarını aktarın</p>
            </div>
          </div>
          <i className="fas fa-chevron-right text-slate-300 group-hover:translate-x-1 transition-transform text-[10px]"></i>
        </button>
      </div>
      
      <GlobalFooter />
    </div>
  );
};

export default ProjectActionView;
