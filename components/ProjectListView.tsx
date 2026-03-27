import React, { useState } from 'react';
import { Project } from '../types';
import GlobalFooter from './GlobalFooter';
import Header from './Header';

interface Props {
  projects: Project[];
  onBack: () => void;
  onContinue: (selectedProjects: Project[]) => void;
  onDeleteProject: (id: string) => void;
}

const ProjectListView: React.FC<Props> = ({ projects, onBack, onContinue, onDeleteProject }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleContinue = () => {
    const selectedProjects = projects.filter(p => selectedIds.has(p.id));
    if (selectedProjects.length > 0) {
      onContinue(selectedProjects);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-200 animate-in h-full overflow-y-auto no-scrollbar">
      <Header 
        title="Kayıtlı Projeler" 
        onBack={onBack} 
        sticky={true}
      />

      <div className="p-8 flex-1 flex flex-col max-w-md mx-auto w-full gap-4">
        <button 
          onClick={handleContinue}
          disabled={selectedIds.size === 0}
          className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-wider ${
            selectedIds.size > 0 
              ? 'bg-blue-600 text-white shadow-blue-600/30 active:scale-[0.98]' 
              : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
          }`}
        >
          <i className="fas fa-map-location-dot text-lg"></i>
          <span>CAD Görünümü {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</span>
          <i className="fas fa-arrow-right text-xs ml-1 opacity-70"></i>
        </button>

        {projects.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mb-2">
            <p className="text-blue-800 text-[11px] font-bold text-center">
              En az 1 proje seçiniz. Çoklu proje seçimi de yapabilirsiniz.
            </p>
          </div>
        )}
        {projects.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            <i className="fas fa-folder-open text-4xl mb-4 opacity-50"></i>
            <p className="font-medium">Henüz kayıtlı proje bulunmuyor.</p>
          </div>
        ) : (
          projects.map(project => (
            <div 
              key={project.id}
              onClick={() => toggleSelection(project.id)}
              className={`w-full bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer flex items-center gap-4 ${
                selectedIds.has(project.id) 
                  ? 'border-blue-500 shadow-md shadow-blue-500/10' 
                  : 'border-slate-100 shadow-sm hover:border-blue-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selectedIds.has(project.id)
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-slate-300 bg-slate-50'
              }`}>
                {selectedIds.has(project.id) && <i className="fas fa-check text-xs"></i>}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{project.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(project.createdAt).toLocaleDateString('tr-TR')} - {project.geojsonData ? 'KML/KMZ Yüklü' : 'Boş Proje'}
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
                    onDeleteProject(project.id);
                    const newSelection = new Set(selectedIds);
                    newSelection.delete(project.id);
                    setSelectedIds(newSelection);
                  }
                }}
                className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all shrink-0"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          ))
        )}
      </div>
      <GlobalFooter />
    </div>
  );
};

export default ProjectListView;
