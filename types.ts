// Shared interfaces for GPS coordinates and saved location data
export interface Coordinate {
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;
}

export interface SavedLocation extends Coordinate {
  id: string;
  name: string;
  folderName: string;
  description?: string;
  coordinateSystem?: string;
}

export interface StakeoutPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  altitude?: number;
  coordinateSystem?: string;
  originalX?: number;
  originalY?: number;
  color?: string;
}

export interface StakeoutGeometry {
  id: string;
  name: string;
  type: 'LineString' | 'Polygon';
  coordinates: { lat: number; lng: number; altitude?: number }[];
  color?: string;
}
