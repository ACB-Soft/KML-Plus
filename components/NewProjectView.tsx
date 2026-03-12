import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { kml } from '@tmcw/togeojson';
import { Project } from '../types';
import GlobalFooter from './GlobalFooter';

interface Props {
  onBack: () => void;
  onProjectCreated: (project: Project) => void;
}

const NewProjectView: React.FC<Props> = ({ onBack, onProjectCreated }) => {
  const [projectName, setProjectName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext !== 'kml' && ext !== 'kmz') {
        setError('Lütfen sadece KML veya KMZ dosyası yükleyin.');
        setFile(null);
      } else {
        setError(null);
        setFile(selectedFile);
        if (!projectName) {
          setProjectName(selectedFile.name.replace(/\.[^/.]+$/, ""));
        }
      }
    }
  };

  const parseKML = (kmlString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(kmlString, 'text/xml');
    return kml(doc);
  };

  const handleCreate = async () => {
    if (!file) {
      setError('Lütfen bir KML veya KMZ dosyası seçin.');
      return;
    }

    if (!projectName.trim()) {
      setError('Lütfen bir proje adı girin.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let geojsonData = null;

      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'kmz') {
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(file);
          
          // Find the first .kml file in the KMZ
          const kmlFile = Object.values(loadedZip.files).find(f => f.name.toLowerCase().endsWith('.kml'));
          if (kmlFile) {
            const kmlText = await kmlFile.async('text');
            geojsonData = parseKML(kmlText);
          }
          
          if (!kmlFile) {
            throw new Error('KMZ dosyası içinde geçerli KML bulunamadı.');
          }
        } else if (ext === 'kml') {
          const kmlText = await file.text();
          geojsonData = parseKML(kmlText);
        }
      }

      const newProject: Project = {
        id: Date.now().toString(),
        name: projectName.trim(),
        createdAt: Date.now(),
        geojsonData
      };

      onProjectCreated(newProject);
    } catch (err: any) {
      console.error(err);
      setError('Dosya işlenirken bir hata oluştu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] animate-in h-full overflow-y-auto no-scrollbar">
      <header className="px-8 pt-6 pb-6 flex items-center gap-5 shrink-0 bg-white shadow-sm z-10">
        <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 text-slate-800 active:scale-90 transition-all">
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Yeni Proje Yükle</h2>
        </div>
      </header>

      <div className="p-8 flex-1 flex flex-col max-w-sm mx-auto w-full gap-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">KML / KMZ Dosyası (Zorunlu)</label>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".kml,.kmz"
              className="hidden"
            />
            
            {file ? (
              <>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-file-check text-xl"></i>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-cloud-upload-alt text-xl"></i>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Dosya Seçin</p>
                  <p className="text-xs text-slate-500 mt-1">Sadece .kml veya .kmz</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Proje Adı</label>
          <input 
            type="text" 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Örn: Parsel 123"
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
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

export default NewProjectView;
