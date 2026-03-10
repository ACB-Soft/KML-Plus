import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { StakeoutPoint, Coordinate, StakeoutGeometry } from '../types';
import { parseKML } from '../utils/KmlParser';
import { convertCoordinate, convertToWGS84 } from '../utils/CoordinateUtils';
import { isIOS } from '../utils/browser';
import JSZip from 'jszip';
import GlobalFooter from './GlobalFooter';

// Leaflet icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Props {
  onBack: () => void;
  initialPoint?: StakeoutPoint | null;
}

// Helper Components defined outside to prevent re-mounting
const MapPopupContent = ({ name, subtitle, onGo, color }: { name: string, subtitle?: string, onGo: () => void, color?: string }) => (
  <div className="p-3 min-w-[140px] bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col gap-2">
    <div className="flex flex-col px-1">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color || '#3b82f6' }}></div>
        <h4 className="font-black text-slate-800 text-[11px] truncate leading-tight">{name}</h4>
      </div>
      {subtitle && (
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 ml-4">{subtitle}</p>
      )}
    </div>
    <button 
      onClick={onGo}
      className="w-full py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.15em] active:scale-95 transition-all"
    >
      GİT
    </button>
  </div>
);

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const BoundsUpdater = ({ points, geometries }: { points: StakeoutPoint[], geometries: StakeoutGeometry[] }) => {
  const map = useMap();
  const prevDataRef = useRef<string>("");

  useEffect(() => {
    const currentData = JSON.stringify({ 
      p: points.map(p => ({ id: p.id, lat: p.lat, lng: p.lng })), 
      g: geometries.map(g => ({ id: g.id, coords: g.coordinates.map(c => ({ lat: c.lat, lng: c.lng })) })) 
    });

    if (prevDataRef.current !== currentData) {
      const allCoords: [number, number][] = [];
      points.forEach(p => allCoords.push([p.lat, p.lng]));
      geometries.forEach(g => g.coordinates.forEach(c => allCoords.push([c.lat, c.lng])));

      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
      }
      prevDataRef.current = currentData;
    }
  }, [points, geometries, map]);
  return null;
};

