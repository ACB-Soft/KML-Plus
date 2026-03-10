import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Coordinate, SavedLocation } from '../types';
import { convertToMSL } from './GeoidUtils';
import GlobalFooter from './GlobalFooter';
import { isIOS } from '../utils/browser';

interface Props {
  onComplete: (coord: Coordinate, folderName: string, pointName: string, description: string, coordinateSystem: string) => void;
  onCancel: () => void;
  isContinuing?: boolean;
  existingLocations: SavedLocation[];
}

const GPSCapture: React.FC<Props> = ({ onComplete, onCancel, isContinuing = false, existingLocations }) => {
  const [step, setStep] = useState<'SELECT_MODE' | 'FORM' | 'READY' | 'COUNTDOWN'>(isContinuing ? 'READY' : 'SELECT_MODE');
  const [isNewProject, setIsNewProject] = useState(!isContinuing);
  const [folderName, setFolderName] = useState(localStorage.getItem('last_folder_name') || '');
  const [pointName, setPointName] = useState('');
  
  const getInitialSystem = () => {
     const savedFolder = localStorage.getItem('last_folder_name');
     if (savedFolder) {
        const proj = existingLocations.find(l => l.folderName === savedFolder);
        if (proj && proj.coordinateSystem) return proj.coordinateSystem;
     }
     return 'WGS84';
  };

  const [coordinateSystem, setCoordinateSystem] = useState(getInitialSystem());
  const [accuracyLimit, setAccuracyLimit] = useState(5.0);
  const [measurementDuration, setMeasurementDuration] = useState(5);
  const [seconds, setSeconds] = useState(5);
  const [sampleCount, setSampleCount] = useState(0);
  const [instantAccuracy, setInstantAccuracy] = useState<number | null>(null);
  const [waitingForSignal, setWaitingForSignal] = useState(true);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  
  const samplesRef = useRef<Coordinate[]>([]);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock is active');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Wake Lock released');
    }
  };

  // Warm up GPS on mount
  useEffect(() => {
    startGPSWarmup();
    return () => {
      releaseWakeLock();
    };
  }, []);

  const startGPSWarmup = () => {
    if (navigator.geolocation) {
      setWaitingForSignal(true);
      setCaptureError(null);
      
      // iOS için optimize edilmiş ayarlar
      // maximumAge: 5000 -> Son 5 saniyedeki konumu kabul et (hızlı açılış için)
      // timeout: 30000 -> GPS'in ısınması için iPhone'lara daha fazla zaman tanı
      const options = { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 };
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setInstantAccuracy(pos.coords.accuracy);
          lastPositionRef.current = pos;
          setWaitingForSignal(false);
          setCaptureError(null);
        },
        (err) => {
          console.warn("High accuracy failed, trying low accuracy...", err);
          // Yüksek hassasiyet başarısız olursa, düşük hassasiyeti dene (Fallback)
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setInstantAccuracy(pos.coords.accuracy);
              lastPositionRef.current = pos;
              setWaitingForSignal(false);
              setCaptureError(null);
            },
            (err2) => {
              let msg = `Kod: ${err2.code} - ${err2.message}`;
              if (err2.code === 1) {
                msg = "Konum izni reddedildi. Lütfen ayarlardan izin verin.";
                setShowPermissionHelp(true);
              }
              else if (err2.code === 2) msg = "Konum alınamıyor. GPS sinyali zayıf olabilir.";
              else if (err2.code === 3) msg = "Zaman aşımı. GPS yanıt vermedi.";
              setCaptureError(msg);
            },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
          );
        },
        options
      );
    } else {
      setCaptureError("Tarayıcınız konum servisini desteklemiyor.");
    }
  };

  const getNextPointName = useCallback((projName: string) => {
    const projPoints = existingLocations.filter(l => l.folderName === projName);
    return `Nokta${projPoints.length + 1}`;
  }, [existingLocations]);

  useEffect(() => {
    if (folderName) setPointName(getNextPointName(folderName));
  }, [folderName, getNextPointName]);

  useEffect(() => {
    if (folderName) {
      const existingProject = existingLocations.find(l => l.folderName === folderName);
      if (existingProject && existingProject.coordinateSystem) {
        setCoordinateSystem(existingProject.coordinateSystem);
      }
    }
  }, [folderName, existingLocations]);

  useEffect(() => {
    if (step === 'READY' || step === 'COUNTDOWN') {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setInstantAccuracy(pos.coords.accuracy);
          lastPositionRef.current = pos;
          setWaitingForSignal(false);
          setCaptureError(null);
          if (step === 'COUNTDOWN' && !waitingForSignal) {
            samplesRef.current.push({
              lat: pos.coords.latitude, lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy, altitude: pos.coords.altitude, timestamp: Date.now()
            });
            setSampleCount(samplesRef.current.length);
          }
        },
        (err) => { 
          setInstantAccuracy(null); 
          setWaitingForSignal(true);
          setCaptureError(`Kod: ${err.code} - ${err.message}`);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
    return () => { 
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [step]); // Removed waitingForSignal from deps to avoid infinite loop

  const processSamples = useCallback(() => {
    let samples = [...samplesRef.current];
    if (samples.length === 0 && lastPositionRef.current) {
      const p = lastPositionRef.current;
      samples.push({ 
        lat: p.coords.latitude, 
        lng: p.coords.longitude, 
        accuracy: p.coords.accuracy, 
        altitude: p.coords.altitude, 
        timestamp: Date.now() 
      });
    }
    if (samples.length === 0) {
      alert("Konum verisi alınamadı.");
      setStep('READY');
      return;
    }
    const avg = {
      lat: samples.reduce((a, b) => a + b.lat, 0) / samples.length,
      lng: samples.reduce((a, b) => a + b.lng, 0) / samples.length,
      accuracy: samples.reduce((a, b) => a + b.accuracy, 0) / samples.length,
      altitude: samples.reduce((a, b) => a + (b.altitude || 0), 0) / samples.length,
      timestamp: Date.now()
    };

    onComplete(avg, folderName, pointName, '', coordinateSystem);
    releaseWakeLock();
  }, [folderName, pointName, coordinateSystem, onComplete]);

  // Ref to track accuracy validity without triggering effect re-runs
  const isAccuracyOkRef = useRef(false);

  useEffect(() => {
    isAccuracyOkRef.current = instantAccuracy !== null && instantAccuracy <= accuracyLimit;
  }, [instantAccuracy, accuracyLimit]);

  useEffect(() => {
    let timer: any;
    
    if (step === 'COUNTDOWN' && !waitingForSignal) {
      timer = setInterval(() => {
        // Only decrement if accuracy is within limits
        if (isAccuracyOkRef.current) {
          setSeconds(prev => prev > 0 ? prev - 1 : 0);
        }
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [step, waitingForSignal]);

  useEffect(() => {
    if (step === 'COUNTDOWN' && seconds === 0) {
      processSamples();
    }
  }, [step, seconds, processSamples]);

  const handleStartMeasurement = () => {
    requestWakeLock();
    // Start with the last known position as the first sample
    if (lastPositionRef.current) {
      const p = lastPositionRef.current;
      samplesRef.current = [{
        lat: p.coords.latitude, 
        lng: p.coords.longitude, 
        accuracy: p.coords.accuracy, 
        altitude: p.coords.altitude, 
        timestamp: Date.now()
      }];
      setSampleCount(1);
    } else {
      samplesRef.current = [];
      setSampleCount(0);
    }

    setSeconds(measurementDuration);
    if (lastPositionRef.current && instantAccuracy !== null) setWaitingForSignal(false);
    else setWaitingForSignal(true);
    setStep('COUNTDOWN');
  };

  const StandardHeader = (title: string, subtitle: string, backTo: any) => (
    <header className="px-8 pt-6 pb-6 flex items-center gap-5 shrink-0 bg-white w-full">
      <button 
        onClick={backTo === 'HOME' ? onCancel : () => setStep(backTo)} 
        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 text-slate-800 active:scale-90 transition-all"
      >
        <i className="fas fa-chevron-left text-sm"></i>
      </button>
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{title}</h2>
      </div>
    </header>
  );

  const getAccuracyColor = (acc: number | null) => {
    if (acc === null) return "text-slate-300";
    if (acc <= 10) return "text-emerald-500";
    if (acc <= 20) return "text-amber-500";
    return "text-rose-500";
  };
  
  const getAccuracyBg = (acc: number | null) => {
     if (acc === null) return "bg-slate-50 border-slate-200";
     if (acc <= 10) return "bg-emerald-50 border-emerald-200";
     if (acc <= 20) return "bg-amber-50 border-amber-200";
     return "bg-rose-50 border-rose-200";
  };

  if (step === 'SELECT_MODE') return (
    <div className="w-full flex flex-col bg-[#F8FAFC] animate-in h-full relative overflow-y-auto no-scrollbar">
      {StandardHeader("Yeni Ölçüm Yap", "YENİ KAYIT", "HOME")}
      <div className="w-full px-8 pt-4 mx-auto">
        <div className="max-w-sm mx-auto w-full space-y-4">
          <button onClick={() => { setIsNewProject(true); setFolderName(''); setStep('FORM'); }} className="w-full py-3 md:py-4 px-5 bg-white rounded-3xl shadow-md border border-slate-100 text-left active:scale-[0.97] transition-all flex items-center gap-5">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><i className="fas fa-folder-plus text-xl"></i></div>
            <span className="font-black text-lg text-slate-900">Yeni Proje Oluştur</span>
          </button>
          <button onClick={() => { setIsNewProject(false); setStep('FORM'); }} className="w-full py-3 md:py-4 px-5 bg-white rounded-3xl shadow-md border border-slate-100 text-left active:scale-[0.97] transition-all flex items-center gap-5">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0"><i className="fas fa-folder-open text-xl"></i></div>
            <span className="font-black text-lg text-slate-900">Mevcut Proje Seç</span>
          </button>
        </div>
      </div>
      <GlobalFooter showAd={true} />
    </div>
  );

  if (step === 'FORM') return (
    <div className="w-full flex flex-col bg-[#F8FAFC] animate-in h-full relative overflow-y-auto no-scrollbar">
      {StandardHeader("Proje Bilgisi", "DETAYLAR", "SELECT_MODE")}
      <div className="w-full px-8 pt-4 mx-auto">
        <div className="max-w-sm mx-auto w-full">
          <div className="soft-card p-8 w-full space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Proje Adı</label>
            {isNewProject ? (
              <input type="text" placeholder="Örn: Saha Çalışması A" value={folderName} onChange={e => setFolderName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-base" />
            ) : (
              <select value={folderName} onChange={e => setFolderName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none appearance-none text-base">
                <option value="">Seçiniz...</option>
                {Array.from(new Set(existingLocations.map(l => l.folderName))).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Koordinat Sistemi</label>
            <select 
              value={coordinateSystem} 
              onChange={e => setCoordinateSystem(e.target.value)} 
              disabled={!isNewProject}
              className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none appearance-none text-base ${!isNewProject ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value="WGS84">WGS84 (Enlem-Boylam)</option>
              <option value="ITRF96_3">ITRF96 - 3°</option>
              <option value="ED50_3">ED50 - 3°</option>
              <option value="ED50_6">ED50 - 6°</option>
            </select>
          </div>

          <button 
            disabled={!folderName.trim()}
            onClick={() => { localStorage.setItem('last_folder_name', folderName); setStep('READY'); }} 
            className="w-full py-3 md:py-4 px-5 bg-blue-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] active:scale-95 disabled:opacity-30 transition-all shadow-xl shadow-blue-100"
          >
            ÖLÇÜME HAZIRLAN
          </button>
        </div>
      </div>
      </div>
      <GlobalFooter showAd={true} />
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center justify-around p-8 bg-white h-full text-center relative animate-in overflow-hidden">
      <button 
        onClick={() => {
          if (step === 'COUNTDOWN') {
            setStep('READY');
          } else if (isContinuing) {
            onCancel();
          } else {
            setStep('FORM');
          }
        }} 
        className="absolute left-6 md:left-8 top-6 w-11 h-11 flex items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100 text-slate-800 active:scale-90 transition-all z-20"
      >
        <i className="fas fa-chevron-left text-sm"></i>
      </button>
      
      <div className="absolute top-6 left-0 right-0 flex items-center justify-center px-20 z-10 h-11">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 truncate max-w-[280px] leading-tight">{folderName}</h3>
      </div>

      <div className="relative flex items-center justify-center flex-1 w-full max-h-[350px] mt-12">
        <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-[3.5rem] md:rounded-[4.5rem] border-8 border-slate-50 shadow-2xl flex items-center justify-center relative bg-white">
          <div className={`absolute inset-4 md:inset-6 border-2 rounded-[2.8rem] md:rounded-[3.8rem] ${instantAccuracy && instantAccuracy <= 10 ? 'border-emerald-100' : 'border-slate-50'}`}></div>
          {step === 'COUNTDOWN' && !waitingForSignal && <div className="scanner-line"></div>}
          
          <span className="text-7xl md:text-9xl font-black text-slate-900 mono-font z-10 tracking-tighter leading-none">
            {waitingForSignal ? (
              <div className="flex flex-col items-center gap-4">
                <i className="fas fa-satellite fa-spin text-blue-600 text-4xl md:text-5xl"></i>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 animate-pulse">Sinyal Bekleniyor</span>
              </div>
            ) : (
              step === 'COUNTDOWN' ? seconds : <i className={`fas fa-satellite-dish text-5xl md:text-7xl transition-all duration-700 ${getAccuracyColor(instantAccuracy)}`}></i>
            )}
          </span>

          {instantAccuracy !== null && (
             <div className={`absolute -bottom-4 px-5 py-2.5 rounded-2xl border-2 shadow-xl flex items-center gap-2.5 animate-in fade-in zoom-in ${getAccuracyBg(instantAccuracy)}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${getAccuracyColor(instantAccuracy).replace('text','bg')} animate-pulse`}></div>
                <span className={`text-[12px] md:text-[14px] font-black mono-font ${getAccuracyColor(instantAccuracy)}`}>±{instantAccuracy.toFixed(1)}m</span>
             </div>
          )}

          {captureError && (
            <div className="absolute -bottom-24 left-0 right-0 animate-in slide-in-from-top-2 flex flex-col items-center gap-2 z-30">
              <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                <i className="fas fa-exclamation-circle text-rose-500 text-xs"></i>
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">{captureError}</span>
              </div>
              <button 
                onClick={startGPSWarmup}
                className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 active:scale-95 transition-all"
              >
                <i className="fas fa-rotate-right mr-2"></i>
                Tekrar Dene
              </button>
              {captureError.includes("izni reddedildi") && (
                <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mt-1 text-center px-4 leading-tight opacity-80">
                  Safari Ayarlarından "Konum" İznini Kontrol Edin
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto w-full shrink-0 pb-6">
        {step === 'READY' ? (
          <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight block h-6 flex flex-col justify-center">
                <span>Nokta İsmi</span>
              </label>
              <input type="text" value={pointName} onChange={e => setPointName(e.target.value)} className="w-full p-3 bg-white rounded-xl font-black text-center text-lg text-slate-900 outline-none border border-slate-200 leading-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight block h-6 flex flex-col justify-center">
                  <span>Hassasiyet</span>
                  <span>Limiti (m)</span>
                </label>
                <select 
                  value={accuracyLimit} 
                  onChange={e => setAccuracyLimit(parseFloat(e.target.value))}
                  className="w-full p-3 bg-white rounded-xl font-black text-center text-lg text-slate-900 outline-none border border-slate-200 leading-none appearance-none"
                >
                  {[2, 3, 5, 10, 20, 50, 100].map(v => <option key={v} value={v}>{v}m</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight block h-6 flex flex-col justify-center">
                  <span>Ölçüm</span>
                  <span>Süresi (sn)</span>
                </label>
                <select 
                  value={measurementDuration} 
                  onChange={e => setMeasurementDuration(parseInt(e.target.value))}
                  className="w-full p-3 bg-white rounded-xl font-black text-center text-lg text-slate-900 outline-none border border-slate-200 leading-none appearance-none"
                >
                  {[5, 10, 15, 20, 30].map(v => <option key={v} value={v}>{v}sn</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleStartMeasurement} 
              disabled={instantAccuracy === null}
              className="w-full py-4 md:py-6 px-5 bg-emerald-600 text-white rounded-2xl font-black text-[13px] md:text-[14px] active:scale-[0.96] disabled:bg-slate-200 transition-all uppercase tracking-[0.25em] leading-none shadow-2xl shadow-emerald-100"
            >
              ÖLÇÜMÜ BAŞLAT
            </button>
          </div>
        ) : (
          <div className="space-y-2 py-4">
            {instantAccuracy !== null && instantAccuracy > accuracyLimit ? (
              <div className="animate-pulse space-y-2">
                <p className="font-black text-amber-600 text-[12px] md:text-[13px] uppercase tracking-[0.2em] leading-none">Hassasiyet Bekleniyor...</p>
                <p className="text-slate-400 text-[10px] font-bold leading-tight uppercase tracking-widest px-4">
                  Mevcut hassasiyet (±{instantAccuracy.toFixed(1)}m),<br/>belirlenen {accuracyLimit}m limitinden yüksek.
                </p>
              </div>
            ) : (
              <div className="animate-pulse space-y-2">
                <p className="font-black text-emerald-600 text-[12px] md:text-[13px] uppercase tracking-[0.3em] leading-none">{sampleCount} KONUM ÖRNEĞİ</p>
                <p className="text-slate-400 text-[11px] md:text-[12px] font-bold leading-none uppercase tracking-widest">SABİT TUTUN</p>
              </div>
            )}
          </div>
        )}
      </div>
      <GlobalFooter />

      {showPermissionHelp && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
              <i className="fas fa-location-dot text-rose-500 text-2xl"></i>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900">Konum İzni Gerekli</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Ölçüm yapabilmek için tarayıcınızın konum erişimine izin vermeniz gerekiyor.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Nasıl İzin Verilir?</p>
              <div className="space-y-2">
                {!isIOS() ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                      <p className="text-xs text-slate-600">Adres çubuğundaki <strong>AA</strong> veya <strong>Kilit</strong> ikonuna tıklayın.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                      <p className="text-xs text-slate-600"><strong>Web Sitesi Ayarları</strong> seçeneğine girin.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                      <p className="text-xs text-slate-600"><strong>Konum</strong> iznini "İzin Ver" olarak değiştirin.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                      <p className="text-xs text-slate-600">iPhone <strong>Ayarlar</strong> uygulamasını açın.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                      <p className="text-xs text-slate-600"><strong>Gizlilik ve Güvenlik</strong> {'>'} <strong>Konum Servisleri</strong> yolunu izleyin.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                      <p className="text-xs text-slate-600"><strong>Safari Siteleri</strong>'ni bulun ve <strong>Uygulamayı Kullanırken</strong> olarak işaretleyin.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isIOS() && (
                <button 
                  onClick={() => {
                    // iPhone'da direkt Safari ayarlarına gitmeyi dene
                    window.location.href = 'App-Prefs:SAFARI&path=Location';
                    // Fallback olarak genel ayarlar
                    setTimeout(() => {
                      window.location.href = 'app-settings:';
                    }, 500);
                  }}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                >
                  <i className="fas fa-cog"></i>
                  AYARLARI AÇ
                </button>
              )}
              <button 
                onClick={() => setShowPermissionHelp(false)}
                className={`w-full py-4 ${isIOS() ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'} rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all`}
              >
                ANLADIM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPSCapture;