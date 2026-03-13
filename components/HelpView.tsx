import React from 'react';
import GlobalFooter from './GlobalFooter';
import { APP_VERSION } from '../version';

interface Props {
  onBack: () => void;
}

const HelpView: React.FC<Props> = ({ onBack }) => {
  const [showUpdateMsg, setShowUpdateMsg] = React.useState(false);

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
            {/* Yeni Proje Oluştur */}
            <div className="soft-card p-4 space-y-3">
              <h4 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                Yeni Proje Oluştur
              </h4>
              <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                Ana ekrandaki <b>"Yeni Proje Oluştur"</b> butonuna tıklayarak yeni bir çalışma alanı yaratabilirsiniz.
                <br/><br/>
                • <b>KML/KMZ Yükleme:</b> İsteğe bağlı olarak cihazınızdaki KML veya KMZ dosyalarını projeye dahil edebilirsiniz.
                <br/>
                • <b>Proje İsimlendirme:</b> Projenize bir isim vererek daha sonra kolayca bulabilirsiniz.
              </p>
            </div>

            {/* Projeye Devam Et */}
            <div className="soft-card p-4 space-y-3">
              <h4 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                Projeye Devam Et
              </h4>
              <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                Önceden oluşturduğunuz veya yüklediğiniz projelere <b>"Projeye Devam Et"</b> sekmesinden ulaşabilirsiniz.
                <br/><br/>
                • <b>Çoklu Seçim:</b> Birden fazla projeyi aynı anda seçerek harita üzerinde (CAD Görünümü) birlikte görüntüleyebilirsiniz.
                <br/>
                • <b>Proje Silme:</b> Artık ihtiyacınız olmayan projeleri çöp kutusu ikonu ile silebilirsiniz.
              </p>
            </div>

            {/* CAD Görünümü ve Araçlar */}
            <div className="soft-card p-4 space-y-3">
              <h4 className="font-black text-slate-900 text-base uppercase flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">3</span>
                CAD Görünümü ve Araçlar
              </h4>
              <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
                Harita ekranında projelerinizi görüntüleyebilir ve çeşitli araçları kullanabilirsiniz.
                <br/><br/>
                • <b>Kaydır (El İkonu):</b> Haritayı serbestçe kaydırmanızı sağlar.
                <br/>
                • <b>Obje Seç (İmleç İkonu):</b> Haritadaki KML objelerine tıklayarak detayları ekranın alt kısmında görebilirsiniz.
                <br/>
                • <b>Koordinat Sor (Hedef İkonu):</b> Haritaya tıkladığınız noktanın enlem ve boylam bilgilerini verir.
                <br/>
                • <b>Mesafe Ölç (Cetvel İkonu):</b> Haritaya tıklayarak noktalar arası mesafeyi ölçebilirsiniz.
                <br/>
                • <b>Alan Ölç (Çokgen İkonu):</b> Haritaya en az 3 nokta ekleyerek kapalı bir alanın yüzölçümünü hesaplayabilirsiniz.
                <br/>
                • <b>Katman Yönetimi:</b> Katmanlar panelinden projeleri açıp kapatabilir, büyüteç ikonu ile ilgili katmana odaklanabilirsiniz.
                <br/>
                • <b>Obje Yakalama (Snapping):</b> Mevcut KML objelerinin köşelerine otomatik olarak kilitlenmenizi sağlar.
              </p>
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
              Verileriniz tamamen cihazınızda (tarayıcı önbelleğinde) saklanır. Uygulama, konum verilerinizi veya yüklediğiniz KML dosyalarını hiçbir uzak sunucuya göndermez. Tarayıcı önbelleğini temizlediğinizde verilerinizin silineceğini unutmayın.
            </p>
          </div>
        </section>

        {/* Veri Kaynağı */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <i className="fas fa-database"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Veri Kaynağı</h3>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
            <p className="text-amber-900 text-sm leading-relaxed font-medium text-justify">
              Uygulamada kullanılan harita katmanları ve coğrafi veriler açık kaynaklı servislerden (OpenStreetMap, OpenTopoMap, Google Maps API) sağlanmaktadır. Yüklediğiniz KML/KMZ dosyaları tamamen sizin sorumluluğunuzdadır.
            </p>
          </div>
        </section>

        {/* Telif Hakları */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
              <i className="fas fa-copyright"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Yasal Bilgilendirme</h3>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6">
            <p className="text-slate-700 text-sm leading-relaxed font-medium text-justify italic">
              "Bu uygulama telif ihlali barındıran içerik içermemektedir. Tüm yazılım ve tasarım hakları saklıdır."
            </p>
          </div>
        </section>

        {/* Hakkında */}
        <section className="space-y-4 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <i className="fas fa-info-circle"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Uygulama Hakkında</h3>
          </div>
          <div className="soft-card p-6 space-y-4">
            <p className="text-slate-900 text-sm leading-relaxed font-medium text-justify">
              <b>KML Plus</b>, arazi çalışmalarında ve ofis süreçlerinde KML/KMZ verilerini en hızlı ve verimli şekilde yönetmeniz için geliştirilmiş profesyonel bir CBS (Coğrafi Bilgi Sistemi) aracıdır.
              <br/><br/>
              Google Earth standartlarında görselleştirme, hassas ölçüm araçları ve gelişmiş obje yakalama (snapping) özellikleri ile projelerinizi mobil cihazınızdan kolayca yönetebilirsiniz.
            </p>
            
            <button 
              onClick={() => {
                setShowUpdateMsg(true);
                setTimeout(() => setShowUpdateMsg(false), 3000);
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 relative"
            >
              <i className="fas fa-sync-alt"></i>
              GÜNCELLEME DENETİMİ
              {showUpdateMsg && (
                <div className="absolute -top-12 left-0 right-0 bg-emerald-600 text-white py-2 px-4 rounded-lg text-xs font-bold animate-bounce shadow-lg">
                  Uygulamanız günceldir. (Sürüm: {APP_VERSION})
                </div>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Yazılım & Tasarım</p>
                <p className="text-sm font-black text-slate-900">ACB_Soft Engineering</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Sürüm</p>
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
