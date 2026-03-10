import { SavedLocation } from '../types';
import { BRAND_NAME, FULL_BRAND } from '../version';

export const generateKML = (locations: SavedLocation[], projectName: string): string => {
  const dateStr = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  const folderName = `${projectName}_${dateStr}`;

  const placemarks = locations.map(loc => `
    <Placemark>
      <name>${escapeXml(loc.name)}</name>
      <description>${escapeXml(loc.description || 'Saha Ölçümü')}</description>
      <Point>
        <altitudeMode>clampToGround</altitudeMode>
        <coordinates>${loc.lng},${loc.lat},0</coordinates>
      </Point>
    </Placemark>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(folderName)}</name>
    <description>${FULL_BRAND} tarafindan olusturuldu.</description>
    ${placemarks}
  </Document>
</kml>`;
};

const escapeXml = (unsafe: string) => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

export const downloadKML = (locations: SavedLocation[]) => {
  if (locations.length === 0) {
    alert("Kayıt bulunamadı.");
    return;
  }
  
  const projectName = locations[0].folderName || "Proje";
  const kmlContent = generateKML(locations, projectName);
  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
  
  link.href = url;
  link.download = `GPS_${projectName}_${dateStr}_${timeStr}.kml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const shareKML = async (locations: SavedLocation[]) => {
  if (locations.length === 0) return;
  
  const projectName = locations[0].folderName || "Proje";
  const kmlContent = generateKML(locations, projectName);
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
  const fileName = `GPS_${projectName}_${dateStr}_${timeStr}.kml`;
  
  const file = new File([kmlContent], fileName, { type: 'application/vnd.google-earth.kml+xml' });

  if (navigator.share) {
    try {
      await navigator.share({
        files: [file],
        title: `${BRAND_NAME} Saha Verileri`,
        text: `Google Earth için ${BRAND_NAME} tarafından hazırlanan veriler.`
      });
    } catch (err) {
      console.error("Sharing failed", err);
      downloadKML(locations); // Fallback to download
    }
  } else {
    downloadKML(locations);
  }
};