# CLAUDE.md — Time Echo Project Memory Bank

> Bu dosya, projeye dönen Claude oturumunun hızla bağlam kurması içindir.
> Claude Code projeyi açtığında bu dosyayı otomatik bağlam olarak yükler.
> İnsan ve AI birlikte korur.

---

## Proje Tek Cümlede

Tarayıcıda çalışan, sıra-bazlı, "kendi geçmiş kopyalarınla işbirliği yap" mekaniğine dayanan, atmosferik bir bulmaca oyunu. HTML + saf JS, build aracı yok.

## Çalışma Dizini

`C:\Users\Event Horizon\Desktop\Game Project\None`

`index.html`'i tarayıcıda açmak yeterli.

## Mimari

Modüler, global script yüklemeli (ES modules KULLANILMIYOR, basit `<script src=...>`).

```
index.html
├── audio.js      → Audio (WebAudio synth)
├── story.js      → STORY (intro/tutorial/afterLevel/outro metinleri)
├── version.js    → VERSION (sürüm sabiti)
├── levels.js     → LEVELS (seviye dizisi)
├── editor.js     → Editor (level editor + URL share)
└── game.js       → Screens, Save, Game (ana motor)
```

Yükleme sırası önemli — `game.js` diğerlerini kullanır, en son yüklenir.

## Kritik Konseptler

### Yankı motoru
- Her yankı bir hamle dizisi: `[{dx,dy}, ...]`
- `R` basıldığında `currentMoves` dizisi `echoes`'e push edilir, `resetRun()` çağrılır.
- Replay sırasında her tick'te yankı `echoes[i].moves[turn]` hamlesini dener.
- Bloklandığında yerinde kalır AMA hamleyi yine de tüketir (deterministik).

### Tick sırası (game.js içinde `tick()`)
1. **Pre-snapshot** — kapı durumu için bu fotoğraf kullanılır.
2. **Hareket** — oyuncu ve yankılar pre-snapshot kullanarak hareket eder. Eş zamanlı, sıralı değil.
3. **Portal teleport** — hareket sonrası, portal hücresine düşen varlıklar eşleşmiş portala ışınlanır.
4. **Post-snapshot** — yeni durum.
5. **Beam hesabı** — emitterlerden başlayıp duvar / kapalı kapıya kadar yürür.
6. **Hasar** — beam hücresindeki canlı varlık ölür.
7. **Hedef kontrolü** — oyuncu hedefte mi?

### Hücre tipleri (grid string)
`. # P G a-z A-Z 1-9 ^ v < >`

`a-c` plakaları `A-C` kapılarıyla eşleşir. `1-9` portalları aynı rakamla eşleşir (her seviyede her rakamın iki adet olması beklenir).

### Lazer
- Yayıcı `^v<>` her zaman açık.
- `level.lasers = [{x, y, plate}]` ile bir plaka'ya bağlanabilir; o plaka aktifken yayıcı söner.
- Beam: emitter'dan başlayıp yön doğrultusunda yürür; duvar / kapalı kapı / harita sınırı durdurur. Varlıklar BEAM'i durdurmaz, sadece eritilirler (beam onları geçer).

## Önemli Kod Lokasyonları

- Echo motoru: [game.js](game.js) içinde `tick()` ve `recordEcho()`.
- Beam hesabı: [game.js](game.js) içinde `computeBeamsFromEntities()`.
- Seviye parse: [game.js](game.js) içinde `parseLevel()`.
- URL share encode/decode: [editor.js](editor.js) içinde `encodeLevel()` / `decodeLevel()`.
- localStorage anahtarı: `timeEcho.progress.v1` (Save modülü).

## Sürüm Yönetimi

- Tek doğru kaynak: [version.js](version.js) içindeki `VERSION` objesi.
- Değişiklik olduğunda [CHANGELOG.md](CHANGELOG.md)'ye yeni sürüm bloku ekle.
- Semver: MAJOR.MINOR.PATCH (kuralları için CHANGELOG'un altına bak).

## Test Etme

UI testi otomatik değil — tarayıcıda manuel.

Smoke test:
1. `index.html` aç, ana menü gelsin.
2. NASIL OYNANIR? → 4 sayfayı geç.
3. YENİ DÖNGÜ → intro → tutorial → seviye 1 oynanabilir mi?
4. Seviye 1 çözümü: ② R basınca yankı oluşmalı, kapı açılmalı, ✦'ye ulaşılınca STABILIZED.
5. Seviye 4 (KÖPRÜ) — portal çalışmalı.
6. Seviye 5 (IŞIN) — lazer öldürmeli, plaka aktifken sönmeli.
7. EDİTÖR → küçük seviye yap → TEST → PAYLAŞ → URL'i yeni sekmede aç → seviye yüklenmeli.

## Tasarım Tercihleri

- **Türkçe arayüz.** Tüm UI metni Türkçe; teknik kelimeler (echo, tick, beam) korunabilir.
- **Atmosfer:** Karanlık zemin, mor-mavi neon, monospace font, CRT scanline.
- **Ses:** Synth bleeps. Müzik yok. Mute butonu var.
- **Build aracı yok.** ES modules kullanma — basit `<script>` ile yüklenmesi tercih edilir.
- **Tek dizin.** Alt klasör açma; her dosya proje kökünde.
- **Yorum azlığı.** Kod kendi kendini açıklasın; yorum sadece NEDEN için.

## Bilinen Tasarım Kararları

- **Yankı bloklanınca hamleyi tüketir** (atlanmaz). Sebebi: replay deterministik kalsın.
- **Birden fazla varlık aynı hücrede olabilir.** Sadece duvar/kapalı kapı/yayıcı blok.
- **Plaka durumu pre-snapshot ile hesaplanır** her tick'te. Mid-tick race önlemek için.
- **Beam hasarı post-snapshot ile.** Çünkü teleport sonrası pozisyonu yansıtmalı.

## TODO / Yol Haritası (CHANGELOG'un altında da var)

- Quantum Tile mekaniği
- Kullanıcı seviye galerisi (yerel)
- Hayalet replay (kazanan run'ı izleme)
- Pixel-art tile seti

## İletişim Tarzı

Kullanıcı Türkçe, samimi/casual ton. Plan modunda detaylı, çalıştırma modunda hızlı icra. Auto mode kullanılıyor — kullanıcı onayı gerekmedikçe ilerle.
