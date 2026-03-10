import React from 'react';
import GlobalFooter from './GlobalFooter';
import { APP_VERSION } from '../version';

interface Props {
  onBack: () => void;
}

const HelpView: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col animate-in h-full overflow-hidden bg-[#F8FAFC]">
      <header className="px-8 pt-6 pb-6 flex items-center gap-5 shrink-0 bg-white shadow-sm">
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
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Nasıl Kullanılır?</h3>
          </div>
          
          <div className="space-y-4">
            {/* Yeni Ölçüm Yap */}
            <div className="soft-card p-4 space-y-3">
              <h4 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                Yeni Ölçüm Yap
              </h4>
              <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                Saha çalışmasına başlamak için ana ekrandaki <b>"Yeni Ölçüm Yap"</b> butonuna tıklayın.
                <br/><br/>
                • <b>Proje Bilgisi:</b> "Yeni Proje Oluştur" ile yeni bir isim verebilir veya "Mevcut Proje Seç" ile önceki çalışmalarınıza devam edebilirsiniz.
                <br/>
                • <b>Koordinat Sistemi:</b> WGS84 (Enlem-Boylam), ITRF96 (3 derece), ED50 (3 derece) veya ED50 (6 derece) sistemlerinden birini seçin. Proje bir kez oluşturulduğunda sistem değiştirilemez.
                <br/>
                • <b>Ölçüm Süreci:</b> "Ölçümü Başlat" dediğinizde belirlediğiniz hassasiyette (2-100 m) ve belirlediğiniz sürede (5-30 sn) veri toplama süreci başlatılır. Uygulama bu aşamada konum örneği alarak verilerin ortalamasını hesaplar. En doğru sonuç için cihazı sabit bir zeminde ve açık bir alanda tutun.
                <br/>
                • <b>Hızlı Erişim:</b> Uygulama, ana ekrandayken GPS sinyalini arka planda hazırlamaya başlar. Üst bar üzerindeki "Sistem Hazır" rozeti, GPS'in ısındığını ve ölçüme geçebileceğinizi gösterir.
              </p>
            </div>

            {/* Aplikasyon Yap */}
            <div className="soft-card p-4 space-y-3">
              <h4 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                Aplikasyon Yap
              </h4>
              <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                Kayıtlı noktaları arazide fiziksel olarak bulmak için <b>"Aplikasyon Yap"</b> modülünü kullanın.
                <br/><br/>
                • <b>Nokta Seçimi:</b> Proje listenizden hedeflediğiniz noktayı seçin.
                <br/>
                • <b>Canlı Rehberlik:</b> Ekranın ortasındaki pusula benzeri gösterge size gitmeniz gereken yönü gösterir.
                <br/>
                • <b>Ekranı Açık Tut:</b> Aplikasyon sırasında ekranın kapanmasını önlemek için güneş/ay ikonuna tıklayarak "Ekranı Açık Tut" özelliğini aktif edebilirsiniz.
                <br/>
                • <b>Mesafe Takibi:</b> Hedefe olan kuş uçuşu mesafeniz (metre cinsinden) anlık olarak güncellenir. Uygulamanın metre hassasiyetinde çalıştığını unutmayın.
                <br/>
                • <b>Yaklaşma Modu:</b> Hedefe 5 metreden fazla yaklaştığınızda gösterge daha hassas bir "yakın çekim" moduna geçer. Mobil cihazların GPS kısıtları nedeniyle 2 metre ve altına ulaştığınızda "Hedefe Ulaşıldı" sinyali ve görsel bildirim alırsınız.
              </p>
            </div>

            {/* Kayıtlı Projeler */}
            <div className="soft-card p-4 space-y-3">
              <h4 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">3</span>
                Kayıtlı Projeler
              </h4>
              <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                Tüm saha verilerinizi <b>"Kayıtlı Projeler"</b> menüsünden yönetebilirsiniz.
                <br/><br/>
                • <b>Görüntüleme:</b> Noktalarınızı proje klasörleri altında gruplanmış şekilde görün.
                <br/>
                • <b>Detaylar:</b> Bir noktaya tıkladığınızda koordinatlarını, yüksekliğini, hassasiyetini ve harita üzerindeki konumunu görebilirsiniz.
                <br/>
                • <b>Düzenleme:</b> Gereksiz noktaları veya tüm proje klasörlerini silebilirsiniz.Projelere yeniden isim verebilirsiniz.
              </p>
            </div>

            {/* Veri Aktar */}
            <div className="soft-card p-4 space-y-3">
              <h4 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">4</span>
                Veri Aktar
              </h4>
              <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                Saha verilerinizi ofis yazılımlarına aktarmak için <b>"Veri Aktar"</b> menüsünü kullanın.
                <br/><br/>
                • <b>Google Earth (.kml):</b> Noktalarınızı uydu görüntüsü üzerinde görmek için ideal format.
                <br/>
                • <b>Excel (.xlsx):</b> Nokta adı, koordinatlar (X, Y, Z), hassasiyet ve tarih bilgilerini içeren detaylı tablo.
                <br/>
                • <b>Metin (.txt):</b> Ham veri formatında (Ad, Y, X, Z) hızlı paylaşım.
                <br/>
                • <b>Paylaşım:</b> Oluşturulan dosyaları mobil cihazlarınız ile WhatsApp, E-posta veya Bulut sürücülere doğrudan gönderebilirsiniz.
              </p>
            </div>
          </div>
        </section>

        {/* Hassasiyet İpuçları */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <i className="fas fa-signal"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Hassasiyet İpuçları</h3>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-4">
            <div className="flex gap-4">
              <i className="fas fa-cloud-sun text-amber-600 mt-1 text-lg"></i>
              <p className="text-sm text-amber-900 font-medium leading-relaxed text-justify">
                <b>Açık Gökyüzü:</b> En iyi sonuçlar için binalardan, ağaçlardan ve metal yapılardan uzak, gökyüzünü doğrudan gören alanlarda ölçüm yapın.
              </p>
            </div>
            <div className="flex gap-4">
              <i className="fas fa-mobile-alt text-amber-600 mt-1 text-lg"></i>
              <p className="text-sm text-amber-900 font-medium leading-relaxed text-justify">
                <b>Bekleme Süresi:</b> Uygulamayı açtıktan sonra GPS sinyalinin "oturması" için yaklaşık 30 saniye beklemek hassasiyeti 2-5 metreye kadar düşürebilir.
              </p>
            </div>
            <div className="flex gap-4">
              <i className="fas fa-battery-three-quarters text-amber-600 mt-1 text-lg"></i>
              <p className="text-sm text-amber-900 font-medium leading-relaxed text-justify">
                <b>Güç Modu:</b> Cihazınızın "Düşük Güç Modu"nda olmaması gerekir, çünkü bu mod GPS güncelleme sıklığını azaltabilir.
              </p>
            </div>
          </div>
        </section>

        {/* Konum Teknolojisi */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <i className="fas fa-satellite-dish"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Konum Teknolojisi</h3>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-4">
            <p className="text-sm text-amber-900 font-medium leading-relaxed text-justify mb-4">
              Uygulama, en yüksek hassasiyeti sağlamak için <b>Hibrit (Karma) Konumlama</b> teknolojisini kullanır. Bu teknoloji, aşağıdaki 4 kaynağı birleştirerek çalışır:
            </p>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-satellite text-amber-600"></i>
                  <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">1. GNSS (Uydu)</h4>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  GPS, GLONASS, Galileo ve BeiDou uydularından gelen sinyalleri kullanır. Açık alanda hassas (±2m) konum verisi sağlar.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-broadcast-tower text-amber-600"></i>
                  <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">2. Baz İstasyonları</h4>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Uyduların görülemediği kapalı alanlarda veya tünellerde, telefonunuzun bağlı olduğu baz istasyonlarına göre yaklaşık konum belirler.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-wifi text-amber-600"></i>
                  <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">3. Wi-Fi Ağları</h4>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Şehir içinde bina aralarında, çevredeki kablosuz ağların sinyal gücünü kullanarak konumu keskinleştirir (IPS).
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-bolt text-amber-600"></i>
                  <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">4. A-GPS (İnternet)</h4>
                </div>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  İnternet üzerinden güncel uydu yörünge verilerini (almanak) indirerek, GPS'in saniyeler içinde kilitlenmesini (Fix) sağlar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Teknik Bilgiler */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <i className="fas fa-microchip"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Teknik Altyapı</h3>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-black text-blue-700 uppercase tracking-tight mb-1">ED50 Dönüşümü</h4>
                <p className="text-sm text-blue-900 font-medium leading-relaxed text-justify">
                  WGS84 ile ED50 (European Datum 1950) arasındaki dönüşümler, Türkiye geneli için optimize edilmiş 7 Parametreli (dX, dY, dZ, Rx, Ry, Rz, dS "HGM/EPSG Standartları") Helmert Dönüşümü kullanılarak yapılmaktadır.
                </p>
              </div>

              <div>
                <h4 className="text-base font-black text-blue-700 uppercase tracking-tight mb-1">ITRF96 Dönüşümü</h4>
                <p className="text-sm text-blue-900 font-medium leading-relaxed text-justify">
                  ITRF96 (GRS80 Elipsoidi) koordinatları, Transversal Mercator (TM) projeksiyonu ile hesaplanmaktadır. 3° dilim genişliği ve dilim orta meridyenleri (DOM) otomatik belirlenir.
                </p>
              </div>

              <div>
                <h4 className="text-base font-black text-blue-700 uppercase tracking-tight mb-1">Düşey Datum (Yükseklik)</h4>
                <p className="text-sm text-blue-900 font-medium leading-relaxed text-justify">
                  Ortometrik yükseklik (H), GPS'ten alınan Elipsoid yüksekliğinden (h), TG-20 (Türkiye Geoidi 2020) Hibrit Jeoid Modeli ondülasyon değeri (N) çıkarılarak hesaplanır.
                  <br/>
                  <span className="opacity-70 text-xs block mt-1 font-mono">Çözünürlük: 5' x 5' (Yaklaşık 9km)</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Veri Güvenliği */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Veri Güvenliği</h3>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
            <p className="text-emerald-900 text-sm leading-relaxed font-medium text-justify">
              Verileriniz tamamen cihazınızda saklanır. Uygulama, konum verilerinizi hiçbir uzak sunucuya göndermez. Mobil cihazınızdan uygulamayı sildiğinizde veya tarayıcı önbelliğini temizlediğinizde cihazınızdaki veriler de silinecektir. Ölçüm sonrası verilerinizi yedeklemeyi unutmayın.
            </p>
          </div>
        </section>

        {/* Sorumluluk Reddi */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Sorumluluk Reddi</h3>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
            <p className="text-sm text-rose-900 font-medium leading-relaxed text-justify">
              Bu uygulama tarafından sağlanan verilerin doğruluğu ve hassasiyeti, doğrudan kullanıcının mobil cihazının donanımsal (GPS/GNSS) alıcı kapasitesine, uydu görünürlüğüne ve çevresel faktörlere bağlıdır. Uygulama, profesyonel jeodezik ekipmanların yerini tutmaz. Elde edilen verilerin kritik mühendislik projelerinde kullanılmadan önce profesyonel ekipmanlarla doğrulanması önerilir. Oluşabilecek hatalardan veya veri kayıplarından yazılım geliştiricisi sorumlu tutulamaz.
            </p>
          </div>
        </section>

        {/* Hakkında */}
        <section className="space-y-4 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-code"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Geliştirici</h3>
          </div>
          <div className="soft-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Yazılım & Tasarım</p>
              <p className="text-sm font-black text-slate-900">ACB_Soft Engineering</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Sürüm</p>
              <p className="text-sm font-black text-blue-600">{APP_VERSION}</p>
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
