import React from 'react';
import { FULL_BRAND } from '../version';

interface Props {
  showAd?: boolean;
  noPadding?: boolean;
}

const GlobalFooter: React.FC<Props> = ({ showAd = false, noPadding = false }) => (
  <footer className={`py-4 md:py-6 flex flex-col items-center mt-auto safe-bottom shrink-0 bg-transparent ${noPadding ? '' : 'px-8'}`}>
    {/* Reklam Alanı */}
    {showAd && (
      <div className="w-full max-w-sm mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-full h-[100px] md:h-[120px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50"></div>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="px-2 py-0.5 bg-slate-200 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest">Sponsorlu</div>
            <i className="fas fa-rectangle-ad text-slate-300 text-2xl group-hover:scale-110 transition-transform"></i>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reklam Alanı</p>
          </div>
          {/* Dekoratif köşeler */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-slate-200 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-slate-200 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-slate-200 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-slate-200 rounded-br-lg"></div>
        </div>
      </div>
    )}

    <p className="text-[10px] md:text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] text-center w-full">
      {FULL_BRAND}
    </p>
  </footer>
);

export default GlobalFooter;
