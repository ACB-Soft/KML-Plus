import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, Polyline, Polygon, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Project } from '../types';
import L from 'leaflet';
import * as turf from '@turf/turf';
import tokml from 'tokml';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import GlobalFooter from './GlobalFooter';

interface Props {
  projects: Project[];
  onBack: () => void;
}

// Component to handle bounds fitting
const FitBounds: React.FC<{ geojson: any, rasterBounds: any[] }> = ({ geojson, rasterBounds }) => {
  const map = useMap();
  
  useEffect(() => {
    let combinedBounds: L.LatLngBounds | null = null;

    if (geojson) {
      try {
        const layer = L.geoJSON(geojson as any);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          combinedBounds = bounds;
        }
      } catch (e) {
        console.error("Error fitting bounds:", e);
      }
    }

    if (rasterBounds && rasterBounds.length > 0) {
      rasterBounds.forEach(b => {
        if (b && b.isValid()) {
          if (!combinedBounds) {
            combinedBounds = L.latLngBounds(b.getSouthWest(), b.getNorthEast());
          } else {
            combinedBounds.extend(b);
          }
        }
      });
    }

    if (combinedBounds && combinedBounds.isValid()) {
      map.fitBounds(combinedBounds, { padding: [50, 50] });
    }
  }, [geojson, rasterBounds, map]);

  return null;
};

