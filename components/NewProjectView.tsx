import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { kml } from '@tmcw/togeojson';
import { Project } from '../types';
import GlobalFooter from './GlobalFooter';
import Header from './Header';

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

  const normalizeGeoJSON = (data: any) => {
    if (!data) return { type: 'FeatureCollection', features: [] };
    if (data.type === 'FeatureCollection') return data;
    if (data.type === 'Feature') return { type: 'FeatureCollection', features: [data] };
    if (data.type === 'GeometryCollection') {
      return {
        type: 'FeatureCollection',
        features: (data.geometries || []).map((g: any) => ({
          type: 'Feature',
          geometry: g,
          properties: {}
        }))
      };
    }
    if (Array.isArray(data)) return { type: 'FeatureCollection', features: data };
    return { type: 'FeatureCollection', features: [] };
  };

  const parseKML = (kmlString: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(kmlString, 'text/xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        console.error('KML Parsing Error:', parserError.textContent);
        throw new Error('KML dosyası ayrıştırılamadı. Geçersiz XML formatı.');
      }

      const geojson = kml(doc);
      
      // Ensure we have a FeatureCollection and it's not empty if possible
      if (!geojson || (geojson.type === 'FeatureCollection' && (!geojson.features || geojson.features.length === 0))) {
        console.warn('Parsed GeoJSON is empty or invalid');
      }
      
      return geojson;
    } catch (err) {
      console.error('Error in parseKML:', err);
      throw err;
    }
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
          
          // Standard KMZ usually has doc.kml at the root
          let kmlFile = loadedZip.file("doc.kml");
          
          // If not found, look for any .kml file
          if (!kmlFile) {
            kmlFile = Object.values(loadedZip.files).find(f => f.name.toLowerCase().endsWith('.kml')) || null;
          }

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
        geojsonData: normalizeGeoJSON(geojsonData)
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
    <div className="flex-1 flex flex-col bg-slate-200 animate-in h-full overflow-y-auto no-scrollbar">
      <Header title="Yeni Proje Yükle" onBack={onBack} />

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
              accept=".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz,application/zip"
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
