import React from 'react';
import Header from './Header';
import GlobalFooter from './GlobalFooter';

interface Props {
  onBack: () => void;
}

const ConversionView: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col bg-slate-200 animate-in h-full overflow-hidden">
      <Header 
        title="KML Dönüşümü" 
        onBack={onBack} 
        sticky={true}
      />

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-xl">
          <i className="fas fa-tools text-4xl text-orange-600 animate-bounce"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Hazırlanıyor</h2>
        <p className="text-slate-500 font-medium max-w-xs mx-auto">
          KML dönüşüm araçları çok yakında burada olacak. Lütfen takipte kalın!
        </p>
        
        <div className="mt-12 flex gap-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
      
      <GlobalFooter />
    </div>
  );
};

export default ConversionView;
