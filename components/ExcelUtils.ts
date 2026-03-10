import * as XLSX from 'xlsx';
import { SavedLocation } from '../types';
import { convertCoordinate } from '../utils/CoordinateUtils';
import { FULL_BRAND } from '../version';
import { getCorrectedHeight } from './GeoidUtils';

export const downloadExcel = (locations: SavedLocation[]) => {
  if (locations.length === 0) {
    alert("Kayıt bulunamadı.");
    return;
  }

  const uniqueFolders = Array.from(new Set(locations.map(l => l.folderName)));
  const projectName = uniqueFolders.length === 1 ? uniqueFolders[0] : "Çoklu Proje Seçimi";
  
  let projectSystem = "Muhtelif";
  if (uniqueFolders.length === 1) {
     projectSystem = locations[0].coordinateSystem || 'WGS84';
  }

  const isWGS84 = projectSystem === 'WGS84';
  const headerX = isWGS84 ? "Boylam" : "Sağa (Y)";
  const headerY = isWGS84 ? "Enlem" : "Yukarı (X)";

  const dataRows = locations.map(loc => {
    const { x, y } = convertCoordinate(loc.lat, loc.lng, loc.coordinateSystem || 'WGS84');
    const isUTM = loc.coordinateSystem && loc.coordinateSystem !== 'WGS84';
    
    const valX = isUTM ? Math.round(x) : parseFloat(x.toFixed(6));
    const valY = isUTM ? Math.round(y) : parseFloat(y.toFixed(6));
    
    const correctedH = getCorrectedHeight(loc.lat, loc.lng, loc.altitude);
    
    return [
      loc.name,
      valX,
      valY,
      correctedH !== null ? Math.round(correctedH) : '---',
      loc.accuracy.toFixed(2),
      new Date(loc.timestamp).toLocaleString('tr-TR')
    ];
  });

  const ws_data = [
    [`"${FULL_BRAND}" tarafindan olusturuldu.`],
    [],
    ["Proje Adı:", projectName],
    ["Proje Koordinat Sistemi:", projectSystem],
    [], 
    ["Nokta İsmi", headerX, headerY, "Yükseklik (m)", "Hassasiyet (m)", "Tarih"],
    ...dataRows
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
  
  const wscols = [
    { wch: 15 }, // Nokta İsmi
    { wch: 18 }, // X / Boylam
    { wch: 18 }, // Y / Enlem
    { wch: 15 }, // Yükseklik
    { wch: 15 }, // Hassasiyet
    { wch: 20 }, // Tarih
  ];
  worksheet['!cols'] = wscols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Saha Verileri");

  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
  const fileName = `GPS_${projectName}_${dateStr}_${timeStr}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};