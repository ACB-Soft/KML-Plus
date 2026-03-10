import { StakeoutPoint, StakeoutGeometry } from '../types';

export const parseKML = (text: string): { points: StakeoutPoint[], geometries: StakeoutGeometry[] } => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  const placemarks = xmlDoc.getElementsByTagName("Placemark");
  const points: StakeoutPoint[] = [];
  const geometries: StakeoutGeometry[] = [];

  const kmlColorToCss = (kmlColor: string): string => {
    if (!kmlColor || kmlColor.length !== 8) return '#3b82f6'; // Default blue
    // KML: aabbggrr -> CSS: #rrggbbaa
    const aa = kmlColor.substring(0, 2);
    const bb = kmlColor.substring(2, 4);
    const gg = kmlColor.substring(4, 6);
    const rr = kmlColor.substring(6, 8);
    return `#${rr}${gg}${bb}${aa}`;
  };

  const getStyleColor = (pm: Element): string | undefined => {
    // Try to find inline color first
    const lineStyle = pm.getElementsByTagName("LineStyle")[0];
    const polyStyle = pm.getElementsByTagName("PolyStyle")[0];
    const colorTag = (lineStyle || polyStyle)?.getElementsByTagName("color")[0];
    if (colorTag?.textContent) {
      return kmlColorToCss(colorTag.textContent.trim());
    }
    return undefined;
  };

  const parseCoords = (coordsText: string): { lat: number, lng: number, altitude?: number }[] => {
    return coordsText.trim().split(/\s+/).map(coordStr => {
      const parts = coordStr.split(",");
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        const altitude = parts.length >= 3 ? parseFloat(parts[2]) : undefined;
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng, altitude };
        }
      }
      return null;
    }).filter((c): c is NonNullable<typeof c> => c !== null);
  };

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const name = pm.getElementsByTagName("name")[0]?.textContent || `Nesne ${i + 1}`;
    const color = getStyleColor(pm);
    
    // Check for Point
    const point = pm.getElementsByTagName("Point")[0];
    if (point) {
      const coordsText = point.getElementsByTagName("coordinates")[0]?.textContent;
      if (coordsText) {
        const coords = parseCoords(coordsText);
        if (coords.length > 0) {
          points.push({
            id: `kml-pt-${Date.now()}-${i}`,
            name,
            lat: coords[0].lat,
            lng: coords[0].lng,
            altitude: coords[0].altitude,
            coordinateSystem: 'WGS84',
            originalX: coords[0].lng,
            originalY: coords[0].lat,
            color
          });
        }
      }
    }

    // Check for LineString
    const line = pm.getElementsByTagName("LineString")[0];
    if (line) {
      const coordsText = line.getElementsByTagName("coordinates")[0]?.textContent;
      if (coordsText) {
        const coords = parseCoords(coordsText);
        if (coords.length > 0) {
          geometries.push({
            id: `kml-line-${Date.now()}-${i}`,
            name,
            type: 'LineString',
            coordinates: coords,
            color
          });
        }
      }
    }

    // Check for Polygon
    const poly = pm.getElementsByTagName("Polygon")[0];
    if (poly) {
      const coordsText = poly.getElementsByTagName("coordinates")[0]?.textContent;
      if (coordsText) {
        const coords = parseCoords(coordsText);
        if (coords.length > 0) {
          geometries.push({
            id: `kml-poly-${Date.now()}-${i}`,
            name,
            type: 'Polygon',
            coordinates: coords,
            color
          });
        }
      }
    }
  }

  return { points, geometries };
};
