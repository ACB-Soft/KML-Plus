import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, Polyline, Polygon, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Project } from '../types';
import L from 'leaflet';
import * as turf from '@turf/turf';
import tokml from 'tokml';
import { convertCoordinate } from '../utils/CoordinateUtils';
import { APP_VERSION } from '../version';

interface Props {
  projects: Project[];
  onBack: () => void;
}

// Component to handle bounds fitting
const FitBounds: React.FC<{ geojson: any }> = ({ geojson }) => {
  const map = useMap();
  const hasFittedRef = useRef(false);
  
  useEffect(() => {
    if (geojson && !hasFittedRef.current) {
      try {
        const layer = L.geoJSON(geojson as any);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
          hasFittedRef.current = true;
        }
      } catch (e) {
        console.error("Error fitting bounds:", e);
      }
    }
  }, [geojson, map]);

  return null;
};

const createGoogleEarthIcon = (color: string) => L.divIcon({
  className: 'google-earth-icon',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5); z-index: 2;"></div>
      <div style="width: 2px; height: 10px; background-color: white; margin-top: -2px; box-shadow: 1px 0 2px rgba(0,0,0,0.3); z-index: 1;"></div>
    </div>
  `,
  iconSize: [12, 20],
  iconAnchor: [6, 20]
});

const createCustomIcon = (color: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const userLocationIcon = L.divIcon({
  className: 'user-location-icon',
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const CadView: React.FC<Props> = ({ projects, onBack }) => {
  const [combinedGeoJSON, setCombinedGeoJSON] = useState<any>(null);
  const [snapPoints, setSnapPoints] = useState<any>(null);
  const [activeTool, setActiveTool] = useState<'pan' | 'distance' | 'area' | 'select' | 'draw_point' | 'draw_line' | 'draw_area' | 'query_point'>('pan');
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measurementResult, setMeasurementResult] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [drawnFeatures, setDrawnFeatures] = useState<any[]>([]);
  const [namingFeature, setNamingFeature] = useState<any>(null);
  const [featureNameInput, setFeatureNameInput] = useState('');
  const [selectedCoordSystem, setSelectedCoordSystem] = useState('WGS84');
  const [queryCoord, setQueryCoord] = useState<L.LatLng | null>(null);
  const [currentDrawInfo, setCurrentDrawInfo] = useState<string | null>(null);

  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    // Combine all GeoJSON data from selected projects
    const allFeatures: any[] = [];
    
    projects.forEach(project => {
      if (project.geojsonData && project.geojsonData.features) {
        const projectFeatures = project.geojsonData.features.map((f: any) => ({
          ...f,
          properties: {
            ...f.properties,
            _projectName: project.name
          }
        }));
        allFeatures.push(...projectFeatures);
      }
    });

    const layers = Array.from(new Set(allFeatures.map(f => f.properties._projectName || 'Varsayılan')));

    // Initialize visible layers if not set
    if (visibleLayers.size === 0 && layers.length > 0) {
      setVisibleLayers(new Set(layers));
    }

    // Filter features based on visibility
    // If visibleLayers is empty but we have layers, it means we're in the middle of an update
    // In that case, show all features for the first render
    const effectiveVisibleLayers = visibleLayers.size === 0 ? new Set(layers) : visibleLayers;
    const filteredFeatures = allFeatures.filter(f => effectiveVisibleLayers.has(f.properties._projectName || 'Varsayılan'));
    
    const filteredFC = {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
    
    setCombinedGeoJSON(filteredFC);
    
    // Update snap points
    try {
      const allForSnap = {
        type: 'FeatureCollection',
        features: [...filteredFeatures, ...drawnFeatures]
      };
      setSnapPoints(turf.explode(allForSnap as any));
    } catch (e) {
      console.error("Error exploding features for snap:", e);
    }
  }, [projects, visibleLayers, drawnFeatures]);

  useEffect(() => {
    if (measurePoints.length < 2) {
      setMeasurementResult(null);
      return;
    }

    if (activeTool === 'distance' || activeTool === 'draw_line') {
      const line = turf.lineString(measurePoints.map(p => [p.lng, p.lat]));
      const length = turf.length(line, { units: 'meters' });
      let result = '';
      if (length > 1000) {
        result = (length / 1000).toFixed(2) + ' km';
      } else {
        result = length.toFixed(2) + ' m';
      }
      if (activeTool === 'distance') setMeasurementResult(result);
      else setCurrentDrawInfo(result);
    } else if (activeTool === 'area' || activeTool === 'draw_area') {
      if (measurePoints.length >= 3) {
        const coords = measurePoints.map(p => [p.lng, p.lat]);
        coords.push(coords[0]); // close the polygon
        const poly = turf.polygon([coords]);
        const area = turf.area(poly); // in square meters
        let result = '';
        if (area > 10000) {
          result = (area / 10000).toFixed(2) + ' ha';
        } else {
          result = area.toFixed(2) + ' m²';
        }
        if (activeTool === 'area') setMeasurementResult(result);
        else setCurrentDrawInfo(result);
      } else {
        setMeasurementResult(null);
        setCurrentDrawInfo(null);
      }
    }
  }, [measurePoints, activeTool]);

  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on('click', (e: any) => {
      if (activeToolRef.current === 'select') {
        L.DomEvent.stopPropagation(e);
        setSelectedFeature(feature);
      }
    });
  };

  const geojsonStyle = (feature: any) => {
    // Google Earth default or KML properties
    // GE often uses yellow (#ffff00) for lines by default if not specified
    const strokeColor = feature?.properties?.stroke || feature?.properties?.['line-color'] || '#ffff00';
    const strokeWidth = feature?.properties?.['stroke-width'] || feature?.properties?.['line-width'] || 2.5;
    const strokeOpacity = feature?.properties?.['stroke-opacity'] || feature?.properties?.['line-opacity'] || 1;
    
    const fillColor = feature?.properties?.fill || feature?.properties?.['poly-color'] || '#3b82f6';
    const fillOpacity = feature?.properties?.['fill-opacity'] || feature?.properties?.['poly-opacity'] || 0.35;

    return {
      color: strokeColor,
      weight: strokeWidth,
      opacity: strokeOpacity,
      fillColor: fillColor,
      fillOpacity: fillOpacity,
      lineCap: 'round',
      lineJoin: 'round'
    };
  };

  const MapEvents = () => {
    const map = useMap();
    
    useEffect(() => {
      if (!mapInstance) setMapInstance(map);
    }, [map]);

    useMapEvents({
      click(e) {
        if (activeTool === 'pan') return;
        if (activeTool === 'select') {
          setSelectedFeature(null);
          return;
        }
        
        let finalLatLng = e.latlng;
        
        // Snapping logic
        if (snapPoints && isSnappingEnabled) {
          const clickPt = turf.point([e.latlng.lng, e.latlng.lat]);
          const nearest = turf.nearestPoint(clickPt, snapPoints);
          if (nearest && nearest.geometry) {
            const nearestLatLng = L.latLng(nearest.geometry.coordinates[1], nearest.geometry.coordinates[0]);
            const clickContainerPt = map.latLngToContainerPoint(e.latlng);
            const nearestContainerPt = map.latLngToContainerPoint(nearestLatLng);
            
            // Snap if within 20 pixels
            if (clickContainerPt.distanceTo(nearestContainerPt) < 20) {
              finalLatLng = nearestLatLng;
            }
          }
        }

        if (activeTool === 'draw_point') {
          const newFeature = {
            type: 'Feature',
            properties: { _isDrawn: true },
            geometry: {
              type: 'Point',
              coordinates: [finalLatLng.lng, finalLatLng.lat]
            }
          };
          setNamingFeature(newFeature);
          setFeatureNameInput('Yeni Nokta');
          setCurrentDrawInfo(`${finalLatLng.lat.toFixed(6)}, ${finalLatLng.lng.toFixed(6)}`);
          return;
        }

        if (activeTool === 'query_point') {
          setQueryCoord(finalLatLng);
          setSelectedFeature({
            type: 'Feature',
            properties: { 
              name: 'Koordinat Bilgisi',
              _isQuery: true
            },
            geometry: {
              type: 'Point',
              coordinates: [finalLatLng.lng, finalLatLng.lat]
            }
          });
          return;
        }
        
        setMeasurePoints(prev => [...prev, finalLatLng]);
      },
      locationfound(e) {
        setUserLocation(e.latlng);
        map.flyTo(e.latlng, 18);
      }
    });
    return null;
  };

  const handleToolChange = (tool: 'pan' | 'distance' | 'area' | 'select' | 'draw_point' | 'draw_line' | 'draw_area' | 'query_point') => {
    setActiveTool(tool);
    setMeasurePoints([]);
    setMeasurementResult(null);
    setSelectedFeature(null);
  };

  const toggleLayer = (layerName: string) => {
    const newVisible = new Set(visibleLayers);
    if (newVisible.has(layerName)) {
      newVisible.delete(layerName);
    } else {
      newVisible.add(layerName);
    }
    setVisibleLayers(newVisible);
  };

  const handleFinishDrawing = () => {
    if (measurePoints.length < 2 && activeTool === 'draw_line') return;
    if (measurePoints.length < 3 && activeTool === 'draw_area') return;

    let newFeature: any = null;

    if (activeTool === 'draw_line') {
      newFeature = {
        type: 'Feature',
        properties: { _isDrawn: true, stroke: '#8b5cf6', 'stroke-width': 4 },
        geometry: {
          type: 'LineString',
          coordinates: measurePoints.map(p => [p.lng, p.lat])
        }
      };
      setFeatureNameInput('Yeni Çizgi');
    } else if (activeTool === 'draw_area') {
      const coords = measurePoints.map(p => [p.lng, p.lat]);
      coords.push(coords[0]); // close polygon
      newFeature = {
        type: 'Feature',
        properties: { _isDrawn: true, stroke: '#8b5cf6', 'stroke-width': 3, fill: '#8b5cf6', 'fill-opacity': 0.3 },
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      };
      setFeatureNameInput('Yeni Alan');
    }

    if (newFeature) {
      setNamingFeature(newFeature);
      setMeasurePoints([]);
    }
  };

  const handlePointDrag = (index: number, e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setMeasurePoints(prev => {
      const newPoints = [...prev];
      newPoints[index] = position;
      return newPoints;
    });
  };

  const handleLocate = () => {
    if (mapInstance) {
      mapInstance.locate({ setView: true, maxZoom: 18 });
    }
  };

  const handleFitBounds = () => {
    if (mapInstance) {
      let combinedBounds: L.LatLngBounds | null = null;

      const allFeatures = [];
      if (combinedGeoJSON?.features) allFeatures.push(...combinedGeoJSON.features);
      if (drawnFeatures.length > 0) allFeatures.push(...drawnFeatures);
      
      if (allFeatures.length > 0) {
        try {
          const layer = L.geoJSON({ type: 'FeatureCollection', features: allFeatures } as any);
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            combinedBounds = bounds;
          }
        } catch (e) {
          console.error("Error fitting bounds:", e);
        }
      }

      if (combinedBounds && combinedBounds.isValid()) {
        mapInstance.fitBounds(combinedBounds, { padding: [50, 50] });
      }
    }
  };

  const handleSaveAs = () => {
    const allFeatures = [];
    if (combinedGeoJSON?.features) allFeatures.push(...combinedGeoJSON.features);
    if (drawnFeatures.length > 0) allFeatures.push(...drawnFeatures);
    
    if (allFeatures.length === 0) {
      alert("Kaydedilecek veri bulunamadı.");
      return;
    }

    const fc: any = { type: 'FeatureCollection', features: allFeatures };
    
    try {
      const kmlString = tokml(fc, {
        documentName: 'KML Plus Dışa Aktarım',
        documentDescription: 'KML Plus uygulaması ile oluşturuldu.',
        name: 'name',
        description: 'description'
      });
      
      const dataStr = "data:application/vnd.google-earth.kml+xml;charset=utf-8," + encodeURIComponent(kmlString);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "kml_plus_disa_aktarim.kml");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      console.error("KML dönüştürme hatası:", e);
      alert("Dışa aktarma sırasında bir hata oluştu.");
    }
  };

  const handleDeleteFeature = (feature: any) => {
    if (feature.properties?._isDrawn) {
      if (window.confirm('Bu çizimi silmek istediğinize emin misiniz?')) {
        setDrawnFeatures(prev => prev.filter(f => f !== feature));
        setSelectedFeature(null);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full relative overflow-hidden">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 flex items-center justify-between pointer-events-none">
        <button 
          onClick={onBack} 
          className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20 text-slate-800 active:scale-90 transition-all pointer-events-auto"
        >
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/20 pointer-events-auto flex items-center gap-3">
          <button onClick={handleSaveAs} className="flex flex-col items-center text-blue-600 hover:text-blue-700 active:scale-95 transition-all" title="Farklı Kaydet">
            <i className="fas fa-save text-lg"></i>
            <span className="text-[8px] font-black uppercase mt-0.5">Farklı Kaydet</span>
          </button>
          <div className="w-px h-8 bg-slate-200"></div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight">CAD Görünümü</h2>
            <p className="text-[10px] font-bold text-slate-500">{projects.length} Proje Aktif</p>
          </div>
        </div>
      </div>

      {/* CAD Tools Panel */}
      <div className="absolute top-24 left-4 z-[1000] flex flex-col gap-3 pointer-events-auto">
        <button 
          onClick={() => handleToolChange('pan')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${activeTool === 'pan' ? 'bg-blue-600 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Ekranı Kaydır"
        >
          <i className="fas fa-hand-paper text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Ekranı<br/>Kaydır</span>
        </button>
        <button 
          onClick={() => handleToolChange('select')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${activeTool === 'select' ? 'bg-purple-600 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Obje Seç"
        >
          <i className="fas fa-mouse-pointer text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Obje<br/>Seç</span>
        </button>
        <button 
          onClick={() => handleToolChange('query_point')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${activeTool === 'query_point' ? 'bg-indigo-600 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Koordinat Sor"
        >
          <i className="fas fa-crosshairs text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Koordinat<br/>Sor</span>
        </button>
        <button 
          onClick={() => handleToolChange('distance')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${activeTool === 'distance' ? 'bg-emerald-600 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Mesafe Hesapla"
        >
          <i className="fas fa-ruler text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Mesafe<br/>Hesapla</span>
        </button>
        <button 
          onClick={() => handleToolChange('area')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${activeTool === 'area' ? 'bg-amber-500 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Alan Hesapla"
        >
          <i className="fas fa-draw-polygon text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Alan<br/>Hesapla</span>
        </button>
        
        <button 
          onClick={() => setShowLayersPanel(!showLayersPanel)} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${showLayersPanel ? 'bg-slate-800 text-white' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white hover:text-blue-600'}`}
          title="Katmanlar"
        >
          <i className="fas fa-layer-group text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Katmanlar</span>
        </button>
        
        <div className="w-12 h-px bg-slate-300/50 my-1"></div>
        
        <button 
          onClick={handleFitBounds} 
          className="w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white hover:text-blue-600"
          title="Limit Bul"
        >
          <i className="fas fa-expand text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Limit<br/>Bul</span>
        </button>
        <button 
          onClick={handleLocate} 
          className="w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white hover:text-blue-600"
          title="Mevcut Konum"
        >
          <i className="fas fa-location-crosshairs text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Mevcut<br/>Konum</span>
        </button>
      </div>

      {/* Draw Tools Panel - Right Side */}
      <div className="absolute top-24 right-4 z-[1000] flex flex-col gap-3 pointer-events-auto">
        <button 
          onClick={() => setIsSnappingEnabled(!isSnappingEnabled)} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${isSnappingEnabled ? 'bg-orange-600 text-white' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Obje Yakala"
        >
          <i className={`fas ${isSnappingEnabled ? 'fa-magnet' : 'fa-magnet text-slate-300'} text-sm`}></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Obje<br/>Yakala</span>
        </button>

        <div className="w-12 h-px bg-slate-300/50 my-1"></div>

        <button 
          onClick={() => handleToolChange('draw_point')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${activeTool === 'draw_point' ? 'bg-violet-600 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Nokta Ekle"
        >
          <i className="fas fa-map-pin text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Nokta<br/>Ekle</span>
        </button>
        <button 
          onClick={() => handleToolChange('draw_line')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${activeTool === 'draw_line' ? 'bg-violet-600 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Çizgi Ekle"
        >
          <i className="fas fa-project-diagram text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Çizgi<br/>Ekle</span>
        </button>
        <button 
          onClick={() => handleToolChange('draw_area')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${activeTool === 'draw_area' ? 'bg-violet-600 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Alan Ekle"
        >
          <i className="fas fa-draw-polygon text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Alan<br/>Ekle</span>
        </button>

        {(activeTool === 'draw_line' || activeTool === 'draw_area') && measurePoints.length > 0 && (
          <button 
            onClick={handleFinishDrawing} 
            className="w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all bg-emerald-500 text-white hover:bg-emerald-600 mt-2 animate-in zoom-in"
            title="Çizimi Tamamla"
          >
            <i className="fas fa-check text-sm"></i>
            <span className="text-[8px] font-bold leading-none">Tamam</span>
          </button>
        )}
      </div>

      <div className={`flex-1 w-full h-full relative ${activeTool !== 'pan' && activeTool !== 'select' ? 'cursor-crosshair' : ''}`}>
        <MapContainer 
          center={[39.0, 35.0]} // Default center (Turkey)
          zoom={6} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
            maxZoom={22}
            maxNativeZoom={20}
          />
          
          <MapEvents />

          {combinedGeoJSON && (
            <GeoJSON 
              key={`geojson-${projects.map(p => p.id).join('-')}-${visibleLayers.size}-${drawnFeatures.length}`}
              data={combinedGeoJSON} 
              style={geojsonStyle}
              onEachFeature={onEachFeature}
              pointToLayer={(feature, latlng) => {
                const color = feature.properties?.stroke || feature.properties?.['marker-color'] || '#ffff00';
                return L.marker(latlng, { icon: createGoogleEarthIcon(color) });
              }}
            />
          )}
          <FitBounds geojson={combinedGeoJSON} />

          {/* Drawn Features */}
          {drawnFeatures.length > 0 && (
            <GeoJSON 
              key={JSON.stringify(drawnFeatures)}
              data={{ type: 'FeatureCollection', features: drawnFeatures }} 
              style={geojsonStyle}
              onEachFeature={onEachFeature}
              pointToLayer={(feature, latlng) => {
                return L.marker(latlng, { icon: createCustomIcon('#8b5cf6') });
              }}
            />
          )}

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={userLocationIcon} />
          )}

          {/* Measurement Drawings */}
          {(activeTool === 'distance' || activeTool === 'draw_line') && measurePoints.length > 0 && (
            <Polyline positions={measurePoints} color={activeTool === 'draw_line' ? '#8b5cf6' : '#ef4444'} weight={4} dashArray="8, 8" />
          )}
          {(activeTool === 'area' || activeTool === 'draw_area') && measurePoints.length > 0 && (
            <Polygon positions={measurePoints} color={activeTool === 'draw_area' ? '#8b5cf6' : '#f59e0b'} weight={4} fillColor={activeTool === 'draw_area' ? '#8b5cf6' : '#f59e0b'} fillOpacity={0.3} />
          )}
          {measurePoints.map((p, i) => (
            <Marker 
              key={i} 
              position={p} 
              draggable={true}
              eventHandlers={{
                dragend: (e) => handlePointDrag(i, e)
              }}
              icon={createCustomIcon(activeTool === 'distance' ? '#ef4444' : activeTool === 'area' ? '#f59e0b' : '#8b5cf6')} 
            />
          ))}

        </MapContainer>

        {/* Unified Bottom Info & Brand Area */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] flex flex-col pointer-events-auto">
          {/* Info Box Area (2/3 height equivalent) */}
          <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 min-h-[100px] flex flex-col shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            {namingFeature ? (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                    {namingFeature.geometry.type === 'Point' ? 'Nokta' : namingFeature.geometry.type === 'LineString' ? 'Çizgi' : 'Alan'} İsimlendir
                  </h3>
                  {currentDrawInfo && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{currentDrawInfo}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={featureNameInput}
                    onChange={(e) => setFeatureNameInput(e.target.value)}
                    placeholder="İsim giriniz..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      setNamingFeature(null);
                      setCurrentDrawInfo(null);
                    }}
                    className="px-4 py-2 rounded-lg font-black text-[10px] uppercase text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    onClick={() => {
                      const finalFeature = {
                        ...namingFeature,
                        properties: {
                          ...namingFeature.properties,
                          name: featureNameInput.trim() || 'İsimsiz Obje'
                        }
                      };
                      setDrawnFeatures(prev => [...prev, finalFeature]);
                      setNamingFeature(null);
                      setCurrentDrawInfo(null);
                    }}
                    className="px-4 py-2 rounded-lg font-black text-[10px] uppercase text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            ) : selectedFeature ? (
              <div className="flex flex-col animate-in fade-in">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-sm truncate">{selectedFeature.properties?.name || 'İsimsiz Obje'}</h3>
                    {selectedFeature.properties?._projectName && (
                      <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider truncate">{selectedFeature.properties._projectName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedFeature.properties?._isDrawn && (
                      <button 
                        onClick={() => handleDeleteFeature(selectedFeature)}
                        className="text-red-500 hover:text-red-700 w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    )}
                    <button onClick={() => { setSelectedFeature(null); setQueryCoord(null); }} className="text-slate-400 hover:text-slate-600 w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                </div>

                {selectedFeature.properties?._isQuery && queryCoord ? (
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistem:</label>
                      <select 
                        value={selectedCoordSystem}
                        onChange={(e) => setSelectedCoordSystem(e.target.value)}
                        className="bg-transparent border-none p-0 text-[10px] font-bold text-slate-700 focus:ring-0"
                      >
                        <option value="WGS84">WGS84 (Derece)</option>
                        <option value="ITRF96_3">ITRF96 (TM3)</option>
                        <option value="ED50_3">ED50 (TM3)</option>
                        <option value="ED50_6">ED50 (UTM6)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(() => {
                        const converted = convertCoordinate(queryCoord.lat, queryCoord.lng, selectedCoordSystem);
                        return (
                          <>
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{converted.labelY}</p>
                              <p className="text-xs font-black text-slate-900 tabular-nums">{converted.y.toFixed(selectedCoordSystem === 'WGS84' ? 6 : 3)}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{converted.labelX}</p>
                              <p className="text-xs font-black text-slate-900 tabular-nums">{converted.x.toFixed(selectedCoordSystem === 'WGS84' ? 6 : 3)}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : selectedFeature.properties?.description ? (
                  <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 max-h-20 overflow-y-auto no-scrollbar">
                    <p className="text-[10px] text-slate-700 leading-tight font-medium" dangerouslySetInnerHTML={{ __html: selectedFeature.properties.description }}></p>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center italic text-slate-400 text-[10px]">
                    Açıklama bulunmuyor
                  </div>
                )}
              </div>
            ) : measurementResult ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {activeTool === 'distance' ? 'Toplam Mesafe' : 'Hesaplanan Alan'}
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                  {measurementResult}
                </p>
                <button 
                  onClick={() => setMeasurePoints([])}
                  className="mt-2 px-3 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5"
                >
                  <i className="fas fa-trash-alt"></i> Temizle
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                  activeTool === 'distance' ? 'bg-emerald-100 text-emerald-600' :
                  activeTool === 'area' ? 'bg-amber-100 text-amber-600' :
                  activeTool === 'query_point' ? 'bg-indigo-100 text-indigo-600' :
                  activeTool === 'pan' ? 'bg-slate-100 text-slate-400' :
                  'bg-violet-100 text-violet-600'
                }`}>
                  <i className={`fas ${
                    activeTool === 'distance' ? 'fa-ruler' :
                    activeTool === 'area' ? 'fa-draw-polygon' :
                    activeTool === 'query_point' ? 'fa-crosshairs' :
                    activeTool === 'pan' ? 'fa-hand-paper' :
                    'fa-plus'
                  } text-xs`}></i>
                </div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                  {activeTool === 'distance' ? 'Mesafe Ölçümü' : 
                   activeTool === 'area' ? 'Alan Ölçümü' :
                   activeTool === 'query_point' ? 'Koordinat Sorgulama' :
                   activeTool === 'pan' ? 'Gezinti Modu' :
                   activeTool === 'select' ? 'Obje Seçim Modu' :
                   'Çizim Modu'}
                </p>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                  {activeTool === 'pan' ? 'Haritayı kaydırabilir ve yakınlaştırabilirsiniz' :
                   activeTool === 'select' ? 'Bilgi almak için bir objeye tıklayın' :
                   measurePoints.length === 0 ? 'İşleme başlamak için haritaya tıklayın' : 
                   activeTool === 'draw_line' || activeTool === 'draw_area' ? `Nokta eklemeye devam edin${currentDrawInfo ? ` (${currentDrawInfo})` : ''}` :
                   'Noktaları sürükleyerek düzenleyebilirsiniz'}
                </p>
              </div>
            )}
          </div>

          {/* Brand Info Area (1/3 height equivalent) */}
          <div className="bg-[#F8FAFC] py-3 flex items-center justify-center border-t border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">
              ACB_Soft KML Plus {APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadView;
