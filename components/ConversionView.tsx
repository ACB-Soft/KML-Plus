import React, { useState, useRef } from 'react';
import Header from './Header';
import GlobalFooter from './GlobalFooter';
import JSZip from 'jszip';
import * as toGeoJSON from '@tmcw/togeojson';
import tokml from 'tokml';
import DxfParser from 'dxf-parser';
import DxfWriter from 'dxf-writer';
import { convertCoordinate, convertToWGS84 } from '../utils/CoordinateUtils';

interface Props {
  onBack: () => void;
}

type ConversionMode = 'KML_TO_DXF' | 'DXF_TO_KML';

const ConversionView: React.FC<Props> = ({ onBack }) => {
  const [mode, setMode] = useState<ConversionMode | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [projection, setProjection] = useState('ITRF96_3');
  const [centralMeridian, setCentralMeridian] = useState<number>(33);
  const [status, setStatus] = useState<string | null>(null);
  const [showProjectionSelector, setShowProjectionSelector] = useState(false);
  const [showMeridianSelector, setShowMeridianSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projections = [
    { id: 'ITRF96_3', name: 'ITRF96 (TM3)' },
    { id: 'ED50_3', name: 'ED50 (TM3)' },
    { id: 'ED50_6', name: 'ED50 (UTM6)' },
    { id: 'WGS84', name: 'WGS84 (Global)' }
  ];

  const meridians = (projection === 'ED50_6' ? [
    { dom: 27, zone: 35 },
    { dom: 33, zone: 36 },
    { dom: 39, zone: 37 },
    { dom: 45, zone: 38 }
  ] : [27, 30, 33, 36, 39, 42, 45].map(d => ({ dom: d })));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  const handleConvert = async () => {
    if (!file || !mode) return;

    setIsProcessing(true);
    setStatus('İşlem başlatıldı...');

    try {
      // Artificial delay for better UX as requested (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (mode === 'KML_TO_DXF') {
        await kmlToDxf(file);
      } else {
        await dxfToKml(file);
      }
      setStatus('Dönüşüm planlandığı gibi tamamlandı!');
    } catch (error) {
      console.error(error);
      setStatus('Hata oluştu: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const kmlToDxf = async (file: File) => {
    setStatus('KML verisi okunuyor...');
    let kmlContent = '';
    
    if (file.name.toLowerCase().endsWith('.kmz')) {
      const zip = await JSZip.loadAsync(file);
      const kmlFile = Object.keys(zip.files).find(f => f.toLowerCase().endsWith('.kml'));
      if (!kmlFile) throw new Error('KMZ içinde KML dosyası bulunamadı.');
      kmlContent = await zip.files[kmlFile].async('string');
    } else {
      kmlContent = await file.text();
    }

    const parser = new DOMParser();
    const kmlDom = parser.parseFromString(kmlContent, 'text/xml');
    const geojson = toGeoJSON.kml(kmlDom);

    setStatus('DXF dosyası oluşturuluyor...');
    const d = new DxfWriter();
    d.setUnits('Meters');

    const processFeature = (feature: any) => {
      if (!feature.geometry) return;

      const type = feature.geometry.type;
      const coords = feature.geometry.coordinates;
      const name = feature.properties?.name || '';
      const folder = feature.properties?.folder || '0';
      
      // Extract color if exists (typical KML color is aabbggrr)
      let dxfColor = 7; // Default White/Black
      if (feature.properties?.stroke) {
        // Simple heuristic for common colors
        const s = feature.properties.stroke.toLowerCase();
        if (s.includes('ff0000')) dxfColor = 1; // Red
        else if (s.includes('00ff00')) dxfColor = 3; // Green
        else if (s.includes('0000ff')) dxfColor = 5; // Blue
        else if (s.includes('ffff00')) dxfColor = 2; // Yellow
      }

      // Ensure layer exists and is active
      try { 
        d.addLayer(folder, dxfColor, 'CONTINUOUS'); 
      } catch(e) {
        // Layer might already exist
      }
      d.setActiveLayer(folder);

      const drawGeom = (gType: string, gCoords: any) => {
        if (gType === 'Point') {
          const { x, y } = convertCoordinate(gCoords[1], gCoords[0], projection, centralMeridian);
          d.drawPoint(x, y);
          if (name) d.drawText(x + 0.3, y + 0.3, 1.0, 0, name, folder);
        } else if (gType === 'LineString') {
          if (gCoords.length < 2) return;
          const points = gCoords.map((c: any) => {
            const { x, y } = convertCoordinate(c[1], c[0], projection, centralMeridian);
            return [x, y];
          });
          d.drawPolyline(points, false, folder);
        } else if (gType === 'Polygon') {
          if (gCoords.length === 0 || gCoords[0].length < 3) return;
          const points = gCoords[0].map((c: any) => {
            const { x, y } = convertCoordinate(c[1], c[0], projection, centralMeridian);
            return [x, y];
          });
          d.drawPolyline(points, true, folder);
        } else if (gType === 'MultiLineString') {
          gCoords.forEach((line: any) => drawGeom('LineString', line));
        } else if (gType === 'MultiPolygon') {
          gCoords.forEach((poly: any) => drawGeom('Polygon', poly));
        } else if (gType === 'MultiPoint') {
          gCoords.forEach((pt: any) => drawGeom('Point', pt));
        }
      };

      if (type === 'GeometryCollection') {
        feature.geometry.geometries.forEach((g: any) => {
          drawGeom(g.type, g.coordinates);
        });
      } else {
        drawGeom(type, coords);
      }
    };

    let featuresCount = 0;
    geojson.features.forEach((feature: any) => {
        processFeature(feature);
        featuresCount++;
    });

    if (featuresCount === 0) throw new Error('Dönüştürülecek geçerli obje bulunamadı.');

    const dxfString = d.toDxfString();
    downloadFile(dxfString, file.name.replace(/\.(kml|kmz)$/i, '') + '.dxf', 'application/dxf');
  };

  const dxfToKml = async (file: File) => {
    setStatus('DXF verisi parse ediliyor...');
    const dxfContent = await file.text();
    const parser = new DxfParser();
    const dxf = parser.parseSync(dxfContent);

    if (!dxf) throw new Error('DXF dosyası okunamadı veya bozuk.');

    setStatus('KML dosyası oluşturuluyor...');
    
    // ACI (AutoCAD Color Index) to HEX map (Basic 1-7)
    const aciToHex = (index: number) => {
      const basicColors: Record<number, string> = {
        1: '#ff0000', // Red
        2: '#ffff00', // Yellow
        3: '#00ff00', // Green
        4: '#00ffff', // Cyan
        5: '#0000ff', // Blue
        6: '#ff00ff', // Magenta
        7: '#ffffff', // White/Black (depends on background, KML handles white well)
      };
      return basicColors[index] || '#ffffff';
    };

    // Extract layer colors
    const layerColors: Record<string, number> = {};
    if (dxf.tables && dxf.tables.layer && dxf.tables.layer.layers) {
      Object.keys(dxf.tables.layer.layers).forEach(layerName => {
        layerColors[layerName] = dxf.tables.layer.layers[layerName].color || 7;
      });
    }

    const features: any[] = [];
    
    const processEntities = (entities: any[], transform?: { x: number, y: number, scaleX: number, scaleY: number, rotation: number }) => {
      if (!entities) return;
      
      entities.forEach(ent => {
        const applyTransform = (px: number, py: number) => {
            let tx = px, ty = py;
            if (transform) {
                tx *= transform.scaleX;
                ty *= transform.scaleY;
                const rad = transform.rotation * Math.PI / 180;
                const rx = tx * Math.cos(rad) - ty * Math.sin(rad);
                const ry = tx * Math.sin(rad) + ty * Math.cos(rad);
                tx = rx + transform.x;
                ty = ry + transform.y;
            }
            return { x: tx, y: ty };
        };

        try {
          // Determine color
          const colorIndex = ent.color !== undefined && ent.color !== 256 ? ent.color : (layerColors[ent.layer] || 7);
          const hexColor = aciToHex(colorIndex);

          if (ent.type === 'POINT' || ent.type === 'TEXT' || ent.type === 'MTEXT') {
            const pos = ent.position || ent.insertionPoint;
            if (!pos) return;
            const pt = applyTransform(pos.x, pos.y);
            const { lat, lng } = convertToWGS84(pt.x, pt.y, projection, centralMeridian);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [lng, lat] },
                properties: { 
                  name: ent.text || ent.value || (ent.type === 'POINT' ? 'Nokta' : 'Yazı'), 
                  layer: ent.layer,
                  type: ent.type,
                  'marker-color': hexColor,
                  stroke: hexColor
                }
              });
            }
          } else if (ent.type === 'LINE') {
            const start = ent.start || (ent.vertices && ent.vertices[0]);
            const end = ent.end || (ent.vertices && ent.vertices[1]);
            if (!start || !end) return;
            
            const pt1 = applyTransform(start.x, start.y);
            const pt2 = applyTransform(end.x, end.y);
            const p1 = convertToWGS84(pt1.x, pt1.y, projection, centralMeridian);
            const p2 = convertToWGS84(pt2.x, pt2.y, projection, centralMeridian);
            
            if (!isNaN(p1.lat) && !isNaN(p2.lat)) {
              features.push({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [[p1.lng, p1.lat], [p2.lng, p2.lat]] },
                properties: { 
                  name: 'Çizgi', 
                  layer: ent.layer,
                  stroke: hexColor
                }
              });
            }
          } else if (ent.type === 'LWPOLYLINE' || ent.type === 'POLYLINE') {
            if (!ent.vertices || ent.vertices.length < 2) return;
            const coords: [number, number][] = [];
            
            ent.vertices.forEach((v: any) => {
              const pt = applyTransform(v.x, v.y);
              const p = convertToWGS84(pt.x, pt.y, projection, centralMeridian);
              if (!isNaN(p.lat) && !isNaN(p.lng)) {
                coords.push([p.lng, p.lat]);
              }
            });

            if (coords.length < 2) return;
            const isClosed = ent.shape || ent.closed || (ent.vertices.length > 2 && ent.vertices[0].x === ent.vertices[ent.vertices.length-1].x && ent.vertices[0].y === ent.vertices[ent.vertices.length-1].y);
            
            if (isClosed) {
              if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
                coords.push(coords[0]);
              }
              features.push({
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [coords] },
                properties: { 
                  name: 'Alan', 
                  layer: ent.layer,
                  stroke: hexColor,
                  fill: hexColor,
                  'fill-opacity': 0 // Set to 0 to address user request about "unfilled appearing filled"
                }
              });
            } else {
              features.push({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords },
                properties: { 
                  name: 'Çizgi', 
                  layer: ent.layer,
                  stroke: hexColor
                }
              });
            }
          } else if (ent.type === 'CIRCLE' || ent.type === 'ARC') {
            const center = ent.center;
            if (!center) return;
            const radius = ent.radius;
            const startAngle = ent.startAngle || 0;
            const endAngle = ent.type === 'CIRCLE' ? 360 : ent.endAngle;
            
            const points: [number, number][] = [];
            let sweep = endAngle - startAngle;
            if (sweep < 0) sweep += 360;
            
            const steps = Math.max(16, Math.floor(sweep / 5));
            for (let i = 0; i <= steps; i++) {
                const angle = startAngle + (sweep * i / steps);
                const rad = angle * Math.PI / 180;
                const pt = applyTransform(center.x + radius * Math.cos(rad), center.y + radius * Math.sin(rad));
                const p = convertToWGS84(pt.x, pt.y, projection, centralMeridian);
                if (!isNaN(p.lat)) points.push([p.lng, p.lat]);
            }

            if (ent.type === 'CIRCLE') {
                features.push({
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [points] },
                    properties: { 
                      name: 'Daire', 
                      layer: ent.layer,
                      stroke: hexColor,
                      fill: hexColor,
                      'fill-opacity': 0 // Respect unfilled status
                    }
                });
            } else {
                features.push({
                    type: 'Feature',
                    geometry: { type: 'LineString', coordinates: points },
                    properties: { 
                      name: 'Yay', 
                      layer: ent.layer,
                      stroke: hexColor
                    }
                });
            }
          } else if (ent.type === 'INSERT') {
            const blockName = ent.name;
            const block = dxf.blocks && dxf.blocks[blockName];
            if (block && block.entities) {
                processEntities(block.entities, {
                    x: ent.position.x,
                    y: ent.position.y,
                    scaleX: ent.scaleX || 1,
                    scaleY: ent.scaleY || 1,
                    rotation: ent.rotation || 0
                });
            }
          }
        } catch (err) {
          console.warn('Obje işlenirken hata oluştu (atlandı):', err, ent);
        }
      });
    };

    if (dxf.entities) processEntities(dxf.entities);
    
    // Sometimes entities are only in model space block
    if (dxf.blocks) {
      const ms = dxf.blocks['*Model_Space'] || dxf.blocks['*MODEL_SPACE'];
      if (ms && ms.entities && (!dxf.entities || dxf.entities.length < ms.entities.length)) {
        processEntities(ms.entities);
      }
    }

    if (features.length === 0) throw new Error('İçe aktarılacak geçerli obje bulunamadı.');

    const geojson = { type: 'FeatureCollection', features };
    const kml = tokml(geojson);
    downloadFile(kml, file.name.replace(/\.dxf$/i, '') + '.kml', 'application/vnd.google-earth.kml+xml');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-200 animate-in h-full overflow-hidden">
      <Header 
        title={!mode ? "KML Dönüşümü" : (mode === 'KML_TO_DXF' ? 'KML → DXF' : 'DXF → KML')} 
        onBack={mode ? () => { setMode(null); setFile(null); setStatus(null); } : onBack} 
        sticky={true}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        {/* Seçim Ekranı */}
        {!mode ? (
          <div className="grid grid-cols-1 gap-4 py-4">
            <button 
              onClick={() => setMode('KML_TO_DXF')}
              className="group p-6 bg-white rounded-3xl border-2 border-transparent hover:border-blue-600 transition-all text-center space-y-4 shadow-sm active:scale-95"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i className="fas fa-file-export text-2xl"></i>
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight">KML/KMZ → DXF</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase">Google Earth'ten CAD formatına</p>
              </div>
            </button>

            <button 
              onClick={() => setMode('DXF_TO_KML')}
              className="group p-6 bg-white rounded-3xl border-2 border-transparent hover:border-emerald-600 transition-all text-center space-y-4 shadow-sm active:scale-95"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <i className="fas fa-file-import text-2xl"></i>
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight">DXF → KML/KMZ</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase">CAD Dosyasından Google Earth'e</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            {/* Dosya Seçimi */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`p-10 border-2 border-dashed rounded-[2rem] text-center cursor-pointer transition-all ${file ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-300 hover:border-blue-400'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept={mode === 'KML_TO_DXF' ? '.kml,.kmz' : '.dxf'}
                onChange={handleFileChange}
              />
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                <i className={`fas ${file ? 'fa-check' : 'fa-cloud-upload-alt'} text-2xl`}></i>
              </div>
              <p className="text-sm font-black text-slate-700 uppercase tracking-tight">
                {file ? file.name : "Dosya Seç veya Sürükle"}
              </p>
              <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase">
                {mode === 'KML_TO_DXF' ? '.KML veya .KMZ' : '.DXF'} formatında
              </p>
            </div>

            {/* Projeksiyon Seçimi - Daha Kompakt Tasarım */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Projeksiyon Seçici */}
                <div 
                  onClick={() => setShowProjectionSelector(true)}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform cursor-pointer"
                >
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Projeksiyon</label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 truncate">
                      {projections.find(p => p.id === projection)?.name.split(' (')[0] || projection}
                    </span>
                    <i className="fas fa-chevron-down text-[10px] text-blue-500"></i>
                  </div>
                </div>

                {/* DOM Seçici */}
                <div 
                  onClick={() => projection !== 'WGS84' && setShowMeridianSelector(true)}
                  className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-transform cursor-pointer ${projection === 'WGS84' ? 'opacity-50 grayscale' : 'active:scale-95'}`}
                >
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">DOM / Dilim</label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 truncate">
                      {projection === 'WGS84' ? '-' : `${centralMeridian}°`}
                    </span>
                    <i className="fas fa-chevron-down text-[10px] text-blue-500"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Seçim Overlays */}
            {(showProjectionSelector || showMeridianSelector) && (
              <div className="fixed inset-0 z-50 flex items-end justify-center animate-in fade-in duration-300">
                <div 
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                  onClick={() => { setShowProjectionSelector(false); setShowMeridianSelector(false); }}
                ></div>
                <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
                  
                  {showProjectionSelector ? (
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] text-center mb-6">Projeksiyon Sistemi</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {projections.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setProjection(p.id); setShowProjectionSelector(false); }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${projection === p.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-600'}`}
                          >
                            <span className="text-xs font-bold">{p.name}</span>
                            {projection === p.id && <i className="fas fa-check-circle"></i>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] text-center mb-6">Dilim Orta Meridyeni</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {meridians.map((m: any) => (
                          <button
                            key={m.dom}
                            onClick={() => { setCentralMeridian(m.dom); setShowMeridianSelector(false); }}
                            className={`py-4 rounded-2xl border-2 text-center transition-all ${centralMeridian === m.dom ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-600'}`}
                          >
                            <span className="text-xs font-bold">{m.dom}°</span>
                            <div className="text-[8px] opacity-70">{m.zone ? `(Z${m.zone})` : ''}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => { setShowProjectionSelector(false); setShowMeridianSelector(false); }}
                    className="w-full mt-8 py-4 bg-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-500 tracking-widest"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            )}

            {/* Durum Mesajı */}
            {status && (
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white text-center animate-in zoom-in-95">
                <p className="text-xs font-black text-slate-600 uppercase tracking-tight">{status}</p>
              </div>
            )}

            {/* Dönüştür Butonu */}
            <button 
              disabled={!file || isProcessing}
              onClick={handleConvert}
              className={`w-full py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 ${!file || isProcessing ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-blue-600 text-white shadow-blue-600/30 active:scale-95'}`}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  İŞLENİYOR...
                </>
              ) : (
                <>
                  DÖNÜŞTÜRMEYİ BAŞLAT
                  <i className="fas fa-arrow-right opacity-50"></i>
                </>
              )}
            </button>
          </div>
        )}
      </main>
      
      <GlobalFooter />
    </div>
  );
};

export default ConversionView;