const StakeoutModule: React.FC<Props> = ({ onBack, initialPoint }) => {
  const [view, setView] = useState<'MENU' | 'LIST' | 'MANUAL' | 'MAP' | 'ALL_MAP'>(initialPoint ? 'MAP' : 'MENU');
  const [sourceView, setSourceView] = useState<'LIST' | 'ALL_MAP' | 'MENU'>(initialPoint ? 'LIST' : 'MENU');
  const [points, setPoints] = useState<StakeoutPoint[]>(() => {
    const saved = localStorage.getItem('stakeout_points_v1');
    const existingPoints = saved ? JSON.parse(saved) : [];
    if (initialPoint && !existingPoints.find((p: StakeoutPoint) => p.id === initialPoint.id)) {
      return [initialPoint, ...existingPoints];
    }
    return existingPoints;
  });
  const [geometries, setGeometries] = useState<StakeoutGeometry[]>(() => {
    const saved = localStorage.getItem('stakeout_geometries_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const [activePoint, setActivePoint] = useState<StakeoutPoint | null>(initialPoint || null);
  const [confirmClear, setConfirmClear] = useState<'NONE' | 'LIST' | 'MAP'>('NONE');
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Stakeout Wake Lock is active');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log('Stakeout Wake Lock released');
    }
  };

  useEffect(() => {
    if (keepScreenOn) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => releaseWakeLock();
  }, [keepScreenOn]);

  useEffect(() => {
    if (confirmClear !== 'NONE') {
      const timer = setTimeout(() => setConfirmClear('NONE'), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  useEffect(() => {
    localStorage.setItem('stakeout_points_v1', JSON.stringify(points));
  }, [points]);

  useEffect(() => {
    localStorage.setItem('stakeout_geometries_v1', JSON.stringify(geometries));
  }, [geometries]);
  const [userPos, setUserPos] = useState<Coordinate | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  // Manual Entry State
  const [manualName, setManualName] = useState('');
  const [manualX, setManualX] = useState('');
  const [manualY, setManualY] = useState('');
  const [manualSystem, setManualSystem] = useState('WGS84');

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          timestamp: pos.timestamp
        });
        if (pos.coords.heading !== null) {
          setHeading(pos.coords.heading);
        }
      },
      (err) => {
        console.error(err);
        if (err.code === 1) {
          setShowPermissionHelp(true);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const webkitHeading = (e as any).webkitCompassHeading;
      if (webkitHeading !== undefined) {
        setHeading(webkitHeading);
      } else if (e.alpha !== null) {
        setHeading(360 - e.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const handleKmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.kmz')) {
      try {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        const kmlFile = Object.keys(contents.files).find(name => name.toLowerCase().endsWith('.kml'));
        
        if (kmlFile) {
          const kmlText = await contents.files[kmlFile].async('string');
          const result = parseKML(kmlText);
          setPoints(prev => [...prev, ...result.points]);
          setGeometries(prev => [...prev, ...result.geometries]);
          // Removed setView('LIST') as per request
        } else {
          alert("KMZ dosyası içerisinde KML bulunamadı.");
        }
      } catch (err) {
        console.error("KMZ okuma hatası:", err);
        alert("KMZ dosyası okunamadı.");
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const result = parseKML(text);
        setPoints(prev => [...prev, ...result.points]);
        setGeometries(prev => [...prev, ...result.geometries]);
        // Removed setView('LIST') as per request
      };
      reader.readAsText(file);
    }
  };

  const handleAddManual = () => {
    if (!manualName || !manualX || !manualY) return;

    let lat = 0, lng = 0;
    if (manualSystem === 'WGS84') {
      lat = parseFloat(manualY);
      lng = parseFloat(manualX);
    } else {
      const wgs = convertToWGS84(parseFloat(manualX), parseFloat(manualY), manualSystem);
      lat = wgs.lat;
      lng = wgs.lng;
    }

    if (isNaN(lat) || isNaN(lng)) {
      alert("Geçersiz koordinat girişi.");
      return;
    }

    const newPoint: StakeoutPoint = {
      id: `manual-${Date.now()}`,
      name: manualName,
      lat,
      lng,
      coordinateSystem: manualSystem,
      originalX: parseFloat(manualX),
      originalY: parseFloat(manualY)
    };

    setPoints(prev => [...prev, newPoint]);
    setManualName('');
    setManualX('');
    setManualY('');
    setView('LIST');
  };

  const calculateGuidance = () => {
    if (!userPos || !activePoint) return null;

    const R = 6371e3;
    const φ1 = userPos.lat * Math.PI/180;
    const φ2 = activePoint.lat * Math.PI/180;
    const Δφ = (activePoint.lat - userPos.lat) * Math.PI/180;
    const Δλ = (activePoint.lng - userPos.lng) * Math.PI/180;

    // North/South distance (approx)
    const distNS = Δφ * R;
    // East/West distance (approx)
    const distEW = Δλ * R * Math.cos(φ1);

    const totalDist = Math.sqrt(distNS * distNS + distEW * distEW);

    let forward = distNS;
    let right = distEW;

    if (heading !== null) {
      const rad = heading * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      // Rotate coordinates based on heading
      // Standard rotation: x' = x cos θ + y sin θ, y' = -x sin θ + y cos θ
      // Here y is North, x is East. Heading is clockwise from North.
      forward = distNS * cos + distEW * sin;
      right = distEW * cos - distNS * sin;
    }

    return {
      totalDist,
      forward,
      right,
      north: distNS,
      east: distEW
    };
  };

  const guidance = calculateGuidance();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
      <header className="px-8 pt-6 pb-6 flex items-center gap-5 shrink-0 bg-white shadow-sm z-30">
        <button 
          onClick={() => {
            if (view === 'MENU') onBack();
            else if (view === 'MAP') setView(sourceView === 'ALL_MAP' ? 'ALL_MAP' : 'LIST');
            else if (view === 'ALL_MAP') setView('MENU');
            else setView('MENU');
          }} 
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 text-slate-800 active:scale-90 transition-all"
        >
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {view === 'MENU' ? 'Aplikasyon Yap' : 
             view === 'LIST' ? 'Nokta Listesi' : 
             view === 'MANUAL' ? 'Manuel Ekle' : 
             view === 'ALL_MAP' ? 'Tüm Noktalar' : 'Aplikasyon Ekranı'}
          </h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {view === 'MENU' && (
          <div className="flex-1 flex flex-col overflow-y-auto h-full no-scrollbar px-8">
            <div className="py-8 pt-4 space-y-4 max-w-sm mx-auto w-full">
              <div className="grid grid-cols-1 gap-4">
                <button onClick={() => setView('MANUAL')} className="w-full py-2.5 md:py-3.5 px-5 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 active:scale-[0.98] transition-all">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                    <i className="fas fa-keyboard text-xl"></i>
                  </div>
                  <div className="text-left">
                    <span className="font-black text-slate-900 block">Manuel Koordinat Ekle</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">El ile Giriş</span>
                  </div>
                </button>

                <label className="w-full py-2.5 md:py-3.5 px-5 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 cursor-pointer active:scale-[0.98] transition-all">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <i className="fas fa-file-import text-xl"></i>
                  </div>
                  <div className="text-left">
                    <span className="font-black text-slate-900 block">KML / KMZ Yükle</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Dosyadan Aktar</span>
                  </div>
                  <input type="file" accept=".kml,.kmz" onChange={handleKmlUpload} className="hidden" />
                </label>

                <button onClick={() => setView('LIST')} className="w-full py-2.5 md:py-3.5 px-5 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 active:scale-[0.98] transition-all">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                    <i className="fas fa-list-ul text-xl"></i>
                  </div>
                  <div className="text-left">
                    <span className="font-black text-slate-900 block">Nokta Listesini Gör</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{points.length} Nokta Hazır</span>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    if (points.length === 0 && geometries.length === 0) alert("Haritada gösterilecek veri bulunamadı.");
                    else setView('ALL_MAP');
                  }} 
                  className="w-full py-2.5 md:py-3.5 px-5 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 active:scale-[0.98] transition-all"
                >
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                    <i className="fas fa-map-marked-alt text-xl"></i>
                  </div>
                  <div className="text-left">
                    <span className="font-black text-slate-900 block">Harita Üzerinde Gör</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{points.length} Nokta, {geometries.length} Geometri</span>
                  </div>
                </button>
              </div>
            </div>
            <GlobalFooter showAd={true} noPadding={true} />
          </div>
        )}

        {view === 'LIST' && (
          <div className="flex-1 flex flex-col overflow-y-auto h-full no-scrollbar px-8">
            <div className="py-8 pt-4 space-y-4 max-w-sm mx-auto w-full">
              {points.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
                  <i className="fas fa-ghost text-3xl text-slate-200"></i>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Liste Boş</p>
                </div>
              ) : (
                points.map(p => (
                  <div key={p.id} className="soft-card py-3 md:py-4 px-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4 flex-1">
                      <div>
                        <h4 className="font-black text-slate-800">{p.name}</h4>
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold text-slate-400 mono-font">
                            {p.coordinateSystem === 'WGS84' ? `Boy: ${p.originalX?.toFixed(6)}` : `Y: ${p.originalY?.toFixed(3)}`}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mono-font">
                            {p.coordinateSystem === 'WGS84' ? `Enl: ${p.originalY?.toFixed(6)}` : `X: ${p.originalX?.toFixed(3)}`}
                          </p>
                          <p className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">
                            {p.coordinateSystem?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { 
                          setSourceView('LIST');
                          setActivePoint(p); 
                          setView('MAP'); 
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest active:scale-95 transition-all"
                      >
                        GİT
                      </button>
                      <button 
                        onClick={() => setPoints(prev => prev.filter(pt => pt.id !== p.id))}
                        className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <i className="fas fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
              <button 
                onClick={() => { 
                  if (confirmClear === 'LIST') {
                    localStorage.removeItem('stakeout_points_v1');
                    localStorage.removeItem('stakeout_geometries_v1');
                    setPoints([]); 
                    setGeometries([]); 
                    setConfirmClear('NONE');
                  } else {
                    setConfirmClear('LIST');
                  }
                }}
                className={`w-full py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${confirmClear === 'LIST' ? 'text-red-600 bg-red-50 rounded-2xl' : 'text-slate-400 hover:text-red-500'}`}
              >
                {confirmClear === 'LIST' ? 'EMİN MİSİNİZ? (TEKRAR TIKLAYIN)' : 'LİSTEYİ TEMİZLE'}
              </button>
            </div>
            <GlobalFooter noPadding={true} />
          </div>
        )}

        {view === 'MANUAL' && (
          <div className="flex-1 flex flex-col overflow-y-auto h-full no-scrollbar px-8">
            <div className="py-8 pt-4 mx-auto max-w-sm w-full">
              <div className="soft-card p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Nokta Adı</label>
                  <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Örn: P1" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Koordinat Sistemi</label>
                  <select value={manualSystem} onChange={e => setManualSystem(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none appearance-none">
                    <option value="WGS84">WGS84 (Enlem-Boylam)</option>
                    <option value="ITRF96_3">ITRF96 - 3°</option>
                    <option value="ED50_3">ED50 - 3°</option>
                    <option value="ED50_6">ED50 - 6°</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                      {manualSystem === 'WGS84' ? 'Boylam (X)' : 'Sağa (Y)'}
                    </label>
                    <input type="number" value={manualX} onChange={e => setManualX(e.target.value)} placeholder="0.000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">
                      {manualSystem === 'WGS84' ? 'Enlem (Y)' : 'Yukarı (X)'}
                    </label>
                    <input type="number" value={manualY} onChange={e => setManualY(e.target.value)} placeholder="0.000" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all" />
                  </div>
                </div>
                <button onClick={handleAddManual} className="w-full py-2.5 md:py-3.5 px-5 bg-blue-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-blue-100 active:scale-95 transition-all">
                  LİSTEYE EKLE
                </button>
              </div>
            </div>
            <GlobalFooter noPadding={true} />
          </div>
        )}

        {view === 'ALL_MAP' && (
          <div className="flex flex-col h-full relative">
            <div className="flex-1 relative z-10">
              <MapContainer 
                center={[userPos?.lat || 39, userPos?.lng || 35]} 
                zoom={19} 
                maxZoom={22}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                  attribution='&copy; Google'
                  maxZoom={22}
                  maxNativeZoom={20}
                />
                
                {geometries.map(g => (
                  <React.Fragment key={g.id}>
                    {g.type === 'LineString' ? (
                      <Polyline 
                        positions={g.coordinates.map(c => [c.lat, c.lng])} 
                        pathOptions={{ color: g.color || '#3b82f6', weight: 3 }} 
                      />
                    ) : (
                      <Polygon 
                        positions={g.coordinates.map(c => [c.lat, c.lng])} 
                        pathOptions={{ color: g.color || '#3b82f6', fillColor: g.color || '#3b82f6', fillOpacity: 0.1, weight: 2 }} 
                      />
                    )}
                    {/* Vertices for snapping */}
                    {g.coordinates.map((c, idx) => (
                      <Circle
                        key={`${g.id}-v-${idx}`}
                        center={[c.lat, c.lng]}
                        radius={1.5}
                        pathOptions={{ color: 'white', fillColor: g.color || '#3b82f6', fillOpacity: 1, weight: 1 }}
                      >
                        <Popup closeButton={false} className="custom-leaflet-popup">
                          <MapPopupContent 
                            name={g.name}
                            subtitle={`Köşe ${idx + 1}`}
                            color={g.color}
                            onGo={() => {
                              const newPt: StakeoutPoint = {
                                id: `snap-${Date.now()}`,
                                name: `${g.name} - K${idx + 1}`,
                                lat: c.lat,
                                lng: c.lng,
                                coordinateSystem: 'WGS84',
                                originalX: c.lng,
                                originalY: c.lat
                              };
                              setSourceView('ALL_MAP');
                              setActivePoint(newPt);
                              setView('MAP');
                            }}
                          />
                        </Popup>
                      </Circle>
                    ))}
                  </React.Fragment>
                ))}

                {points.map(p => (
                  <Marker key={p.id} position={[p.lat, p.lng]} icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="width: 12px; height: 12px; background: ${p.color || '#3b82f6'}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                  })}>
                    <Popup closeButton={false} className="custom-leaflet-popup">
                      <MapPopupContent 
                        name={p.name}
                        color={p.color}
                        onGo={() => { 
                          setSourceView('ALL_MAP');
                          setActivePoint(p); 
                          setView('MAP'); 
                        }}
                      />
                    </Popup>
                  </Marker>
                ))}

                {userPos && (
                  <>
                    <Circle 
                      center={[userPos.lat, userPos.lng]} 
                      radius={userPos.accuracy} 
                      pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }} 
                    />
                    <Marker 
                      position={[userPos.lat, userPos.lng]} 
                      icon={L.divIcon({
                        className: 'user-marker',
                        html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3); transform: rotate(${heading || 0}deg);">
                                <div style="position: absolute; top: -10px; left: 5px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 10px solid #3b82f6;"></div>
                               </div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                      })}
                    />
                  </>
                )}
                <BoundsUpdater points={points} geometries={geometries} />
              </MapContainer>
            </div>
            <div className="absolute bottom-0 left-0 right-0 z-20 px-8 py-4 bg-white/95 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.1)] border-t border-slate-100 flex items-center justify-between">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {points.length} Nokta, {geometries.length} Geometri
               </p>
               <button 
                 onClick={() => {
                   if (confirmClear === 'MAP') {
                     localStorage.removeItem('stakeout_points_v1');
                     localStorage.removeItem('stakeout_geometries_v1');
                     setPoints([]);
                     setGeometries([]);
                     setConfirmClear('NONE');
                     setView('MENU');
                   } else {
                     setConfirmClear('MAP');
                   }
                 }}
                 className={`px-3 py-1.5 text-[9px] font-black rounded-lg uppercase tracking-wider border transition-all active:scale-95 ${confirmClear === 'MAP' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-600 border-red-100'}`}
               >
                 {confirmClear === 'MAP' ? 'EMİN MİSİNİZ?' : 'EKRANI TEMİZLE'}
               </button>
            </div>
          </div>
        )}

        {view === 'MAP' && activePoint && (
          <div className="flex flex-col h-full relative">
            <div className="flex-1 relative z-10">
              <MapContainer 
                center={[activePoint.lat, activePoint.lng]} 
                zoom={19} 
                maxZoom={22}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                  attribution='&copy; Google'
                  maxZoom={22}
                  maxNativeZoom={20}
                />
                
                {geometries.map(g => (
                  <React.Fragment key={g.id}>
                    {g.type === 'LineString' ? (
                      <Polyline 
                        positions={g.coordinates.map(c => [c.lat, c.lng])} 
                        pathOptions={{ color: g.color || '#3b82f6', weight: 2, opacity: 0.7, dashArray: '5, 10' }} 
                      />
                    ) : (
                      <Polygon 
                        positions={g.coordinates.map(c => [c.lat, c.lng])} 
                        pathOptions={{ color: g.color || '#3b82f6', fillColor: g.color || '#3b82f6', fillOpacity: 0.2, weight: 1, opacity: 0.6 }} 
                      />
                    )}
                  </React.Fragment>
                ))}

                <Marker position={[activePoint.lat, activePoint.lng]} />
                {userPos && (
                  <>
                    <Circle 
                      center={[userPos.lat, userPos.lng]} 
                      radius={userPos.accuracy} 
                      pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }} 
                    />
                    <Marker 
                      position={[userPos.lat, userPos.lng]} 
                      icon={L.divIcon({
                        className: 'user-marker',
                        html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3); transform: rotate(${heading || 0}deg);">
                                <div style="position: absolute; top: -10px; left: 5px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 10px solid #3b82f6;"></div>
                               </div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                      })}
                    />
                  </>
                )}
                <MapUpdater center={[activePoint.lat, activePoint.lng]} />
              </MapContainer>

              {/* Visual Guidance Compass Overlay */}
              {guidance && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-white/30 bg-slate-900/10 backdrop-blur-[2px] relative flex items-center justify-center">
                    {/* Crosshair lines */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[1px] bg-white/20"></div>
                      <div className="h-full w-[1px] bg-white/20"></div>
                    </div>

                    {/* Target Indicator Dot */}
                    {(() => {
                      const maxVisualDist = guidance.totalDist < 5 ? 5 : Math.max(15, guidance.totalDist);
                      const scale = (guidance.totalDist < 5 ? 80 : 40) / maxVisualDist;
                      const topOffset = -guidance.forward * scale;
                      const leftOffset = guidance.right * scale;
                      
                      // Clamp to circle boundary
                      const distFromCenter = Math.sqrt(topOffset * topOffset + leftOffset * leftOffset);
                      const maxRadius = guidance.totalDist < 5 ? 90 : 80;
                      let finalTop = topOffset;
                      let finalLeft = leftOffset;
                      
                      if (distFromCenter > maxRadius) {
                        finalTop = (topOffset / distFromCenter) * maxRadius;
                        finalLeft = (leftOffset / distFromCenter) * maxRadius;
                      }

                      return (
                        <div 
                          className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 flex items-center justify-center ${guidance.totalDist < 2.0 ? 'bg-emerald-500 animate-ping' : 'bg-blue-600'}`}
                          style={{ 
                            transform: `translate(${finalLeft}px, ${finalTop}px)`,
                          }}
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      );
                    })()}

                    {/* Center Point (User) */}
                    <div className="w-4 h-4 bg-white rounded-full border-2 border-blue-600 shadow-md z-10"></div>
                    
                    {/* Distance Label */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-100 shadow-xl">
                       <span className="text-[11px] font-black text-slate-900 mono-font">{guidance.totalDist.toFixed(1)}m</span>
                    </div>

                    {/* Close-up Mode Indicator */}
                    {guidance.totalDist < 5 && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                        <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                          YAKIN ÇEKİM MODU
                        </div>
                        {guidance.totalDist < 2.0 && (
                          <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 animate-bounce">
                            HEDEFE ULAŞILDI
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-4 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 rounded-t-[2.5rem] -mt-8">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-slate-900 truncate leading-tight">{activePoint.name}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seçili Nokta</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setKeepScreenOn(!keepScreenOn)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${keepScreenOn ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-slate-100 text-slate-400 shadow-slate-100'}`}
                    title={keepScreenOn ? "Ekranı Açık Tut Aktif" : "Ekranı Açık Tut Devre Dışı"}
                  >
                    <i className={`fas ${keepScreenOn ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
                  </button>
                  <button 
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${activePoint.lat},${activePoint.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-slate-200"
                  >
                    <i className="fas fa-route text-[10px]"></i>
                    <span className="text-[9px] font-black uppercase tracking-wider">Navigasyon</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                  <div className="text-xl font-black text-emerald-600 mono-font leading-none">
                    {userPos ? `±${userPos.accuracy.toFixed(1)}` : '---'}
                    <span className="text-[10px] ml-1">m</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hassasiyet</p>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                  <div className="text-xl font-black text-blue-600 mono-font leading-none">
                    {guidance ? guidance.totalDist.toFixed(1) : '---'}
                    <span className="text-[10px] ml-1">m</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mesafe</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">
                    {heading !== null ? 'İLERİ / GERİ' : 'KUZEY / GÜNEY'}
                  </div>
                  <div className={`text-base font-black mono-font ${guidance && (heading !== null ? guidance.forward : guidance.north) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {guidance ? Math.abs(heading !== null ? guidance.forward : guidance.north).toFixed(1) : '0.0'}
                    <span className="text-[10px] ml-1">m</span>
                    <span className="text-[9px] ml-2 opacity-60">
                      {guidance ? ((heading !== null ? guidance.forward : guidance.north) > 0 ? (heading !== null ? 'İLERİ' : 'KUZEY') : (heading !== null ? 'GERİ' : 'GÜNEY')) : ''}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">
                    {heading !== null ? 'SAĞ / SOL' : 'DOĞU / BATI'}
                  </div>
                  <div className={`text-base font-black mono-font ${guidance && (heading !== null ? guidance.right : guidance.east) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {guidance ? Math.abs(heading !== null ? guidance.right : guidance.east).toFixed(1) : '0.0'}
                    <span className="text-[10px] ml-1">m</span>
                    <span className="text-[9px] ml-2 opacity-60">
                      {guidance ? ((heading !== null ? guidance.right : guidance.east) > 0 ? (heading !== null ? 'SAĞ' : 'DOĞU') : (heading !== null ? 'SOL' : 'BATI')) : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              {!heading && (
                <p className="mt-3 text-[8px] text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                  Pusula verisi bekleniyor... (K/G/D/B modunda)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {showPermissionHelp && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
              <i className="fas fa-location-dot text-rose-500 text-2xl"></i>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900">Konum İzni Gerekli</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Aplikasyon yapabilmek için tarayıcınızın konum erişimine izin vermeniz gerekiyor.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Nasıl İzin Verilir?</p>
              <div className="space-y-2">
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
                {isIOS() && (
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">!</div>
                      <p className="text-[11px] text-slate-500 italic">iPhone kullanıyorsanız, aşağıdaki butonu kullanarak direkt uygulama ayarlarına gidebilirsiniz.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isIOS() && (
                <button 
                  onClick={() => window.location.href = 'app-settings:'}
                  className="w-full py-2.5 md:py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                >
                  <i className="fas fa-cog"></i>
                  CİHAZ AYARLARINI AÇ
                </button>
              )}
              <button 
                onClick={() => setShowPermissionHelp(false)}
                className={`w-full py-2.5 md:py-3.5 ${isIOS() ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-white'} rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all`}
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

export default StakeoutModule;