// Component to render raster layers
const RasterLayersRenderer: React.FC<{ layers: any[] }> = ({ layers }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !layers || layers.length === 0) return;
    
    layers.forEach(layer => {
      if (!map.hasLayer(layer)) {
        layer.addTo(map);
      }
    });
    
    return () => {
      layers.forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map, layers]);
  
  return null;
};

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
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [layerStructure, setLayerStructure] = useState<any[]>([]);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measurementResult, setMeasurementResult] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [drawnFeatures, setDrawnFeatures] = useState<any[]>([]);
  const [namingFeature, setNamingFeature] = useState<any>(null);
  const [featureNameInput, setFeatureNameInput] = useState('');
  const [rasterLayers, setRasterLayers] = useState<any[]>([]);
  const [rasterBoundsList, setRasterBoundsList] = useState<L.LatLngBounds[]>([]);

  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

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
      const fc = {
        type: 'FeatureCollection',
        features
      };
      
      // Extract layer structure from folder paths if available, or project names
      const layers = Array.from(new Set(features.map(f => f.properties._projectName || 'Varsayılan')));
      setLayerStructure(layers);
      if (visibleLayers.size === 0) {
        setVisibleLayers(new Set(layers));
      }

      const filteredFeatures = features.filter(f => visibleLayers.has(f.properties._projectName || 'Varsayılan'));
      const filteredFC = { ...fc, features: filteredFeatures };
      
      setCombinedGeoJSON(filteredFC);
      try {
        setSnapPoints(turf.explode(filteredFC as any));
      } catch (e) {
        console.error("Error exploding features for snap:", e);
      }
    } else {
      setCombinedGeoJSON(null);
      setSnapPoints(null);
    }

    // Load raster layers
    const loadRasters = async () => {
      const newRasterLayers: any[] = [];
      const newRasterBounds: L.LatLngBounds[] = [];
      
      for (const project of projects) {
        if (project.rasterLayers && project.rasterLayers.length > 0) {
          for (const rl of project.rasterLayers) {
            try {
              const georaster = await parseGeoraster(rl.data);
              const layer = new GeoRasterLayer({
                georaster: georaster,
                opacity: 0.8,
                resolution: 256
              });
              newRasterLayers.push(layer);
              
              const bounds = L.latLngBounds(
                L.latLng(georaster.ymin, georaster.xmin),
                L.latLng(georaster.ymax, georaster.xmax)
              );
              newRasterBounds.push(bounds);
            } catch (err) {
              console.error("Error parsing georaster:", err);
            }
          }
        }
      }
      
      setRasterLayers(newRasterLayers);
      setRasterBoundsList(newRasterBounds);
    };

    loadRasters();
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
    layer.on('click', (e: any) => {
      if (activeToolRef.current === 'select') {
        L.DomEvent.stopPropagation(e);
        setSelectedFeature(feature);
        if ('closePopup' in layer) {
          (layer as any).closePopup();
        }
      }
    });

    if (feature.properties && activeToolRef.current !== 'select') {
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
          return;
        }

        if (activeTool === 'query_point') {
          const newFeature = {
            type: 'Feature',
            properties: { 
              name: 'Koordinat Bilgisi',
              description: `Enlem: ${finalLatLng.lat.toFixed(6)}<br/>Boylam: ${finalLatLng.lng.toFixed(6)}`
            },
            geometry: {
              type: 'Point',
              coordinates: [finalLatLng.lng, finalLatLng.lat]
            }
          };
          setSelectedFeature(newFeature);
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

      if (rasterBoundsList && rasterBoundsList.length > 0) {
        rasterBoundsList.forEach(b => {
          if (b && b.isValid()) {
            if (!combinedBounds) {
              combinedBounds = L.latLngBounds(b.getSouthWest(), b.getNorthEast());
            } else {
              combinedBounds.extend(b);
            }
          }
        });
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
          <button onClick={handleSaveAs} className="text-blue-600 hover:text-blue-700 active:scale-95 transition-all" title="Farklı Kaydet">
            <i className="fas fa-save text-lg"></i>
          </button>
          <div className="w-px h-6 bg-slate-200"></div>
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
        <button 
          onClick={() => setShowLayersPanel(!showLayersPanel)} 
          className={`w-12 h-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-0.5 transition-all ${showLayersPanel ? 'bg-slate-800 text-white' : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white hover:text-blue-600'}`}
          title="Katmanlar"
        >
          <i className="fas fa-layer-group text-sm"></i>
          <span className="text-[7px] font-bold leading-[1.1] text-center">Katmanlar</span>
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
            <>
              <GeoJSON 
                data={combinedGeoJSON} 
                style={geojsonStyle}
                onEachFeature={onEachFeature}
              />
            </>
          )}
          <FitBounds geojson={combinedGeoJSON} rasterBounds={rasterBoundsList} />
          <RasterLayersRenderer layers={rasterLayers} />

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

        {/* Selected Feature Overlay (Fixed Position) */}
        {(activeTool === 'select' || activeTool === 'query_point') && selectedFeature && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm pointer-events-auto animate-in fade-in slide-in-from-top-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-black text-slate-900 text-base">{selectedFeature.properties?.name || 'İsimsiz Obje'}</h3>
                <button onClick={() => setSelectedFeature(null)} className="text-slate-400 hover:text-slate-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
              {selectedFeature.properties?._projectName && (
                <p className="text-[10px] font-bold text-purple-600 mb-2 uppercase tracking-wider">{selectedFeature.properties._projectName}</p>
              )}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-32 overflow-y-auto no-scrollbar">
                {selectedFeature.properties?.description ? (
                  <p className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedFeature.properties.description }}></p>
                ) : (
                  <p className="text-xs text-slate-400 italic">Bu obje için açıklama bulunmuyor.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Layers Panel */}
        {showLayersPanel && (
          <div className="absolute top-24 left-20 z-[1001] w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-left-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Katmanlar</h3>
              <button onClick={() => setShowLayersPanel(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {layerStructure.map(layer => (
                <div key={layer} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <span className="text-xs font-bold text-slate-700 truncate mr-2">{layer}</span>
                  <button 
                    onClick={() => toggleLayer(layer)}
                    className={`w-10 h-6 rounded-full transition-all relative ${visibleLayers.has(layer) ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${visibleLayers.has(layer) ? 'left-5' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Measurement Result Overlay */}
        {measurementResult && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto animate-in slide-in-from-bottom-4">
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
        {activeTool !== 'pan' && activeTool !== 'select' && measurePoints.length === 0 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg pointer-events-none animate-pulse">
            <p className="text-xs font-medium text-white">
              {activeTool === 'distance' ? 'Ölçüme başlamak için haritaya tıklayın' : 
               activeTool === 'area' ? 'Alan ölçmek için haritaya tıklayın' :
               activeTool === 'draw_point' ? 'Nokta eklemek için haritaya tıklayın' :
               activeTool === 'draw_line' ? 'Çizgi çizmek için haritaya tıklayın' :
               'Alan çizmek için haritaya tıklayın'}
            </p>
          </div>
        )}

        {activeTool === 'select' && !selectedFeature && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg pointer-events-none animate-pulse">
            <p className="text-xs font-medium text-white">
              Detaylarını görmek için bir objeye tıklayın
            </p>
          </div>
        )}

        {/* Footer Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#F8FAFC] z-[1000] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <GlobalFooter />
        </div>

        {/* Naming Modal */}
        {namingFeature && (
          <div className="absolute inset-0 z-[2000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
              <h3 className="text-lg font-black text-slate-900 mb-4">Objeye İsim Ver</h3>
              <input 
                type="text" 
                value={featureNameInput}
                onChange={(e) => setFeatureNameInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setNamingFeature(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
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
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadView;
