// Tek doğru sürüm kaynağı.
// Burayı güncelle → ana menü, HUD ve sürüm ekranı otomatik yenilenir.
// CHANGELOG.md ile senkron tut.
// changes alanı iki dilli: { tr: [...], en: [...] }

const VERSION = {
  number: "1.5.0",
  codename: "BABEL",
  date: "2026-05-08",
  build: "monolith",

  history: [
    {
      v: "1.5.0",
      date: "2026-05-08",
      codename: "BABEL",
      changes: {
        tr: [
          "i18n.js — TR/EN sözlüğü, localStorage'a kaydedilen dil tercihi",
          "Tüm UI metinleri (menü, HUD, overlay'ler, editör, hikâye) iki dilde",
          "Hikâye girdileri ve seviye isim/intro'ları iki dilli",
          "Ana menüde DİL: TR/EN tuşu — anında dil değiştirir",
          "data-i18n / data-i18n-html / data-i18n-placeholder attribute desteği",
        ],
        en: [
          "i18n.js — TR/EN dictionary, localStorage-persisted language choice",
          "All UI text (menu, HUD, overlays, editor, story) translated",
          "Story entries and level name/intro fields bilingual",
          "LANG: TR/EN toggle on title screen — instant switch",
          "data-i18n / data-i18n-html / data-i18n-placeholder attribute support",
        ],
      },
    },
    {
      v: "1.4.2",
      date: "2026-05-08",
      codename: "FALLBACK ROUTING",
      changes: {
        tr: [
          "Bug: window.Audio constructor'ı çakışan modül adıyla gölgeleniyordu — düzeltildi",
          "OGG yüklenemezse (file:// kısıtı vb.) menü prosedürel drone'a otomatik düşer",
          "Menü drone'u oyun drone'undan farklı (daha açık/yıldız ambient)",
          "Müzik artık file:// üzerinde de hep çalar (OGG ya da drone fallback)",
        ],
        en: [
          "Bug: window.Audio constructor was shadowed by our SFX module name — fixed",
          "If OGG fails to load (file:// restriction etc.), menu falls back to procedural drone",
          "Menu drone differs from game drone (brighter, more star-like ambient)",
          "Music now plays on file:// too (OGG or drone fallback)",
        ],
      },
    },
    {
      v: "1.4.1",
      date: "2026-05-08",
      codename: "AMBIENT DRONE",
      changes: {
        tr: [
          "Müzik motoru sadeleştirildi — MIDI parser kaldırıldı",
          "Oyun müziği prosedürel hale getirildi (WebAudio drone, dosya gerekmez)",
          "Menü müziği <audio> ile aynı, file:// üzerinden çalışır",
          "fetch / yerel sunucu gereksinimi yok",
        ],
        en: [
          "Music engine simplified — MIDI parser removed",
          "Game music is now procedural (WebAudio drone, no file needed)",
          "Menu music still uses <audio>, works on file://",
          "No fetch / local server required",
        ],
      },
    },
    {
      v: "1.4.0",
      date: "2026-05-08",
      codename: "DERELICT SIGNAL",
      changes: {
        tr: [
          "Müzik motoru: music.js — OGG (HTMLAudio) + minimal MIDI parser/synth (WebAudio)",
          "Ana menüde space_echo.ogg, oyunda derelict.mid arka planda çalar",
          "İlk kullanıcı etkileşiminde otomatik tetikleme (autoplay kısıtlaması için)",
          "Mute butonu hem SFX hem müzik için ortak çalışır",
        ],
        en: [
          "Music engine: music.js — OGG (HTMLAudio) + minimal MIDI parser/synth (WebAudio)",
          "Menu plays space_echo.ogg, gameplay plays derelict.mid in background",
          "First-user-interaction kickstart (for autoplay policy)",
          "Mute toggles both SFX and music together",
        ],
      },
    },
    {
      v: "1.3.0",
      date: "2026-05-08",
      codename: "BELLEK BANKASI",
      changes: {
        tr: [
          "Proje belgeleri: README.md, CHANGELOG.md, CLAUDE.md",
          "Oyun içi SÜRÜM GEÇMİŞİ ekranı",
          "Ana menü ve HUD'da görünür sürüm",
          "version.js → tek doğru sürüm kaynağı",
        ],
        en: [
          "Project docs: README.md, CHANGELOG.md, CLAUDE.md",
          "In-game VERSION HISTORY screen",
          "Visible version on title and HUD",
          "version.js → single source of truth",
        ],
      },
    },
    {
      v: "1.2.0",
      date: "2026-05-08",
      codename: "ONBOARDING",
      changes: {
        tr: [
          "4 sayfalık başlangıç eğitimi (HAREKET / PLAKA / YANKI / ÖRNEK)",
          "Ana menüde NASIL OYNANIR? butonu",
          "Seviye 1 intro mesajı somut adımlara dönüştürüldü",
        ],
        en: [
          "4-page intro tutorial (MOVEMENT / PLATE / ECHO / EXAMPLE)",
          "HOW TO PLAY? button on title screen",
          "Level 1 intro rewritten as concrete steps",
        ],
      },
    },
    {
      v: "1.1.0",
      date: "2026-05-08",
      codename: "TAM SİSTEM",
      changes: {
        tr: [
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
        en: [
          "Portal mechanic (1-9 paired teleport)",
          "Laser mechanic (4 directions, disabled by plate)",
          "Echo death → cascading paradoxes",
          "WebAudio synth SFX engine (audio.js)",
          "Story entries: intro + 8 logs + outro (story.js)",
          "6 levels: FIRST ECHO, TWIN ENTANGLED, THREE SIMULTANEOUS, BRIDGE, BEAM, COLLAPSE",
          "Title menu, level select, persistent progress (localStorage)",
          "Level editor + URL hash sharing",
          "Death/win/out-of-sync overlays, mute key",
        ],
      },
    },
    {
      v: "1.0.0",
      date: "2026-05-08",
      codename: "MVP",
      changes: {
        tr: [
          "Çekirdek echo motoru (R kaydet, Z geri al, N sıfırla)",
          "Plaka & kapı sistemi (a/A, b/B, c/C)",
          "3 seviye, sıra-bazlı hareket",
          "CRT scanline, mor-mavi neon palet, monospace tipografi",
        ],
        en: [
          "Core echo engine (R record, Z undo, N reset)",
          "Plate & door system (a/A, b/B, c/C)",
          "3 levels, turn-based movement",
          "CRT scanline, purple-blue neon palette, monospace typography",
        ],
      },
    },
  ],
};
