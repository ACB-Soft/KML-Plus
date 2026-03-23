import React, { useState } from 'react';
import { Project } from '../types';
import GlobalFooter from './GlobalFooter';

interface Props {
  onBack: () => void;
  onProjectCreated: (project: Project) => void;
}

const CreateProjectView: React.FC<Props> = ({ onBack, onProjectCreated }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!projectName.trim()) {
      setError('Lütfen bir proje adı girin.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newProject: Project = {
        id: Date.now().toString(),
        name: projectName.trim(),
        createdAt: Date.now(),
        geojsonData: {
          type: 'FeatureCollection',
          features: []
        }
      };

      onProjectCreated(newProject);
    } catch (err: any) {
      console.error(err);
      setError('Proje oluşturulurken bir hata oluştu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-200 animate-in h-full overflow-y-auto no-scrollbar">
      <header className="px-8 pt-6 pb-6 flex items-center gap-5 shrink-0 bg-slate-200 border-b border-slate-300 z-10">
        <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 text-slate-800 active:scale-90 transition-all">
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Yeni Proje Oluştur</h2>
        </div>
      </header>

      <div className="p-8 flex-1 flex flex-col max-w-sm mx-auto w-full gap-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Proje Adı</label>
          <input 
            type="text" 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Örn: Yeni Saha Çalışması"
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            autoFocus
          />
        </div>

        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <i className="fas fa-pencil-ruler text-xl"></i>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Boş Proje</p>
            <p className="text-xs text-slate-500 mt-1">Herhangi bir dosya yüklemeden sıfırdan çizim yapmaya başlayın.</p>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <button 
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full py-4 px-5 bg-blue-600 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <><i className="fas fa-spinner fa-spin"></i> OLUŞTURULUYOR...</>
            ) : (
              <><i className="fas fa-plus"></i> PROJEYİ OLUŞTUR</>
            )}
          </button>
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
};

export default CreateProjectView;
