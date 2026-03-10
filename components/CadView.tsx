import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, Polyline, Polygon, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Project } from '../types';
import L from 'leaflet';
import * as turf from '@turf/turf';
import GlobalFooter from './GlobalFooter';

interface Props {
  projects: Project[];
  onBack: () => void;
}

// Component to handle bounds fitting
const FitBounds: React.FC<{ geojson: any }> = ({ geojson }) => {
  const map = useMap();
  
  useEffect(() => {
    if (geojson) {
      try {
        const layer = L.geoJSON(geojson);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (e) {
        console.error("Error fitting bounds:", e);
      }
    }
  }, [geojson, map]);

  return null;
};

const CadView: React.FC<Props> = ({ projects, onBack }) => {
  const [combinedGeoJSON, setCombinedGeoJSON] = useState<any>(null);
  const [activeTool, setActiveTool] = useState<'pan' | 'distance' | 'area'>('pan');
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measurementResult, setMeasurementResult] = useState<string | null>(null);

  useEffect(() => {
    // Combine all GeoJSON data from selected projects
    const features: any[] = [];
    
    projects.forEach(project => {
      if (project.geojsonData && project.geojsonData.features) {
        // Add project name to properties for potential styling/tooltips
        const projectFeatures = project.geojsonData.features.map((f: any) => ({
          ...f,
          properties: {
            ...f.properties,
            _projectName: project.name
          }
        }));
        features.push(...projectFeatures);
      }
    });

    if (features.length > 0) {
      setCombinedGeoJSON({
        type: 'FeatureCollection',
        features
      });
    }
  }, [projects]);

  useEffect(() => {
    if (measurePoints.length < 2) {
      setMeasurementResult(null);
      return;
    }

    if (activeTool === 'distance') {
      const line = turf.lineString(measurePoints.map(p => [p.lng, p.lat]));
      const length = turf.length(line, { units: 'meters' });
      if (length > 1000) {
        setMeasurementResult((length / 1000).toFixed(2) + ' km');
      } else {
        setMeasurementResult(length.toFixed(2) + ' m');
      }
    } else if (activeTool === 'area') {
      if (measurePoints.length >= 3) {
        const coords = measurePoints.map(p => [p.lng, p.lat]);
        coords.push(coords[0]); // close the polygon
        const poly = turf.polygon([coords]);
        const area = turf.area(poly); // in square meters
        if (area > 10000) {
          setMeasurementResult((area / 10000).toFixed(2) + ' ha');
        } else {
          setMeasurementResult(area.toFixed(2) + ' m²');
        }
      } else {
        setMeasurementResult(null);
      }
    }
  }, [measurePoints, activeTool]);

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      let popupContent = `<div class="p-2">`;
      if (feature.properties.name) {
        popupContent += `<h3 class="font-bold text-sm mb-1">${feature.properties.name}</h3>`;
      }
      if (feature.properties._projectName) {
        popupContent += `<p class="text-xs text-slate-500">Proje: ${feature.properties._projectName}</p>`;
      }
      if (feature.properties.description) {
        popupContent += `<p class="text-xs mt-1">${feature.properties.description}</p>`;
      }
      popupContent += `</div>`;
      layer.bindPopup(popupContent);
    }
  };

  const geojsonStyle = (feature: any) => {
    return {
      color: feature?.properties?.stroke || '#3b82f6',
      weight: feature?.properties?.['stroke-width'] || 3,
      opacity: feature?.properties?.['stroke-opacity'] || 0.8,
      fillColor: feature?.properties?.fill || '#3b82f6',
      fillOpacity: feature?.properties?.['fill-opacity'] || 0.2,
    };
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (activeTool === 'pan') return;
        setMeasurePoints(prev => [...prev, e.latlng]);
      }
    });
    return null;
  };

  const handleToolChange = (tool: 'pan' | 'distance' | 'area') => {
    setActiveTool(tool);
    setMeasurePoints([]);
    setMeasurementResult(null);
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
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-white/20 pointer-events-auto">
          <h2 className="text-sm font-black text-slate-900 tracking-tight">CAD Görünümü</h2>
          <p className="text-[10px] font-bold text-slate-500">{projects.length} Proje Aktif</p>
        </div>
      </div>

      {/* CAD Tools Panel */}
      <div className="absolute top-24 left-4 z-[1000] flex flex-col gap-3 pointer-events-auto">
        <button 
          onClick={() => handleToolChange('pan')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all ${activeTool === 'pan' ? 'bg-blue-600 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Kaydır"
        >
          <i className="fas fa-hand-paper"></i>
        </button>
        <button 
          onClick={() => handleToolChange('distance')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all ${activeTool === 'distance' ? 'bg-emerald-600 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Mesafe Ölç"
        >
          <i className="fas fa-ruler"></i>
        </button>
        <button 
          onClick={() => handleToolChange('area')} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all ${activeTool === 'area' ? 'bg-amber-500 text-white scale-110' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white'}`}
          title="Alan Ölç"
        >
          <i className="fas fa-draw-polygon"></i>
        </button>
      </div>

      <div className={`flex-1 w-full h-full relative ${activeTool !== 'pan' ? 'cursor-crosshair' : ''}`}>
        <MapContainer 
          center={[39.0, 35.0]} // Default center (Turkey)
          zoom={6} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
            maxZoom={22}
            maxNativeZoom={20}
          />
          
          <MapEvents />

          {combinedGeoJSON && (
            <>
              <GeoJSON 
                data={combinedGeoJSON} 
                style={geojsonStyle}
                onEachFeature={onEachFeature}
              />
              <FitBounds geojson={combinedGeoJSON} />
            </>
          )}

          {/* Measurement Drawings */}
          {activeTool === 'distance' && measurePoints.length > 0 && (
            <Polyline positions={measurePoints} color="#ef4444" weight={4} dashArray="8, 8" />
          )}
          {activeTool === 'area' && measurePoints.length > 0 && (
            <Polygon positions={measurePoints} color="#f59e0b" weight={4} fillColor="#f59e0b" fillOpacity={0.3} />
          )}
          {measurePoints.map((p, i) => (
            <CircleMarker key={i} center={p} radius={6} color="white" weight={2} fillColor={activeTool === 'distance' ? '#ef4444' : '#f59e0b'} fillOpacity={1} />
          ))}

        </MapContainer>

        {/* Measurement Result Overlay */}
        {measurementResult && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto animate-in slide-in-from-bottom-4">
            <button 
              onClick={() => setMeasurePoints([])} 
              className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3 active:scale-95 transition-all"
            >
              <span className="text-sm font-black text-slate-900 tracking-tight">
                {activeTool === 'distance' ? 'Mesafe: ' : 'Alan: '}
                {measurementResult}
              </span>
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors">
                <i className="fas fa-times text-xs"></i>
              </div>
            </button>
          </div>
        )}

        {/* Tool Hint */}
        {activeTool !== 'pan' && measurePoints.length === 0 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg pointer-events-none animate-pulse">
            <p className="text-xs font-medium text-white">
              {activeTool === 'distance' ? 'Ölçüme başlamak için haritaya tıklayın' : 'Alan çizmek için haritaya tıklayın'}
            </p>
          </div>
        )}

        {/* Footer Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#F8FAFC] z-[1000] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <GlobalFooter />
        </div>
      </div>
    </div>
  );
};

export default CadView;
