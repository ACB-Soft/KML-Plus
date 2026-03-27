import React from 'react';
import GlobalFooter from './GlobalFooter';
import Header from './Header';

interface Props {
  onBack: () => void;
  onSelectBlank: () => void;
  onSelectUpload: () => void;
}

const ProjectCreationTypeView: React.FC<Props> = ({ onBack, onSelectBlank, onSelectUpload }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-200 animate-in h-full overflow-y-auto no-scrollbar">
      <Header title="Proje Oluştur" onBack={onBack} />

      <div className="p-8 flex-1 flex flex-col max-w-sm mx-auto w-full gap-6 justify-center">
        {/* Boş Proje */}
        <button 
          onClick={onSelectBlank}
          className="w-full p-4 bg-white rounded-2xl shadow-lg border border-slate-100 active:scale-[0.98] transition-all flex flex-col items-center text-center gap-3 group hover:border-blue-200"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <i className="fas fa-pencil-ruler text-xl"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Sıfırdan Oluştur</h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">Boş bir proje açın ve çizim yapmaya başlayın.</p>
          </div>
        </button>

        {/* Dosyadan Yükle */}
        <button 
          onClick={onSelectUpload}
          className="w-full p-4 bg-white rounded-2xl shadow-lg border border-slate-100 active:scale-[0.98] transition-all flex flex-col items-center text-center gap-3 group hover:border-emerald-200"
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <i className="fas fa-file-import text-xl"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Dosyadan Yükle</h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed">KML veya KMZ dosyalarınızı sisteme aktarın.</p>
          </div>
        </button>
      </div>
      <GlobalFooter />
    </div>
  );
};

export default ProjectCreationTypeView;
