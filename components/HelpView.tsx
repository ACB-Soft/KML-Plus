import React from 'react';
import GlobalFooter from './GlobalFooter';
import { APP_VERSION } from '../version';

interface Props {
  onBack: () => void;
}

const HelpView: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col animate-in h-full overflow-hidden bg-slate-200">
      <header className="px-8 pt-6 pb-6 flex items-center gap-5 shrink-0 bg-slate-200 border-b border-slate-300">
        <button 
          onClick={onBack} 
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 text-slate-800 active:scale-90 transition-all"
        >
          <i className="fas fa-chevron-left text-sm"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Yardım & Hakkında</h2>
        </div>
      </header>

      <div className="flex-1 px-8 overflow-y-auto no-scrollbar py-4">
        <div className="max-w-sm mx-auto w-full space-y-10">
          {/* Kullanım Kılavuzu */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <i className="fas fa-book"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Kullanım Kılavuzu</h3>
            </div>
            
            <div className="space-y-4">
              {/* Proje Yönetimi */}
              <div className="soft-card p-4 space-y-3">
                <h4 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                  Proje Başlatma
                </h4>
                <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                  Uygulama iki ana yöntemle proje başlatmanıza olanak tanır:
                  <br/><br/>
                  • <b>Yeni Proje Oluştur:</b> Sıfırdan bir çalışma alanı açar. Kendi çizimlerinizi yapabilir veya daha sonra veri ekleyebilirsiniz.
                  <br/>
                  • <b>Yeni Proje Yükle:</b> Cihazınızdaki mevcut <b>.kml</b> veya <b>.kmz</b> dosyalarını içe aktararak hızlıca görüntüleme yapmanızı sağlar.
                </p>
              </div>

              {/* Harita Araçları */}
              <div className="soft-card p-4 space-y-3">
                <h4 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                  Gelişmiş Araçlar
                </h4>
                <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                  CAD Görünümü içerisinde profesyonel ölçüm ve analiz araçları bulunur:
                  <br/><br/>
                  • <b>Hassas Ölçüm:</b> Mesafe ve alan ölçümlerinde "Snapping" (Obje Yakalama) özelliği ile KML objelerinin köşelerine tam isabetle kilitlenebilirsiniz.
                  <br/>
                  • <b>Koordinat Sorgulama:</b> Harita üzerinde herhangi bir noktaya dokunarak anlık WGS84 koordinatlarını alabilirsiniz.
                  <br/>
                  • <b>Katman Kontrolü:</b> Birden fazla projeyi aynı anda açabilir, görünürlüklerini yönetebilir ve odaklanma (zoom) yapabilirsiniz.
                </p>
              </div>
            </div>
          </section>

          {/* Sıkça Sorulan Sorular */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
                <i className="fas fa-question-circle"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Sıkça Sorulan Sorular</h3>
            </div>
            
            <div className="space-y-3">
              <details className="soft-card p-4 group cursor-pointer">
                <summary className="font-bold text-slate-900 text-sm uppercase flex items-center justify-between list-none">
                  Dosyalarım nerede saklanıyor?
                  <i className="fas fa-chevron-down text-[10px] group-open:rotate-180 transition-transform"></i>
                </summary>
                <p className="text-slate-600 text-xs mt-3 leading-relaxed font-medium">
                  Tüm verileriniz tarayıcınızın yerel depolama alanında (IndexedDB) saklanır. Hiçbir veri buluta veya sunucuya yüklenmez.
                </p>
              </details>

              <details className="soft-card p-4 group cursor-pointer">
                <summary className="font-bold text-slate-900 text-sm uppercase flex items-center justify-between list-none">
                  Büyük dosyalar performansı etkiler mi?
                  <i className="fas fa-chevron-down text-[10px] group-open:rotate-180 transition-transform"></i>
                </summary>
                <p className="text-slate-600 text-xs mt-3 leading-relaxed font-medium">
                  Çok karmaşık ve binlerce nokta içeren KML dosyaları mobil cihazlarda yavaşlamaya neden olabilir. Optimize edilmiş dosyalar kullanmanız önerilir.
                </p>
              </details>

              <details className="soft-card p-4 group cursor-pointer">
                <summary className="font-bold text-slate-900 text-sm uppercase flex items-center justify-between list-none">
                  Çevrimdışı çalışabilir miyim?
                  <i className="fas fa-chevron-down text-[10px] group-open:rotate-180 transition-transform"></i>
                </summary>
                <p className="text-slate-600 text-xs mt-3 leading-relaxed font-medium">
                  Uygulama arayüzü çevrimdışı çalışabilir ancak harita altlıklarının (Google/OSM) yüklenmesi için internet bağlantısı gereklidir.
                </p>
              </details>
            </div>
          </section>

          {/* Veri Güvenliği */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Gizlilik ve Güvenlik</h3>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
              <p className="text-emerald-900 text-sm leading-relaxed font-medium text-justify">
                <b>KML Plus</b> gizlilik odaklıdır. Konum verileriniz sadece anlık ölçümler için kullanılır ve asla kaydedilmez. Projeleriniz sadece sizin cihazınızda yaşar.
              </p>
            </div>
          </section>

          {/* Hakkında */}
          <section className="space-y-4 pb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <i className="fas fa-info-circle"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Vizyonumuz</h3>
            </div>
            <div className="soft-card p-6 space-y-4">
              <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                Amacımız, arazi mühendisleri, mimarlar ve CBS uzmanları için en hafif, en hızlı ve en güvenilir mobil KML görüntüleme deneyimini sunmaktır. 
                <br/><br/>
                Sürekli güncellenen araç setimizle, karmaşık coğrafi verileri cebinizde taşınabilir hale getiriyoruz.
              </p>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Geliştirici</p>
                  <p className="text-sm font-black text-slate-900">ACB_Soft Engineering</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Versiyon</p>
                  <p className="text-sm font-black text-blue-600">{APP_VERSION}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      <GlobalFooter />
    </div>
  );
};

export default HelpView;
