import React from 'react';
import { isInAppBrowser, isIOS, getChromeURL } from '../utils/browser';

const BrowserGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showWarning, setShowWarning] = React.useState(false);

  React.useEffect(() => {
    if (isInAppBrowser()) {
      setShowWarning(true);
    }
  }, []);

  if (!showWarning) return <>{children}</>;

  const currentUrl = window.location.href;
  const chromeUrl = getChromeURL(currentUrl);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-200 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
        <i className="fas fa-compass text-4xl text-blue-600"></i>
      </div>
      
      <h1 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
        Tarayıcı Uyumluluğu
      </h1>
      
      <p className="text-slate-600 mb-10 leading-relaxed text-sm">
        GPS hassasiyetinin en yüksek seviyede olması için uygulamayı harici bir tarayıcıda açmanız gerekmektedir.
      </p>

      <div className="w-full space-y-4 max-w-xs">
        <button 
          onClick={() => setShowWarning(false)}
          className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          Uygulamaya Devam Et
        </button>
      </div>

      <button 
        onClick={() => setShowWarning(false)}
        className="mt-12 text-slate-500 text-xs underline underline-offset-4"
      >
        Yine de devam et (Önerilmez)
      </button>
    </div>
  );
};

export default BrowserGuard;
