import React, { useState } from 'react';
import { SavedLocation } from '../types';
import { downloadKML } from './KMLUtils';
import { downloadExcel } from './ExcelUtils';
import { downloadTXT } from './TxtUtils';

interface Props {
  locations: SavedLocation[];
}

const ExportUnifiedView: React.FC<Props> = ({ locations }) => {
  const uniqueFolders: string[] = Array.from(new Set(locations.map(l => l.folderName)));
  const [selectedFolder, setSelectedFolder] = useState<string>(uniqueFolders.length > 0 ? uniqueFolders[0] : '');
  
  const getFiltered = () => locations.filter(l => l.folderName === selectedFolder);

  const hasSelection = !!selectedFolder;

  return (
    <div className="space-y-8 pb-10 max-w-sm mx-auto w-full">
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Proje Seçimi</h4>
        
        {uniqueFolders.length > 0 ? (
          <div className="relative">
             <select 
               value={selectedFolder}
               onChange={(e) => setSelectedFolder(e.target.value)}
               className="w-full p-4 rounded-3xl border border-slate-200 bg-white font-bold text-slate-800 appearance-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm text-sm"
             >
               {uniqueFolders.map(name => (
                 <option key={name} value={name}>{name} ({locations.filter(l => l.folderName === name).length} Nokta)</option>
               ))}
             </select>
             <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <i className="fas fa-chevron-down"></i>
             </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Kayıtlı Proje Bulunamadı</p>
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-slate-100 pt-8">
        <button 
          onClick={() => downloadKML(getFiltered())} 
          disabled={!hasSelection} 
          className={`w-full py-3 md:py-4 px-5 text-white rounded-3xl font-bold text-xs uppercase flex items-center gap-5 transition-all duration-300 shadow-xl ${
            hasSelection ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-300 opacity-40 grayscale cursor-not-allowed shadow-none'
          }`}
        >
          <i className="fas fa-earth-europe text-xl"></i>
          <span>Google Earth (.KML)</span>
        </button>

        <button 
          onClick={() => downloadExcel(getFiltered())} 
          disabled={!hasSelection} 
          className={`w-full py-3 md:py-4 px-5 text-white rounded-3xl font-bold text-xs uppercase flex items-center gap-5 transition-all duration-300 shadow-xl ${
            hasSelection ? 'bg-emerald-600 shadow-emerald-200' : 'bg-slate-300 opacity-40 grayscale cursor-not-allowed shadow-none'
          }`}
        >
          <i className="fas fa-file-excel text-xl"></i>
          <span>Excel Dökümanı (.XLSX)</span>
        </button>

        <button 
          onClick={() => downloadTXT(getFiltered())} 
          disabled={!hasSelection} 
          className={`w-full py-3 md:py-4 px-5 text-white rounded-3xl font-bold text-xs uppercase flex items-center gap-5 transition-all duration-300 shadow-xl ${
            hasSelection ? 'bg-sky-600 shadow-sky-200' : 'bg-slate-300 opacity-40 grayscale cursor-not-allowed shadow-none'
          }`}
        >
          <i className="fas fa-file-lines text-xl"></i>
          <span>Metin Belgesi (.TXT)</span>
        </button>
      </div>
    </div>
  );
};

export default ExportUnifiedView;