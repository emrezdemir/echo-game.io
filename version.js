// Tek doğru sürüm kaynağı.
// Burayı güncelle → ana menü, HUD ve sürüm ekranı otomatik yenilenir.
// CHANGELOG.md ile senkron tut.

const VERSION = {
  number: "1.4.2",
  codename: "FALLBACK ROUTING",
  date: "2026-05-08",
  build: "monolith",

  history: [
    {
      v: "1.4.2",
      date: "2026-05-08",
      codename: "FALLBACK ROUTING",
      changes: [
        "Bug: window.Audio constructor'ı çakışan modül adıyla gölgeleniyordu — düzeltildi",
        "OGG yüklenemezse (file:// kısıtı vb.) menü prosedürel drone'a otomatik düşer",
        "Menü drone'u oyun drone'undan farklı (daha açık/yıldız ambient)",
        "Müzik artık file:// üzerinde de hep çalar (OGG ya da drone fallback)",
      ],
    },
    {
      v: "1.4.1",
      date: "2026-05-08",
      codename: "AMBIENT DRONE",
      changes: [
        "Müzik motoru sadeleştirildi — MIDI parser kaldırıldı",
        "Oyun müziği prosedürel hale getirildi (WebAudio drone, dosya gerekmez)",
        "Menü müziği <audio> ile aynı, file:// üzerinden çalışır",
        "fetch / yerel sunucu gereksinimi yok",
      ],
    },
    {
      v: "1.4.0",
      date: "2026-05-08",
      codename: "DERELICT SIGNAL",
      changes: [
        "Müzik motoru: music.js — OGG (HTMLAudio) + minimal MIDI parser/synth (WebAudio)",
        "Ana menüde space_echo.ogg, oyunda derelict.mid arka planda çalar",
        "İlk kullanıcı etkileşiminde otomatik tetikleme (autoplay kısıtlaması için)",
        "Mute butonu hem SFX hem müzik için ortak çalışır",
      ],
    },
    {
      v: "1.3.0",
      date: "2026-05-08",
      codename: "BELLEK BANKASI",
      changes: [
        "Proje belgeleri: README.md, CHANGELOG.md, CLAUDE.md",
        "Oyun içi SÜRÜM GEÇMİŞİ ekranı",
        "Ana menü ve HUD'da görünür sürüm",
        "version.js → tek doğru sürüm kaynağı",
      ],
    },
    {
      v: "1.2.0",
      date: "2026-05-08",
      codename: "ONBOARDING",
      changes: [
        "4 sayfalık başlangıç eğitimi (HAREKET / PLAKA / YANKI / ÖRNEK)",
        "Ana menüde NASIL OYNANIR? butonu",
        "Seviye 1 intro mesajı somut adımlara dönüştürüldü",
      ],
    },
    {
      v: "1.1.0",
      date: "2026-05-08",
      codename: "TAM SİSTEM",
      changes: [
        "Portal mekaniği (1-9 eşli ışınlanma)",
        "Lazer mekaniği (4 yön, plaka ile söndürülebilir)",
        "Yankı ölümü → zincirleme paradokslar",
        "WebAudio synth ses motoru (audio.js)",
        "Hikâye girdileri: intro + 8 log + outro (story.js)",
        "6 seviye: İLK YANKI, ÇİFT DOLAŞIK, ÜÇ EŞZAMANLI, KÖPRÜ, IŞIN, ÇÖKÜŞ",
        "Ana menü, seviye seçim, kalıcı ilerleme (localStorage)",
        "Seviye editörü + URL hash paylaşımı",
        "Ölüm/galibiyet/out-of-sync ekranları, sustur tuşu",
      ],
    },
    {
      v: "1.0.0",
      date: "2026-05-08",
      codename: "MVP",
      changes: [
        "Çekirdek echo motoru (R kaydet, Z geri al, N sıfırla)",
        "Plaka & kapı sistemi (a/A, b/B, c/C)",
        "3 seviye, sıra-bazlı hareket",
        "CRT scanline, mor-mavi neon palet, monospace tipografi",
      ],
    },
  ],
};
